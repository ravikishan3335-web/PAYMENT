export interface PaymentDetails {
  name: string;
  sender: string;
  receiver: string;
  amount: string;
  date: string;
  time: string;
  transactionId: string;
  upiId: string;
  paymentMethod: string;
  bankWallet: string;
  status: string;
}

export const EMPTY_PAYMENT_DETAILS: PaymentDetails = {
  name: '',
  sender: '',
  receiver: '',
  amount: '',
  date: '',
  time: '',
  transactionId: '',
  upiId: '',
  paymentMethod: '',
  bankWallet: '',
  status: '',
};

export interface PaymentRecord {
  id: string;
  createdAt: number;
  imageSrc?: string;
  thumbnail?: string;
  fileName: string;
  fileSize?: string;
  payment: PaymentDetails;
}

export interface ExtractionResponse {
  success: boolean;
  data?: PaymentDetails;
  error?: string;
}
