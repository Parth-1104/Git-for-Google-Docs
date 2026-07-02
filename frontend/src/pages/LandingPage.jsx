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

        <h1 className="text-5xl font-extrabold tracking-tight text-[#24292f] sm:text-7xl flex ml-8.5 items-center justify-center gap-3">
          GitDoc
          <span className="text-[#1a7f37] text-xs font-mono align-middle bg-[#dafbe1] border border-[#a1dfb1] px-2.5 py-1 rounded-full font-semibold">
            v2.0.4
          </span>
        </h1>

        <strong>Complete version control for Word documents.</strong> 

        <p className="text-[#57606a] max-w-2xl mx-auto text-base sm:text-lg leading-relaxed font-normal">
  Track local changes, view character-level diffs, and roll back to any previous version straight from your terminal.
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
                  Booting...
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

{/* ========================================================================= */}
      {/* NEW PREMIUM QUICKSTART WORKFLOW GUIDE                                     */}
      {/* ========================================================================= */}
      <div className="max-w-4xl w-full mt-24 border border-[#e1e4e8] rounded-2xl bg-white shadow-[0_4px_24px_rgba(0,0,0,0.02)] overflow-hidden relative z-10">
        
        {/* Section Header */}
        <div className="p-8 border-b border-[#e1e4e8] bg-[#fafafa]/50 backdrop-blur-sm">
          <div className="text-[10px] font-mono uppercase tracking-widest text-[#1a7f37] font-bold mb-1">
            System Implementation Guide
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight text-[#24292f]">
            Initialize Your Document Tracking Environment
          </h2>
          <p className="text-[#57606a] text-sm max-w-xl mt-1">
            Follow this 3-step lifecycle pipeline to install the core agent, link your local workspace workspace, and manage your first version checkpoint stream.
          </p>
        </div>

        {/* Workflow Matrix Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-[#e1e4e8]">
          
          {/* Step 1: Environment Setup */}
          <div className="p-8 space-y-4 hover:bg-[#fafafa]/30 transition-colors flex flex-col justify-between">
            <div className="space-y-3">
              <div className="text-xs font-mono font-bold text-[#57606a] flex items-center justify-between">
                <span>STEP // 01</span>
                <span className="px-2 py-0.5 rounded bg-[#eff1f3] text-[10px] border border-[#d1d5da] text-[#24292f]">Setup</span>
              </div>
              <h3 className="text-base font-bold text-[#24292f]">
                Global Installation
              </h3>
              <p className="text-[#57606a] text-xs leading-relaxed">
                Pull down the core background binary engine directly from the public npm registry layer to expose the global execution utility command.
              </p>
            </div>
            <div className="pt-4">
              <div className="bg-[#f6f8fa] border border-[#d0d7de] rounded-lg p-2.5 font-mono text-[11px] text-[#24292f] flex items-center justify-between shadow-inner">
                <span className="truncate select-all text-left">npm i -g @singhparth427/gitdoc-cli</span>
              </div>
            </div>
          </div>

          {/* Step 2: System Hook Link */}
          <div className="p-8 space-y-4 hover:bg-[#fafafa]/30 transition-colors flex flex-col justify-between">
            <div className="space-y-3">
              <div className="text-xs font-mono font-bold text-[#57606a] flex items-center justify-between">
                <span>STEP // 02</span>
                <span className="px-2 py-0.5 rounded bg-[#dafbe1] text-[10px] border border-[#a1dfb1] text-[#1a7f37]">Link</span>
              </div>
              <h3 className="text-base font-bold text-[#24292f]">
                Initialize the Path
              </h3>
              <p className="text-[#57606a] text-xs leading-relaxed">
                Connect the background watcher daemon to your target working document location matrix string path to launch the local listener hook.
              </p>
            </div>
            <div className="pt-4">
              <div className="bg-[#f6f8fa] border border-[#d0d7de] rounded-lg p-2.5 font-mono text-[11px] text-[#24292f] flex items-center justify-between shadow-inner">
                <span className="truncate select-all text-left text-gray-500">gitdoc track "./my-file.docx"</span>
              </div>
            </div>
          </div>

          {/* Step 3: Run & Synchronize */}
          <div className="p-8 space-y-4 hover:bg-[#fafafa]/30 transition-colors flex flex-col justify-between">
            <div className="space-y-3">
              <div className="text-xs font-mono font-bold text-[#57606a] flex items-center justify-between">
                <span>STEP // 03</span>
                <span className="px-2 py-0.5 rounded bg-[#ddf4ff] text-[10px] border border-[#54aeff]/30 text-[#0969da]">Stream</span>
              </div>
              <h3 className="text-base font-bold text-[#24292f]">
                Modify & Automate
              </h3>
              <p className="text-[#57606a] text-xs leading-relaxed">
                Work normally inside your document editor. Every local save operation automatically compiles line deltas and updates your central dashboard.
              </p>
            </div>
            <div className="pt-4">
              <div className="text-[10px] font-mono text-[#57606a] flex items-center gap-1.5 bg-[#f6f8fa] p-2.5 rounded-lg border border-[#e1e4e8]">
                <span className="h-1.5 w-1.5 bg-[#1a7f37] rounded-full animate-ping" />
                <span>Streaming live updates directly to cloud</span>
              </div>
            </div>
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
