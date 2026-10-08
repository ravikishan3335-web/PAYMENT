export interface SampleReceipt {
  id: string;
  title: string;
  app: string;
  amount: string;
  recipient: string;
  generateDataUrl: () => string;
}

// Generate realistic pixel-crisp payment screenshot images on the fly using HTML Canvas
export function createGPaySample(): string {
  const canvas = document.createElement('canvas');
  canvas.width = 600;
  canvas.height = 920;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // Background - Modern smartphone Google Pay style
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, 600, 920);

  // Status Bar
  ctx.fillStyle = '#1e293b';
  ctx.font = 'bold 18px sans-serif';
  ctx.fillText('10:30 AM', 32, 42);
  ctx.textAlign = 'right';
  ctx.fillText('5G  98%', 568, 42);
  ctx.textAlign = 'left';

  // App Header
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(0, 60, 600, 64);
  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 22px sans-serif';
  ctx.fillText('Google Pay', 32, 100);

  // Success Checkmark Circle
  ctx.beginPath();
  ctx.arc(300, 210, 48, 0, Math.PI * 2);
  ctx.fillStyle = '#16a34a'; // green
  ctx.fill();

  // White checkmark icon
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 6;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(280, 210);
  ctx.lineTo(295, 226);
  ctx.lineTo(322, 195);
  ctx.stroke();

  // Paid to text
  ctx.textAlign = 'center';
  ctx.fillStyle = '#64748b';
  ctx.font = '500 18px sans-serif';
  ctx.fillText('Paid to', 300, 285);

  // Recipient Name
  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 28px sans-serif';
  ctx.fillText('Rahul Kumar', 300, 325);

  // UPI ID
  ctx.fillStyle = '#475569';
  ctx.font = '16px monospace';
  ctx.fillText('rahulkumar@okhdfcbank', 300, 355);

  // Big Amount
  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 54px sans-serif';
  ctx.fillText('₹500', 300, 435);

  // Completed badge
  ctx.fillStyle = '#dcfce7';
  ctx.beginPath();
  ctx.roundRect(220, 460, 160, 34, 17);
  ctx.fill();
  ctx.fillStyle = '#15803d';
  ctx.font = 'bold 15px sans-serif';
  ctx.fillText('✓ Completed', 300, 482);

  // Divider
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(40, 520);
  ctx.lineTo(560, 520);
  ctx.stroke();

  // Transaction Details Table
  ctx.textAlign = 'left';
  const rows = [
    { label: 'Date', value: '08-10-2026' },
    { label: 'Time', value: '10:30 AM' },
    { label: 'UPI Transaction ID', value: 'TXN123459876' },
    { label: 'To', value: 'Rahul Kumar' },
    { label: 'From', value: 'A/C **4589 (HDFC Bank)' },
    { label: 'Payment Method', value: 'UPI' },
    { label: 'Bank / Wallet', value: 'HDFC Bank' },
    { label: 'Google Transaction ID', value: 'CICAgOCk_831Lw' },
    { label: 'Status', value: 'Success' },
  ];

  let y = 560;
  rows.forEach((r) => {
    ctx.fillStyle = '#64748b';
    ctx.font = '15px sans-serif';
    ctx.fillText(r.label, 40, y);

    ctx.textAlign = 'right';
    ctx.fillStyle = '#0f172a';
    ctx.font = '600 15px sans-serif';
    ctx.fillText(r.value, 560, y);
    ctx.textAlign = 'left';

    y += 36;
  });

  return canvas.toDataURL('image/png');
}

