// frontend/src/pages/LandingPage.jsx
import React, { useState } from 'react';
import { LogIn, Terminal, Cpu, CheckCircle, Copy, Check, ArrowRight, ExternalLink, ShieldCheck, Loader2, LayoutDashboard } from 'lucide-react';

export default function LandingPage({ handleLoginTrigger, user, navigate }) {
  const [copiedStep, setCopiedStep] = useState(null);
  const [isRedirecting, setIsRedirecting] = useState(false);

  const copyToClipboard = (text, stepId) => {
    navigator.clipboard.writeText(text);
    setCopiedStep(stepId);
    setTimeout(() => setCopiedStep(null), 2000);
  };

  const handleLoginClick = async () => {
    setIsRedirecting(true);
    try {
      await handleLoginTrigger();
    } catch (err) {
      setIsRedirecting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fafafa] text-[#1f2328] flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans antialiased selection:bg-[#bbf7d0] selection:text-[#1f2328]">
      
      {/* GitHub-style Subtle Linear Top Glow & Grid Mesh Backdrop */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#e1e4e8_1px,transparent_1px),linear-gradient(to_bottom,#e1e4e8_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-60 pointer-events-none" />

      {/* Structural Hero Header Section */}
      <div className="max-w-3xl w-full text-center space-y-6 mb-16 relative z-10 pt-12">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#eff1f3] border border-[#d1d5da] text-[#24292f] rounded-full text-xs font-mono font-medium shadow-sm">
          <span className={`flex h-2 w-2 rounded-full ${isRedirecting ? 'bg-[#bf8700] animate-pulse' : 'bg-[#1a7f37] animate-pulse'}`} />
          {user 
            ? `Welcome back, ${user.name}` 
            : isRedirecting ? 'Waking Auth Gateway Core (Render)...' : 'Production Gateway Connected'}
        </div>

        <h1 className="text-5xl font-extrabold tracking-tight text-[#24292f] sm:text-7xl flex items-center justify-center gap-3">
          DocGit 
          <span className="text-[#1a7f37] text-xs font-mono align-middle bg-[#dafbe1] border border-[#a1dfb1] px-2.5 py-1 rounded-full font-semibold">
            v2.0.4
          </span>
        </h1>

        <p className="text-[#57606a] max-w-2xl mx-auto text-base sm:text-lg leading-relaxed font-normal">
          Automated version tracking for local documents. Run sub-second character diffs and manage historical snapshots with a light-weight background agent.
        </p>
        
        <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
          {user ? (
            /* 🔥 PREMIUM ALREADY LOGGED IN VIEW */
            <button 
              onClick={() => navigate('/dashboard')} 
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 bg-[#1a7f37] hover:bg-[#1a6f30] text-white font-semibold py-3 px-6 rounded-xl transition-all shadow-md hover:shadow-lg hover:scale-[1.01] active:scale-[0.99] group text-sm border border-[#1a7f37]"
            >
              <LayoutDashboard size={16} /> Go to Dashboard
              <ArrowRight size={14} className="opacity-70 group-hover:translate-x-0.5 transition-transform" />
            </button>
          ) : (
            /* 🔓 STANDARD LOGGED OUT VIEW */
            <button 
              onClick={handleLoginClick} 
              disabled={isRedirecting}
              className={`w-full sm:w-auto inline-flex items-center justify-center gap-2.5 font-semibold py-3 px-6 rounded-xl transition-all shadow-md text-sm ${
                isRedirecting 
                  ? 'bg-[#57606a] text-gray-200 cursor-not-allowed opacity-80' 
                  : 'bg-[#24292f] hover:bg-[#1f2328] text-white hover:shadow-lg hover:scale-[1.01] active:scale-[0.99] group'
              }`}
            >
              {isRedirecting ? (
                <>
                  <Loader2 size={16} className="animate-spin text-[#dafbe1]" />
                  Booting Secure Auth Session...
                </>
              ) : (
                <>
                  <LogIn size={16} /> Sign in with Google Account
                  <ArrowRight size={14} className="opacity-60 group-hover:translate-x-0.5 transition-transform" />
                </>
              )}
            </button>
          )}
          
          {/* <a 
            href="https://github.com/Parth-1104/GitInspect" 
            target="_blank" 
            rel="noreferrer"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white hover:bg-[#f6f8fa] text-[#24292f] border border-[#d0d7de] font-medium py-3 px-6 rounded-xl transition-all shadow-sm text-sm"
          >
            GitHub Core Core Source <ExternalLink size={14} className="opacity-60" />
          </a> */}
        </div>
      </div>

      {/* Local Infrastructure Initialization Guide */}
      <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
        
        {/* Component 1: CLI Global Distribution Vector */}
        <div className="bg-white border border-[#d0d7de] rounded-2xl p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group">
          <div className="space-y-3">
            <div className="inline-flex p-2.5 bg-[#f6f8fa] border border-[#d0d7de] text-[#24292f] rounded-xl group-hover:bg-[#f0f3f6] transition-colors">
              <Terminal size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#24292f] flex items-center gap-2">
                1. Install the CLI Agent
              </h2>
              <p className="text-[#57606a] text-xs leading-relaxed mt-1">
                Install the light-weight background tracking daemon globally on your machine via the public npm registry network.
              </p>
            </div>
          </div>

          <div className="mt-6 bg-[#f6f8fa] border border-[#d0d7de] rounded-xl p-3.5 font-mono text-xs text-[#24292f] flex items-center justify-between shadow-inner group-hover:border-[#cfd6dd] transition-colors">
            <span className="truncate select-all pr-2">npm install -g @singhparth427/gitdoc-cli</span>
            <button 
              onClick={() => copyToClipboard('npm install -g @singhparth427/gitdoc-cli', 'step1')}
              className="text-[#57606a] hover:text-[#24292f] p-1.5 hover:bg-[#eef1f4] rounded-md transition-colors shrink-0"
              title="Copy statement buffer"
            >
              {copiedStep === 'step1' ? <Check size={14} className="text-[#1a7f37]" /> : <Copy size={14} />}
            </button>
          </div>
        </div>

        {/* Component 2: Runtime System Initializer */}
        <div className="bg-white border border-[#d0d7de] rounded-2xl p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group">
          <div className="space-y-3">
            <div className="inline-flex p-2.5 bg-[#f6f8fa] border border-[#d0d7de] text-[#24292f] rounded-xl group-hover:bg-[#f0f3f6] transition-colors">
              <Cpu size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#24292f] flex items-center gap-2">
                2. Initialize Tracking
              </h2>
              <p className="text-[#57606a] text-xs leading-relaxed mt-1">
                Point the listener at any file path workspace descriptor. The daemon automatically commits localized, real-time differentials whenever you save.
              </p>
            </div>
          </div>

          <div className="mt-6 bg-[#f6f8fa] border border-[#d0d7de] rounded-xl p-3.5 font-mono text-xs text-[#24292f] flex items-center justify-between shadow-inner group-hover:border-[#cfd6dd] transition-colors">
            <div className="truncate select-all pr-2">
              <span className="text-[#cf222e]">gitdoc </span>
              <span className="text-[#0550ae]">track </span>
              <span className="text-[#0a3069]">"/path/to/doc.docx"</span>
            </div>
            <button 
              onClick={() => copyToClipboard('gitdoc track "/path/to/document.docx"', 'step2')}
              className="text-[#57606a] hover:text-[#24292f] p-1.5 hover:bg-[#eef1f4] rounded-md transition-colors shrink-0"
              title="Copy statement buffer"
            >
              {copiedStep === 'step2' ? <Check size={14} className="text-[#1a7f37]" /> : <Copy size={14} />}
            </button>
          </div>
        </div>

      </div>

      {/* Platform Features Grid Footer */}
      <footer className="mt-20 border-t border-[#e1e4e8] pt-8 w-full max-w-2xl relative z-10">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
          <div className="flex items-center justify-center gap-2 text-xs font-medium text-[#57606a] bg-white border border-[#e1e4e8] px-4 py-3 rounded-xl shadow-sm">
            <CheckCircle size={14} className="text-[#1a7f37]" />
            <span>Automated Sync (`Cmd+S`)</span>
          </div>
          <div className="flex items-center justify-center gap-2 text-xs font-medium text-[#57606a] bg-white border border-[#e1e4e8] px-4 py-3 rounded-xl shadow-sm">
            <CheckCircle size={14} className="text-[#1a7f37]" />
            <span>Myers Linear Diffs</span>
          </div>
          <div className="flex items-center justify-center gap-2 text-xs font-medium text-[#57606a] bg-white border border-[#e1e4e8] px-4 py-3 rounded-xl shadow-sm">
            <ShieldCheck size={14} className="text-[#1a7f37]" />
            <span>Cryptographic State Integrity</span>
          </div>
        </div>
        <p className="text-center text-[11px] text-[#8c959f] mt-8 font-mono">
          System Core Layer running on isolation endpoints securely.
        </p>
      </footer>
    </div>
  );
}
