import React, { useState, useEffect } from 'react';
import { LogIn, LogOut, Folder, RefreshCw, Download, FileText, GitCommit } from 'lucide-react';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

export default function App() {
  const [user, setUser] = useState(null);
  const [filePath, setFilePath] = useState('');
  const [commits, setCommits] = useState([]);
  const [fileName, setFileName] = useState('');
  const [status, setStatus] = useState({ type: '', message: '' });

  // 🔐 Catch incoming parameters right after successful Google Auth redirects
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const name = params.get('name');
    const avatar = params.get('avatar');

    if (token) {
      localStorage.setItem('gitdoc_token', token);
      const profile = { name, avatar };
      localStorage.setItem('gitdoc_user', JSON.stringify(profile));
      setUser(profile);
      // Safely flush the URL parameters clean back to standard root path window views
      window.history.replaceState({}, document.title, "/");
    } else {
      const savedUser = localStorage.getItem('gitdoc_user');
      if (savedUser) setUser(JSON.parse(savedUser));
    }
  }, []);

  // 🔄 Automated background tracking long-polling mechanism
  useEffect(() => {
    if (!filePath || !user) return;
    const interval = setInterval(() => {
      silentlyPollTimeline();
    }, 3000);
    return () => clearInterval(interval);
  }, [filePath, user]);

  const handleLoginTrigger = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/auth/google`);
      const data = await res.json();
      if (data.url) window.location.href = data.url; 
    } catch (err) {
      alert("Handshake failure linking to backend auth endpoints.");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('gitdoc_token');
    localStorage.removeItem('gitdoc_user');
    setUser(null);
    setCommits([]);
    setFileName('');
    setFilePath('');
    setStatus({ type: '', message: '' });
  };

  const fetchDocumentTimeline = async () => {
    if (!filePath.trim()) return alert("Please specify a targeted workspace repository path descriptor.");
    setStatus({ type: 'info', message: 'Establishing real-time session tunnel...' });

    try {
      const token = localStorage.getItem('gitdoc_token');
      const res = await fetch(`${BACKEND_URL}/api/word/commits?filePath=${encodeURIComponent(filePath)}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();

      if (!res.ok) {
        setStatus({ type: 'error', message: data.error || 'Failed to sync platform records.' });
        return;
      }

      setStatus({ type: 'success', message: 'Real-time session tunnel connected successfully.' });
      setFileName(data.fileName);
      setCommits(data.commits || []);
    } catch (err) {
      setStatus({ type: 'error', message: 'Unable to establish live link connection with API.' });
    }
  };

  const silentlyPollTimeline = async () => {
    try {
      const token = localStorage.getItem('gitdoc_token');
      const res = await fetch(`${BACKEND_URL}/api/word/commits?filePath=${encodeURIComponent(filePath)}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setCommits(data.commits || []);
      }
    } catch (e) {}
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950 p-4">
        <div className="max-w-md w-full bg-gray-900 border border-gray-800 rounded-2xl p-8 shadow-2xl text-center">
          <div className="inline-flex p-4 bg-green-950/50 border border-green-900 text-green-400 rounded-2xl mb-5">
            <FileText size={40} />
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">GitDoc <span class="text-green-400 text-sm font-mono align-super">v2</span></h1>
          <p className="text-gray-400 mt-2 text-sm mb-8">Real-time localized document version control sandbox interface.</p>
          <button onClick={handleLoginTrigger} className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-100 text-gray-950 font-semibold py-3 px-4 rounded-xl transition-all shadow-lg">
            <LogIn size={20} /> Sign in with Google Account
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Structural Heading Bar */}
      <header className="flex justify-between items-center border-b border-gray-800 pb-5 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            📁 GitDoc <span className="text-xs font-mono text-green-400 bg-green-950 border border-green-900 px-2.5 py-0.5 rounded-full">Cloud Hub</span>
          </h1>
          <p className="text-gray-400 text-sm mt-1">Logged in as {user.name}</p>
        </div>
        <div className="flex items-center gap-4">
          <img src={user.avatar} alt="Profile" className="w-9 h-9 rounded-full border border-gray-700" />
          <button onClick={handleLogout} className="flex items-center gap-2 text-xs bg-gray-900 hover:bg-gray-800 text-red-400 border border-gray-800 px-3 py-2 rounded-lg transition-colors font-medium">
            <LogOut size={14} /> Sign Out
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Interactive Control Console */}
        <div className="space-y-6">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 shadow-xl">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-4 flex items-center gap-2"><Folder size={14} /> Repository Configuration</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-medium text-gray-400 uppercase tracking-wider mb-2">Absolute Path Vector</label>
                <input type="text" value={filePath} onChange={(e) => setFilePath(e.target.value)} placeholder="/Users/username/Desktop/test.docx" 
                  className="w-full bg-black text-gray-200 text-sm p-3 border border-gray-800 rounded-lg focus:outline-none focus:border-green-500 font-mono transition-colors" />
              </div>
              <button onClick={fetchDocumentTimeline} className="w-full bg-green-600 hover:bg-green-700 text-white font-medium text-sm py-3 px-4 rounded-lg transition-colors shadow-lg flex items-center justify-center gap-2">
                <RefreshCw size={16} /> Load Document Stream
              </button>
            </div>

            {status.message && (
              <div className={`mt-4 p-3 rounded-lg text-xs font-mono border ${status.type === 'error' ? 'bg-red-950/40 text-red-400 border-red-900' : 'bg-green-950/40 text-green-400 border-green-900'}`}>
                {status.message}
              </div>
            )}
          </div>
        </div>

        {/* Right Dynamic Commit Timeline Layout */}
        <div className="lg:col-span-2">
          <div class="bg-gray-900 border border-gray-800 rounded-xl p-6 shadow-xl">
            <div className="flex justify-between items-center border-b border-gray-800 pb-4 mb-6">
              <h2 className="text-lg font-medium text-white flex items-center gap-2"><GitCommit size={18} class="text-green-400" /> Version Stream Timeline</h2>
              {fileName && <div className="text-xs bg-black border border-gray-800 text-gray-400 px-3 py-1 rounded-md font-mono">{fileName}</div>}
            </div>

            <div className="space-y-6 relative before:absolute before:inset-0 before:left-4 before:w-0.5 before:bg-gray-800 before:block">
              {commits.length === 0 ? (
                <p className="text-gray-500 text-sm pl-8 italic">Awaiting document parameter links. Track a file vector to initialize.</p>
              ) : (
                commits.map((commit) => (
                  <div key={commit.version} className="relative pl-8 group">
                    <div className="absolute left-2 top-2 w-4 h-4 rounded-full bg-gray-900 border-2 border-green-500 group-hover:bg-green-400 transition-colors z-10 shadow-md"></div>
                    <div className="bg-gray-950 border border-gray-800 rounded-xl p-5 hover:border-gray-700 transition-colors">
                      <div className="flex flex-wrap justify-between items-center gap-3 border-b border-gray-800 pb-3 mb-3">
                        <div className="flex items-center gap-2.5">
                          <span className="text-sm font-bold text-white">Version {commit.version}</span>
                          <span className={`text-[9px] uppercase font-mono tracking-wider border px-2 py-0.5 rounded-full ${commit.type === 'GENESIS' ? 'bg-purple-950/60 text-purple-400 border-purple-900' : 'bg-blue-950/60 text-blue-400 border-blue-900'}`}>{commit.type}</span>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="text-xs text-gray-500">{new Date(commit.timestamp).toLocaleTimeString()}</span>
                          <a href={`${BACKEND_URL}/api/word/download-commit?filePath=${encodeURIComponent(filePath)}&targetVersion=${commit.version}`} className="text-xs bg-gray-900 hover:bg-gray-800 text-green-400 border border-gray-800 px-2.5 py-1 rounded-md flex items-center gap-1.5 transition-colors">
                            <Download size={12} /> Download
                          </a>
                        </div>
                      </div>
                      <div className="leading-relaxed space-y-1">
                        {commit.changes.map((change, idx) => (
                          <span key={idx} className={change.operation === 'INSERT' ? 'bg-green-950 text-green-300 px-1 py-0.5 rounded border border-green-900 font-mono text-xs' : change.operation === 'DELETE' ? 'bg-red-950 text-red-400 line-through px-1 py-0.5 rounded border border-red-900 font-mono text-xs' : 'text-gray-400 text-xs font-mono font-light'}>
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
  );
}