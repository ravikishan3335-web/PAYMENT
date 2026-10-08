import React, { useState } from 'react';
import { Eye, ZoomIn, ZoomOut, RotateCcw, FileText, CheckCircle } from 'lucide-react';

interface ScreenshotPreviewProps {
  imageSrc: string;
  fileName?: string;
  fileSize?: string;
  isProcessing?: boolean;
}

export const ScreenshotPreview: React.FC<ScreenshotPreviewProps> = ({
  imageSrc,
  fileName,
  fileSize,
  isProcessing,
}) => {
  const [zoom, setZoom] = useState<number>(1);

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.25, 2.5));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.25, 0.75));
  const handleResetZoom = () => setZoom(1);

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col h-full">
      {/* Header */}
      <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200/80 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Eye className="w-4 h-4 text-blue-600" />
          <h3 className="font-bold text-sm text-slate-800">Screenshot Preview</h3>
          {isProcessing && (
            <span className="px-2 py-0.5 text-[11px] font-semibold bg-blue-100 text-blue-700 rounded-full animate-pulse">
              Scanning OCR...
            </span>
          )}
          {!isProcessing && (
            <span className="px-2 py-0.5 text-[11px] font-semibold bg-emerald-100 text-emerald-700 rounded-full flex items-center gap-1">
              <CheckCircle className="w-3 h-3" /> Scanned
            </span>
          )}
        </div>

        {/* Zoom controls */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handleZoomOut}
            title="Zoom out"
            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-200/60 rounded-md transition-colors"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span className="text-xs text-slate-500 w-10 text-center font-mono">
            {Math.round(zoom * 100)}%
          </span>
          <button
            type="button"
            onClick={handleZoomIn}
            title="Zoom in"
            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-200/60 rounded-md transition-colors"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          {zoom !== 1 && (
            <button
              type="button"
              onClick={handleResetZoom}
              title="Reset zoom"
              className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-200/60 rounded-md transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Image container */}
      <div className="relative flex-1 min-h-[380px] max-h-[560px] bg-slate-900/5 p-4 flex items-center justify-center overflow-auto">
        <div
          className="transition-transform duration-200 ease-out max-w-full flex items-center justify-center"
          style={{ transform: `scale(${zoom})`, transformOrigin: 'center center' }}
        >
          <img
            src={imageSrc}
            alt="Uploaded Payment Screenshot"
            className="max-h-[480px] w-auto object-contain rounded-lg shadow-md border border-slate-200/60 bg-white"
          />
        </div>

        {/* Scanning beam overlay animation during OCR */}
        {isProcessing && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-b-2xl">
            <div className="w-full h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent shadow-[0_0_15px_#3b82f6] animate-bounce" />
            <div className="absolute inset-0 bg-blue-500/10 flex items-center justify-center backdrop-blur-[1px]">
              <div className="bg-slate-900/90 text-white px-4 py-2.5 rounded-xl shadow-lg flex items-center gap-2.5 text-xs font-semibold">
                <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                <span>Reading receipt details with OCR...</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer image metadata */}
      {(fileName || fileSize) && (
        <div className="px-5 py-2.5 bg-slate-50 border-t border-slate-200/80 text-xs text-slate-500 flex items-center justify-between">
          <span className="truncate max-w-[240px] flex items-center gap-1.5 font-medium">
            <FileText className="w-3.5 h-3.5 text-slate-400" />
            {fileName || 'screenshot.png'}
          </span>
          {fileSize && <span className="font-mono text-slate-400">{fileSize}</span>}
        </div>
      )}
    </div>
  );
};
