import * as XLSX from 'xlsx';
import { PaymentDetails, PaymentRecord } from '../types/payment';

export function exportPaymentToExcel(payment: PaymentDetails, filename?: string) {
  // Ordered columns as requested
  const rowData = [
    {
      'Name': payment.name || '',
      'Sender': payment.sender || '',
      'Receiver': payment.receiver || '',
      'Amount': payment.amount || '',
      'Date': payment.date || '',
      'Time': payment.time || '',
      'Transaction ID': payment.transactionId || '',
      'UPI ID': payment.upiId || '',
      'Payment Method': payment.paymentMethod || '',
      'Bank/Wallet': payment.bankWallet || '',
      'Status': payment.status || '',
    },
  ];

  // Create worksheet
  const worksheet = XLSX.utils.json_to_sheet(rowData);

  // Set explicit column widths for readability
  worksheet['!cols'] = [
    { wch: 22 }, // Name
    { wch: 22 }, // Sender
    { wch: 22 }, // Receiver
    { wch: 14 }, // Amount
    { wch: 14 }, // Date
    { wch: 12 }, // Time
    { wch: 26 }, // Transaction ID
    { wch: 24 }, // UPI ID
    { wch: 18 }, // Payment Method
    { wch: 22 }, // Bank/Wallet
    { wch: 14 }, // Status
  ];

  // Create workbook
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Payment Details');

  // Determine file name
  const cleanTxn = (payment.transactionId || 'Payment')
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .slice(0, 16);
  const dateStr = new Date().toISOString().slice(0, 10);
  const outputFilename = filename || `Payment_${cleanTxn}_${dateStr}.xlsx`;

  // Write and trigger download
  XLSX.writeFile(workbook, outputFilename);
}

export function exportMultiplePaymentsToExcel(
  items: (PaymentDetails | PaymentRecord)[],
  filename?: string
) {
  if (items.length === 0) return;

  const payments: PaymentDetails[] = items.map((item) =>
    'payment' in item ? item.payment : item
  );

  let totalNumeric = 0;
  let currency = '₹';

  const rows = payments.map((p, idx) => {
    const rawAmt = p.amount || '';
    if (rawAmt.includes('$')) currency = '$';
    else if (rawAmt.includes('€')) currency = '€';
    else if (rawAmt.includes('£')) currency = '£';

    const num = parseFloat(rawAmt.replace(/[^0-9.]/g, ''));
    if (!isNaN(num)) {
      totalNumeric += num;
    }

    return {
      '#': idx + 1,
      'Name': p.name || '',
      'Sender': p.sender || '',
      'Receiver': p.receiver || '',
      'Amount': p.amount || '',
      'Date': p.date || '',
      'Time': p.time || '',
      'Transaction ID': p.transactionId || '',
      'UPI ID': p.upiId || '',
      'Payment Method': p.paymentMethod || '',
      'Bank/Wallet': p.bankWallet || '',
      'Status': p.status || '',
    };
  });

  // Summary Row at bottom
  rows.push({
    '#': '' as any,
    'Name': `TOTAL: ${payments.length} Payments`,
    'Sender': '',
    'Receiver': '',
    'Amount': `${currency}${totalNumeric.toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`,
    'Date': '',
    'Time': '',
    'Transaction ID': '',
    'UPI ID': '',
    'Payment Method': '',
    'Bank/Wallet': '',
    'Status': 'CONSOLIDATED',
  });

  const worksheet = XLSX.utils.json_to_sheet(rows);
  worksheet['!cols'] = [
    { wch: 6 },  // #
    { wch: 24 }, // Name
    { wch: 22 }, // Sender
    { wch: 22 }, // Receiver
    { wch: 16 }, // Amount
    { wch: 14 }, // Date
    { wch: 12 }, // Time
    { wch: 28 }, // Transaction ID
    { wch: 24 }, // UPI ID
    { wch: 18 }, // Payment Method
    { wch: 22 }, // Bank/Wallet
    { wch: 16 }, // Status
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Consolidated Payments');
  const dateStr = new Date().toISOString().slice(0, 10);
  const outputFilename = filename || `All_Payments_Ledger_${payments.length}_Receipts_${dateStr}.xlsx`;
  XLSX.writeFile(workbook, outputFilename);
}
