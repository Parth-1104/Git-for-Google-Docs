// frontend/src/pages/DashboardPage.jsx
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LogOut,
  Folder,
  RefreshCw,
  Download,
  GitCommit,
  FileClock,
  FileText,
  Globe,
  Laptop,
  Maximize2,
  Search,
  X,
  AlertCircle,
  CheckCircle,
  Info,
} from 'lucide-react';

/* -------------------------------------------------------------------------- */
/*  Config                                                                    */
/* -------------------------------------------------------------------------- */

// Flip to true to bring back the Google Docs tracking mode toggle.
const ENABLE_GOOGLE_DOCS = false;

const POLL_INTERVAL_MS = 3000;
const PAGE_SIZE = 8; // versions shown per "Show more" step
const PREVIEW_CONTEXT = 36; // characters of unchanged text kept around each change in a card
const PREVIEW_SEGMENTS = 80; // hard cap on segments rendered inside a card
const MODAL_CONTEXT = 120;
const INSTALL_CMD = 'npm install -g @singhparth427/gitdoc-cli';

const FOCUS =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1a7f37] focus-visible:ring-offset-2 focus-visible:ring-offset-[#fafafa]';

const EMPTY_STATUS = { type: '', message: '' };

const STATUS_STYLE = {
  error: { box: 'border-[#ffc1c0] bg-[#ffebe9] text-[#a40e26]', Icon: AlertCircle },
  success: { box: 'border-[#a1dfb1] bg-[#dafbe1] text-[#116329]', Icon: CheckCircle },
  info: { box: 'border-[#b6e3ff] bg-[#ddf4ff] text-[#0550ae]', Icon: Info },
};

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                   */
/* -------------------------------------------------------------------------- */

const getToken = () => {
  try {
    return localStorage.getItem('gitdoc_token');
  } catch (err) {
    return null;
  }
};

const authHeaders = () => ({ Authorization: `Bearer ${getToken()}` });

// fetch wrapper that turns network failures into a readable message.
async function apiFetch(url, options) {
  try {
    return await fetch(url, options);
  } catch (err) {
    if (err && err.name === 'AbortError') throw err;
    throw new Error('Can’t reach the server. Check your connection and try again.');
  }
}

// Extracts a 44-character document ID if the user pastes a full Google Docs URL.
const extractGoogleDocId = (input) => {
  if (!input) return '';
  const matches = input.match(/\/document\/d\/([a-zA-Z0-9-_]{44})/);
  return matches ? matches[1] : input.trim();
};

const isGoogleDocId = (id = '') => id.length === 44 && !id.includes('/');

const normalizePath = (input, mode) =>
  mode === 'GOOGLE_DOC' || (input || '').includes('docs.google.com') ? extractGoogleDocId(input) : (input || '').trim();

const baseName = (p = '') => p.split(/[\\/]/).filter(Boolean).pop() || p;

const fmtTime = (ts) => {
  const d = new Date(ts);
  return Number.isNaN(d.getTime())
    ? '—'
    : d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
};

const fmtDateTime = (ts) => {
  const d = new Date(ts);
  return Number.isNaN(d.getTime())
    ? '—'
    : d.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' });
};

const typeLabel = (type) => (type === 'GENESIS' ? 'Baseline' : type ? type.charAt(0) + type.slice(1).toLowerCase() : 'Update');

const sortCommits = (list, order) => {
  const dir = order === 'newest' ? -1 : 1;
  return [...list].sort((a, b) => {
    const av = Number(a.version);
    const bv = Number(b.version);
    if (!Number.isNaN(av) && !Number.isNaN(bv) && av !== bv) return (av - bv) * dir;
    return (new Date(a.timestamp) - new Date(b.timestamp)) * dir;
  });
};

// Cheap check so an unchanged poll result doesn't re-render the whole timeline.
const sameCommits = (a, b) => {
  if (a.length !== b.length) return false;
  if (a.length === 0) return true;
  const [a0, b0] = [a[0], b[0]];
  const [a1, b1] = [a[a.length - 1], b[b.length - 1]];
  return (
    a0.version === b0.version &&
    a0.timestamp === b0.timestamp &&
    a1.version === b1.version &&
    a1.timestamp === b1.timestamp
  );
};

const summarize = (changes) => {
  let add = 0;
  let del = 0;
  changes.forEach((c) => {
    const len = (c.text || '').length;
    if (c.operation === 'INSERT') add += len;
    else if (c.operation === 'DELETE') del += len;
  });
  return { add, del, hasChanges: add + del > 0 };
};

// Collapses long runs of unchanged text into "…" so the changes stay readable.
const compactChanges = (changes, ctx) => {
  const out = [];
  changes.forEach((c, i) => {
    const text = c.text || '';
    if (c.operation !== 'EQUAL' || text.length <= ctx * 2 + 20) {
      out.push(c);
      return;
    }
    const isFirst = i === 0;
    const isLast = i === changes.length - 1;
    if (!isFirst) out.push({ operation: 'EQUAL', text: text.slice(0, ctx) });
    out.push({ operation: 'GAP' });
    if (!isLast) out.push({ operation: 'EQUAL', text: text.slice(-ctx) });
  });
  return out;
};

/* -------------------------------------------------------------------------- */
/*  Presentational pieces                                                     */
/* -------------------------------------------------------------------------- */

function Avatar({ user }) {
  const [failed, setFailed] = useState(false);
  const initial = (user?.name || '?').trim().charAt(0).toUpperCase();
  if (user?.avatar && !failed) {
    return (
      <img
        src={user.avatar}
        alt=""
        referrerPolicy="no-referrer"
        onError={() => setFailed(true)}
        className="h-8 w-8 rounded-full border border-[#d0d7de] bg-[#f6f8fa] object-cover"
      />
    );
  }
  return (
    <span
      aria-hidden="true"
      className="grid h-8 w-8 place-items-center rounded-full border border-[#d0d7de] bg-[#eff1f3] text-xs font-semibold text-[#24292f]"
    >
      {initial}
    </span>
  );
}

function StatusBanner({ status }) {
  if (!status.message) return null;
  const { box, Icon } = STATUS_STYLE[status.type] || STATUS_STYLE.info;
  return (
    <div
      role={status.type === 'error' ? 'alert' : 'status'}
      className={`flex items-start gap-2.5 rounded-lg border px-3 py-2.5 text-[13px] leading-relaxed ${box}`}
    >
      <Icon size={15} className="mt-0.5 shrink-0" />
      <span className="min-w-0 break-words">{status.message}</span>
    </div>
  );
}

function DiffText({ segments }) {
  return (
    <>
      {segments.map((seg, i) => {
        if (seg.operation === 'GAP') {
          return (
            <span key={i} aria-hidden="true" className="select-none text-[#6e7781]">
              {' … '}
            </span>
          );
        }
        if (seg.operation === 'INSERT') {
          return (
            <ins key={i} className="rounded-sm bg-[#aceebb]/60 px-0.5 text-[#0f5323] no-underline">
              <span className="sr-only">Added: </span>
              {seg.text}
            </ins>
          );
        }
        if (seg.operation === 'DELETE') {
          return (
            <del key={i} className="rounded-sm bg-[#ffcecb]/70 px-0.5 text-[#82071e] line-through decoration-[#cf222e]/60">
              <span className="sr-only">Removed: </span>
              {seg.text}
            </del>
          );
        }
        return (
          <span key={i} className="text-[#24292f]">
            {seg.text}
          </span>
        );
      })}
    </>
  );
}

function TypePill({ type }) {
  const baseline = type === 'GENESIS';
  return (
    <span
      className={`rounded-full border px-2 py-0.5 text-[11px] font-medium ${
        baseline
          ? 'border-[#d1bcf5] bg-[#f5f0ff] text-[#6639ba]'
          : 'border-[#a1dfb1] bg-[#dafbe1] text-[#116329]'
      }`}
    >
      {typeLabel(type)}
    </span>
  );
}

function ChangeCounts({ add, del }) {
  return (
    <span className="font-mono">
      <span className="text-[#1a7f37]">+{add.toLocaleString()}</span>{' '}
      <span className="text-[#cf222e]">−{del.toLocaleString()}</span>
    </span>
  );
}

const iconButton = `inline-flex h-8 items-center justify-center gap-1.5 rounded-md border border-[#d0d7de] bg-white px-2.5 text-xs font-medium text-[#24292f] transition-colors hover:bg-[#f6f8fa] ${FOCUS}`;

/* One version in the timeline. Every card has exactly the same dimensions:
   the change preview is a fixed-height, scrollable window, whatever the diff size. */
const VersionCard = React.memo(function VersionCard({ commit, downloadUrl, onExpand }) {
  const changes = commit.changes || [];
  const { add, del, hasChanges } = useMemo(() => summarize(changes), [changes]);
  const preview = useMemo(
    () => compactChanges(changes, PREVIEW_CONTEXT).slice(0, PREVIEW_SEGMENTS),
    [changes]
  );

  return (
    <article className="rounded-xl border border-[#d0d7de] bg-white transition-shadow hover:shadow-md">
      <div className="flex items-center justify-between gap-3 px-4 pt-3.5">
        <div className="flex min-w-0 items-center gap-2.5">
          <h3 className="whitespace-nowrap text-sm font-bold text-[#24292f]">Version {commit.version}</h3>
          <TypePill type={commit.type} />
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={() => onExpand(commit)}
            aria-label={`View all changes in version ${commit.version}`}
            title="View all changes"
            className={`${iconButton} w-8 px-0`}
          >
            <Maximize2 size={14} />
          </button>
          <a href={downloadUrl} className={`${iconButton} text-[#0969da]`}>
            <Download size={13} />
            Download
          </a>
        </div>
      </div>

      <div className="mt-0.5 flex items-center gap-3 px-4 text-xs text-[#57606a]">
        <time dateTime={Number.isNaN(new Date(commit.timestamp).getTime()) ? undefined : new Date(commit.timestamp).toISOString()}>
          {fmtDateTime(commit.timestamp)}
        </time>
        {hasChanges && <ChangeCounts add={add} del={del} />}
      </div>

      <div className="px-4 pb-4 pt-3">
        <div className="relative h-32 overflow-hidden rounded-lg border border-[#e1e4e8] bg-[#f6f8fa]">
          {hasChanges ? (
            <>
              <div
                tabIndex={0}
                role="region"
                aria-label={`Changes in version ${commit.version}`}
                className="h-full overflow-y-auto whitespace-pre-wrap break-words px-3.5 pb-8 pt-3 font-mono text-xs leading-6 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#1a7f37]"
              >
                <DiffText segments={preview} />
              </div>
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-[#f6f8fa] to-transparent"
              />
            </>
          ) : (
            <div className="grid h-full place-items-center px-4 text-center text-xs text-[#57606a]">
              No text changes in this version.
            </div>
          )}
        </div>
      </div>
    </article>
  );
});

function VersionSkeleton() {
  return (
    <div aria-hidden="true" className="rounded-xl border border-[#e1e4e8] bg-white p-4 motion-safe:animate-pulse">
      <div className="flex items-center justify-between">
        <div className="h-4 w-28 rounded bg-[#eaeef2]" />
        <div className="h-8 w-24 rounded-md bg-[#eaeef2]" />
      </div>
      <div className="mt-2 h-3 w-40 rounded bg-[#eaeef2]" />
      <div className="mt-4 h-32 rounded-lg bg-[#f6f8fa]" />
    </div>
  );
}

function LiveIndicator({ syncError, lastSynced }) {
  return (
    <div className="flex items-center gap-2 text-xs text-[#57606a]">
      <span className="relative flex h-2 w-2">
        {!syncError && (
          <span className="absolute inline-flex h-full w-full rounded-full bg-[#1a7f37] opacity-60 motion-safe:animate-ping" />
        )}
        <span className={`relative inline-flex h-2 w-2 rounded-full ${syncError ? 'bg-[#bf8700]' : 'bg-[#1a7f37]'}`} />
      </span>
      {syncError ? 'Reconnecting…' : lastSynced ? `Live · synced ${fmtTime(lastSynced)}` : 'Live'}
    </div>
  );
}

/* Full-size view of one version's changes. */
function DiffModal({ commit, downloadUrl, onClose }) {
  const [showFull, setShowFull] = useState(false);
  const dialogRef = useRef(null);
  const closeRef = useRef(null);
  const changes = commit.changes || [];
  const { add, del } = useMemo(() => summarize(changes), [changes]);
  const segments = useMemo(
    () => (showFull ? changes : compactChanges(changes, MODAL_CONTEXT)),
    [changes, showFull]
  );

  useEffect(() => {
    const previouslyFocused = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    if (closeRef.current) closeRef.current.focus();

    const onKey = (e) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }
      if (e.key !== 'Tab' || !dialogRef.current) return;
      const focusable = dialogRef.current.querySelectorAll('a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])');
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = previousOverflow;
      if (previouslyFocused && previouslyFocused.focus) previouslyFocused.focus();
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[#1f2328]/50" onClick={onClose} aria-hidden="true" />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="diff-modal-title"
        className="relative flex max-h-[88vh] w-full max-w-3xl flex-col overflow-hidden rounded-xl border border-[#d0d7de] bg-white shadow-2xl"
      >
        <div className="flex items-start justify-between gap-4 border-b border-[#e1e4e8] px-5 py-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2.5">
              <h2 id="diff-modal-title" className="text-base font-bold text-[#24292f]">
                Version {commit.version}
              </h2>
              <TypePill type={commit.type} />
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-x-3 text-xs text-[#57606a]">
              <span>{fmtDateTime(commit.timestamp)}</span>
              <ChangeCounts add={add} del={del} />
            </div>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Close"
            className={`${iconButton} w-8 shrink-0 px-0`}
          >
            <X size={15} />
          </button>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#e1e4e8] bg-[#f6f8fa] px-5 py-2.5">
          <div className="flex items-center gap-4 text-xs text-[#57606a]">
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm bg-[#aceebb]" /> Added
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm bg-[#ffcecb]" /> Removed
            </span>
          </div>
          <div className="inline-flex rounded-lg border border-[#d0d7de] bg-white p-0.5 text-xs font-medium">
            {[
              [false, 'Changes only'],
              [true, 'Full text'],
            ].map(([value, label]) => (
              <button
                key={label}
                type="button"
                aria-pressed={showFull === value}
                onClick={() => setShowFull(value)}
                className={`rounded-md px-3 py-1 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1a7f37] ${
                  showFull === value ? 'bg-[#24292f] text-white' : 'text-[#57606a] hover:text-[#24292f]'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div
          tabIndex={0}
          role="region"
          aria-label={`All changes in version ${commit.version}`}
          className="min-h-[10rem] flex-1 overflow-y-auto whitespace-pre-wrap break-words px-5 py-4 font-mono text-[13px] leading-7 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#1a7f37]"
        >
          {add + del === 0 ? (
            <p className="font-sans text-sm text-[#57606a]">No text changes in this version.</p>
          ) : (
            <DiffText segments={segments} />
          )}
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-[#e1e4e8] px-5 py-3">
          <a href={downloadUrl} className={`${iconButton} text-[#0969da]`}>
            <Download size={13} />
            Download this version
          </a>
          <button type="button" onClick={onClose} className={`${iconButton} border-[#24292f] bg-[#24292f] text-white hover:bg-[#1f2328]`}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Page                                                                      */
/* -------------------------------------------------------------------------- */

export default function DashboardPage({ user, handleLogout, BACKEND_URL }) {
  const navigate = useNavigate();

  const [trackingMode, setTrackingMode] = useState('LOCAL'); // 'LOCAL' | 'GOOGLE_DOC'
  const [filePath, setFilePath] = useState(''); // what's typed in the input
  const [activePath, setActivePath] = useState(''); // the document whose timeline is loaded
  const [inputError, setInputError] = useState('');
  const [repositories, setRepositories] = useState([]);
  const [repoError, setRepoError] = useState('');
  const [repoQuery, setRepoQuery] = useState('');
  const [commits, setCommits] = useState([]);
  const [fileName, setFileName] = useState('');
  const [status, setStatus] = useState(EMPTY_STATUS);
  const [loadingRepos, setLoadingRepos] = useState(false);
  const [loadingTimeline, setLoadingTimeline] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [order, setOrder] = useState('newest');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [openCommit, setOpenCommit] = useState(null);
  const [lastSynced, setLastSynced] = useState(null);
  const [syncError, setSyncError] = useState(false);

  const activePathRef = useRef('');
  const loadSeq = useRef(0);
  const inFlight = useRef(false);

  const commitsUrl = useCallback(
    (path) => `${BACKEND_URL}/api/word/commits?filePath=${encodeURIComponent(path)}`,
    [BACKEND_URL]
  );

  /* ------------------------------ Data loading ------------------------------ */

  const fetchUserRepositories = useCallback(async () => {
    setLoadingRepos(true);
    setRepoError('');
    try {
      const res = await apiFetch(`${BACKEND_URL}/api/word/repositories`, { headers: authHeaders() });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error('Couldn’t load your documents.');
      setRepositories(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Unable to load repository list:', err);
      setRepoError('Couldn’t load your documents. Try refreshing.');
    } finally {
      setLoadingRepos(false);
    }
  }, [BACKEND_URL]);

  // Loads a document's timeline. Throws an Error with a user-facing message on failure.
  const loadTimeline = useCallback(
    async (rawPath, mode) => {
      const target = normalizePath(rawPath, mode);
      if (!target) return null;

      const seq = ++loadSeq.current;
      setLoadingTimeline(true);
      try {
        const res = await apiFetch(commitsUrl(target), { headers: authHeaders() });
        const data = await res.json().catch(() => ({}));
        if (seq !== loadSeq.current) return null; // a newer request superseded this one

        if (!res.ok) {
          if (res.status === 401) throw new Error('Your session has expired. Sign out and sign in again.');
          if (res.status === 404)
            throw new Error('No tracked document found at that path. Run gitdoc track on the file first, then try again.');
          throw new Error(data.error || 'Something went wrong while loading this document. Try again.');
        }

        const list = data.commits || [];
        activePathRef.current = target;
        setActivePath(target);
        setFileName(data.fileName || baseName(target));
        setCommits(list);
        setVisibleCount(PAGE_SIZE);
        setLastSynced(new Date());
        setSyncError(false);
        fetchUserRepositories();
        return { target, count: list.length, name: data.fileName || baseName(target) };
      } finally {
        if (seq === loadSeq.current) setLoadingTimeline(false);
      }
    },
    [commitsUrl, fetchUserRepositories]
  );

  useEffect(() => {
    if (user) fetchUserRepositories();
  }, [user, fetchUserRepositories]);

  // Background polling for the loaded document. Pauses while the tab is hidden,
  // never overlaps requests, and ignores results for a document that's no longer active.
  useEffect(() => {
    if (!activePath || !user) return undefined;

    let cancelled = false;
    const controller = new AbortController();

    const poll = async () => {
      if (document.hidden || inFlight.current) return;
      inFlight.current = true;
      try {
        const res = await apiFetch(commitsUrl(activePath), { headers: authHeaders(), signal: controller.signal });
        if (cancelled) return;
        if (!res.ok) throw new Error('poll failed');
        const data = await res.json();
        if (cancelled || activePathRef.current !== activePath) return;
        const next = data.commits || [];
        setCommits((prev) => (sameCommits(prev, next) ? prev : next));
        setLastSynced(new Date());
        setSyncError(false);
      } catch (err) {
        if (!cancelled && !(err && err.name === 'AbortError')) setSyncError(true);
      } finally {
        inFlight.current = false;
      }
    };

    const id = setInterval(poll, POLL_INTERVAL_MS);
    const onVisibility = () => {
      if (!document.hidden) poll();
    };
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      cancelled = true;
      controller.abort();
      clearInterval(id);
      document.removeEventListener('visibilitychange', onVisibility);
      inFlight.current = false;
    };
  }, [activePath, user, commitsUrl]);

  // Success messages dismiss themselves.
  useEffect(() => {
    if (status.type !== 'success') return undefined;
    const t = setTimeout(() => setStatus(EMPTY_STATUS), 6000);
    return () => clearTimeout(t);
  }, [status]);

  /* -------------------------------- Handlers -------------------------------- */

  const handleSubmit = async (e) => {
    e.preventDefault();
    const raw = filePath.trim();
    if (!raw) {
      setInputError(trackingMode === 'LOCAL' ? 'Enter the path to a tracked file.' : 'Enter a Google Doc URL or ID.');
      return;
    }
    setInputError('');
    setSubmitting(true);
    setStatus({
      type: 'info',
      message: trackingMode === 'GOOGLE_DOC' ? 'Registering document…' : 'Loading version history…',
    });

    try {
      let result;
      if (trackingMode === 'GOOGLE_DOC') {
        const cleanedDocId = extractGoogleDocId(raw);
        const token = getToken();
        const res = await apiFetch(`${BACKEND_URL}/api/document/track`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ googleDocId: cleanedDocId }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || 'Google Drive rejected the registration request.');

        setFilePath(cleanedDocId);
        result = await loadTimeline(cleanedDocId, 'GOOGLE_DOC');
        setStatus({ type: 'success', message: data.message || 'Google Doc registered.' });
      } else {
        result = await loadTimeline(raw, 'LOCAL');
        if (result) {
          setStatus({
            type: 'success',
            message: `Loaded ${result.count} ${result.count === 1 ? 'version' : 'versions'} of ${result.name}.`,
          });
        }
      }
    } catch (err) {
      setStatus({ type: 'error', message: err.message || 'Something went wrong. Try again.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleSelectRepository = async (path) => {
    const mode = isGoogleDocId(path) ? 'GOOGLE_DOC' : 'LOCAL';
    setFilePath(path);
    setTrackingMode(mode);
    setInputError('');
    setStatus(EMPTY_STATUS);
    try {
      await loadTimeline(path, mode);
    } catch (err) {
      setStatus({ type: 'error', message: err.message });
    }
  };

  const switchMode = (mode) => {
    setTrackingMode(mode);
    setFilePath('');
    setInputError('');
  };

  const expandCommit = useCallback((commit) => setOpenCommit(commit), []);
  const closeModal = useCallback(() => setOpenCommit(null), []);

  const downloadUrlFor = (version) =>
    `${BACKEND_URL}/api/word/download-commit?filePath=${encodeURIComponent(activePath)}&targetVersion=${version}`;

  /* ------------------------------- Derived data ------------------------------ */

  const newestFirst = useMemo(() => sortCommits(commits, 'newest'), [commits]);
  const ordered = useMemo(() => (order === 'newest' ? newestFirst : [...newestFirst].reverse()), [newestFirst, order]);
  const visible = ordered.slice(0, visibleCount);
  const remaining = ordered.length - visible.length;
  const latest = newestFirst[0];

  const filteredRepos = useMemo(() => {
    const q = repoQuery.trim().toLowerCase();
    if (!q) return repositories;
    return repositories.filter((r) =>
      `${r.docName || ''} ${r.googleDocId || ''}`.toLowerCase().includes(q)
    );
  }, [repositories, repoQuery]);

  const isLocal = trackingMode === 'LOCAL';

  /* --------------------------------- Render --------------------------------- */

  return (
    <div className="relative min-h-screen overflow-x-clip bg-[#fafafa] font-sans text-[#1f2328] antialiased selection:bg-[#bbf7d0] selection:text-[#1f2328]">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[28rem] bg-[linear-gradient(to_right,#e1e4e8_1px,transparent_1px),linear-gradient(to_bottom,#e1e4e8_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-40 [mask-image:radial-gradient(ellipse_80%_60%_at_50%_0%,#000_60%,transparent_100%)]" />

      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-[#e1e4e8] bg-[#fafafa]/85 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
          <button
            type="button"
            onClick={() => navigate('/')}
            title="Return to landing page"
            className={`flex select-none items-center gap-2.5 rounded-md font-bold text-[#24292f] transition-opacity hover:opacity-80 ${FOCUS}`}
          >
            <span className="grid h-7 w-7 place-items-center rounded-md bg-[#24292f] text-white">
              <FileText size={15} />
            </span>
            GitDoc
            <span className="rounded-full border border-[#a1dfb1] bg-[#dafbe1] px-2 py-0.5 font-mono text-[11px] font-semibold text-[#1a7f37]">
              Cloud Hub
            </span>
          </button>

          <div className="flex items-center gap-3">
            <div className="hidden text-right leading-tight sm:block">
              <p className="text-[11px] text-[#57606a]">Signed in as</p>
              <p className="max-w-[12rem] truncate text-[13px] font-medium text-[#24292f]">{user?.name}</p>
            </div>
            <Avatar user={user} />
            <button
              type="button"
              onClick={handleLogout}
              className={`inline-flex items-center gap-1.5 rounded-lg border border-[#d0d7de] bg-white px-3 py-1.5 text-xs font-medium text-[#cf222e] shadow-sm transition-colors hover:bg-[#f6f8fa] ${FOCUS}`}
            >
              <LogOut size={13} />
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="relative mx-auto grid max-w-6xl gap-8 px-6 py-8 lg:grid-cols-12">
        {/* ------------------------------ Left column ------------------------------ */}
        <aside className="space-y-6 lg:sticky lg:top-20 lg:col-span-4 lg:self-start">
          {/* Track a document */}
          <section aria-labelledby="track-title" className="rounded-xl border border-[#d0d7de] bg-white p-5 shadow-sm">
            <h2 id="track-title" className="mb-4 flex items-center gap-2 text-sm font-semibold text-[#24292f]">
              <Folder size={15} className="text-[#57606a]" />
              Open a document
            </h2>

            {ENABLE_GOOGLE_DOCS && (
              <div role="group" aria-label="Tracking source" className="mb-4 grid grid-cols-2 gap-1 rounded-lg border border-[#d0d7de] bg-[#f6f8fa] p-1 text-xs font-medium">
                {[
                  ['LOCAL', Laptop, 'Local file'],
                  ['GOOGLE_DOC', Globe, 'Google Doc'],
                ].map(([mode, Icon, label]) => (
                  <button
                    key={mode}
                    type="button"
                    aria-pressed={trackingMode === mode}
                    onClick={() => switchMode(mode)}
                    className={`flex items-center justify-center gap-1.5 rounded-md py-1.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1a7f37] ${
                      trackingMode === mode
                        ? 'border border-[#d0d7de] bg-white font-semibold text-[#24292f] shadow-sm'
                        : 'border border-transparent text-[#57606a] hover:text-[#24292f]'
                    }`}
                  >
                    <Icon size={13} />
                    {label}
                  </button>
                ))}
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate className="space-y-3">
              <div>
                <label htmlFor="doc-path" className="mb-1.5 block text-xs font-semibold text-[#24292f]">
                  {isLocal ? 'File path' : 'Google Doc URL or ID'}
                </label>
                <input
                  id="doc-path"
                  type="text"
                  value={filePath}
                  onChange={(e) => {
                    setFilePath(e.target.value);
                    if (inputError) setInputError('');
                  }}
                  placeholder={isLocal ? '/Users/username/Desktop/test.docx' : 'https://docs.google.com/document/d/...'}
                  autoComplete="off"
                  spellCheck={false}
                  aria-invalid={Boolean(inputError)}
                  aria-describedby="doc-path-help"
                  className={`w-full rounded-lg border bg-[#f6f8fa] p-3 font-mono text-xs text-[#24292f] shadow-inner transition-colors placeholder:text-[#8c959f] focus:outline-none focus:ring-2 ${
                    inputError
                      ? 'border-[#cf222e] focus:ring-[#cf222e]/30'
                      : 'border-[#d0d7de] focus:border-[#1a7f37] focus:ring-[#1a7f37]/25'
                  }`}
                />
                <p
                  id="doc-path-help"
                  className={`mt-1.5 text-xs ${inputError ? 'text-[#cf222e]' : 'text-[#57606a]'}`}
                >
                  {inputError || (isLocal ? 'Use the same path you gave to gitdoc track.' : 'Paste the document link or its 44-character ID.')}
                </p>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className={`flex w-full items-center justify-center gap-2 rounded-lg bg-[#24292f] px-4 py-2.5 text-[13px] font-semibold text-white shadow-sm transition-colors hover:bg-[#1f2328] disabled:cursor-not-allowed disabled:opacity-70 ${FOCUS}`}
              >
                <RefreshCw size={14} className={submitting ? 'motion-safe:animate-spin' : ''} />
                {submitting ? 'Working…' : isLocal ? 'Load version history' : 'Start watching Google Doc'}
              </button>
            </form>

            {status.message && (
              <div className="mt-4">
                <StatusBanner status={status} />
              </div>
            )}
          </section>

          {/* Tracked documents */}
          <section aria-labelledby="repos-title" className="rounded-xl border border-[#d0d7de] bg-white shadow-sm">
            <div className="flex items-center justify-between gap-2 px-5 pb-3 pt-4">
              <h2 id="repos-title" className="flex items-center gap-2 text-sm font-semibold text-[#24292f]">
                <FileClock size={15} className="text-[#57606a]" />
                Tracked documents
                {repositories.length > 0 && (
                  <span className="rounded-full bg-[#eff1f3] px-2 py-0.5 font-mono text-[11px] font-medium text-[#57606a]">
                    {repositories.length}
                  </span>
                )}
              </h2>
              <button
                type="button"
                onClick={fetchUserRepositories}
                disabled={loadingRepos}
                aria-label="Refresh tracked documents"
                title="Refresh"
                className={`${iconButton} w-8 px-0`}
              >
                <RefreshCw size={13} className={loadingRepos ? 'motion-safe:animate-spin' : ''} />
              </button>
            </div>

            {repositories.length > 6 && (
              <div className="relative px-5 pb-3">
                <Search size={13} className="pointer-events-none absolute left-8 top-1/2 -translate-y-[70%] text-[#57606a]" />
                <input
                  type="search"
                  value={repoQuery}
                  onChange={(e) => setRepoQuery(e.target.value)}
                  placeholder="Filter documents"
                  aria-label="Filter tracked documents"
                  className="w-full rounded-lg border border-[#d0d7de] bg-[#f6f8fa] py-2 pl-8 pr-3 text-xs focus:border-[#1a7f37] focus:outline-none focus:ring-2 focus:ring-[#1a7f37]/25"
                />
              </div>
            )}

            <div className="max-h-72 overflow-y-auto border-t border-[#e1e4e8] p-2">
              {loadingRepos && repositories.length === 0 ? (
                <div aria-hidden="true" className="space-y-2 p-1 motion-safe:animate-pulse">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="h-[3.25rem] rounded-lg bg-[#f6f8fa]" />
                  ))}
                </div>
              ) : repoError ? (
                <p role="alert" className="p-3 text-xs text-[#cf222e]">
                  {repoError}
                </p>
              ) : repositories.length === 0 ? (
                <p className="p-3 text-xs leading-relaxed text-[#57606a]">
                  Nothing tracked yet. Run <code className="rounded bg-[#eff1f3] px-1 py-0.5 font-mono text-[11px] text-[#24292f]">gitdoc track</code> on a file and it will show up here.
                </p>
              ) : filteredRepos.length === 0 ? (
                <p className="p-3 text-xs text-[#57606a]">No documents match “{repoQuery}”.</p>
              ) : (
                <ul className="space-y-1">
                  {filteredRepos.map((repo) => {
                    const id = repo.googleDocId || '';
                    const isGoogle = isGoogleDocId(id);
                    const selected = activePath === id;
                    const Icon = isGoogle ? Globe : FileClock;
                    return (
                      <li key={repo._id || id}>
                        <button
                          type="button"
                          onClick={() => handleSelectRepository(id)}
                          aria-current={selected ? 'true' : undefined}
                          className={`flex h-[3.25rem] w-full items-center gap-3 rounded-lg border px-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1a7f37] ${
                            selected
                              ? 'border-[#1a7f37] bg-[#dafbe1]/40'
                              : 'border-transparent hover:bg-[#f6f8fa]'
                          }`}
                        >
                          <Icon size={15} className={`shrink-0 ${selected ? 'text-[#1a7f37]' : isGoogle ? 'text-[#0969da]' : 'text-[#57606a]'}`} />
                          <span className="min-w-0">
                            <span className="block truncate text-[13px] font-semibold text-[#24292f]">
                              {repo.docName || baseName(id) || 'Unnamed document'}
                            </span>
                            <span className="block truncate font-mono text-[11px] text-[#57606a]" title={id}>
                              {id}
                            </span>
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </section>
        </aside>

        {/* ------------------------------ Right column ----------------------------- */}
        <section aria-labelledby="timeline-title" className="min-w-0 lg:col-span-8">
          <div className="overflow-hidden rounded-xl border border-[#d0d7de] bg-white shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#e1e4e8] px-5 py-4">
              <div className="flex min-w-0 items-center gap-2.5">
                <GitCommit size={16} className="shrink-0 text-[#1a7f37]" />
                <h2 id="timeline-title" className="text-base font-bold text-[#24292f]">
                  Version history
                </h2>
                {fileName && (
                  <span
                    title={fileName}
                    className="max-w-[14rem] truncate rounded-md border border-[#d0d7de] bg-[#f6f8fa] px-2.5 py-1 font-mono text-[11px] font-medium text-[#57606a]"
                  >
                    {fileName}
                  </span>
                )}
              </div>

              {activePath && (
                <div className="flex items-center gap-4">
                  <LiveIndicator syncError={syncError} lastSynced={lastSynced} />
                  <div role="group" aria-label="Sort versions" className="inline-flex rounded-lg border border-[#d0d7de] bg-[#f6f8fa] p-0.5 text-xs font-medium">
                    {[
                      ['newest', 'Newest'],
                      ['oldest', 'Oldest'],
                    ].map(([value, label]) => (
                      <button
                        key={value}
                        type="button"
                        aria-pressed={order === value}
                        onClick={() => setOrder(value)}
                        className={`rounded-md px-2.5 py-1 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1a7f37] ${
                          order === value ? 'bg-white text-[#24292f] shadow-sm' : 'text-[#57606a] hover:text-[#24292f]'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {activePath && commits.length > 0 && (
              <dl className="grid grid-cols-3 divide-x divide-[#e1e4e8] border-b border-[#e1e4e8] bg-[#fafafa]">
                {[
                  ['Versions', commits.length.toLocaleString()],
                  ['Latest', latest ? `Version ${latest.version}` : '—'],
                  ['Last saved', latest ? fmtDateTime(latest.timestamp) : '—'],
                ].map(([label, value]) => (
                  <div key={label} className="min-w-0 px-5 py-3">
                    <dt className="text-xs text-[#57606a]">{label}</dt>
                    <dd className="mt-0.5 truncate text-sm font-semibold text-[#24292f]" title={value}>
                      {value}
                    </dd>
                  </div>
                ))}
              </dl>
            )}

            <div className="p-5">
              {loadingTimeline ? (
                <div className="space-y-4" aria-busy="true" aria-label="Loading versions">
                  {[0, 1, 2].map((i) => (
                    <VersionSkeleton key={i} />
                  ))}
                </div>
              ) : !activePath ? (
                <div className="grid min-h-[22rem] place-items-center rounded-xl border border-dashed border-[#d0d7de] bg-[#f6f8fa] px-6 py-10 text-center">
                  <div className="max-w-sm">
                    <span className="mx-auto grid h-10 w-10 place-items-center rounded-lg border border-[#d0d7de] bg-white text-[#57606a]">
                      <GitCommit size={18} />
                    </span>
                    <h3 className="mt-4 text-sm font-semibold text-[#24292f]">No document selected</h3>
                    <p className="mt-1.5 text-[13px] leading-relaxed text-[#57606a]">
                      Enter a file path or pick a tracked document to see its versions. New here? Install the CLI, then run{' '}
                      <code className="rounded bg-white px-1 py-0.5 font-mono text-[11px] text-[#24292f]">gitdoc track</code> on a file.
                    </p>
                    <code className="mt-4 block overflow-x-auto whitespace-nowrap rounded-lg border border-[#d0d7de] bg-white px-3 py-2 text-left font-mono text-xs text-[#24292f]">
                      {INSTALL_CMD}
                    </code>
                  </div>
                </div>
              ) : commits.length === 0 ? (
                <div className="grid min-h-[16rem] place-items-center rounded-xl border border-dashed border-[#d0d7de] bg-[#f6f8fa] px-6 text-center">
                  <p className="max-w-xs text-[13px] leading-relaxed text-[#57606a]">
                    No versions recorded yet. Save the file and the first version will appear here.
                  </p>
                </div>
              ) : (
                <>
                  <ol className="relative space-y-4 before:absolute before:bottom-6 before:left-[11px] before:top-6 before:w-px before:bg-[#d0d7de]">
                    {visible.map((commit) => (
                      <li key={commit.version} className="relative pl-9">
                        <span
                          aria-hidden="true"
                          className={`absolute left-[5px] top-[19px] z-10 h-3.5 w-3.5 rounded-full border-2 bg-white ${
                            commit.type === 'GENESIS' ? 'border-[#8250df]' : 'border-[#1a7f37]'
                          }`}
                        />
                        <VersionCard
                          commit={commit}
                          downloadUrl={downloadUrlFor(commit.version)}
                          onExpand={expandCommit}
                        />
                      </li>
                    ))}
                  </ol>

                  <div className="mt-6 flex flex-col items-center gap-2 border-t border-[#e1e4e8] pt-5">
                    <p className="text-xs text-[#57606a]">
                      Showing {visible.length.toLocaleString()} of {ordered.length.toLocaleString()} versions
                    </p>
                    {remaining > 0 && (
                      <button
                        type="button"
                        onClick={() => setVisibleCount((n) => n + PAGE_SIZE)}
                        className={`${iconButton} h-9 px-4`}
                      >
                        Show {Math.min(PAGE_SIZE, remaining)} more
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </section>
      </main>

      {openCommit && (
        <DiffModal commit={openCommit} downloadUrl={downloadUrlFor(openCommit.version)} onClose={closeModal} />
      )}
    </div>
  );
}