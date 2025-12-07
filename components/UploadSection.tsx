import React, { useRef } from 'react';

interface UploadSectionProps {
  onFileSelect: (file: File) => void;
  disabled: boolean;
}

const UploadSection: React.FC<UploadSectionProps> = ({ onFileSelect, disabled }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (disabled) return;
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onFileSelect(e.target.files[0]);
    }
  };

  return (
    <div 
      className={`relative group overflow-hidden border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-300 ease-out cursor-pointer
        ${disabled 
          ? 'border-zinc-700 bg-zinc-800/50 opacity-50 cursor-not-allowed' 
          : 'border-zinc-600 hover:border-green-500 bg-zinc-800/50 hover:bg-zinc-800 hover:shadow-[0_0_20px_rgba(16,185,129,0.1)]'
        }`}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onClick={() => !disabled && fileInputRef.current?.click()}
    >
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/png, image/jpeg, image/jpg"
        onChange={handleChange}
        disabled={disabled}
      />
      
      <div className="relative z-10 flex flex-col items-center justify-center space-y-4">
        <div className={`p-4 rounded-full transition-colors duration-300 ${disabled ? 'bg-zinc-700' : 'bg-zinc-700 group-hover:bg-green-500/20'}`}>
          <svg className={`w-8 h-8 transition-colors duration-300 ${disabled ? 'text-zinc-500' : 'text-zinc-400 group-hover:text-green-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        <div className="space-y-1">
          <p className="text-base font-semibold text-zinc-200 group-hover:text-white transition-colors">
            Drop your selfie here
          </p>
          <p className="text-xs text-zinc-500 font-mono uppercase tracking-wide">
            JPG, PNG :: MAX 10MB
          </p>
        </div>
        <div className={`px-3 py-1 rounded-full border text-[10px] font-medium tracking-wider uppercase transition-all
          ${disabled ? 'border-zinc-700 text-zinc-600' : 'border-green-500/30 text-green-400 bg-green-500/10'}`}>
          Tip: Use Even Lighting
        </div>
      </div>
    </div>
  );
};

export default UploadSection;