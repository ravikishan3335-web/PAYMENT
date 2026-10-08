import React, { useState } from 'react';
import { PaymentDetails } from '../types/payment';
import {
  User,
  Send,
  Download,
  Calendar,
  Clock,
  Hash,
  AtSign,
  CreditCard,
  Building,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Edit3,
} from 'lucide-react';

interface PaymentDetailsTableProps {
  payment: PaymentDetails;
  onChange: (field: keyof PaymentDetails, value: string) => void;
  isEditing: boolean;
  onToggleEdit: () => void;
}

export const PaymentDetailsTable: React.FC<PaymentDetailsTableProps> = ({
  payment,
  onChange,
  isEditing,
  onToggleEdit,
}) => {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const copyToClipboard = (key: string, value: string) => {
    if (!value) return;
    navigator.clipboard.writeText(value);
    setCopiedField(key);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const fields: {
    key: keyof PaymentDetails;
    label: string;
    icon: React.ReactNode;
    placeholder: string;
    important?: boolean;
  }[] = [
    {
      key: 'name',
      label: 'Name',
      icon: <User className="w-4 h-4 text-blue-600" />,
      placeholder: 'Counterparty / Merchant name',
      important: true,
    },
    {
      key: 'amount',
      label: 'Amount',
      icon: <Download className="w-4 h-4 text-emerald-600" />,
      placeholder: 'e.g. ₹500, $25.00',
      important: true,
    },
    {
      key: 'date',
      label: 'Date',
      icon: <Calendar className="w-4 h-4 text-blue-600" />,
      placeholder: 'e.g. 08-10-2026',
    },
    {
      key: 'time',
      label: 'Time',
      icon: <Clock className="w-4 h-4 text-blue-600" />,
      placeholder: 'e.g. 10:30 AM',
    },
    {
      key: 'transactionId',
      label: 'Transaction ID',
      icon: <Hash className="w-4 h-4 text-indigo-600" />,
      placeholder: 'e.g. TXN12345 or UTR',
      important: true,
    },
    {
      key: 'paymentMethod',
      label: 'Payment Method',
      icon: <CreditCard className="w-4 h-4 text-blue-600" />,
      placeholder: 'e.g. UPI, Net Banking, Card',
    },
    {
      key: 'status',
      label: 'Status',
      icon: <CheckCircle2 className="w-4 h-4 text-emerald-600" />,
      placeholder: 'e.g. Success, Completed',
      important: true,
    },
    {
      key: 'sender',
      label: 'Sender',
      icon: <Send className="w-4 h-4 text-slate-500" />,
      placeholder: 'Sender name or account',
    },
    {
      key: 'receiver',
      label: 'Receiver',
      icon: <User className="w-4 h-4 text-slate-500" />,
      placeholder: 'Recipient name or store',
    },
    {
      key: 'upiId',
      label: 'UPI ID',
      icon: <AtSign className="w-4 h-4 text-purple-600" />,
      placeholder: 'e.g. rahul@okhdfcbank',
    },
    {
      key: 'bankWallet',
      label: 'Bank/Wallet',
      icon: <Building className="w-4 h-4 text-cyan-600" />,
      placeholder: 'e.g. HDFC Bank, Paytm, SBI',
    },
  ];

  const isSuccessStatus = /success|completed|paid|received|done/i.test(payment.status || '');
  const isFailedStatus = /fail|declined|error|rejected/i.test(payment.status || '');

  const filledCount = fields.filter((f) => !!payment[f.key]).length;

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
      {/* Header bar */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 px-6 py-4 flex flex-wrap items-center justify-between gap-3 text-white">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-400/30">
            <CheckCircle2 className="w-5 h-5 text-emerald-300" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-lg tracking-tight">Payment Details</h3>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                Auto-Filled ({filledCount}/{fields.length})
              </span>
            </div>
            <p className="text-xs text-slate-300">
              Scanned from screenshot • Click any field to edit before exporting
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onToggleEdit}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all ${
              isEditing
                ? 'bg-blue-500 text-white shadow-sm'
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            <Edit3 className="w-3.5 h-3.5" />
            {isEditing ? 'Editing Mode' : 'Edit Details'}
          </button>
        </div>
      </div>

      {/* Hero Highlight: Amount & Status Display */}
      <div className="px-6 py-4 bg-slate-50/70 border-b border-slate-200/70 flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 block">
            Transaction Amount
          </span>
          <div className="text-3xl font-extrabold text-slate-900 flex items-center gap-2 mt-0.5">
            {payment.amount ? (
              <span className="text-emerald-600">{payment.amount}</span>
            ) : (
              <span className="text-slate-400 text-xl font-normal italic">Amount not detected</span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 mr-1">
            Status:
          </span>
          <span
            className={`px-3 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1.5 ${
              isSuccessStatus
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                : isFailedStatus
                ? 'bg-rose-100 text-rose-800 border border-rose-200'
                : payment.status
                ? 'bg-amber-100 text-amber-800 border border-amber-200'
                : 'bg-slate-100 text-slate-600 border border-slate-200'
            }`}
          >
            {isSuccessStatus ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            ) : isFailedStatus ? (
              <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
            ) : null}
            {payment.status || 'Unspecified'}
          </span>
        </div>
      </div>

      {/* Main Extracted Fields Grid */}
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {fields.map(({ key, label, icon, placeholder, important }) => {
            const val = payment[key];
            const isCopied = copiedField === key;

            return (
              <div
                key={key}
                className={`p-3.5 rounded-xl border transition-all ${
                  important
                    ? 'border-blue-100 bg-blue-50/20 hover:border-blue-300'
                    : 'border-slate-200/70 bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                    {icon}
                    {label}
                  </label>

                  {val && (
                    <button
                      type="button"
                      onClick={() => copyToClipboard(key, val)}
                      title={`Copy ${label}`}
                      className="text-slate-400 hover:text-blue-600 text-xs flex items-center gap-1 transition-colors p-1 rounded"
                    >
                      {isCopied ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-600" />
                          <span className="text-[10px] text-emerald-600 font-semibold">Copied</span>
                        </>
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </button>
                  )}
                </div>

                {isEditing ? (
                  <input
                    type="text"
                    value={val}
                    onChange={(e) => onChange(key, e.target.value)}
                    placeholder={placeholder}
                    className="w-full text-sm font-medium text-slate-900 bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                ) : (
                  <div
                    onClick={onToggleEdit}
                    className="cursor-pointer group flex items-center justify-between"
                  >
                    <span
                      className={`text-sm font-medium break-all ${
                        val ? 'text-slate-900 font-semibold' : 'text-slate-400 italic text-xs'
                      }`}
                    >
                      {val || 'Not detected (tap to add)'}
                    </span>
                    <span className="opacity-0 group-hover:opacity-100 text-[11px] text-blue-600 font-medium ml-2 shrink-0">
                      Edit
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <p>💡 Tip: Verify all OCR values. If a field was omitted in the screenshot, you can type it above.</p>
        </div>
      </div>
    </div>
  );
};
