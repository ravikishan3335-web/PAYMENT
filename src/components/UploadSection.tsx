import React, { useRef, useState, useEffect } from 'react';
import { Upload, Sparkles, Image as ImageIcon, ShieldCheck, Zap, Layers } from 'lucide-react';
import { SAMPLE_RECEIPTS } from '../utils/sampleImages';

interface UploadSectionProps {
  onImageSelected: (file: File | null, dataUrl: string, name?: string) => void;
  onMultipleImagesSelected?: (items: { file: File | null; dataUrl: string; name: string }[]) => void;
  isProcessing: boolean;
  historyCount?: number;
}

export const UploadSection: React.FC<UploadSectionProps> = ({
  onImageSelected,
  onMultipleImagesSelected,
  isProcessing,
  historyCount = 0,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  // Global paste handler (Ctrl+V) for payment screenshot images
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const file = items[i].getAsFile();
          if (file) {
            processFiles([file]);
            break;
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, []);

  const processFiles = async (files: File[]) => {
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    const validFiles = files.filter((f) => validTypes.includes(f.type.toLowerCase()));

    if (validFiles.length === 0) {
      alert('Please upload valid JPG, JPEG, or PNG images.');
      return;
    }

    // Read all files
    const readPromises = validFiles.map(
      (file) =>
        new Promise<{ file: File; dataUrl: string; name: string }>((resolve) => {
          const reader = new FileReader();
          reader.onload = (event) => {
            resolve({
              file,
              dataUrl: (event.target?.result as string) || '',
              name: file.name,
            });
          };
          reader.readAsDataURL(file);
        })
    );

    const results = await Promise.all(readPromises);

    if (results.length === 1 || !onMultipleImagesSelected) {
      onImageSelected(results[0].file, results[0].dataUrl, results[0].name);
    } else {
      onMultipleImagesSelected(results);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processFiles(Array.from(files));
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      processFiles(Array.from(files));
    }
  };

  const handleSampleClick = (sample: (typeof SAMPLE_RECEIPTS)[0]) => {
    const dataUrl = sample.generator();
    onImageSelected(null, dataUrl, `Sample_${sample.app}_Receipt.png`);
  };

  return (
    <div className="w-full">
      {/* Hidden file input with multiple support */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".jpg,.jpeg,.png,image/jpeg,image/png"
        className="hidden"
        onChange={handleFileInputChange}
      />

      {/* Main Drag-and-Drop / Upload Area */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed rounded-3xl p-8 md:p-12 text-center transition-all duration-200 cursor-pointer ${
          isDragOver
            ? 'border-blue-500 bg-blue-50/70 scale-[1.01] shadow-lg shadow-blue-500/10'
            : 'border-blue-200 bg-gradient-to-b from-white to-blue-50/30 hover:border-blue-400 hover:shadow-md'
        }`}
        onClick={() => fileInputRef.current?.click()}
      >
        <div className="max-w-xl mx-auto flex flex-col items-center">
          {/* Icon Badge */}
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-xl shadow-blue-500/25 mb-6 group-hover:scale-105 transition-transform">
            <Upload className="w-10 h-10 animate-pulse" />
          </div>

          <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight mb-2">
            Upload Payment Screenshots
          </h2>

          <p className="text-sm md:text-base text-slate-600 mb-6 max-w-md">
            Upload one or multiple payment receipts. Each screenshot is auto-scanned and saved safely into your history.
          </p>

          {/* LARGE UPLOAD BUTTON as strictly requested */}
          <button
            type="button"
            disabled={isProcessing}
            onClick={(e) => {
              e.stopPropagation();
              fileInputRef.current?.click();
            }}
            className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white font-bold text-lg rounded-2xl shadow-lg shadow-blue-600/30 hover:shadow-xl hover:shadow-blue-600/40 hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center justify-center gap-3 cursor-pointer"
          >
            <span className="text-2xl">📸</span>
            <span>Upload Payment Screenshot(s)</span>
          </button>

          {/* Format pills */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-2 text-xs font-semibold text-slate-500">
            <span className="bg-white px-3 py-1 rounded-full border border-slate-200 shadow-2xs">
              Supports: JPG, JPEG, PNG (Single or Multi-select)
            </span>
            <span className="bg-white px-3 py-1 rounded-full border border-slate-200 shadow-2xs flex items-center gap-1">
              <Zap className="w-3 h-3 text-amber-500" /> Paste via Ctrl + V
            </span>
            <span className="bg-white px-3 py-1 rounded-full border border-slate-200 shadow-2xs flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-emerald-500" /> Safe Local History
            </span>
          </div>
        </div>
      </div>

      {/* Instant Test Sample Screenshots */}
      <div className="mt-6 p-4 bg-white/80 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 uppercase tracking-wider">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>Or test with a sample receipt to see auto-scan & history:</span>
          </div>
          <span className="text-xs text-slate-400">One-click auto-fill</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {SAMPLE_RECEIPTS.map((sample) => (
            <button
              key={sample.id}
              type="button"
              disabled={isProcessing}
              onClick={() => handleSampleClick(sample)}
              className="px-4 py-2.5 bg-slate-50 hover:bg-blue-50/80 border border-slate-200 hover:border-blue-300 rounded-xl text-left transition-all group flex items-center justify-between gap-3 text-slate-700 hover:text-blue-900 cursor-pointer"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-blue-100/80 text-blue-700 flex items-center justify-center font-bold text-xs shrink-0 group-hover:scale-105 transition-transform">
                  <ImageIcon className="w-4 h-4" />
                </div>
                <div className="truncate">
                  <p className="text-xs font-bold truncate">{sample.title}</p>
                  <p className="text-[11px] text-slate-500 truncate">To: {sample.recipient}</p>
                </div>
              </div>
              <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/60 shrink-0">
                {sample.amount}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
