import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// Increase payload size limit to accept high-res payment screenshot base64
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

const apiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;
if (apiKey) {
  ai = new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    hasApiKey: !!process.env.GEMINI_API_KEY,
  });
});

// Extract payment details endpoint
app.post('/api/extract-payment', async (req, res) => {
  try {
    const { imageBase64, mimeType = 'image/jpeg' } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ error: 'Missing imageBase64 in request body.' });
    }

    if (!ai) {
      return res.status(500).json({
        error: 'Gemini API key is not configured. Please verify your environment configuration.',
      });
    }

    // Clean base64 string if it contains data prefix
    const base64Data = imageBase64.replace(/^data:image\/[a-z0-9+.-]+;base64,/, '');

    const prompt = `You are an automated financial document and payment screenshot OCR engine.
Extract the exact payment details visible in this receipt image.
DO NOT hallucinate or guess any details not present. If a field is not displayed, return an empty string "".

Fields:
1. name: Counterparty / merchant / recipient name
2. sender: Sender name, bank account or VPA if shown
3. receiver: Receiver name or merchant name
4. amount: Transaction amount with currency (e.g. ₹500, $25.00)
5. date: Transaction date (e.g. 08-10-2026, 08 Oct 2026)
6. time: Transaction time (e.g. 10:30 AM)
7. transactionId: Transaction ID, UTR, Reference ID, or Order ID
8. upiId: UPI ID / VPA handle (e.g. name@okhdfcbank, merchant@ybl)
9. paymentMethod: Payment method (UPI, Card, Wallet, Bank Transfer)
10. bankWallet: Bank or wallet name (e.g. HDFC Bank, SBI, Paytm)
11. status: Status (Success, Completed, Failed, Pending)`;

    const candidateModels = [
      'gemini-3.1-flash-lite',
      'gemini-flash-latest',
      'gemini-3.8-flash',
    ];

    let lastError: any = null;
    let parsedData: any = null;

    for (const modelName of candidateModels) {
      try {
        const response = await ai.models.generateContent({
          model: modelName,
          contents: {
            parts: [
              {
                inlineData: {
                  mimeType: mimeType || 'image/jpeg',
                  data: base64Data,
                },
              },
              {
                text: prompt,
              },
            ],
          },
          config: {
            systemInstruction:
              'You are a strict, ultra-accurate financial receipt OCR assistant. Return extracted data strictly conforming to JSON. Never invent nonexistent details.',
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                sender: { type: Type.STRING },
                receiver: { type: Type.STRING },
                amount: { type: Type.STRING },
                date: { type: Type.STRING },
                time: { type: Type.STRING },
                transactionId: { type: Type.STRING },
                upiId: { type: Type.STRING },
                paymentMethod: { type: Type.STRING },
                bankWallet: { type: Type.STRING },
                status: { type: Type.STRING },
              },
              required: [
                'name',
                'sender',
                'receiver',
                'amount',
                'date',
                'time',
                'transactionId',
                'upiId',
                'paymentMethod',
                'bankWallet',
                'status',
              ],
            },
          },
        });

        const text = response.text || '{}';
        parsedData = JSON.parse(text);
        if (parsedData) {
          break; // successfully extracted!
        }
      } catch (err: any) {
        console.warn(`Model ${modelName} failed:`, err.message);
        lastError = err;
        // continue to next model in candidateModels
      }
    }

    if (!parsedData) {
      throw lastError || new Error('All OCR extraction models are currently busy. Please try again.');
    }

    // Sanitize any undefined to empty string
    const sanitized = {
      name: parsedData.name || '',
      sender: parsedData.sender || '',
      receiver: parsedData.receiver || '',
      amount: parsedData.amount || '',
      date: parsedData.date || '',
      time: parsedData.time || '',
      transactionId: parsedData.transactionId || '',
      upiId: parsedData.upiId || '',
      paymentMethod: parsedData.paymentMethod || '',
      bankWallet: parsedData.bankWallet || '',
      status: parsedData.status || '',
    };

    return res.json({ success: true, data: sanitized });
  } catch (error: any) {
    console.error('Error during payment screenshot extraction:', error);
    return res.status(500).json({
      error: error.message || 'Failed to extract payment details from screenshot.',
    });
  }
});

// Vite middleware in dev or static files in production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Payment Screenshot to Excel server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
