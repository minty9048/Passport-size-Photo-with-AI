import React from 'react';

export const ComplianceBadge: React.FC = () => {
  return (
    <div className="bg-black/40 backdrop-blur-sm rounded-xl p-4 border border-green-500/30 mb-6 shadow-lg shadow-green-900/10 relative overflow-hidden">
      {/* Decorative corner accents */}
      <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-green-500"></div>
      <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-green-500"></div>
      <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-green-500"></div>
      <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-green-500"></div>

      <h4 className="text-xs font-bold text-green-400 uppercase tracking-widest mb-4 flex items-center border-b border-green-500/20 pb-2">
        <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
        AI Compliance Verified
      </h4>
      <div className="grid grid-cols-2 gap-3 text-[11px] font-mono text-zinc-300">
        <div className="flex items-center">
          <span className="w-1.5 h-1.5 bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.8)] rounded-full mr-2"></span>
          DIMENSIONS: 51x51mm
        </div>
        <div className="flex items-center">
          <span className="w-1.5 h-1.5 bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.8)] rounded-full mr-2"></span>
          BG: PURE WHITE
        </div>
        <div className="flex items-center">
          <span className="w-1.5 h-1.5 bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.8)] rounded-full mr-2"></span>
          FACE: SCALED 65%
        </div>
        <div className="flex items-center">
          <span className="w-1.5 h-1.5 bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.8)] rounded-full mr-2"></span>
          LIGHT: CORRECTED
        </div>
        <div className="flex items-center">
          <span className="w-1.5 h-1.5 bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.8)] rounded-full mr-2"></span>
          ALIGN: CENTERED
        </div>
        <div className="flex items-center">
          <span className="w-1.5 h-1.5 bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.8)] rounded-full mr-2"></span>
          SHADOWS: NULL
        </div>
      </div>
    </div>
  );
};

export default ComplianceBadge;