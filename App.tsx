import React, { useState, useCallback, useEffect } from 'react';
import Header from './components/Header';
import UploadSection from './components/UploadSection';
import ComplianceBadge from './components/ComplianceBadge';
import { DocType, OutputFormat, ProcessingStatus, DOC_CONFIGS, OutfitOption, BgColorOption, FileSizeLimit } from './types';
import { processImageWithGemini } from './services/geminiService';
import { fileToBase64, createPrintSheet, compressToTargetSize } from './utils/photoUtils';

function App() {
  const docType = DocType.PASSPORT;
  
  const [outputFormat, setOutputFormat] = useState<OutputFormat>(OutputFormat.SINGLE_DIGITAL);
  const [fileSizeLimit, setFileSizeLimit] = useState<FileSizeLimit>('unlimited');
  const [status, setStatus] = useState<ProcessingStatus>(ProcessingStatus.IDLE);
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  
  // AI Feature State
  const [selectedOutfit, setSelectedOutfit] = useState<OutfitOption>('original');
  const [selectedBgColor, setSelectedBgColor] = useState<BgColorOption>('white');
  
  // Cache the raw result from Gemini
  const [geminiRawData, setGeminiRawData] = useState<string | null>(null);
  
  // Final displayable image
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Compare mode
  const [isComparing, setIsComparing] = useState(false);

  const currentConfig = DOC_CONFIGS[docType];

  const handleFileSelect = useCallback(async (file: File) => {
    try {
      setStatus(ProcessingStatus.UPLOADING);
      setErrorMsg(null);
      
      const base64 = await fileToBase64(file);
      setOriginalImage(base64);
      
      // Reset state on new upload
      setProcessedImage(null); 
      setGeminiRawData(null);
      setStatus(ProcessingStatus.IDLE);
    } catch (err) {
      console.error(err);
      setErrorMsg("Failed to read image file.");
      setStatus(ProcessingStatus.ERROR);
    }
  }, []);

  const handleOutfitChange = (outfit: OutfitOption) => {
    if (outfit !== selectedOutfit) {
      setSelectedOutfit(outfit);
      setGeminiRawData(null); 
      setProcessedImage(null);
    }
  };

  const handleBgChange = (bg: BgColorOption) => {
    if (bg !== selectedBgColor) {
      setSelectedBgColor(bg);
      setGeminiRawData(null);
      setProcessedImage(null);
    }
  };

  const generateOutput = useCallback(async (rawData: string, format: OutputFormat) => {
    try {
      setStatus(format === OutputFormat.PRINT_SHEET ? ProcessingStatus.GENERATING_SHEET : ProcessingStatus.PROCESSING);
      
      let finalImage = `data:image/jpeg;base64,${rawData}`;
      
      if (format === OutputFormat.PRINT_SHEET) {
        finalImage = await createPrintSheet(
          rawData, 
          currentConfig.widthMm, 
          currentConfig.heightMm
        );
      }

      setProcessedImage(finalImage);
      setStatus(ProcessingStatus.SUCCESS);
    } catch (err) {
      console.error("Output generation error:", err);
      setErrorMsg("Failed to generate output format.");
      setStatus(ProcessingStatus.ERROR);
    }
  }, [currentConfig]);

  useEffect(() => {
    if (geminiRawData && status !== ProcessingStatus.PROCESSING && status !== ProcessingStatus.GENERATING_SHEET) {
       generateOutput(geminiRawData, outputFormat);
    }
  }, [outputFormat, geminiRawData, generateOutput]);

  const processImage = async () => {
    if (!originalImage) return;

    try {
      setErrorMsg(null);
      
      if (geminiRawData) {
        await generateOutput(geminiRawData, outputFormat);
        return;
      }

      setStatus(ProcessingStatus.PROCESSING);

      const geminiResultBase64 = await processImageWithGemini(
        originalImage, 
        docType, 
        selectedOutfit, 
        selectedBgColor
      );
      
      setGeminiRawData(geminiResultBase64);
      await generateOutput(geminiResultBase64, outputFormat);

    } catch (err) {
      console.error(err);
      setErrorMsg(err instanceof Error ? err.message : "An unexpected error occurred during processing.");
      setStatus(ProcessingStatus.ERROR);
    }
  };

  const handleDownload = async () => {
    if (!processedImage) return;
    
    try {
      let imageToDownload = processedImage;
      
      // Handle compression if selected (and only for digital files, sheets usually printed need HQ)
      if (fileSizeLimit !== 'unlimited' && outputFormat === OutputFormat.SINGLE_DIGITAL) {
        setStatus(ProcessingStatus.COMPRESSING);
        const limitKb = fileSizeLimit === '50kb' ? 50 : fileSizeLimit === '100kb' ? 100 : 200;
        imageToDownload = await compressToTargetSize(processedImage, limitKb);
        setStatus(ProcessingStatus.SUCCESS);
      }

      const link = document.createElement('a');
      link.href = imageToDownload;
      link.download = `passport_photo_${selectedOutfit}_${fileSizeLimit !== 'unlimited' ? fileSizeLimit : 'HQ'}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e) {
      console.error(e);
      setErrorMsg("Failed to process download");
      setStatus(ProcessingStatus.SUCCESS); // Reset status
    }
  };

  const reset = () => {
    setOriginalImage(null);
    setProcessedImage(null);
    setGeminiRawData(null);
    setStatus(ProcessingStatus.IDLE);
    setErrorMsg(null);
  };

  const isProcessing = status === ProcessingStatus.PROCESSING || status === ProcessingStatus.GENERATING_SHEET || status === ProcessingStatus.COMPRESSING;

  // Reusable card style for consistent 3D matte look
  const Card = ({ children, disabled = false }: { children: React.ReactNode, disabled?: boolean }) => (
    <div className={`
      relative rounded-2xl overflow-hidden
      bg-gradient-to-b from-zinc-800 to-zinc-900
      border border-white/5 shadow-xl shadow-black/40
      transition-all duration-300
      ${disabled ? 'opacity-50 grayscale pointer-events-none' : 'opacity-100'}
    `}>
      {/* Top light reflection for 3D effect */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
      <div className="p-6 relative z-10">
        {children}
      </div>
    </div>
  );

  const StepNumber = ({ num }: { num: number }) => (
    <span className="flex items-center justify-center w-6 h-6 rounded bg-zinc-700 text-zinc-300 text-xs font-bold font-mono mr-3 border border-zinc-600 shadow-inner">
      {num}
    </span>
  );

  return (
    <div className="min-h-screen flex flex-col bg-zinc-950 text-zinc-100 selection:bg-green-500/30 selection:text-green-200">
      <div className="fixed inset-0 z-0 opacity-20 pointer-events-none" 
           style={{ backgroundImage: 'radial-gradient(circle at 50% 0%, #10b981 0%, transparent 25%), radial-gradient(circle at 80% 80%, #064e3b 0%, transparent 20%)' }}>
      </div>

      <Header />

      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 relative z-10">
        
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-b from-white to-zinc-400 tracking-tight">
            Next-Gen Passport Photos
          </h2>
          <p className="mt-4 max-w-2xl mx-auto text-lg text-zinc-400 font-light">
            AI-powered compliance for Indian documents. 
            <span className="text-green-500 font-mono ml-2 text-sm bg-green-900/20 px-2 py-1 rounded border border-green-900/30">v2.5 ACTIVE</span>
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Controls */}
          <div className="lg:col-span-4 space-y-6">
            
            <Card>
              <h3 className="text-lg font-bold text-white mb-5 flex items-center">
                <StepNumber num={1} />
                Input Source
              </h3>
              
              {!originalImage ? (
                <UploadSection 
                  onFileSelect={handleFileSelect} 
                  disabled={isProcessing}
                />
              ) : (
                <div className="relative rounded-xl overflow-hidden bg-black border border-zinc-700 shadow-inner group">
                   <img 
                      src={`data:image/jpeg;base64,${originalImage}`} 
                      alt="Original" 
                      className="w-full h-48 object-cover opacity-60 group-hover:opacity-40 transition-opacity"
                   />
                   <div className="absolute inset-0 flex items-center justify-center">
                     <button 
                        onClick={reset}
                        disabled={isProcessing}
                        className="bg-zinc-800/80 backdrop-blur text-white border border-white/10 px-4 py-2 rounded-lg text-sm font-medium hover:bg-zinc-700 hover:border-green-500/50 hover:text-green-400 transition-all shadow-lg"
                     >
                       Change Source
                     </button>
                   </div>
                </div>
              )}
            </Card>

            <Card disabled={!originalImage}>
              <h3 className="text-lg font-bold text-white mb-5 flex items-center">
                <StepNumber num={2} />
                Neural Modifiers
              </h3>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-xs font-mono font-medium text-zinc-400 uppercase tracking-wider mb-3">Attire Selection</label>
                  <div className="grid grid-cols-2 gap-2">
                    {['original', 'suit_male', 'suit_female', 'shirt_white'].map((opt) => (
                      <button
                        key={opt}
                        onClick={() => handleOutfitChange(opt as OutfitOption)}
                        className={`
                          relative px-3 py-3 text-sm rounded-lg border font-medium transition-all duration-200 text-left overflow-hidden
                          ${selectedOutfit === opt 
                            ? 'border-green-500 bg-green-500/10 text-white shadow-[0_0_15px_rgba(16,185,129,0.2)]' 
                            : 'border-zinc-700 bg-zinc-800/50 text-zinc-400 hover:bg-zinc-800 hover:border-zinc-600'}
                        `}
                      >
                         {selectedOutfit === opt && <div className="absolute left-0 top-0 bottom-0 w-1 bg-green-500"></div>}
                         <span className="relative z-10 capitalize">{opt.replace('_', ' ')}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-mono font-medium text-zinc-400 uppercase tracking-wider mb-3">Background Tone</label>
                  <div className="flex gap-4">
                    {[
                      { id: 'white', color: '#ffffff', label: 'White' },
                      { id: 'light_blue', color: '#D0E0FF', label: 'Blue' },
                      { id: 'light_gray', color: '#E0E0E0', label: 'Gray' }
                    ].map((bg) => (
                      <button 
                        key={bg.id}
                        onClick={() => handleBgChange(bg.id as BgColorOption)} 
                        className={`
                          group relative w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300
                          ${selectedBgColor === bg.id ? 'ring-2 ring-green-500 scale-110' : 'ring-1 ring-zinc-700 hover:ring-zinc-500'}
                        `}
                      >
                         <span 
                           className="w-8 h-8 rounded-full shadow-sm" 
                           style={{ backgroundColor: bg.color }}
                         ></span>
                         {selectedBgColor === bg.id && (
                           <span className="absolute -bottom-6 text-[10px] font-mono text-green-500">{bg.label}</span>
                         )}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </Card>

            <Card disabled={!originalImage}>
              <h3 className="text-lg font-bold text-white mb-5 flex items-center">
                <StepNumber num={3} />
                Output Specs
              </h3>

              <div className="space-y-4">
                  <div className="flex flex-col space-y-3">
                      <label className={`
                        relative flex items-center p-3 rounded-xl border cursor-pointer transition-all
                        ${outputFormat === OutputFormat.SINGLE_DIGITAL 
                          ? 'border-green-500 bg-green-500/10 shadow-[0_0_10px_rgba(16,185,129,0.1)]' 
                          : 'border-zinc-700 bg-zinc-800/30 hover:bg-zinc-800'}
                      `}>
                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${outputFormat === OutputFormat.SINGLE_DIGITAL ? 'border-green-500' : 'border-zinc-500'}`}>
                           {outputFormat === OutputFormat.SINGLE_DIGITAL && <div className="w-2 h-2 rounded-full bg-green-500"></div>}
                        </div>
                        <input type="radio" name="output" className="hidden" checked={outputFormat === OutputFormat.SINGLE_DIGITAL} onChange={() => setOutputFormat(OutputFormat.SINGLE_DIGITAL)} disabled={isProcessing} />
                        <span className={`ml-3 text-sm font-medium ${outputFormat === OutputFormat.SINGLE_DIGITAL ? 'text-white' : 'text-zinc-400'}`}>Digital File (51x51mm)</span>
                      </label>

                      <label className={`
                        relative flex items-center p-3 rounded-xl border cursor-pointer transition-all
                        ${outputFormat === OutputFormat.PRINT_SHEET 
                          ? 'border-green-500 bg-green-500/10 shadow-[0_0_10px_rgba(16,185,129,0.1)]' 
                          : 'border-zinc-700 bg-zinc-800/30 hover:bg-zinc-800'}
                      `}>
                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${outputFormat === OutputFormat.PRINT_SHEET ? 'border-green-500' : 'border-zinc-500'}`}>
                           {outputFormat === OutputFormat.PRINT_SHEET && <div className="w-2 h-2 rounded-full bg-green-500"></div>}
                        </div>
                        <input type="radio" name="output" className="hidden" checked={outputFormat === OutputFormat.PRINT_SHEET} onChange={() => setOutputFormat(OutputFormat.PRINT_SHEET)} disabled={isProcessing} />
                        <span className={`ml-3 text-sm font-medium ${outputFormat === OutputFormat.PRINT_SHEET ? 'text-white' : 'text-zinc-400'}`}>Printable 4x6" Sheet</span>
                      </label>
                  </div>

                  {outputFormat === OutputFormat.SINGLE_DIGITAL && (
                    <div className="pt-4 border-t border-zinc-700/50">
                      <div className="flex items-center justify-between mb-2">
                         <label className="block text-xs font-mono font-medium text-zinc-500 uppercase">Govt. Size Limit</label>
                         <span className="text-[10px] text-zinc-600 italic">For Online Portals</span>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        {['unlimited', '50kb', '100kb'].map((limit) => (
                          <button
                            key={limit}
                            onClick={() => setFileSizeLimit(limit as FileSizeLimit)}
                            className={`px-1 py-2 text-[11px] font-bold rounded border uppercase tracking-wide transition-all
                              ${fileSizeLimit === limit 
                                ? 'bg-zinc-100 text-zinc-900 border-white shadow-lg' 
                                : 'bg-transparent text-zinc-500 border-zinc-700 hover:border-zinc-500 hover:text-zinc-300'}
                            `}
                          >
                            {limit === 'unlimited' ? 'Max HQ' : `< ${limit.toUpperCase()}`}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
              </div>
            </Card>

            <button
              onClick={processImage}
              disabled={!originalImage || isProcessing}
              className={`
                group w-full py-4 px-6 rounded-xl text-lg font-bold tracking-wide uppercase shadow-xl transition-all duration-300 relative overflow-hidden
                ${(!originalImage || isProcessing) 
                  ? 'bg-zinc-800 text-zinc-600 cursor-not-allowed border border-zinc-700' 
                  : 'bg-gradient-to-r from-green-600 to-emerald-600 text-white border border-green-400/30 hover:shadow-[0_0_30px_rgba(16,185,129,0.4)] hover:scale-[1.02] active:scale-[0.98]'}
              `}
            >
              <div className="absolute inset-0 bg-white/20 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
              <div className="flex items-center justify-center relative z-10">
                {isProcessing ? (
                   <>
                     <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white/80" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                       <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                       <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                     </svg>
                     <span className="text-sm font-mono">{status === ProcessingStatus.COMPRESSING ? 'OPTIMIZING...' : 'PROCESSING...'}</span>
                   </>
                ) : (
                  <>
                    <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                    </svg>
                    {status === ProcessingStatus.SUCCESS ? 'REGENERATE' : 'INITIATE GENERATION'}
                  </>
                )}
              </div>
            </button>
             
             {errorMsg && (
               <div className="p-4 bg-red-900/20 border border-red-500/30 rounded-xl text-red-400 text-xs font-mono">
                 <strong className="block text-red-300 mb-1">SYSTEM ERROR</strong>
                 {errorMsg}
               </div>
             )}
          </div>

          {/* Right Column: Preview */}
          <div className="lg:col-span-8">
            <div className="h-full flex flex-col min-h-[600px] rounded-2xl bg-zinc-900 border border-zinc-800 shadow-2xl overflow-hidden relative">
               
               {/* Grid Pattern Overlay */}
               <div className="absolute inset-0 opacity-10 pointer-events-none" 
                    style={{ backgroundImage: 'linear-gradient(#333 1px, transparent 1px), linear-gradient(90deg, #333 1px, transparent 1px)', backgroundSize: '40px 40px' }}>
               </div>

               <div className="p-6 border-b border-zinc-800 bg-zinc-900/50 flex justify-between items-center relative z-10">
                 <h3 className="text-xl font-bold text-white flex items-center gap-2">
                   <span className="w-2 h-2 bg-green-500 rounded-sm"></span>
                   Output Console
                 </h3>
                 {processedImage && (
                    <div className="flex gap-3">
                       <button 
                         onMouseDown={() => setIsComparing(true)}
                         onMouseUp={() => setIsComparing(false)}
                         onMouseLeave={() => setIsComparing(false)}
                         className="hidden md:inline-flex items-center px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-zinc-800 border border-zinc-700 text-zinc-300 hover:bg-zinc-700 hover:text-white transition-colors select-none"
                       >
                         Hold to Compare
                       </button>
                       <span className="inline-flex items-center px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-green-500/10 border border-green-500/20 text-green-400">
                         <span className="w-1.5 h-1.5 bg-green-400 rounded-full mr-2 animate-pulse"></span>
                         Ready
                       </span>
                    </div>
                 )}
               </div>

               <div className="flex-grow flex flex-col items-center justify-center p-8 relative z-10">
                  {status === ProcessingStatus.IDLE && !originalImage && (
                    <div className="text-center text-zinc-600">
                       <div className="w-24 h-24 mx-auto mb-6 rounded-full border-2 border-dashed border-zinc-800 flex items-center justify-center">
                         <svg className="h-10 w-10 text-zinc-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                         </svg>
                       </div>
                       <p className="text-xl font-light text-zinc-500">Waiting for input stream...</p>
                    </div>
                  )}

                  {originalImage && !processedImage && !isProcessing && (
                    <div className="relative">
                      <div className="absolute inset-0 bg-green-500/20 blur-2xl rounded-full"></div>
                      <img src={`data:image/jpeg;base64,${originalImage}`} className="relative max-h-[500px] max-w-full rounded border border-zinc-700 shadow-2xl" alt="Original Upload" />
                    </div>
                  )}
                  
                  {isProcessing && (
                    <div className="flex flex-col items-center">
                      <div className="relative w-24 h-24 mb-8">
                        <div className="absolute inset-0 border-4 border-zinc-800 rounded-full"></div>
                        <div className="absolute inset-0 border-t-4 border-green-500 rounded-full animate-spin"></div>
                        <div className="absolute inset-4 bg-zinc-800 rounded-full flex items-center justify-center">
                          <span className="text-xs font-mono text-green-500 animate-pulse">AI</span>
                        </div>
                      </div>
                      <p className="text-lg font-mono text-zinc-400">ANALYZING BIOMETRICS...</p>
                      <div className="w-64 h-1 bg-zinc-800 rounded-full mt-4 overflow-hidden">
                        <div className="h-full bg-green-500 animate-progress"></div>
                      </div>
                    </div>
                  )}

                  {processedImage && !isProcessing && (
                    <div className="flex flex-col items-center w-full animate-fade-in">
                       <ComplianceBadge />
                       
                       <div className="relative shadow-[0_20px_50px_-12px_rgba(0,0,0,0.5)] rounded-sm overflow-hidden border-4 border-white p-1 bg-white max-w-full group">
                          {/* Image Display with Compare Logic */}
                          <img 
                            src={isComparing && originalImage ? `data:image/jpeg;base64,${originalImage}` : processedImage} 
                            className="max-h-[450px] max-w-full object-contain transition-opacity duration-200" 
                            alt="Result" 
                          />
                          
                          {/* Mobile Compare Button Overlay */}
                          <button 
                             onTouchStart={() => setIsComparing(true)}
                             onTouchEnd={() => setIsComparing(false)}
                             className="md:hidden absolute bottom-4 right-4 bg-black/80 text-white text-[10px] uppercase font-bold px-3 py-1.5 rounded border border-zinc-600 backdrop-blur-md"
                          >
                             Hold to Compare
                          </button>
                       </div>
                       
                       <p className="mt-6 text-xs text-zinc-500 font-mono border border-zinc-800 px-3 py-1 rounded bg-zinc-900/50">
                         {outputFormat === OutputFormat.SINGLE_DIGITAL 
                           ? `RES: 51x51mm // SIZE: ${fileSizeLimit !== 'unlimited' ? `<${fileSizeLimit.toUpperCase()}` : 'MAX'}` 
                           : 'LAYOUT: 4x6 INCH SHEET (6 UNITS)'}
                       </p>
                    </div>
                  )}
               </div>

               {processedImage && !isProcessing && (
                 <div className="p-6 border-t border-zinc-800 bg-zinc-900/80 flex justify-between items-center relative z-10">
                    <button onClick={reset} className="text-zinc-500 hover:text-white font-medium text-sm transition-colors">
                      &larr; RESET
                    </button>
                    <button
                      onClick={handleDownload}
                      className="inline-flex items-center px-8 py-3 bg-white text-black text-sm font-bold uppercase tracking-widest rounded hover:bg-zinc-200 transition-all shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:shadow-[0_0_30px_rgba(255,255,255,0.4)] hover:-translate-y-1"
                    >
                      <svg className="-ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      DOWNLOAD
                    </button>
                 </div>
               )}
            </div>
          </div>
        </div>
      </main>

      <style>{`
        @keyframes progress {
          0% { width: 0%; }
          50% { width: 70%; }
          100% { width: 100%; }
        }
        .animate-progress {
          animation: progress 2s ease-in-out infinite;
        }
        .animate-fade-in {
          animation: fadeIn 0.5s ease-out forwards;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

export default App;