// frontend/src/pages/DashboardPage.jsx
import React, { useState, useEffect } from 'react';
import { LogOut, Folder, RefreshCw, Download, GitCommit, List, FileClock, ChevronRight,Globe, Laptop } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function DashboardPage({ user, handleLogout, BACKEND_URL }) {
  const [trackingMode, setTrackingMode] = useState('LOCAL'); // 🔄 Modes: 'LOCAL' or 'GOOGLE_DOC'
  const [filePath, setFilePath] = useState('');
  const [repositories, setRepositories] = useState([]); 
  const [commits, setCommits] = useState([]);
  const [fileName, setFileName] = useState('');
  const [status, setStatus] = useState({ type: '', message: '' });
  const [loadingRepos, setLoadingRepos] = useState(false);

  // 📥 Initializer: Load user's previous repository pool on page load
  useEffect(() => {
    if (user) {
      fetchUserRepositories();
    }
  }, [user]);

  // 🔄 Automated background tracking long-polling mechanism
  useEffect(() => {
    if (!filePath || !user) return;
    const interval = setInterval(() => {
      silentlyPollTimeline();
    }, 3000);
    return () => clearInterval(interval);
  }, [filePath, user]);

  // 🛰️ API Query: Fetch previous repositories from the database
  const fetchUserRepositories = async () => {
    setLoadingRepos(true);
    try {
      const token = localStorage.getItem('gitdoc_token');
      const res = await fetch(`${BACKEND_URL}/api/word/repositories`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setRepositories(data || []);
      }
    } catch (err) {
      console.error("Unable to load repository workspace registry maps:", err);
    } finally {
      setLoadingRepos(false);
    }
  };

  // 🧪 Helper: Cleanly extracts a 44-character document ID string if user pastes a full Google Docs URL
  const extractGoogleDocId = (input) => {
    if (!input) return '';
    const regex = /\/document\/d\/([a-zA-Z0-9-_]{44})/;
    const matches = input.match(regex);
    return matches ? matches[1] : input.trim();
  };

  const handleInitializeTracking = async () => {
    if (!filePath.trim()) return alert("Please specify a valid repository file vector or Google Doc identifier.");
    
    setStatus({ type: 'info', message: 'Initializing distributed sync engine...' });
    const token = localStorage.getItem('gitdoc_token');

    try {
      if (trackingMode === 'GOOGLE_DOC') {
        const cleanedDocId = extractGoogleDocId(filePath); // 🎯 Extract it first
        
        console.log("🚀 Sending Track Request for ID:", cleanedDocId);

        const res = await fetch(`${BACKEND_URL}/api/document/track`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}` // 🔥 Ensure this matches your backend token expectations
          },
          body: JSON.stringify({
            googleDocId: cleanedDocId // ✅ Passing the exact 44-character ID string
          })
        });
        
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Google Drive changes engine rejected registration request.');
        
        setStatus({ type: 'success', message: data.message });
        
        // ✅ FIX: Update the input state and fetch using the CLEANED ID, not the raw URL string
        setFilePath(cleanedDocId);
        fetchDocumentTimeline(cleanedDocId);
      } else {
        await fetchDocumentTimeline(filePath);
      }
    } catch (err) {
      setStatus({ type: 'error', message: err.message || 'Failed to map real-time convergence links.' });
    }
  };

  const fetchDocumentTimeline = async (selectedPath) => {
    let targetPath = selectedPath || filePath;
    
    // ✅ FIX: Force extraction check on any string passed into this timeline compiler
    if (trackingMode === 'GOOGLE_DOC' || (targetPath.includes('docs.google.com'))) {
      targetPath = extractGoogleDocId(targetPath);
    }

    if (!targetPath.trim()) return;

    try {
      const token = localStorage.getItem('gitdoc_token');
      const res = await fetch(`${BACKEND_URL}/api/word/commits?filePath=${encodeURIComponent(targetPath)}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();

      if (res.ok) {
        setFileName(data.fileName);
        setCommits(data.commits || []);
        fetchUserRepositories();
      }
    } catch (err) {
      console.error("Timeline synchronization error:", err);
    }
  };

  const silentlyPollTimeline = async () => {
    try {
      // ✅ FIX: Clean the active state path before firing the network request
      const targetPath = trackingMode === 'GOOGLE_DOC' ? extractGoogleDocId(filePath) : filePath;
      
      if (!targetPath.trim()) return;

      const token = localStorage.getItem('gitdoc_token');
      const res = await fetch(`${BACKEND_URL}/api/word/commits?filePath=${encodeURIComponent(targetPath)}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setCommits(data.commits || []);
      }
    } catch (e) {
      console.error("Silent polling failed:", e);
    }
  };

  const handleSelectRepository = (path) => {
    setFilePath(path);
    // Auto-detect mode based on path shape structure
    setTrackingMode(path.length === 44 && !path.includes('/') ? 'GOOGLE_DOC' : 'LOCAL');
    fetchDocumentTimeline(path);
  };
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-[#fafafa] text-[#1f2328] relative overflow-x-hidden font-sans antialiased selection:bg-[#bbf7d0] selection:text-[#1f2328]">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#e1e4e8_1px,transparent_1px),linear-gradient(to_bottom,#e1e4e8_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_60%,transparent_100%)] opacity-40 pointer-events-none" />

      <div className="max-w-6xl mx-auto p-6 relative z-10">
        {/* Header Section */}
        <header className="flex justify-between items-center border-b border-[#e1e4e8] pb-5 mb-8 bg-white/80 backdrop-blur px-4 py-3 rounded-xl shadow-sm border">
        <div 
    onClick={() => navigate('/')} 
    className="cursor-pointer hover:opacity-80 transition-opacity select-none"
    title="Return to Landing Page"
  >
            <h1 className="text-xl font-bold text-[#24292f] flex items-center gap-2">
              📁 GitDoc <span className="text-[10px] font-mono text-[#1a7f37] bg-[#dafbe1] border border-[#a1dfb1] px-2.5 py-0.5 rounded-full font-semibold">Cloud Hub</span>
            </h1>
            <p className="text-[#57606a] text-xs mt-0.5">Active session: <span className="font-medium text-[#24292f]">{user?.name}</span></p>
          </div>
          <div className="flex items-center gap-3">
            <img src={user?.avatar} alt="Profile" className="w-8 h-8 rounded-full border border-[#d0d7de] bg-[#f6f8fa]" />
            <button onClick={handleLogout} className="flex items-center gap-1.5 text-xs bg-white hover:bg-[#f6f8fa] text-[#cf222e] border border-[#d0d7de] px-3 py-2 rounded-lg transition-colors font-medium shadow-sm">
              <LogOut size={13} /> Sign Out
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Interactive Control Console Stack */}
          <div className="space-y-6">
            
            {/* Component Card 1: Configuration Input Form with Vector Selector Switch */}
            <div className="bg-white border border-[#d0d7de] rounded-xl p-5 shadow-sm">
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#57606a] mb-4 flex items-center gap-2">
                <Folder size={14} className="text-[#24292f]" /> System Engine Matrix
              </h2>
              
              {/* GitHub-style Tracking Mode Toggle Switch */}
              <div className="grid grid-cols-1 p-1 bg-[#f6f8fa] border border-[#d0d7de] rounded-lg mb-4 text-xs font-medium">
                <button 
                  onClick={() => { setTrackingMode('LOCAL'); setFilePath(''); }}
                  className={`flex items-center justify-center gap-1.5 py-1.5 rounded-md transition-all ${trackingMode === 'LOCAL' ? 'bg-white text-[#24292f] shadow-sm font-semibold border border-[#d0d7de]' : 'text-[#57606a] hover:text-[#24292f]'}`}
                >
                  <Laptop size={13} /> Local File
                </button>
                {/* <button 
                  onClick={() => { setTrackingMode('GOOGLE_DOC'); setFilePath(''); }}
                  className={`flex items-center justify-center gap-1.5 py-1.5 rounded-md transition-all ${trackingMode === 'GOOGLE_DOC' ? 'bg-white text-[#24292f] shadow-sm font-semibold border border-[#d0d7de]' : 'text-[#57606a] hover:text-[#24292f]'}`}
                >
                  <Globe size={13} /> Google Doc
                </button> */}
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-[#57606a] uppercase tracking-wider mb-2">
                    {trackingMode === 'LOCAL' ? 'Absolute Path Vector' : 'Google Document URL / Shared Resource ID'}
                  </label>
                  <input 
                    type="text" 
                    value={filePath} 
                    onChange={(e) => setFilePath(e.target.value)} 
                    placeholder={trackingMode === 'LOCAL' ? '/Users/username/Desktop/test.docx' : 'https://docs.google.com/document/d/...'} 
                    className="w-full bg-[#f6f8fa] text-[#24292f] text-xs p-3 border border-[#d0d7de] rounded-lg focus:outline-none focus:border-[#1a7f37] font-mono transition-colors shadow-inner placeholder-gray-400" 
                  />
                </div>
                <button 
                  onClick={handleInitializeTracking} 
                  className="w-full bg-[#24292f] hover:bg-[#1f2328] text-white font-semibold text-xs py-3 px-4 rounded-lg transition-colors shadow-sm flex items-center justify-center gap-2 group"
                >
                  <RefreshCw size={14} className="group-hover:rotate-45 transition-transform" /> 
                  {trackingMode === 'LOCAL' ? 'Load Document Stream' : 'Deploy Google Changes Watcher'}
                </button>
              </div>

              {status.message && (
                <div className={`mt-4 p-3 rounded-lg text-xs font-mono border ${
                  status.type === 'error' ? 'bg-[#ffebe9] text-[#cf222e] border-[#ffc1c0]' : 'bg-[#dafbe1] text-[#1a7f37] border-[#a1dfb1]'
                }`}>
                  {status.message}
                </div>
              )}
            </div>

            {/* Component Card 2: Tracked Historical Repositories Hub */}
            <div className="bg-white border border-[#d0d7de] rounded-xl p-5 shadow-sm">
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#57606a] mb-4 flex items-center justify-between">
                <span className="flex items-center gap-2"><List size={14} className="text-[#24292f]" /> Workspace Repository History</span>
                <button onClick={fetchUserRepositories} className="text-[10px] font-mono text-[#0969da] hover:underline">Refresh</button>
              </h2>

              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {loadingRepos ? (
                  <p className="text-xs text-[#57606a] italic font-mono p-2">Syncing database maps...</p>
                ) : repositories.length === 0 ? (
                  <p className="text-xs text-[#57606a] italic p-2 bg-[#f6f8fa] border border-[#e1e4e8] rounded-lg">No historical document records linked.</p>
                ) : (
                  repositories.map((repo) => {
                    const isGoogleDocNode = repo.googleDocId.length === 44 && !repo.googleDocId.includes('/');
                    return (
                      <button
                        key={repo._id || repo.googleDocId}
                        onClick={() => handleSelectRepository(repo.googleDocId)}
                        className={`w-full text-left p-3 rounded-lg border text-xs transition-all duration-150 flex flex-col gap-1 relative overflow-hidden group ${
                          filePath === repo.googleDocId ? 'bg-[#dafbe1]/40 border-[#1a7f37] text-[#24292f]' : 'bg-white border-[#d0d7de] hover:bg-[#f6f8fa]'
                        }`}
                      >
                        <div className="font-semibold flex items-center gap-1.5 truncate pr-4 text-[#24292f]">
                          {isGoogleDocNode ? (
                            <Chrome size={13} className={filePath === repo.googleDocId ? 'text-[#1a7f37]' : 'text-[#0969da]'} />
                          ) : (
                            <FileClock size={13} className={filePath === repo.googleDocId ? 'text-[#1a7f37]' : 'text-[#57606a]'} />
                          )}
                          {repo.docName || 'Unnamed Document'}
                        </div>
                        <div className="font-mono text-[10px] text-[#57606a] truncate">{repo.googleDocId}</div>
                        <ChevronRight size={12} className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-40 group-hover:translate-x-0.5 transition-all" />
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Right Dynamic Commit Timeline Layout */}
          <div className="lg:col-span-2">
            <div className="bg-white border border-[#d0d7de] rounded-xl p-6 shadow-xl relative overflow-hidden">
              <div className="flex justify-between items-center border-b border-[#e1e4e8] pb-4 mb-6">
                <h2 className="text-base font-bold text-[#24292f] flex items-center gap-2">
                  <GitCommit size={16} className="text-[#1a7f37]" /> Version Stream Timeline
                </h2>
                {fileName && (
                  <div className="text-[10px] bg-[#f6f8fa] border border-[#d0d7de] text-[#57606a] px-3 py-1 rounded-md font-mono font-medium shadow-inner">
                    {fileName}
                  </div>
                )}
              </div>

              <div className="space-y-6 relative before:absolute before:inset-0 before:left-4 before:w-0.5 before:bg-[#e1e4e8] before:block">
                {commits.length === 0 ? (
                  <p className="text-[#57606a] text-xs pl-8 italic py-4 bg-[#f6f8fa] rounded-xl border border-dashed border-[#d0d7de]">
                    Awaiting core metrics. Activate your local NPM tracking agent or supply a target Google Docs link above to generate runtime ledger commits.
                  </p>
                ) : (
                  commits.map((commit) => (
                    <div key={commit.version} className="relative pl-8 group">
                      <div className={`absolute left-[10px] top-[18px] w-3 h-3 rounded-full bg-white border-2 transition-all duration-200 z-10 ${
                        commit.type === 'GENESIS' ? 'border-[#8250df] group-hover:bg-[#8250df]' : 'border-[#1a7f37] group-hover:bg-[#1a7f37]'
                      }`} />
                      
                      <div className="bg-white border border-[#d0d7de] rounded-xl p-5 hover:shadow-md transition-all">
                        <div className="flex flex-wrap justify-between items-center gap-3 border-b border-[#e1e4e8] pb-3 mb-3">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-[#24292f]">Version {commit.version}</span>
                            <span className={`text-[9px] uppercase font-mono tracking-wider font-semibold border px-2 py-0.5 rounded-full ${
                              commit.type === 'GENESIS' ? 'bg-[#f5f0ff] text-[#8250df] border-[#d1bcf5]' : 'bg-[#dafbe1] text-[#1a7f37] border-[#a1dfb1]'
                            }`}>
                              {commit.type}
                            </span>
                          </div>
                          <div className="flex items-center gap-4">
                            <span className="text-[11px] font-mono text-[#57606a]">
                              {new Date(commit.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                            </span>
                            <a 
                              href={`${BACKEND_URL}/api/word/download-commit?filePath=${encodeURIComponent(filePath)}&targetVersion=${commit.version}`} 
                              className="text-[11px] bg-white hover:bg-[#f6f8fa] text-[#0969da] border border-[#d0d7de] px-2.5 py-1 rounded-md flex items-center gap-1.5 transition-colors font-medium shadow-sm"
                            >
                              <Download size={12} /> Download
                            </a>
                          </div>
                        </div>

                        <div className="leading-relaxed bg-[#f6f8fa] border border-[#e1e4e8] rounded-lg p-3.5 shadow-inner max-h-48 overflow-y-auto">
                          {commit.changes.map((change, idx) => (
                            <span 
                              key={idx} 
                              className={
                                change.operation === 'INSERT' 
                                  ? 'bg-[#dafbe1] text-[#1a7f37] px-1 py-0.5 rounded border border-[#a1dfb1] font-mono text-xs font-medium' 
                                  : change.operation === 'DELETE' 
                                    ? 'bg-[#ffebe9] text-[#cf222e] line-through px-1 py-0.5 rounded border border-[#ffc1c0] font-mono text-xs font-medium' 
                                    : 'text-[#24292f] text-xs font-mono font-normal'
                              }
                            >
                              {change.operation === 'EQUAL' ? change.text : ` ${change.operation === 'INSERT' ? '+' : '-'} "${change.text}" `}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}