import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="bg-zinc-900/80 backdrop-blur-md border-b border-white/5 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-green-500 to-emerald-700 rounded-lg p-1.5 shadow-lg shadow-green-900/50 ring-1 ring-white/10">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              PassportAI <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-600">Pro</span>
            </h1>
            <p className="text-[10px] text-zinc-400 uppercase tracking-widest font-semibold">Indian Standard Edition</p>
          </div>
        </div>
        <div className="hidden md:flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
          <div className="text-xs text-zinc-400 font-mono">
            SYSTEM: ONLINE
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;