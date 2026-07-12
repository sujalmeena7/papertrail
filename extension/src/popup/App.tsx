import React, { useEffect, useState } from 'react';
import { Receipt, CheckCircle2, Save, KeyRound, ExternalLink, ShieldCheck, SearchCode } from 'lucide-react';

export default function App() {
  const [token, setToken] = useState<string>('');
  const [isSaved, setIsSaved] = useState(false);
  const [hasToken, setHasToken] = useState(false);

  useEffect(() => {
    chrome.storage.local.get(['device_token'], (result: { [key: string]: any }) => {
      if (result.device_token) {
        setToken(result.device_token);
        setHasToken(true);
      }
    });
  }, []);

  const saveToken = () => {
    chrome.storage.local.set({ device_token: token }, () => {
      setIsSaved(true);
      setHasToken(true);
      setTimeout(() => setIsSaved(false), 2000);
    });
  };

  const removeToken = () => {
    chrome.storage.local.remove(['device_token'], () => {
      setToken('');
      setHasToken(false);
    });
  };

  return (
    <div className="w-[340px] min-h-[420px] font-sans text-zinc-300 bg-zinc-950 relative overflow-hidden flex flex-col">
      {/* Background ambient gradients */}
      <div className="absolute top-[-20%] right-[-10%] w-[70%] h-[70%] rounded-full bg-blue-500/10 blur-[80px] mix-blend-screen pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-500/10 blur-[60px] mix-blend-screen pointer-events-none" />

      {/* Header */}
      <div className="px-6 pt-6 pb-4 flex items-center justify-center gap-2 border-b border-zinc-800/50 bg-zinc-950/50 backdrop-blur-md relative z-10">
        <div className="bg-white text-black p-1.5 rounded-md shadow-[0_0_15px_rgba(255,255,255,0.2)]">
          <Receipt className="w-5 h-5" strokeWidth={2.5} />
        </div>
        <h1 className="text-xl font-semibold tracking-tight text-white">Papertrail</h1>
      </div>
      
      <div className="flex-1 p-6 flex flex-col relative z-10">
        {!hasToken ? (
          <div className="flex flex-col h-full justify-center space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 bg-zinc-900 rounded-full flex items-center justify-center mx-auto mb-2 border border-zinc-800 shadow-inner">
                <KeyRound className="w-6 h-6 text-zinc-400" />
              </div>
              <h2 className="text-lg font-medium text-white">Connect Device</h2>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Link this extension to your Papertrail account using a device token.
              </p>
            </div>
            
            <div className="space-y-3 mt-4">
              <div className="relative">
                <input 
                  type="text" 
                  placeholder="Paste token here..." 
                  className="w-full text-sm bg-zinc-900/50 border border-zinc-800 rounded-lg p-3 pl-4 outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 transition-all text-white placeholder:text-zinc-600"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                />
              </div>
              <button 
                className="w-full bg-white hover:bg-zinc-200 text-black font-semibold py-3 px-4 rounded-lg transition-all text-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_25px_rgba(255,255,255,0.2)]"
                onClick={saveToken}
                disabled={!token.trim()}
              >
                {isSaved ? <CheckCircle2 className="w-4 h-4" /> : <Save className="w-4 h-4" />} 
                {isSaved ? 'Saved!' : 'Connect Extension'}
              </button>
            </div>
            
            <div className="text-center mt-auto pt-4">
              <a 
                href="http://localhost:3000/settings" 
                target="_blank" 
                rel="noreferrer" 
                className="inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-white transition-colors"
              >
                Get a token from Settings <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        ) : (
          <div className="flex flex-col h-full animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="flex items-center gap-3 text-green-400 text-sm font-medium bg-green-950/30 p-4 rounded-xl border border-green-900/50 shadow-inner mb-6">
              <div className="bg-green-500/20 p-1.5 rounded-full">
                <ShieldCheck className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <div className="text-green-300 font-semibold">Connected & Active</div>
                <div className="text-green-500/70 text-xs mt-0.5">Device token validated</div>
              </div>
            </div>
            
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 mb-auto">
              <div className="flex items-center gap-2 mb-2">
                <SearchCode className="w-4 h-4 text-zinc-400" />
                <h3 className="text-sm font-medium text-white">Auto-Capture Ready</h3>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Papertrail will automatically detect and capture receipts when you visit billing pages (AWS, Vercel, OpenAI, etc). Just look for the popup!
              </p>
            </div>

            <button 
              className="w-full bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-white font-medium py-3 px-4 rounded-lg transition-all text-sm mt-6"
              onClick={removeToken}
            >
              Disconnect Extension
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