export function createPhonePeSample(): string {
  const canvas = document.createElement('canvas');
  canvas.width = 600;
  canvas.height = 920;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // Background PhonePe Purple Header
  ctx.fillStyle = '#5f259f'; // PhonePe purple
  ctx.fillRect(0, 0, 600, 200);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 22px sans-serif';
  ctx.fillText('PhonePe', 40, 60);

  ctx.font = 'bold 26px sans-serif';
  ctx.fillText('Transaction Successful', 40, 110);
  ctx.font = '15px sans-serif';
  ctx.fillStyle = '#e9d5ff';
  ctx.fillText('08 Oct 2026 at 02:45 PM', 40, 140);

  // White Card body
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.roundRect(24, 170, 552, 720, 16);
  ctx.fill();
  ctx.shadowColor = 'rgba(0,0,0,0.06)';
  ctx.shadowBlur = 12;

  // Paid to
  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 22px sans-serif';
  ctx.fillText('Fresh Supermarket & Mart', 50, 230);

  ctx.fillStyle = '#64748b';
  ctx.font = '15px monospace';
  ctx.fillText('freshmart@ybl', 50, 258);

  ctx.fillStyle = '#5f259f';
  ctx.font = 'bold 44px sans-serif';
  ctx.fillText('₹1,250.00', 50, 325);

  ctx.strokeStyle = '#f1f5f9';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(50, 360);
  ctx.lineTo(550, 360);
  ctx.stroke();

  const details = [
    { label: 'Sender', value: 'Amit Sharma' },
    { label: 'Receiver', value: 'Fresh Supermarket & Mart' },
    { label: 'Transaction ID', value: 'T2610081445129938' },
    { label: 'UTR', value: '428391029482' },
    { label: 'Debited from', value: 'State Bank of India (SBI)' },
    { label: 'Payment Method', value: 'UPI' },
    { label: 'Date', value: '08-10-2026' },
    { label: 'Time', value: '02:45 PM' },
    { label: 'UPI ID', value: 'freshmart@ybl' },
    { label: 'Bank/Wallet', value: 'State Bank of India' },
    { label: 'Status', value: 'Success' },
  ];

  let y = 410;
  details.forEach((d) => {
    ctx.fillStyle = '#64748b';
    ctx.font = '15px sans-serif';
    ctx.fillText(d.label, 50, y);

    ctx.textAlign = 'right';
    ctx.fillStyle = '#0f172a';
    ctx.font = '600 15px sans-serif';
    ctx.fillText(d.value, 550, y);
    ctx.textAlign = 'left';

    y += 38;
  });

  return canvas.toDataURL('image/png');
}

export function createPaytmSample(): string {
  const canvas = document.createElement('canvas');
  canvas.width = 600;
  canvas.height = 920;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // Background
  ctx.fillStyle = '#002970'; // Paytm deep blue
  ctx.fillRect(0, 0, 600, 160);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 24px sans-serif';
  ctx.fillText('Paytm Payments', 40, 60);

  ctx.font = '16px sans-serif';
  ctx.fillStyle = '#00b9f1';
  ctx.fillText('● Verified Payment Receipt', 40, 95);

  // White Card
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 140, 600, 780);

  // Big Amount
  ctx.textAlign = 'center';
  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 48px sans-serif';
  ctx.fillText('₹320', 300, 230);

  ctx.fillStyle = '#16a34a';
  ctx.font = 'bold 16px sans-serif';
  ctx.fillText('✓ Money Sent Successfully', 300, 270);

  ctx.fillStyle = '#64748b';
  ctx.font = '16px sans-serif';
  ctx.fillText('To: Cafe Blue Bottle', 300, 310);
  ctx.fillText('UPI: cafeblue@paytm', 300, 335);

  // Table
  ctx.textAlign = 'left';
  const rows = [
    { label: 'Name', value: 'Cafe Blue Bottle' },
    { label: 'Receiver', value: 'Cafe Blue Bottle' },
    { label: 'Sender', value: 'Priya Verma' },
    { label: 'Amount', value: '₹320' },
    { label: 'Date', value: '08-10-2026' },
    { label: 'Time', value: '11:15 AM' },
    { label: 'Transaction ID', value: 'PAYTM_ORD_982341' },
    { label: 'UPI ID', value: 'cafeblue@paytm' },
    { label: 'Payment Method', value: 'UPI / Paytm Wallet' },
    { label: 'Bank/Wallet', value: 'Paytm Payments Bank' },
    { label: 'Status', value: 'Success' },
  ];

  let y = 390;
  rows.forEach((r) => {
    ctx.fillStyle = '#64748b';
    ctx.font = '15px sans-serif';
    ctx.fillText(r.label, 40, y);

    ctx.textAlign = 'right';
    ctx.fillStyle = '#0f172a';
    ctx.font = '600 15px sans-serif';
    ctx.fillText(r.value, 560, y);
    ctx.textAlign = 'left';

    y += 38;
  });

  return canvas.toDataURL('image/png');
}

export const SAMPLE_RECEIPTS = [
  {
    id: 'gpay',
    title: 'Google Pay (₹500)',
    app: 'Google Pay',
    amount: '₹500',
    recipient: 'Rahul Kumar',
    generator: createGPaySample,
  },
  {
    id: 'phonepe',
    title: 'PhonePe (₹1,250)',
    app: 'PhonePe',
    amount: '₹1,250',
    recipient: 'Fresh Supermarket',
    generator: createPhonePeSample,
  },
  {
    id: 'paytm',
    title: 'Paytm (₹320)',
    app: 'Paytm',
    amount: '₹320',
    recipient: 'Cafe Blue Bottle',
    generator: createPaytmSample,
  },
];
