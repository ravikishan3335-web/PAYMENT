import { jsPDF } from 'jspdf';
import { PaymentDetails, PaymentRecord } from '../types/payment';

export function generatePaymentPdf(payment: PaymentDetails, filename?: string) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;

  // Background header band (Fintech Deep Blue)
  doc.setFillColor(15, 23, 42); // #0f172a
  doc.rect(0, 0, pageWidth, 42, 'F');

  // Brand title
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('PAYMENT SCREENSHOT TO EXCEL', margin, 18);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(148, 163, 184); // slate-400
  doc.text('Automated Payment Receipt & OCR Summary', margin, 26);
  doc.text(`Generated: ${new Date().toLocaleString()}`, margin, 33);

  // Main Card Box
  let currentY = 52;

  // Section Title
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('PAYMENT DETAILS', margin, currentY);

  // Amount badge / highlight banner
  currentY += 8;
  doc.setFillColor(241, 245, 249); // slate-100
  doc.setDrawColor(203, 213, 225); // slate-300
  doc.roundedRect(margin, currentY, contentWidth, 26, 3, 3, 'FD');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text('TRANSACTION AMOUNT', margin + 6, currentY + 9);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(16, 185, 129); // emerald-500
  doc.text(payment.amount || 'N/A', margin + 6, currentY + 19);

  // Status tag on the right of amount box
  const statusText = (payment.status || 'Verified').toUpperCase();
  const isSuccess = /success|completed|paid/i.test(payment.status || 'success');
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  if (isSuccess) {
    doc.setFillColor(220, 252, 231); // green-100
    doc.setTextColor(22, 101, 52); // green-800
    doc.setDrawColor(187, 247, 208);
  } else {
    doc.setFillColor(254, 243, 199); // amber-100
    doc.setTextColor(146, 64, 14); // amber-800
    doc.setDrawColor(253, 230, 138);
  }
  const tagWidth = 34;
  doc.roundedRect(pageWidth - margin - tagWidth - 6, currentY + 7, tagWidth, 12, 2, 2, 'FD');
  doc.text(statusText, pageWidth - margin - tagWidth - 6 + tagWidth / 2, currentY + 14.5, {
    align: 'center',
  });

  currentY += 34;

  // Key-value items grid
  const items = [
    { label: 'Name', value: payment.name || '-' },
    { label: 'Sender', value: payment.sender || '-' },
    { label: 'Receiver', value: payment.receiver || '-' },
    { label: 'Amount', value: payment.amount || '-' },
    { label: 'Date', value: payment.date || '-' },
    { label: 'Time', value: payment.time || '-' },
    { label: 'Transaction ID', value: payment.transactionId || '-' },
    { label: 'UPI ID', value: payment.upiId || '-' },
    { label: 'Payment Method', value: payment.paymentMethod || '-' },
    { label: 'Bank/Wallet', value: payment.bankWallet || '-' },
    { label: 'Status', value: payment.status || '-' },
  ];

  // Table wrapper
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.setFillColor(255, 255, 255);
  doc.rect(margin, currentY, contentWidth, items.length * 11 + 6, 'FD');

  // Draw rows
  items.forEach((item, index) => {
    const rowY = currentY + 7 + index * 11;

    // Alternate row stripe
    if (index % 2 === 1) {
      doc.setFillColor(248, 250, 252);
      doc.rect(margin + 0.5, rowY - 5, contentWidth - 1, 11, 'F');
    }

    // Label
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(71, 85, 105); // slate-600
    doc.text(item.label, margin + 6, rowY + 2);

    // Value
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42); // slate-900

    // Check if value is too long
    const maxValueWidth = contentWidth - 65;
    const truncatedValue = doc.splitTextToSize(item.value, maxValueWidth);
    doc.text(truncatedValue[0] || '-', margin + 60, rowY + 2);

    // Row divider
    if (index < items.length - 1) {
      doc.setDrawColor(241, 245, 249);
      doc.line(margin, rowY + 5.5, pageWidth - margin, rowY + 5.5);
    }
  });

  const tableBottom = currentY + items.length * 11 + 18;

  // Required statement
  doc.setDrawColor(203, 213, 225);
  doc.setLineDashPattern([1.5, 1.5], 0);
  doc.line(margin, tableBottom, pageWidth - margin, tableBottom);
  doc.setLineDashPattern([], 0);

  doc.setFont('helvetica', 'italic');
  doc.setFontSize(9.5);
  doc.setTextColor(100, 116, 139); // slate-500
  doc.text('Generated from uploaded payment screenshot.', margin, tableBottom + 8);

  // Security note
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text(
    'This receipt document was extracted and compiled using Payment Screenshot to Excel OCR technology.',
    margin,
    tableBottom + 15
  );

  // Save PDF
  const cleanTxn = (payment.transactionId || 'Payment')
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .slice(0, 16);
  const dateStr = new Date().toISOString().slice(0, 10);
  const outputFilename = filename || `Payment_Receipt_${cleanTxn}_${dateStr}.pdf`;

  doc.save(outputFilename);
}

