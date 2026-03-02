export type TransactionStatus = 
  | 'PENDING' 
  | 'AWAITING' 
  | 'AWAITING_CONFIRMATION' 
  | 'PAYMENT_SUBMITTED' 
  | 'COMPLETED' 
  | 'DECLINED';

export interface Product {
  name: string;
  price: number;
  description?: string;
}

export interface Seller {
  cela_id: string;
  business_name: string;
  seller_name: string;
  category: string;
  products: Product[];
  stats: {
    pending: number;
    awaiting: number;
    completed: number;
    declined: number;
  };
}

export interface BankDetails {
  bank_name: string;
  account_name: string;
  account_number: string;
  routing_number: string;
}

export interface Transaction {
  txn_id: string;
  status: TransactionStatus;
  buyer_name: string;
  product_name: string;
  amount: number;
  quantity: number;
  message?: string;
  notes?: string;
  bank_details?: BankDetails;
}
