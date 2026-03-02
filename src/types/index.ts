export type TxnStatus =
  | "PENDING"
  | "AWAITING"
  | "PAYMENT_SUBMITTED"
  | "COMPLETED"
  | "DECLINED";

export type BadgeStatus = TxnStatus | "LIVE" | "AWAITING_CONFIRMATION";

export interface Product {
  name: string;
  price: number;
  description?: string;
}

export interface SellerStats {
  pending: number;
  awaiting: number;
  completed: number;
  declined: number;
}

export interface BankDetails {
  bank_name: string;
  account_name: string;
  account_number: string;
  routing_number: string;
}

export interface Seller {
  cela_id: string;
  business_name: string;
  seller_name: string;
  category: string;
  products: Product[];
  created_at: string;
  stats: SellerStats;
}

export interface Transaction {
  txn_id: string;
  cela_id: string;
  seller_name: string;
  buyer_name: string;
  product_name: string;
  quantity: number;
  message: string;
  status: TxnStatus;
  amount: number | null;
  notes?: string;
  bank_details: BankDetails | null;
  created_at: string;
  updated_at: string;
}

export interface OnboardRequest {
  business_name: string;
  seller_name: string;
  category: string;
  products: Product[];
}

export interface OnboardResponse {
  cela_id: string;
  message: string;
}

export interface QuoteRequestBody {
  cela_id: string;
  buyer_name: string;
  product_name: string;
  quantity: number;
  message?: string;
}

export interface SendQuoteBody {
  txn_id: string;
  amount: number;
  notes?: string;
  bank_name: string;
  account_name: string;
  account_number: string;
  routing_number: string;
}

export interface ConfirmPaymentBody {
  txn_id: string;
  confirmed: boolean;
}

export interface QuoteLinkResponse { link: string }
export interface TransactionsResponse { transactions: Transaction[] }

export interface SellerFormState {
  business_name: string;
  seller_name: string;
  category: string;
}

export interface ProductInputRow {
  name: string;
  price: string;
}

export interface BuyerFormState {
  buyer_name: string;
  message: string;
  quantity: number;
}

export interface QuoteFormState {
  amount: string;
  notes: string;
  bank_name: string;
  account_name: string;
  account_number: string;
  routing_number: string;
}