// Generate COMBINED Multi-Receipt PDF Statement
export function generateCombinedPaymentsPdf(records: PaymentRecord[], filename?: string) {
  if (records.length === 0) return;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;

  // Calculate total amounts
  let totalNum = 0;
  let currencySymbol = '₹';
  let successCount = 0;

  records.forEach((r) => {
    const rawAmt = r.payment.amount || '';
    if (rawAmt.includes('$')) currencySymbol = '$';
    else if (rawAmt.includes('€')) currencySymbol = '€';
    else if (rawAmt.includes('£')) currencySymbol = '£';

    const num = parseFloat(rawAmt.replace(/[^0-9.]/g, ''));
    if (!isNaN(num)) {
      totalNum += num;
    }

    if (/success|completed|paid/i.test(r.payment.status || '')) {
      successCount++;
    }
  });

  const formattedTotal = `${currencySymbol}${totalNum.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

  let currentPage = 1;

  const renderHeader = (page: number) => {
    // Header Dark Banner
    doc.setFillColor(15, 23, 42); // #0f172a
    doc.rect(0, 0, pageWidth, 38, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(15);
    doc.text('PAYMENT SCREENSHOT TO EXCEL', margin, 14);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(148, 163, 184);
    doc.text('CONSOLIDATED PAYMENT STATEMENT & TRANSACTION LEDGER', margin, 21);
    doc.text(`Generated: ${new Date().toLocaleString()}  •  Page ${page}`, margin, 28);
  };

  const renderFooter = () => {
    doc.setDrawColor(226, 232, 240);
    doc.line(margin, pageHeight - 16, pageWidth - margin, pageHeight - 16);

    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8.5);
    doc.setTextColor(100, 116, 139);
    doc.text('Generated from uploaded payment screenshots.', margin, pageHeight - 10);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text(`Total Receipts: ${records.length}`, pageWidth - margin - 25, pageHeight - 10, {
      align: 'right',
    });
  };

  renderHeader(currentPage);

  // KPI Summary Bar on Page 1
  let currentY = 46;
  doc.setFillColor(248, 250, 252); // slate-50
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(margin, currentY, contentWidth, 22, 3, 3, 'FD');

  // KPI 1: Count
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('TOTAL TRANSACTIONS', margin + 6, currentY + 7);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(15, 23, 42);
  doc.text(`${records.length} Scanned`, margin + 6, currentY + 16);

  // KPI 2: Total Sum
  const col2X = margin + 62;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('TOTAL AMOUNT', col2X, currentY + 7);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(16, 185, 129); // emerald
  doc.text(formattedTotal, col2X, currentY + 16);

  // KPI 3: Status
  const col3X = margin + 128;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('SUCCESSFUL / VERIFIED', col3X, currentY + 7);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(37, 99, 235); // blue
  doc.text(`${successCount} of ${records.length}`, col3X, currentY + 16);

  currentY += 30;

  // Table Column Definitions
  // Total width: 182mm (with margin 14 each side on 210mm page)
  const cols = [
    { title: '#', width: 8, x: margin },
    { title: 'Party / Name', width: 38, x: margin + 8 },
    { title: 'Amount', width: 25, x: margin + 46 },
    { title: 'Date & Time', width: 28, x: margin + 71 },
    { title: 'Txn / UTR ID', width: 38, x: margin + 99 },
    { title: 'Method', width: 22, x: margin + 137 },
    { title: 'Status', width: 23, x: margin + 159 },
  ];

  const renderTableHeader = (y: number) => {
    doc.setFillColor(30, 41, 59); // slate-800
    doc.rect(margin, y, contentWidth, 8, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);

    cols.forEach((c) => {
      doc.text(c.title, c.x + 1.5, y + 5.5);
    });
  };

  renderTableHeader(currentY);
  currentY += 8;

  const rowHeight = 10;
  const maxY = pageHeight - 24;

  records.forEach((record, index) => {
    // Check if row exceeds page height
    if (currentY + rowHeight > maxY) {
      renderFooter();
      doc.addPage();
      currentPage++;
      renderHeader(currentPage);
      currentY = 46;
      renderTableHeader(currentY);
      currentY += 8;
    }

    const p = record.payment;

    // Alternate background
    if (index % 2 === 1) {
      doc.setFillColor(248, 250, 252);
      doc.rect(margin, currentY, contentWidth, rowHeight, 'F');
    }

    // Border line bottom
    doc.setDrawColor(241, 245, 249);
    doc.line(margin, currentY + rowHeight, pageWidth - margin, currentY + rowHeight);

    doc.setFontSize(8);

    // Index
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(148, 163, 184);
    doc.text(`${index + 1}`, cols[0].x + 1.5, currentY + 6.5);

    // Name
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    const safeName = (p.name || p.receiver || p.sender || '-').slice(0, 20);
    doc.text(safeName, cols[1].x + 1.5, currentY + 6.5);

    // Amount
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(16, 185, 129);
    doc.text((p.amount || '-').slice(0, 14), cols[2].x + 1.5, currentY + 6.5);

    // Date & Time
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    const dateStr = [p.date, p.time].filter(Boolean).join(' ') || '-';
    doc.text(dateStr.slice(0, 16), cols[3].x + 1.5, currentY + 6.5);

    // Transaction ID
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(51, 65, 85);
    const safeTxn = (p.transactionId || p.upiId || '-').slice(0, 20);
    doc.text(safeTxn, cols[4].x + 1.5, currentY + 6.5);

    // Method
    doc.setTextColor(71, 85, 105);
    doc.text((p.paymentMethod || 'UPI').slice(0, 11), cols[5].x + 1.5, currentY + 6.5);

    // Status
    const isSuccess = /success|completed|paid/i.test(p.status || '');
    if (isSuccess) {
      doc.setTextColor(22, 101, 52);
      doc.setFont('helvetica', 'bold');
      doc.text('✓ ' + (p.status || 'Success').slice(0, 8), cols[6].x + 1.5, currentY + 6.5);
    } else {
      doc.setTextColor(180, 83, 9);
      doc.text((p.status || 'Pending').slice(0, 8), cols[6].x + 1.5, currentY + 6.5);
    }

    currentY += rowHeight;
  });

  renderFooter();

  const dateStr = new Date().toISOString().slice(0, 10);
  const outName = filename || `Combined_Payment_Statement_${records.length}_Receipts_${dateStr}.pdf`;
  doc.save(outName);
}
