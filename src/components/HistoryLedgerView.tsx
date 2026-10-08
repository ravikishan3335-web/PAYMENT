import React, { useState } from 'react';
import {
  PaymentRecord,
  PaymentDetails,
} from '../types/payment';
import {
  FileSpreadsheet,
  FileText,
  Trash2,
  Eye,
  Search,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Receipt,
  Download,
  Calendar,
  X,
  CreditCard,
  Building,
  AtSign,
  Hash,
  Clock,
  User,
  Sparkles,
} from 'lucide-react';
import { exportMultiplePaymentsToExcel, exportPaymentToExcel } from '../utils/excelExport';
import { generateCombinedPaymentsPdf, generatePaymentPdf } from '../utils/pdfExport';

interface HistoryLedgerViewProps {
  history: PaymentRecord[];
  onSelectRecord: (record: PaymentRecord) => void;
  onDeleteRecord: (id: string) => void;
  onClearHistory: () => void;
  onSwitchToScanner: () => void;
  onUpdateRecordPayment: (id: string, updated: PaymentDetails) => void;
}

export const HistoryLedgerView: React.FC<HistoryLedgerViewProps> = ({
  history,
  onSelectRecord,
  onDeleteRecord,
  onClearHistory,
  onSwitchToScanner,
  onUpdateRecordPayment,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [inspectRecord, setInspectRecord] = useState<PaymentRecord | null>(null);
  const [editingDetails, setEditingDetails] = useState<PaymentDetails | null>(null);

  // Compute metrics
  let totalAmount = 0;
  let currency = '₹';
  let successCount = 0;

  history.forEach((item) => {
    const rawAmt = item.payment.amount || '';
    if (rawAmt.includes('$')) currency = '$';
    else if (rawAmt.includes('€')) currency = '€';
    else if (rawAmt.includes('£')) currency = '£';

    const num = parseFloat(rawAmt.replace(/[^0-9.]/g, ''));
    if (!isNaN(num)) {
      totalAmount += num;
    }

    if (/success|completed|paid/i.test(item.payment.status || '')) {
      successCount++;
    }
  });

  const filtered = history.filter((item) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    const p = item.payment;
    return (
      (p.name && p.name.toLowerCase().includes(term)) ||
      (p.receiver && p.receiver.toLowerCase().includes(term)) ||
      (p.sender && p.sender.toLowerCase().includes(term)) ||
      (p.amount && p.amount.toLowerCase().includes(term)) ||
      (p.transactionId && p.transactionId.toLowerCase().includes(term)) ||
      (p.upiId && p.upiId.toLowerCase().includes(term)) ||
      (p.bankWallet && p.bankWallet.toLowerCase().includes(term)) ||
      (item.fileName && item.fileName.toLowerCase().includes(term))
    );
  });

  const handleOpenInspect = (record: PaymentRecord) => {
    setInspectRecord(record);
    setEditingDetails({ ...record.payment });
  };

  const handleSaveInspectEdit = () => {
    if (inspectRecord && editingDetails) {
      onUpdateRecordPayment(inspectRecord.id, editingDetails);
      setInspectRecord({
        ...inspectRecord,
        payment: editingDetails,
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Metrics */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700">
                Safe History
              </span>
              <span className="text-xs text-slate-400">
                Stored securely on this device • Total {history.length} Receipts
              </span>
            </div>
            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Consolidated Payment Ledger
            </h2>
            <p className="text-sm text-slate-500">
              Ek saath saare payment receipts ka consolidated data dekhein aur combined Excel/PDF export karein.
            </p>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => exportMultiplePaymentsToExcel(history)}
              disabled={history.length === 0}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-sm flex items-center gap-2 transition-all cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>📊 Export All to Excel (.xlsx)</span>
            </button>

            <button
              type="button"
              onClick={() => generateCombinedPaymentsPdf(history)}
              disabled={history.length === 0}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-sm flex items-center gap-2 transition-all cursor-pointer"
            >
              <FileText className="w-4 h-4" />
              <span>📄 Export All to PDF</span>
            </button>

            {history.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  if (confirm('Are you sure you want to clear all payment history?')) {
                    onClearHistory();
                  }
                }}
                className="px-3 py-2.5 text-rose-600 hover:bg-rose-50 border border-rose-200 font-semibold text-xs rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear All</span>
              </button>
            )}
          </div>
        </div>

        {/* Metric KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6">
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70 flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
              <Receipt className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Total Receipts
              </span>
              <p className="text-2xl font-extrabold text-slate-900 mt-0.5">
                {history.length}
              </p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200/70 flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-emerald-700">
                Combined Total Amount
              </span>
              <p className="text-2xl font-extrabold text-emerald-700 mt-0.5">
                {currency}
                {totalAmount.toLocaleString('en-IN', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-200/70 flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-indigo-700">
                Verified Transactions
              </span>
              <p className="text-2xl font-extrabold text-indigo-800 mt-0.5">
                {successCount}{' '}
                <span className="text-xs font-normal text-slate-500">/ {history.length}</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        {/* Table Filter Bar */}
        <div className="p-4 sm:p-5 border-b border-slate-200/80 flex flex-wrap items-center justify-between gap-3 bg-slate-50/50">
          <div className="relative flex-1 min-w-[240px] max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name, amount, UPI ID, or transaction ID..."
              className="w-full text-xs font-medium pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onSwitchToScanner}
              className="px-3.5 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold rounded-xl border border-blue-200 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>+ Add More Screenshots</span>
            </button>
          </div>
        </div>

        {/* Empty state */}
        {filtered.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-4">
              <Receipt className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-slate-800">
              {history.length === 0 ? 'No Payment Receipts in History Yet' : 'No Matching Payments Found'}
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              {history.length === 0
                ? 'Upload or drop screenshots to auto-scan and build your saved transaction ledger.'
                : 'Try clearing your search term to see all receipts.'}
            </p>
            {history.length === 0 && (
              <button
                type="button"
                onClick={onSwitchToScanner}
                className="mt-4 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md inline-flex items-center gap-2"
              >
                <span>Upload First Screenshot</span>
              </button>
            )}
          </div>
        ) : (
          /* Consolidated Ledger Table */
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-100/80 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200 text-[11px]">
                <tr>
                  <th className="py-3 px-4">Receipt</th>
                  <th className="py-3 px-4">Party / Name</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Date & Time</th>
                  <th className="py-3 px-4">Transaction ID</th>
                  <th className="py-3 px-4">UPI / Method</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((item, index) => {
                  const p = item.payment;
                  const isSuccess = /success|completed|paid/i.test(p.status || '');
                  const isFailed = /fail|declined|error/i.test(p.status || '');

                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-blue-50/40 transition-colors group cursor-pointer"
                      onClick={() => handleOpenInspect(item)}
                    >
                      {/* Thumbnail */}
                      <td className="py-3 px-4">
                        <div className="w-10 h-10 rounded-lg border border-slate-200 bg-slate-50 overflow-hidden flex items-center justify-center shrink-0">
                          {item.thumbnail || item.imageSrc ? (
                            <img
                              src={item.thumbnail || item.imageSrc}
                              alt="thumb"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Receipt className="w-5 h-5 text-slate-400" />
                          )}
                        </div>
                      </td>

                      {/* Name */}
                      <td className="py-3 px-4">
                        <p className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                          {p.name || p.receiver || 'N/A'}
                        </p>
                        {p.sender && (
                          <p className="text-[11px] text-slate-400">From: {p.sender}</p>
                        )}
                      </td>

                      {/* Amount */}
                      <td className="py-3 px-4">
                        <span className="font-extrabold text-sm text-emerald-600">
                          {p.amount || '-'}
                        </span>
                      </td>

                      {/* Date & Time */}
                      <td className="py-3 px-4 text-slate-600">
                        <p className="font-semibold text-slate-800">{p.date || '-'}</p>
                        <p className="text-[11px] text-slate-400">{p.time || ''}</p>
                      </td>

                      {/* Transaction ID */}
                      <td className="py-3 px-4 font-mono text-slate-700">
                        <span className="truncate max-w-[150px] block" title={p.transactionId}>
                          {p.transactionId || '-'}
                        </span>
                      </td>

                      {/* UPI & Method */}
                      <td className="py-3 px-4">
                        <p className="font-medium text-slate-800 truncate max-w-[140px]" title={p.upiId}>
                          {p.upiId || p.paymentMethod || 'UPI'}
                        </p>
                        {p.bankWallet && (
                          <p className="text-[10px] text-slate-400 truncate max-w-[140px]">
                            {p.bankWallet}
                          </p>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold inline-flex items-center gap-1 ${
                            isSuccess
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : isFailed
                              ? 'bg-rose-100 text-rose-800 border border-rose-200'
                              : 'bg-amber-100 text-amber-800 border border-amber-200'
                          }`}
                        >
                          {isSuccess && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
                          {p.status || 'Verified'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td
                        className="py-3 px-4 text-right"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => exportPaymentToExcel(p)}
                            title="Export this receipt to Excel"
                            className="p-1.5 text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
                          >
                            <FileSpreadsheet className="w-4 h-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => generatePaymentPdf(p)}
                            title="Export this receipt to PDF"
                            className="p-1.5 text-slate-400 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            <FileText className="w-4 h-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => onDeleteRecord(item.id)}
                            title="Delete receipt from history"
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Inspect / Quick Edit Modal */}
      {inspectRecord && editingDetails && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-6 shadow-2xl border border-slate-200 space-y-5 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                  <Receipt className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-lg text-slate-900">
                    Receipt Details • {inspectRecord.fileName}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Saved on {new Date(inspectRecord.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setInspectRecord(null)}
                className="p-2 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content: side-by-side or stacked preview + form */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
              {/* Screenshot Preview */}
              <div className="md:col-span-5 bg-slate-100 p-3 rounded-2xl border border-slate-200 text-center">
                <p className="text-xs font-bold text-slate-600 mb-2">Original Screenshot</p>
                {inspectRecord.imageSrc || inspectRecord.thumbnail ? (
                  <img
                    src={inspectRecord.imageSrc || inspectRecord.thumbnail}
                    alt="Receipt Screenshot"
                    className="max-h-[340px] w-auto mx-auto rounded-xl shadow-xs border border-slate-200 bg-white object-contain"
                  />
                ) : (
                  <div className="py-16 text-slate-400 text-xs">No preview stored</div>
                )}
              </div>

              {/* Editable Fields */}
              <div className="md:col-span-7 space-y-3">
                <p className="text-xs font-bold text-slate-600">Extracted Values (Editable)</p>

                <div className="grid grid-cols-2 gap-2.5 text-xs">
                  <div>
                    <label className="font-bold text-slate-500 uppercase text-[10px] block mb-1">
                      Name / Party
                    </label>
                    <input
                      type="text"
                      value={editingDetails.name}
                      onChange={(e) =>
                        setEditingDetails({ ...editingDetails, name: e.target.value })
                      }
                      className="w-full font-semibold border border-slate-300 rounded-lg p-2"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-500 uppercase text-[10px] block mb-1">
                      Amount
                    </label>
                    <input
                      type="text"
                      value={editingDetails.amount}
                      onChange={(e) =>
                        setEditingDetails({ ...editingDetails, amount: e.target.value })
                      }
                      className="w-full font-bold text-emerald-600 border border-slate-300 rounded-lg p-2"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-500 uppercase text-[10px] block mb-1">
                      Date
                    </label>
                    <input
                      type="text"
                      value={editingDetails.date}
                      onChange={(e) =>
                        setEditingDetails({ ...editingDetails, date: e.target.value })
                      }
                      className="w-full border border-slate-300 rounded-lg p-2"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-500 uppercase text-[10px] block mb-1">
                      Time
                    </label>
                    <input
                      type="text"
                      value={editingDetails.time}
                      onChange={(e) =>
                        setEditingDetails({ ...editingDetails, time: e.target.value })
                      }
                      className="w-full border border-slate-300 rounded-lg p-2"
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="font-bold text-slate-500 uppercase text-[10px] block mb-1">
                      Transaction ID / UTR
                    </label>
                    <input
                      type="text"
                      value={editingDetails.transactionId}
                      onChange={(e) =>
                        setEditingDetails({ ...editingDetails, transactionId: e.target.value })
                      }
                      className="w-full font-mono border border-slate-300 rounded-lg p-2"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-500 uppercase text-[10px] block mb-1">
                      UPI ID
                    </label>
                    <input
                      type="text"
                      value={editingDetails.upiId}
                      onChange={(e) =>
                        setEditingDetails({ ...editingDetails, upiId: e.target.value })
                      }
                      className="w-full border border-slate-300 rounded-lg p-2"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-500 uppercase text-[10px] block mb-1">
                      Method
                    </label>
                    <input
                      type="text"
                      value={editingDetails.paymentMethod}
                      onChange={(e) =>
                        setEditingDetails({ ...editingDetails, paymentMethod: e.target.value })
                      }
                      className="w-full border border-slate-300 rounded-lg p-2"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-500 uppercase text-[10px] block mb-1">
                      Bank / Wallet
                    </label>
                    <input
                      type="text"
                      value={editingDetails.bankWallet}
                      onChange={(e) =>
                        setEditingDetails({ ...editingDetails, bankWallet: e.target.value })
                      }
                      className="w-full border border-slate-300 rounded-lg p-2"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-500 uppercase text-[10px] block mb-1">
                      Status
                    </label>
                    <input
                      type="text"
                      value={editingDetails.status}
                      onChange={(e) =>
                        setEditingDetails({ ...editingDetails, status: e.target.value })
                      }
                      className="w-full font-semibold border border-slate-300 rounded-lg p-2"
                    />
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={handleSaveInspectEdit}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer"
                  >
                    Save Changes to History
                  </button>
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-100">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => exportPaymentToExcel(editingDetails)}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>Export this to Excel</span>
                </button>

                <button
                  type="button"
                  onClick={() => generatePaymentPdf(editingDetails)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Generate this PDF</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => setInspectRecord(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
