import React, { useState, useEffect } from 'react';
import {
  FileSpreadsheet,
  FileText,
  RotateCcw,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Layers,
  Shield,
  ArrowRight,
  Receipt,
  PlusCircle,
  Eye,
} from 'lucide-react';
import { PaymentDetails, EMPTY_PAYMENT_DETAILS, PaymentRecord } from './types/payment';
import { UploadSection } from './components/UploadSection';
import { ScreenshotPreview } from './components/ScreenshotPreview';
import { PaymentDetailsTable } from './components/PaymentDetailsTable';
import { HistoryLedgerView } from './components/HistoryLedgerView';
import { exportPaymentToExcel, exportMultiplePaymentsToExcel } from './utils/excelExport';
import { generatePaymentPdf, generateCombinedPaymentsPdf } from './utils/pdfExport';
import { loadPaymentHistory, savePaymentHistory, createThumbnail } from './utils/historyStorage';

export default function App() {
  const [activeTab, setActiveTab] = useState<'scanner' | 'history'>('scanner');

  // Active scan state
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [fileSize, setFileSize] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [processingProgress, setProcessingProgress] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState<boolean>(false);

  // Active extracted data state
  const [payment, setPayment] = useState<PaymentDetails>(EMPTY_PAYMENT_DETAILS);
  const [activeRecordId, setActiveRecordId] = useState<string | null>(null);

  // Persistent Safe History
  const [history, setHistory] = useState<PaymentRecord[]>([]);

  // Load history from localStorage on initial render
  useEffect(() => {
    const saved = loadPaymentHistory();
    setHistory(saved);
  }, []);

  const showNotification = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(null), 3500);
  };

  // Extract payment details using backend OCR API
  const callOcrApi = async (dataUrl: string): Promise<PaymentDetails> => {
    const mimeMatch = dataUrl.match(/^data:([^;]+);base64,/);
    const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg';

    const response = await fetch('/api/extract-payment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        imageBase64: dataUrl,
        mimeType: mimeType,
      }),
    });

    const result = await response.json();
    if (!response.ok || !result.success) {
      throw new Error(result.error || 'Failed to extract payment details.');
    }
    return result.data;
  };

  // Process a single image
  const handleImageSelected = async (file: File | null, dataUrl: string, name?: string) => {
    setImageSrc(dataUrl);
    const safeName = name || file?.name || 'payment_screenshot.png';
    setFileName(safeName);
    setErrorMsg(null);
    setIsEditing(false);
    setActiveTab('scanner');

    let sizeStr = 'High Res';
    if (file) {
      const sizeKb = Math.round(file.size / 1024);
      sizeStr = sizeKb > 1024 ? `${(sizeKb / 1024).toFixed(1)} MB` : `${sizeKb} KB`;
    }
    setFileSize(sizeStr);
    setIsProcessing(true);
    setProcessingProgress('Auto-scanning receipt with OCR...');

    try {
      const extracted = await callOcrApi(dataUrl);
      setPayment(extracted);

      // Create compressed thumbnail for safe localStorage retention
      const thumb = await createThumbnail(dataUrl);
      const newId = `rec_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      setActiveRecordId(newId);

      const record: PaymentRecord = {
        id: newId,
        createdAt: Date.now(),
        imageSrc: dataUrl,
        thumbnail: thumb,
        fileName: safeName,
        fileSize: sizeStr,
        payment: extracted,
      };

      // Automatically add to Safe History!
      const updatedHistory = [record, ...history.filter((h) => h.id !== newId)];
      setHistory(updatedHistory);
      savePaymentHistory(updatedHistory);

      showNotification('✅ Photo auto-scanned & saved to Safe History!');
    } catch (err: any) {
      console.error('OCR Extraction error:', err);
      setErrorMsg(
        err.message ||
          'Could not read some details automatically. You can enter or adjust fields manually.'
      );
      setPayment(EMPTY_PAYMENT_DETAILS);
      setIsEditing(true);
    } finally {
      setIsProcessing(false);
      setProcessingProgress(null);
    }
  };

  // Process multiple images sequentially
  const handleMultipleImagesSelected = async (
    items: { file: File | null; dataUrl: string; name: string }[]
  ) => {
    setIsProcessing(true);
    setErrorMsg(null);
    let newRecords: PaymentRecord[] = [];

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      setProcessingProgress(`Auto-scanning receipt ${i + 1} of ${items.length}...`);
      try {
        const extracted = await callOcrApi(item.dataUrl);
        const thumb = await createThumbnail(item.dataUrl);
        const newId = `rec_${Date.now()}_${i}_${Math.random().toString(36).substring(2, 6)}`;

        const record: PaymentRecord = {
          id: newId,
          createdAt: Date.now() + i,
          imageSrc: item.dataUrl,
          thumbnail: thumb,
          fileName: item.name,
          fileSize: 'Multi-scan',
          payment: extracted,
        };
        newRecords.push(record);
      } catch (err) {
        console.warn(`Error scanning item ${item.name}:`, err);
      }
    }

    if (newRecords.length > 0) {
      const updatedHistory = [...newRecords, ...history];
      setHistory(updatedHistory);
      savePaymentHistory(updatedHistory);

      // Set the last scanned as active preview
      const last = newRecords[0];
      setImageSrc(last.imageSrc || null);
      setFileName(last.fileName);
      setPayment(last.payment);
      setActiveRecordId(last.id);

      showNotification(`🎉 All ${newRecords.length} screenshots scanned & saved to History!`);
      // Switch to history view so user can see all of them together immediately!
      setActiveTab('history');
    } else {
      setErrorMsg('Failed to process uploaded receipts. Please try again.');
    }

    setIsProcessing(false);
    setProcessingProgress(null);
  };

  const handleFieldChange = (field: keyof PaymentDetails, value: string) => {
    const updated = {
      ...payment,
      [field]: value,
    };
    setPayment(updated);

    // Update in history if currently tracked
    if (activeRecordId) {
      const updatedHistory = history.map((item) => {
        if (item.id === activeRecordId) {
          return { ...item, payment: updated };
        }
        return item;
      });
      setHistory(updatedHistory);
      savePaymentHistory(updatedHistory);
    }
  };

  const handleRescan = () => {
    if (imageSrc) {
      handleImageSelected(null, imageSrc, fileName);
    }
  };

  // Single Excel Export
  const handleExportExcel = () => {
    try {
      exportPaymentToExcel(payment);
      showNotification('Excel spreadsheet (.xlsx) downloaded successfully!');
    } catch (err) {
      console.error(err);
      alert('Failed to generate Excel file.');
    }
  };

  // Single PDF Export
  const handleExportPdf = () => {
    try {
      generatePaymentPdf(payment);
      showNotification('Payment receipt PDF downloaded successfully!');
    } catch (err) {
      console.error(err);
      alert('Failed to generate PDF document.');
    }
  };

  // Clear Active Scan View
  const handleClear = () => {
    setImageSrc(null);
    setFileName('');
    setFileSize('');
    setPayment(EMPTY_PAYMENT_DETAILS);
    setErrorMsg(null);
    setIsEditing(false);
    setActiveRecordId(null);
  };

  // Delete item from history
  const handleDeleteHistoryItem = (id: string) => {
    const updated = history.filter((h) => h.id !== id);
    setHistory(updated);
    savePaymentHistory(updated);
    if (activeRecordId === id) {
      handleClear();
    }
    showNotification('Receipt removed from history.');
  };

  // Clear entire history
  const handleClearAllHistory = () => {
    setHistory([]);
    savePaymentHistory([]);
    handleClear();
    showNotification('All history cleared.');
  };

  // Update a record from the ledger view
  const handleUpdateRecordPayment = (id: string, updatedPayment: PaymentDetails) => {
    const updated = history.map((h) => {
      if (h.id === id) {
        return { ...h, payment: updatedPayment };
      }
      return h;
    });
    setHistory(updated);
    savePaymentHistory(updated);
    if (activeRecordId === id) {
      setPayment(updatedPayment);
    }
    showNotification('Changes saved to history.');
  };

  // Select a record from history to open in active scanner
  const handleSelectRecordFromHistory = (record: PaymentRecord) => {
    setImageSrc(record.imageSrc || record.thumbnail || null);
    setFileName(record.fileName);
    setFileSize(record.fileSize || 'Saved');
    setPayment(record.payment);
    setActiveRecordId(record.id);
    setActiveTab('scanner');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Toast Notification */}
      {successToast && (
        <div className="fixed top-5 right-5 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl border border-slate-700 flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-300">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-sm font-medium">{successToast}</span>
        </div>
      )}

      {/* Modern Fintech Header */}
      <header className="bg-white border-b border-slate-200/80 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-blue-500 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-extrabold text-lg sm:text-xl text-slate-900 tracking-tight flex items-center gap-2">
                PAYMENT SCREENSHOT TO EXCEL
                <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-bold bg-blue-100 text-blue-700 rounded-md uppercase tracking-wider">
                  OCR Engine
                </span>
              </h1>
              <p className="text-xs text-slate-500 hidden sm:block">
                Auto-scan screenshots • Safe History • Consolidated Excel & PDF Export
              </p>
            </div>
          </div>

          {/* Navigation Tab Switcher */}
          <div className="flex items-center gap-2">
            <div className="bg-slate-100 p-1 rounded-xl flex items-center gap-1 border border-slate-200/80">
              <button
                type="button"
                onClick={() => setActiveTab('scanner')}
                className={`px-3 sm:px-4 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'scanner'
                    ? 'bg-white text-blue-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Active Scan</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('history')}
                className={`px-3 sm:px-4 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'history'
                    ? 'bg-white text-blue-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Receipt className="w-3.5 h-3.5" />
                <span>History ({history.length})</span>
                {history.length > 0 && (
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                )}
              </button>
            </div>

            {history.length > 0 && activeTab === 'scanner' && (
              <button
                type="button"
                onClick={() => setActiveTab('history')}
                className="hidden lg:flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                <Layers className="w-3.5 h-3.5" />
                <span>View All ({history.length})</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10">
        {/* VIEW 1: CONSOLIDATED HISTORY & ALL-RECEIPT LEDGER ("ek he baar meh dekh sakte hai") */}
        {activeTab === 'history' ? (
          <HistoryLedgerView
            history={history}
            onSelectRecord={handleSelectRecordFromHistory}
            onDeleteRecord={handleDeleteHistoryItem}
            onClearHistory={handleClearAllHistory}
            onSwitchToScanner={() => setActiveTab('scanner')}
            onUpdateRecordPayment={handleUpdateRecordPayment}
          />
        ) : (
          /* VIEW 2: ACTIVE SCANNER VIEW */
          <>
            {/* If no image active, show Hero + Upload section */}
            {!imageSrc ? (
              <div className="space-y-10">
                {/* Hero Pitch */}
                <div className="text-center max-w-3xl mx-auto pt-2 pb-4">
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-200/80 text-blue-700 text-xs font-bold mb-4">
                    <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                    <span>Auto-Scan & Safe History Active • Single or Multiple Screenshots</span>
                  </div>
                  <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
                    Payment Screenshots to <br className="hidden sm:block" />
                    <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 bg-clip-text text-transparent">
                      Safe History, Excel & PDF
                    </span>
                  </h2>
                  <p className="mt-4 text-base sm:text-lg text-slate-600 max-w-2xl mx-auto">
                    Upload any payment screenshot (Google Pay, PhonePe, Paytm, BHIM, UPI, Bank Transfer).
                    Details are auto-scanned, safely saved in history, and can be viewed or exported all together at once!
                  </p>
                </div>

                {/* Workflow steps */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
                  {[
                    { step: '1', title: 'Upload Screenshot(s)', desc: 'JPG/PNG single or multi-file' },
                    { step: '2', title: 'Auto-Scan OCR', desc: 'Auto-reads amount, date, UPI & names' },
                    { step: '3', title: 'Safe History Saved', desc: 'Saved safely on your device' },
                    { step: '4', title: 'Combined Export', desc: 'Ek saath All in Excel & All in PDF' },
                  ].map((item, idx) => (
                    <div
                      key={item.step}
                      className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center md:flex-col md:text-center gap-3 relative"
                    >
                      <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-extrabold text-xs flex items-center justify-center shrink-0">
                        {item.step}
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-slate-900">{item.title}</h4>
                        <p className="text-xs text-slate-500 mt-0.5">{item.desc}</p>
                      </div>
                      {idx < 3 && (
                        <div className="hidden md:block absolute -right-3 top-1/2 -translate-y-1/2 z-10 text-slate-300">
                          <ArrowRight className="w-4 h-4" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Upload Area */}
                <div className="max-w-3xl mx-auto">
                  <UploadSection
                    onImageSelected={handleImageSelected}
                    onMultipleImagesSelected={handleMultipleImagesSelected}
                    isProcessing={isProcessing}
                    historyCount={history.length}
                  />
                </div>

                {/* Recent History quick teaser if history exists */}
                {history.length > 0 && (
                  <div className="max-w-3xl mx-auto p-5 bg-white rounded-3xl border border-slate-200/80 shadow-xs flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                        <Receipt className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-900">
                          {history.length} Receipts Saved in Safe History
                        </p>
                        <p className="text-[11px] text-slate-500">
                          View all scanned payments together in the consolidated ledger
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setActiveTab('history')}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <span>View All in Ledger</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            ) : (
              /* ACTIVE SCAN WORKSPACE VIEW: Preview + Auto-Filled Details + Export */
              <div className="space-y-8 animate-in fade-in duration-300">
                {/* Top Toolbar */}
                <div className="flex flex-wrap items-center justify-between gap-4 pb-2 border-b border-slate-200">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-700">Active Receipt:</span>
                    <span className="text-xs font-semibold px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-slate-900 truncate max-w-[200px] sm:max-w-xs">
                      {fileName}
                    </span>
                    {isProcessing && (
                      <span className="flex items-center gap-1.5 text-xs text-blue-600 font-semibold animate-pulse">
                        <span className="w-2 h-2 rounded-full bg-blue-600 animate-ping" />
                        {processingProgress || 'Extracting OCR fields...'}
                      </span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={isProcessing}
                      onClick={handleRescan}
                      className="px-3.5 py-1.5 text-xs font-semibold text-blue-700 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      Auto-scan Again
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveTab('history')}
                      className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <Receipt className="w-3.5 h-3.5 text-blue-600" />
                      <span>Ledger ({history.length})</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleClear}
                      className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      Upload Another
                    </button>
                  </div>
                </div>

                {/* Auto-fill confirmation banner */}
                {!isProcessing && !errorMsg && payment.amount && (
                  <div className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 border border-emerald-200 text-emerald-950 text-sm flex items-center justify-between gap-3 shadow-2xs">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                        ✓
                      </div>
                      <div>
                        <p className="font-bold text-xs sm:text-sm text-emerald-900">
                          Photo auto-scanned & saved to Safe History!
                        </p>
                        <p className="text-[11px] sm:text-xs text-emerald-700">
                          All detected details are filled below. You can also view all scanned receipts together anytime in the History Ledger.
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setActiveTab('history')}
                      className="hidden sm:flex items-center gap-1.5 text-xs font-bold text-emerald-800 hover:text-emerald-900 bg-white px-3 py-1.5 rounded-xl border border-emerald-200 shadow-2xs cursor-pointer"
                    >
                      <span>View All {history.length} Receipts</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                )}

                {/* Error banner if OCR had partial or full issue */}
                {errorMsg && (
                  <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-sm flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="font-semibold">{errorMsg}</p>
                      <p className="text-xs text-amber-700 mt-1">
                        You can manually type any missing fields directly into the form on the right.
                      </p>
                    </div>
                  </div>
                )}

                {/* 2-Column Responsive Layout: Left Preview, Right Details */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                  {/* Left Column: Screenshot Preview */}
                  <div className="lg:col-span-5 w-full">
                    <div className="sticky top-24">
                      <ScreenshotPreview
                        imageSrc={imageSrc}
                        fileName={fileName}
                        fileSize={fileSize}
                        isProcessing={isProcessing}
                      />
                    </div>
                  </div>

                  {/* Right Column: Extracted Payment Details Table / Card */}
                  <div className="lg:col-span-7 w-full space-y-6">
                    <PaymentDetailsTable
                      payment={payment}
                      onChange={handleFieldChange}
                      isEditing={isEditing}
                      onToggleEdit={() => setIsEditing(!isEditing)}
                    />

                    {/* ACTION BUTTONS BAR as strictly specified:
                        [ 📊 Open in Excel ]
                        [ 📄 Generate PDF ]
                        [ Clear ]
                    */}
                    <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                          Export Options (Active Receipt)
                        </h4>
                        <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Auto-Saved in History
                        </span>
                      </div>

                      <div className="flex flex-col sm:flex-row items-stretch gap-3">
                        {/* EXCEL BUTTON */}
                        <button
                          type="button"
                          onClick={handleExportExcel}
                          disabled={isProcessing}
                          className="flex-1 px-6 py-4 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-bold text-base rounded-xl shadow-md shadow-emerald-600/20 hover:shadow-lg hover:shadow-emerald-600/30 active:scale-[0.99] transition-all flex items-center justify-center gap-2.5 cursor-pointer"
                        >
                          <span className="text-xl">📊</span>
                          <span>Open in Excel</span>
                        </button>

                        {/* PDF BUTTON */}
                        <button
                          type="button"
                          onClick={handleExportPdf}
                          disabled={isProcessing}
                          className="flex-1 px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white font-bold text-base rounded-xl shadow-md shadow-blue-600/20 hover:shadow-lg hover:shadow-blue-600/30 active:scale-[0.99] transition-all flex items-center justify-center gap-2.5 cursor-pointer"
                        >
                          <span className="text-xl">📄</span>
                          <span>Generate PDF</span>
                        </button>

                        {/* CLEAR BUTTON */}
                        <button
                          type="button"
                          onClick={handleClear}
                          disabled={isProcessing}
                          className="px-6 py-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-base rounded-xl border border-slate-200 transition-colors flex items-center justify-center gap-2 cursor-pointer"
                        >
                          <RotateCcw className="w-4 h-4" />
                          <span>Clear</span>
                        </button>
                      </div>

                      {/* Combined Ledger Shortcut Button */}
                      <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
                        <button
                          type="button"
                          onClick={() => setActiveTab('history')}
                          className="text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1.5 p-1 rounded transition-colors cursor-pointer"
                        >
                          <Layers className="w-4 h-4" />
                          <span>
                            View all {history.length} saved receipts in Consolidated Ledger & Export All Together
                          </span>
                        </button>

                        <span className="text-slate-400">
                          Includes all 11 standardized columns
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200/80 py-6 mt-12 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="font-medium text-slate-600">
            Payment Screenshot to Excel • Safe History & Consolidated Ledger
          </p>
          <p className="text-slate-400">
            {history.length} receipt{history.length !== 1 ? 's' : ''} stored safely in local history
          </p>
        </div>
      </footer>
    </div>
  );
}
