// frontend/src/pages/LandingPage.jsx
import React, { useState } from 'react';
import {
  LogIn,
  Terminal,
  CheckCircle,
  Copy,
  Check,
  ShieldCheck,
  Loader2,
  LayoutDashboard,
  ExternalLink,
  FileText,
  Zap,
  GitCompare,
  RotateCcw,
  ChevronDown,
} from 'lucide-react';

/* -------------------------------------------------------------------------- */
/*  Content                                                                   */
/* -------------------------------------------------------------------------- */

const VERSION = 'v2.0.4';
const INSTALL_CMD = 'npm install -g @singhparth427/gitdoc-cli';
const TRACK_CMD = 'gitdoc track "/path/to/document.docx"';
const NPM_URL = 'https://www.npmjs.com/package/@singhparth427/gitdoc-cli';

const FOCUS =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1a7f37] focus-visible:ring-offset-2 focus-visible:ring-offset-[#fafafa]';

// Each diff is a list of [text, changed] pairs so only the characters that
// actually changed get highlighted.
const DIFF_V3 = {
  old: [
    ['The project will be delivered in ', 0],
    ['six', 1],
    [' weeks for a fixed fee of $1', 0],
    ['2,0', 1],
    ['00.', 0],
  ],
  next: [
    ['The project will be delivered in ', 0],
    ['eight', 1],
    [' weeks for a fixed fee of $1', 0],
    ['4,5', 1],
    ['00.', 0],
  ],
};

const DIFF_V2 = {
  old: [
    ['Deliverables include a design review and ', 0],
    ['one', 1],
    [' round of revisions.', 0],
  ],
  next: [
    ['Deliverables include a design review and ', 0],
    ['two', 1],
    [' round', 0],
    ['s', 1],
    [' of revisions.', 0],
  ],
};

const VERSIONS = [
  { id: 'v3', hash: '7be04d8', time: '10:42', add: 8, del: 6, where: 'Paragraph 4', diff: DIFF_V3 },
  { id: 'v2', hash: 'e41b7d0', time: '10:31', add: 4, del: 3, where: 'Paragraph 2', diff: DIFF_V2 },
  { id: 'v1', hash: 'a3f9c21', time: '10:12', baseline: true },
];

const STEPS = [
  {
    id: 'step1',
    tag: 'Setup',
    tagClass: 'bg-[#eff1f3] border-[#d1d5da] text-[#24292f]',
    title: 'Install the CLI agent',
    body: 'Install the lightweight background tracking daemon globally from the public npm registry. You only do this once per machine.',
    cmd: INSTALL_CMD,
  },
  {
    id: 'step2',
    tag: 'Link',
    tagClass: 'bg-[#dafbe1] border-[#a1dfb1] text-[#1a7f37]',
    title: 'Point it at a document',
    body: 'Give the listener the path to any Word file. From then on the daemon records what changed every time you save.',
    cmd: TRACK_CMD,
  },
  {
    id: 'step3',
    tag: 'Stream',
    tagClass: 'bg-[#ddf4ff] border-[#54aeff]/40 text-[#0969da]',
    title: 'Edit and save as usual',
    body: 'Work in Word the way you always do. Each save is compared with the previous version and the result shows up in your dashboard.',
  },
];

const FEATURES = [
  {
    icon: Zap,
    title: 'Automated sync',
    kbd: 'Cmd+S',
    body: 'The background daemon picks up every save and records it as a new version. No manual commits, and no more final_v7_real.docx.',
  },
  {
    icon: GitCompare,
    title: 'Myers linear diffs',
    body: 'Changes are computed with the Myers diff algorithm down to individual characters, so a changed digit in a price shows up as exactly that digit.',
  },
  {
    icon: RotateCcw,
    title: 'Roll back from the terminal',
    body: 'Restore the document to any earlier version with a single command, without leaving the shell.',
  },
  {
    icon: ShieldCheck,
    title: 'Cryptographic state integrity',
    body: 'Every version is identified by a cryptographic hash, so history cannot be silently altered or corrupted.',
  },
  {
    icon: LayoutDashboard,
    title: 'Central dashboard',
    body: 'Sign in with Google to browse every tracked document, step through its versions and read the diffs in your browser.',
  },
];

// NOTE: keep this list in sync with the real CLI surface.
const COMMANDS = [
  { cmd: 'gitdoc track <file>', desc: 'Start watching a .docx file. Each save is recorded as a new version.' },
  { cmd: 'gitdoc log [file]', desc: 'List saved versions with timestamps and the size of each change.' },
  { cmd: 'gitdoc diff <from> <to>', desc: 'Show the character-level changes between two versions.' },
  { cmd: 'gitdoc rollback <version>', desc: 'Restore the document to an earlier version.' },
];

const FAQ = [
  {
    q: 'How does GitDoc know when I save?',
    a: 'The CLI agent runs as a lightweight background daemon and watches the file paths you point it at. When a tracked file is saved, it compares the new content with the previous version and records the difference.',
  },
  {
    q: 'What is a character-level diff?',
    a: 'Instead of marking a whole line as changed, GitDoc uses the Myers algorithm to highlight only the characters that differ. If a price changes from $12,000 to $14,500, you see the digits that moved rather than the entire paragraph.',
  },
  {
    q: 'Can I go back to an earlier version?',
    a: 'Yes. Use the rollback command from your terminal to restore any previous version. The dashboard shows the full version list so you can find the one you want first.',
  },
  {
    q: 'How do I know a version has not been altered?',
    a: 'Each version is identified by a cryptographic hash of its state. If the content changes, the hash no longer matches, so tampering or corruption is detectable.',
  },
  {
    q: 'Why do I sign in with Google?',
    a: 'Signing in links the versions your agent records to your account, so the dashboard shows your documents and nobody else’s.',
  },
  {
    q: 'Why does sign-in sometimes take a moment?',
    a: 'The authentication gateway is hosted on Render and can go to sleep when idle. The first sign-in after a quiet period wakes it up, which is why the button shows a booting state. Later attempts are fast.',
  },
];

/* -------------------------------------------------------------------------- */
/*  Small building blocks                                                     */
/* -------------------------------------------------------------------------- */

// Colours a shell command in the same palette the original page used.
function CmdText({ text }) {
  const tokens = text.match(/"[^"]*"|\S+/g) || [];
  return (
    <>
      {tokens.map((tok, i) => {
        let color = '#24292f';
        if (i === 0) color = '#cf222e';
        else if (i === 1) color = '#0550ae';
        else if (tok.startsWith('"')) color = '#0a3069';
        else if (tok.startsWith('-')) color = '#953800';
        return (
          <span key={i} style={{ color }}>
            {tok}
            {i < tokens.length - 1 ? ' ' : ''}
          </span>
        );
      })}
    </>
  );
}

function CopyButton({ text, id, copiedId, onCopy }) {
  const copied = copiedId === id;
  return (
    <button
      type="button"
      onClick={() => onCopy(text, id)}
      aria-label={copied ? 'Copied to clipboard' : `Copy command: ${text}`}
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium text-[#57606a] transition-colors hover:bg-[#eaeef2] hover:text-[#24292f] ${FOCUS}`}
    >
      {copied ? <Check size={14} className="text-[#1a7f37]" /> : <Copy size={14} />}
      <span className="hidden sm:inline">{copied ? 'Copied' : 'Copy'}</span>
    </button>
  );
}

function CommandBar({ text, id, copiedId, onCopy }) {
  return (
    <div className="flex items-center justify-between gap-2 rounded-lg border border-[#d0d7de] bg-[#f6f8fa] py-1 pl-3.5 pr-1.5 font-mono text-[13px]">
      <code className="min-w-0 flex-1 select-all overflow-x-auto whitespace-nowrap py-1.5">
        <CmdText text={text} />
      </code>
      <CopyButton text={text} id={id} copiedId={copiedId} onCopy={onCopy} />
    </div>
  );
}

const DIFF_THEME = {
  dark: {
    del: { row: 'bg-[#f85149]/10', hit: 'bg-[#f85149]/40', sign: 'text-[#ff7b72]' },
    add: { row: 'bg-[#3fb950]/10', hit: 'bg-[#3fb950]/40', sign: 'text-[#56d364]' },
    text: 'text-[#e6edf3]',
  },
  light: {
    del: { row: 'bg-[#ffebe9]', hit: 'bg-[#ffcecb]', sign: 'text-[#cf222e]' },
    add: { row: 'bg-[#dafbe1]', hit: 'bg-[#aceebb]', sign: 'text-[#1a7f37]' },
    text: 'text-[#1f2328]',
  },
};

function DiffRow({ kind, parts, theme = 'dark' }) {
  const t = DIFF_THEME[theme];
  const c = kind === 'del' ? t.del : t.add;
  return (
    <div className={`flex ${c.row} ${t.text}`}>
      <span aria-hidden="true" className={`w-6 shrink-0 select-none text-center ${c.sign}`}>
        {kind === 'del' ? '−' : '+'}
      </span>
      <span className="sr-only">{kind === 'del' ? 'Removed: ' : 'Added: '}</span>
      <span className="min-w-0 whitespace-pre-wrap break-words pr-3">
        {parts.map(([text, hit], i) =>
          hit ? (
            <span key={i} className={`rounded-sm ${c.hit}`}>
              {text}
            </span>
          ) : (
            <span key={i}>{text}</span>
          )
        )}
      </span>
    </div>
  );
}

// One component for every sign-in / dashboard entry point on the page.
function AuthAction({ user, isRedirecting, onLogin, onDashboard, compact = false }) {
  const size = compact ? 'px-3.5 py-2 text-[13px]' : 'px-6 py-3 text-sm';
  const base = `inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-colors ${size} ${FOCUS}`;

  if (user) {
    return (
      <button
        type="button"
        onClick={onDashboard}
        className={`${base} border border-[#1a7f37] bg-[#1a7f37] text-white hover:bg-[#1a6f30]`}
      >
        <LayoutDashboard size={16} />
        Go to dashboard
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onLogin}
      disabled={isRedirecting}
      aria-busy={isRedirecting}
      className={`${base} ${
        isRedirecting
          ? 'cursor-not-allowed bg-[#57606a] text-gray-200 opacity-80'
          : 'bg-[#24292f] text-white hover:bg-[#1f2328]'
      }`}
    >
      {isRedirecting ? (
        <>
          <Loader2 size={16} className="animate-spin text-[#dafbe1]" />
          Booting...
        </>
      ) : (
        <>
          <LogIn size={16} />
          {compact ? 'Sign in' : 'Sign in with Google Account'}
        </>
      )}
    </button>
  );
}

/* -------------------------------------------------------------------------- */
/*  Hero terminal                                                             */
/* -------------------------------------------------------------------------- */

const DEMO_TABS = ['track', 'log', 'diff', 'rollback'];

const Prompt = ({ children }) => (
  <div>
    <span className="text-[#7ee787]">$</span> <span className="text-[#e6edf3]">{children}</span>
  </div>
);
const Ok = ({ children }) => (
  <div>
    <span className="text-[#56d364]">✔</span> {children}
  </div>
);
const Dim = ({ children, className = '' }) => <div className={`text-[#8b949e] ${className}`}>{children}</div>;

function TerminalDemo() {
  const [tab, setTab] = useState('diff');

  const onKeyDown = (e) => {
    const i = DEMO_TABS.indexOf(tab);
    let next = null;
    if (e.key === 'ArrowRight') next = DEMO_TABS[(i + 1) % DEMO_TABS.length];
    if (e.key === 'ArrowLeft') next = DEMO_TABS[(i - 1 + DEMO_TABS.length) % DEMO_TABS.length];
    if (next) {
      e.preventDefault();
      setTab(next);
      const el = document.getElementById(`demo-tab-${next}`);
      if (el) el.focus();
    }
  };

  return (
    <figure className="m-0">
      <div className="overflow-hidden rounded-xl border border-[#30363d] bg-[#0d1117] shadow-[0_24px_48px_-12px_rgba(31,35,40,0.35)]">
        <div className="flex items-center justify-between gap-3 border-b border-[#30363d] bg-[#161b22] px-4 py-2.5">
          <div className="flex items-center gap-2 font-mono text-xs text-[#8b949e]">
            <Terminal size={14} />
            proposal.docx
          </div>
          <div
            role="tablist"
            aria-label="GitDoc command examples"
            onKeyDown={onKeyDown}
            className="flex items-center gap-1"
          >
            {DEMO_TABS.map((t) => (
              <button
                key={t}
                id={`demo-tab-${t}`}
                role="tab"
                type="button"
                aria-selected={tab === t}
                aria-controls="demo-panel"
                tabIndex={tab === t ? 0 : -1}
                onClick={() => setTab(t)}
                className={`rounded-md px-2.5 py-1 font-mono text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3fb950] ${
                  tab === t ? 'bg-[#30363d] text-[#e6edf3]' : 'text-[#8b949e] hover:text-[#e6edf3]'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <div
          id="demo-panel"
          role="tabpanel"
          aria-labelledby={`demo-tab-${tab}`}
          key={tab}
          className="gd-fade min-h-[14rem] space-y-1.5 overflow-x-auto p-5 font-mono text-[12.5px] leading-6 text-[#c9d1d9]"
        >
          {tab === 'track' && (
            <>
              <Prompt>gitdoc track "./proposal.docx"</Prompt>
              <Ok>Watching proposal.docx</Ok>
              <Ok>
                Baseline saved as v1 <span className="text-[#8b949e]">(a3f9c21)</span>
              </Ok>
              <Dim>Running in the background. Edit and save as usual.</Dim>
              <div className="pt-3">
                <Dim>10:31:08 save detected</Dim>
                <Ok>
                  v2 recorded <span className="text-[#8b949e]">(e41b7d0)</span>{' '}
                  <span className="text-[#56d364]">+4</span> <span className="text-[#ff7b72]">−3</span>
                </Ok>
              </div>
            </>
          )}

          {tab === 'log' && (
            <>
              <Prompt>gitdoc log proposal.docx</Prompt>
              <div className="pt-1">
                {VERSIONS.map((v) => (
                  <div key={v.id} className="grid grid-cols-[2rem_5rem_3.5rem_1fr] gap-x-3 whitespace-nowrap">
                    <span className="text-[#e6edf3]">{v.id}</span>
                    <span className="text-[#d29922]">{v.hash}</span>
                    <span className="text-[#8b949e]">{v.time}</span>
                    {v.baseline ? (
                      <span className="text-[#8b949e]">baseline</span>
                    ) : (
                      <span>
                        <span className="text-[#56d364]">+{v.add}</span>{' '}
                        <span className="text-[#ff7b72]">−{v.del}</span>
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}

          {tab === 'diff' && (
            <>
              <Prompt>gitdoc diff v2 v3</Prompt>
              <Dim>proposal.docx · v2 to v3 · paragraph 4</Dim>
              <div className="py-1">
                <DiffRow kind="del" parts={DIFF_V3.old} />
                <DiffRow kind="add" parts={DIFF_V3.next} />
              </div>
              <Dim>
                <span className="text-[#56d364]">+8</span> <span className="text-[#ff7b72]">−6</span> characters
              </Dim>
            </>
          )}

          {tab === 'rollback' && (
            <>
              <Prompt>gitdoc rollback v2</Prompt>
              <Ok>
                Restored proposal.docx to v2 <span className="text-[#8b949e]">(e41b7d0)</span>
              </Ok>
            </>
          )}
        </div>
      </div>
      <figcaption className="mt-3 text-xs text-[#57606a]">
        Sample session. Pick a command to see what it prints.
      </figcaption>
    </figure>
  );
}

/* -------------------------------------------------------------------------- */
/*  Dashboard preview                                                         */
/* -------------------------------------------------------------------------- */

function DashboardPreview() {
  const [selected, setSelected] = useState('v3');
  const current = VERSIONS.find((v) => v.id === selected);

  return (
    <figure className="m-0">
      <div className="overflow-hidden rounded-xl border border-[#d0d7de] bg-white shadow-[0_8px_30px_rgba(31,35,40,0.06)]">
        <div className="flex items-center justify-between border-b border-[#d0d7de] bg-[#f6f8fa] px-4 py-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-[#24292f]">
            <FileText size={15} className="text-[#57606a]" />
            proposal.docx
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[#a1dfb1] bg-[#dafbe1] px-2.5 py-0.5 text-[11px] font-medium text-[#1a7f37]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#1a7f37]" />
            Tracking
          </span>
        </div>

        <div className="grid md:grid-cols-[13rem_1fr]">
          <ul className="flex gap-1 overflow-x-auto border-b border-[#d0d7de] p-2 md:block md:space-y-1 md:border-b-0 md:border-r">
            {VERSIONS.map((v) => (
              <li key={v.id} className="shrink-0">
                <button
                  type="button"
                  aria-pressed={selected === v.id}
                  onClick={() => setSelected(v.id)}
                  className={`w-full rounded-md px-3 py-2 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1a7f37] ${
                    selected === v.id ? 'bg-[#eff1f3]' : 'hover:bg-[#f6f8fa]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-sm font-semibold text-[#24292f]">{v.id}</span>
                    <span className="font-mono text-[11px] text-[#57606a]">{v.time}</span>
                  </div>
                  <div className="mt-0.5 font-mono text-[11px]">
                    {v.baseline ? (
                      <span className="text-[#57606a]">baseline</span>
                    ) : (
                      <>
                        <span className="text-[#1a7f37]">+{v.add}</span>{' '}
                        <span className="text-[#cf222e]">−{v.del}</span>
                      </>
                    )}
                  </div>
                </button>
              </li>
            ))}
          </ul>

          <div className="min-w-0 p-5">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h3 className="text-sm font-semibold text-[#24292f]">
                {current.id}
                {!current.baseline && <span className="font-normal text-[#57606a]"> · {current.where}</span>}
              </h3>
              <span className="font-mono text-xs text-[#57606a]">{current.hash}</span>
            </div>

            {current.baseline ? (
              <p className="mt-4 text-sm leading-relaxed text-[#57606a]">
                This is the document as it was when tracking started. Every later version is compared against it.
              </p>
            ) : (
              <div className="mt-4 space-y-px overflow-hidden rounded-lg border border-[#d0d7de] font-mono text-[12.5px] leading-6">
                <DiffRow kind="del" parts={current.diff.old} theme="light" />
                <DiffRow kind="add" parts={current.diff.next} theme="light" />
              </div>
            )}

            {!current.baseline && (
              <p className="mt-4 text-xs text-[#57606a]">
                To restore this version, run{' '}
                <code className="rounded bg-[#eff1f3] px-1.5 py-0.5 font-mono text-[11px] text-[#24292f]">
                  gitdoc rollback {current.id}
                </code>
              </p>
            )}
          </div>
        </div>
      </div>
      <figcaption className="mt-3 text-xs text-[#57606a]">Preview with sample data. Select a version to see its diff.</figcaption>
    </figure>
  );
}

/* -------------------------------------------------------------------------- */
/*  Page                                                                      */
/* -------------------------------------------------------------------------- */

export default function LandingPage({ handleLoginTrigger, user, navigate }) {
  const [copiedStep, setCopiedStep] = useState(null);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [loginError, setLoginError] = useState(false);
  const [openFaq, setOpenFaq] = useState(0);

  const copyToClipboard = async (text, stepId) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedStep(stepId);
      setTimeout(() => setCopiedStep(null), 2000);
    } catch (err) {
      // Clipboard can be unavailable (insecure context, denied permission).
      // The command text is selectable, so the user can still copy it by hand.
    }
  };

  const handleLoginClick = async () => {
    setLoginError(false);
    setIsRedirecting(true);
    try {
      await handleLoginTrigger();
    } catch (err) {
      setIsRedirecting(false);
      setLoginError(true);
    }
  };

  const goDashboard = () => navigate('/dashboard');

  const authProps = { user, isRedirecting, onLogin: handleLoginClick, onDashboard: goDashboard };

  const statusText = user
    ? `Welcome back, ${user.name}`
    : isRedirecting
    ? 'Waking Auth Gateway Core (Render)...'
    : 'Production Gateway Connected';

  return (
    <div
      id="top"
      className="relative min-h-screen overflow-x-clip bg-[#fafafa] font-sans text-[#1f2328] antialiased selection:bg-[#bbf7d0] selection:text-[#1f2328]"
    >
      <style>{`
        @keyframes gd-fade { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: none; } }
        .gd-fade { animation: gd-fade .22s ease-out both; }
        @media (prefers-reduced-motion: reduce) { .gd-fade { animation: none; } }
        @media (prefers-reduced-motion: no-preference) { html { scroll-behavior: smooth; } }
      `}</style>

      <span className="sr-only" role="status" aria-live="polite">
        {copiedStep ? 'Copied to clipboard' : ''}
      </span>

      {/* ------------------------------ Navigation ------------------------------ */}
      <header className="sticky top-0 z-30 border-b border-[#e1e4e8] bg-[#fafafa]/85 backdrop-blur">
        <nav aria-label="Primary" className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
          <a href="#top" className={`flex items-center gap-2.5 rounded-md font-bold text-[#24292f] ${FOCUS}`}>
            <span className="grid h-7 w-7 place-items-center rounded-md bg-[#24292f] text-white">
              <FileText size={15} />
            </span>
            GitDoc
            <span className="hidden rounded-full border border-[#a1dfb1] bg-[#dafbe1] px-2 py-0.5 font-mono text-[11px] font-semibold text-[#1a7f37] sm:inline">
              {VERSION}
            </span>
          </a>

          <div className="flex items-center gap-6">
            <ul className="hidden items-center gap-6 text-sm text-[#57606a] md:flex">
              {[
                ['Quickstart', '#quickstart'],
                ['Features', '#features'],
                ['Dashboard', '#dashboard'],
                ['Commands', '#commands'],
                ['FAQ', '#faq'],
              ].map(([label, href]) => (
                <li key={href}>
                  <a href={href} className={`rounded transition-colors hover:text-[#24292f] ${FOCUS}`}>
                    {label}
                  </a>
                </li>
              ))}
            </ul>
            <AuthAction {...authProps} compact />
          </div>
        </nav>
      </header>

      <main>
        {/* ---------------------------------- Hero --------------------------------- */}
        <section className="relative">
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,#e1e4e8_1px,transparent_1px),linear-gradient(to_bottom,#e1e4e8_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-60 [mask-image:radial-gradient(ellipse_60%_60%_at_50%_0%,#000_70%,transparent_100%)]" />

          <div className="relative mx-auto grid max-w-6xl items-center gap-14 px-6 pb-24 pt-14 lg:grid-cols-12 lg:pt-20">
            <div className="lg:col-span-5">
              <div
                role="status"
                className="inline-flex items-center gap-2 rounded-full border border-[#d1d5da] bg-[#eff1f3] px-3 py-1 font-mono text-xs font-medium text-[#24292f] shadow-sm"
              >
                <span
                  className={`h-2 w-2 rounded-full motion-safe:animate-pulse ${
                    isRedirecting ? 'bg-[#bf8700]' : 'bg-[#1a7f37]'
                  }`}
                />
                {statusText}
              </div>

              <h1 className="mt-6 text-4xl font-extrabold leading-[1.05] tracking-tight text-[#24292f] sm:text-5xl">
                Complete version control for Word documents.
              </h1>

              <p className="mt-5 max-w-md text-base leading-relaxed text-[#57606a] sm:text-lg">
                Track local changes, view character-level diffs, and roll back to any previous version straight from
                your terminal.
              </p>

              <div className="mt-8 flex flex-col items-start gap-3 sm:flex-row sm:items-center">
                <AuthAction {...authProps} />
                <a
                  href="#quickstart"
                  className={`inline-flex items-center justify-center rounded-lg border border-[#d0d7de] bg-white px-6 py-3 text-sm font-semibold text-[#24292f] transition-colors hover:bg-[#f6f8fa] ${FOCUS}`}
                >
                  Read the quickstart
                </a>
              </div>
              {loginError && (
                <p role="alert" className="mt-3 max-w-md text-sm text-[#cf222e]">
                  We couldn’t reach the sign-in service. Check your connection and try again.
                </p>
              )}

              <div className="mt-10 max-w-md">
                <p className="mb-2 text-xs text-[#57606a]">Install with npm</p>
                <CommandBar text={INSTALL_CMD} id="hero" copiedId={copiedStep} onCopy={copyToClipboard} />
              </div>

              <ul className="mt-8 space-y-2.5 text-sm text-[#57606a]">
                {[
                  'Every save becomes a version, automatically',
                  'Diffs down to the individual character',
                  'Roll back to any version from the terminal',
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2.5">
                    <CheckCircle size={15} className="shrink-0 text-[#1a7f37]" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="min-w-0 lg:col-span-7">
              <TerminalDemo />
            </div>
          </div>
        </section>

        {/* ------------------------------- Quickstart ------------------------------- */}
        <section id="quickstart" className="scroll-mt-14 border-t border-[#e1e4e8] bg-white">
          <div className="mx-auto grid max-w-6xl gap-12 px-6 py-20 lg:grid-cols-12">
            <div className="lg:col-span-4">
              <h2 className="text-3xl font-bold tracking-tight text-[#24292f]">Start tracking in three steps</h2>
              <p className="mt-3 max-w-sm text-[15px] leading-relaxed text-[#57606a]">
                Install the agent once, point it at a document, and keep working. Your version history builds itself.
              </p>
              <p className="mt-6 max-w-sm text-sm leading-relaxed text-[#57606a]">
                Want to see the history in your browser? Sign in with Google and open the dashboard.
              </p>
            </div>

            <ol className="lg:col-span-8">
              {STEPS.map((s, i) => (
                <li key={s.id} className="relative pb-10 pl-14 last:pb-0">
                  {i < STEPS.length - 1 && <span aria-hidden="true" className="absolute bottom-0 left-4 top-9 w-px bg-[#d0d7de]" />}
                  <span className="absolute left-0 top-0 grid h-8 w-8 place-items-center rounded-full border border-[#d0d7de] bg-white font-mono text-sm font-semibold text-[#24292f]">
                    {i + 1}
                  </span>

                  <div className="flex items-center gap-3">
                    <h3 className="text-base font-bold text-[#24292f]">{s.title}</h3>
                    <span className={`rounded border px-2 py-0.5 text-[11px] font-medium ${s.tagClass}`}>{s.tag}</span>
                  </div>
                  <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-[#57606a]">{s.body}</p>

                  <div className="mt-4 max-w-xl">
                    {s.cmd ? (
                      <CommandBar text={s.cmd} id={s.id} copiedId={copiedStep} onCopy={copyToClipboard} />
                    ) : (
                      <div className="inline-flex items-center gap-2.5 rounded-lg border border-[#d0d7de] bg-[#f6f8fa] px-3.5 py-2.5 font-mono text-xs text-[#57606a]">
                        <span className="relative flex h-2 w-2">
                          <span className="absolute inline-flex h-full w-full rounded-full bg-[#1a7f37] opacity-60 motion-safe:animate-ping" />
                          <span className="relative inline-flex h-2 w-2 rounded-full bg-[#1a7f37]" />
                        </span>
                        Streaming live updates directly to cloud
                      </div>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* -------------------------------- Features -------------------------------- */}
        <section id="features" className="scroll-mt-14 border-t border-[#e1e4e8]">
          <div className="mx-auto grid max-w-6xl gap-12 px-6 py-20 lg:grid-cols-12">
            <div className="lg:col-span-4">
              <div className="lg:sticky lg:top-24">
                <h2 className="text-3xl font-bold tracking-tight text-[#24292f]">
                  Built for documents, not just code
                </h2>
                <p className="mt-3 max-w-sm text-[15px] leading-relaxed text-[#57606a]">
                  Word files are binary, so ordinary version control can’t tell you what changed. GitDoc reads the
                  content and tracks it for you.
                </p>
              </div>
            </div>

            <dl className="divide-y divide-[#e1e4e8] border-y border-[#e1e4e8] lg:col-span-8">
              {FEATURES.map(({ icon: Icon, title, kbd, body }) => (
                <div key={title} className="flex gap-5 py-6">
                  <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-[#d0d7de] bg-white text-[#24292f]">
                    <Icon size={17} />
                  </span>
                  <div>
                    <dt className="flex flex-wrap items-center gap-2 text-base font-bold text-[#24292f]">
                      {title}
                      {kbd && (
                        <kbd className="rounded border border-[#d0d7de] bg-white px-1.5 py-0.5 font-mono text-[11px] font-medium text-[#57606a] shadow-[inset_0_-1px_0_#d0d7de]">
                          {kbd}
                        </kbd>
                      )}
                    </dt>
                    <dd className="mt-1.5 max-w-xl text-sm leading-relaxed text-[#57606a]">{body}</dd>
                  </div>
                </div>
              ))}
            </dl>
          </div>
        </section>

        {/* -------------------------------- Dashboard -------------------------------- */}
        <section id="dashboard" className="scroll-mt-14 border-t border-[#e1e4e8] bg-white">
          <div className="mx-auto grid max-w-6xl items-center gap-12 px-6 py-20 lg:grid-cols-12">
            <div className="lg:col-span-5">
              <h2 className="text-3xl font-bold tracking-tight text-[#24292f]">See every version in one place</h2>
              <p className="mt-3 max-w-md text-[15px] leading-relaxed text-[#57606a]">
                The dashboard shows each tracked document with its full version list. Select a version to read exactly
                what changed, then restore it from the terminal when you need it back.
              </p>
              <div className="mt-8">
                <AuthAction {...authProps} />
              </div>
            </div>
            <div className="min-w-0 lg:col-span-7">
              <DashboardPreview />
            </div>
          </div>
        </section>

        {/* -------------------------------- Commands -------------------------------- */}
        <section id="commands" className="scroll-mt-14 border-t border-[#e1e4e8]">
          <div className="mx-auto grid max-w-6xl gap-12 px-6 py-20 lg:grid-cols-12">
            <div className="lg:col-span-4">
              <h2 className="text-3xl font-bold tracking-tight text-[#24292f]">Command reference</h2>
              <p className="mt-3 max-w-sm text-[15px] leading-relaxed text-[#57606a]">
                Everything you need day to day, from the terminal.
              </p>
            </div>

            <div className="overflow-hidden rounded-xl border border-[#d0d7de] bg-white lg:col-span-8">
              <ul className="divide-y divide-[#e1e4e8]">
                {COMMANDS.map(({ cmd, desc }) => (
                  <li key={cmd} className="grid gap-x-6 gap-y-1.5 px-5 py-4 sm:grid-cols-[15rem_1fr] sm:items-center">
                    <code className="w-fit rounded bg-[#f6f8fa] px-2 py-1 font-mono text-[13px] text-[#24292f]">
                      {cmd}
                    </code>
                    <p className="text-sm leading-relaxed text-[#57606a]">{desc}</p>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* ----------------------------------- FAQ ----------------------------------- */}
        <section id="faq" className="scroll-mt-14 border-t border-[#e1e4e8] bg-white">
          <div className="mx-auto grid max-w-6xl gap-12 px-6 py-20 lg:grid-cols-12">
            <div className="lg:col-span-4">
              <h2 className="text-3xl font-bold tracking-tight text-[#24292f]">Questions, answered</h2>
              <p className="mt-3 max-w-sm text-[15px] leading-relaxed text-[#57606a]">
                How tracking works, what the diffs show, and why sign-in can take a moment.
              </p>
            </div>

            <div className="divide-y divide-[#e1e4e8] border-y border-[#e1e4e8] lg:col-span-8">
              {FAQ.map(({ q, a }, i) => {
                const open = openFaq === i;
                return (
                  <div key={q}>
                    <h3>
                      <button
                        type="button"
                        id={`faq-btn-${i}`}
                        aria-expanded={open}
                        aria-controls={`faq-panel-${i}`}
                        onClick={() => setOpenFaq(open ? null : i)}
                        className={`flex w-full items-center justify-between gap-4 py-5 text-left text-[15px] font-semibold text-[#24292f] ${FOCUS}`}
                      >
                        {q}
                        <ChevronDown
                          size={18}
                          className={`shrink-0 text-[#57606a] transition-transform motion-reduce:transition-none ${
                            open ? 'rotate-180' : ''
                          }`}
                        />
                      </button>
                    </h3>
                    <div
                      id={`faq-panel-${i}`}
                      role="region"
                      aria-labelledby={`faq-btn-${i}`}
                      hidden={!open}
                      className="pb-5 pr-8"
                    >
                      <p className="max-w-2xl text-sm leading-relaxed text-[#57606a]">{a}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ---------------------------------- Final CTA ---------------------------------- */}
        <section className="border-t border-[#e1e4e8]">
          <div className="mx-auto max-w-6xl px-6 py-20">
            <div className="grid items-center gap-8 rounded-2xl border border-[#d0d7de] bg-white p-8 shadow-sm sm:p-10 lg:grid-cols-2">
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-[#24292f] sm:text-3xl">
                  Stop guessing which draft is the right one
                </h2>
                <p className="mt-3 max-w-md text-[15px] leading-relaxed text-[#57606a]">
                  Install GitDoc, track your next document, and keep a full history from the first save.
                </p>
                <div className="mt-6">
                  <AuthAction {...authProps} />
                </div>
              </div>
              <div className="min-w-0">
                <p className="mb-2 text-xs text-[#57606a]">Or start from the terminal</p>
                <CommandBar text={INSTALL_CMD} id="cta" copiedId={copiedStep} onCopy={copyToClipboard} />
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ---------------------------------- Footer ---------------------------------- */}
      <footer className="border-t border-[#e1e4e8] bg-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-10 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2.5 text-sm text-[#57606a]">
            <span className="grid h-6 w-6 place-items-center rounded bg-[#24292f] text-white">
              <FileText size={13} />
            </span>
            <span>
              <span className="font-semibold text-[#24292f]">GitDoc</span> {VERSION} · © {new Date().getFullYear()}
            </span>
          </div>

          <ul className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-[#57606a]">
            <li>
              <a href="#quickstart" className={`rounded hover:text-[#24292f] ${FOCUS}`}>
                Quickstart
              </a>
            </li>
            <li>
              <a href="#commands" className={`rounded hover:text-[#24292f] ${FOCUS}`}>
                Commands
              </a>
            </li>
            <li>
              <a href="#faq" className={`rounded hover:text-[#24292f] ${FOCUS}`}>
                FAQ
              </a>
            </li>
            <li>
              <a
                href={NPM_URL}
                target="_blank"
                rel="noreferrer"
                className={`inline-flex items-center gap-1.5 rounded hover:text-[#24292f] ${FOCUS}`}
              >
                npm package <ExternalLink size={13} className="opacity-60" />
              </a>
            </li>
          </ul>
        </div>
      </footer>
    </div>
  );
}