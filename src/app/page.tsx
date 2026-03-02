"use client";

import {
  useState,
  useEffect,
  type ReactNode,
  type ChangeEvent,
} from "react";
import type {
  BadgeStatus,
  BankDetails,
  BuyerFormState,
  OnboardResponse,
  Product,
  ProductInputRow,
  QuoteFormState,
  Seller,
  SellerFormState,
  Transaction,
  TxnStatus,
} from "@/types";

// ─── API CLIENT ───────────────────────────────────────────────────────────────

const api = {
  post: async <T>(path: string, body: unknown): Promise<T> => {
    const r = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    return r.json() as Promise<T>;
  },
  get: async <T>(path: string): Promise<T> => {
    const r = await fetch(path);
    return r.json() as Promise<T>;
  },
};

// ─── BADGE ────────────────────────────────────────────────────────────────────

const BADGE_STYLES: Record<BadgeStatus, string> = {
  PENDING:               "bg-red-500/15 text-red-400 border border-red-500/25",
  AWAITING:              "bg-amber-500/15 text-amber-400 border border-amber-500/25",
  AWAITING_CONFIRMATION: "bg-amber-500/15 text-amber-400 border border-amber-500/25",
  PAYMENT_SUBMITTED:     "bg-amber-500/15 text-amber-400 border border-amber-500/25",
  COMPLETED:             "bg-emerald-500/15 text-emerald-400 border border-emerald-500/25",
  DECLINED:              "bg-slate-500/15 text-slate-400 border border-slate-500/25",
  LIVE:                  "bg-emerald-500/15 text-emerald-400 border border-emerald-500/25",
};

const BADGE_LABELS: Record<BadgeStatus, string> = {
  PENDING:               "● Pending",
  AWAITING:              "● Awaiting",
  AWAITING_CONFIRMATION: "● Awaiting Confirmation",
  PAYMENT_SUBMITTED:     "● Payment Submitted",
  COMPLETED:             "● Completed",
  DECLINED:              "● Declined",
  LIVE:                  "● Live",
};

function Badge({ status }: { status: BadgeStatus }) {
  return (
    <span
      className={`text-[10px] font-semibold tracking-widest uppercase px-2.5 py-1 rounded-full ${
        BADGE_STYLES[status] ?? BADGE_STYLES.PENDING
      }`}
    >
      {BADGE_LABELS[status] ?? status}
    </span>
  );
}

// ─── PRIMITIVES ───────────────────────────────────────────────────────────────

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}
function Input({ label, ...props }: InputProps) {
  return (
    <div className="mb-4">
      {label && (
        <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-1.5">
          {label}
        </label>
      )}
      <input
        {...props}
        className="w-full bg-white/[0.04] border border-white/[0.07] rounded-lg px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-500/50 focus:bg-white/[0.06] transition-all"
      />
    </div>
  );
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  children: ReactNode;
}
function Select({ label, children, ...props }: SelectProps) {
  return (
    <div className="mb-4">
      {label && (
        <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-1.5">
          {label}
        </label>
      )}
      <select
        {...props}
        className="w-full bg-[#1b2d42] border border-white/[0.07] rounded-lg px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-amber-500/50 transition-all"
      >
        {children}
      </select>
    </div>
  );
}

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
}
function Textarea({ label, ...props }: TextareaProps) {
  return (
    <div className="mb-4">
      {label && (
        <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-1.5">
          {label}
        </label>
      )}
      <textarea
        {...props}
        rows={3}
        className="w-full bg-white/[0.04] border border-white/[0.07] rounded-lg px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-500/50 focus:bg-white/[0.06] transition-all resize-none"
      />
    </div>
  );
}

type BtnVariant = "primary" | "green" | "red" | "outline" | "ghost";

interface BtnProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: BtnVariant;
  children: ReactNode;
}
function Btn({ children, variant = "primary", className = "", ...props }: BtnProps) {
  const base =
    "inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed";
  const variants: Record<BtnVariant, string> = {
    primary: "bg-amber-500 text-slate-900 hover:bg-amber-400 hover:-translate-y-px hover:shadow-lg hover:shadow-amber-500/20",
    green:   "bg-emerald-500 text-white hover:bg-emerald-400 hover:-translate-y-px hover:shadow-lg hover:shadow-emerald-500/20",
    red:     "bg-red-500/15 text-red-400 border border-red-500/25 hover:bg-red-500/25",
    outline: "bg-white/[0.04] border border-white/[0.08] text-slate-300 hover:bg-white/[0.08] hover:border-white/[0.15]",
    ghost:   "text-slate-400 hover:text-slate-200 hover:bg-white/[0.05]",
  };
  return (
    <button {...props} className={`${base} ${variants[variant]} ${className}`}>
      {children}
    </button>
  );
}

interface InfoCardProps {
  label: string;
  value: ReactNode;
  mono?: boolean;
  highlight?: boolean;
}
function InfoCard({ label, value, mono = false, highlight = false }: InfoCardProps) {
  return (
    <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-3.5 mb-3">
      <div className="text-[9px] font-semibold text-slate-500 uppercase tracking-widest mb-1">{label}</div>
      <div
        className={`text-sm font-medium ${
          highlight ? "text-amber-400 font-bold text-base font-mono" : "text-slate-200"
        } ${mono ? "font-mono text-xs text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded" : ""}`}
      >
        {value}
      </div>
    </div>
  );
}

type NotifVariant = "default" | "amber" | "green" | "red";

interface NotifProps {
  icon: string;
  title?: string;
  body: ReactNode;
  variant?: NotifVariant;
}
function Notif({ icon, title, body, variant = "default" }: NotifProps) {
  const styles: Record<NotifVariant, string> = {
    default: "bg-white/[0.03] border-white/[0.07]",
    amber:   "bg-amber-500/[0.07] border-amber-500/20",
    green:   "bg-emerald-500/[0.07] border-emerald-500/20",
    red:     "bg-red-500/[0.07] border-red-500/20",
  };
  return (
    <div className={`flex gap-3 p-3.5 rounded-xl border mb-4 ${styles[variant]}`}>
      <span className="text-xl leading-none mt-0.5">{icon}</span>
      <div>
        {title && <div className="text-sm font-semibold text-slate-200 mb-0.5">{title}</div>}
        <div className="text-xs text-slate-400 leading-relaxed">{body}</div>
      </div>
    </div>
  );
}

function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <div className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.15em] mb-3 pb-2 border-b border-white/[0.06]">
      {children}
    </div>
  );
}

// ─── FLOW BAR ─────────────────────────────────────────────────────────────────

const FLOW_STEPS = [
  "Onboarding","Storefront","Dashboard","Review",
  "Buyer Pays","Confirm","Receipt","Records","Quote Link",
];

function FlowBar({ currentStep }: { currentStep: number }) {
  return (
    <div className="flex items-center justify-center gap-0 px-6 py-3 bg-slate-900/60 border-b border-white/[0.06] overflow-x-auto">
      {FLOW_STEPS.map((label, i) => {
        const num = i + 1;
        const done = num < currentStep;
        const active = num === currentStep;
        return (
          <div key={num} className="flex items-center gap-0 shrink-0">
            {i > 0 && <span className="text-slate-700 px-1 text-xs">›</span>}
            <div
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-semibold whitespace-nowrap transition-all ${
                active ? "bg-amber-500/15 text-amber-400" : done ? "text-emerald-500" : "text-slate-600"
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  active ? "bg-amber-400 scale-125" : done ? "bg-emerald-500" : "bg-slate-700"
                }`}
              />
              {num}. {label}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── STAT BOX ─────────────────────────────────────────────────────────────────

function StatBox({ value, label, color }: { value: number; label: string; color: string }) {
  return (
    <div className={`rounded-xl p-3.5 text-center border ${color}`}>
      <div className="text-2xl font-black font-mono">{value}</div>
      <div className="text-[10px] text-slate-400 mt-0.5">{label}</div>
    </div>
  );
}

// ─── PRODUCT CARD ─────────────────────────────────────────────────────────────

interface ProductCardProps {
  product: Product;
  selected: boolean;
  onClick: () => void;
}
function ProductCard({ product, selected, onClick }: ProductCardProps) {
  return (
    <div
      onClick={onClick}
      className={`p-3.5 rounded-xl border cursor-pointer transition-all duration-200 ${
        selected
          ? "border-amber-500/50 bg-amber-500/[0.08] shadow-sm shadow-amber-500/10"
          : "border-white/[0.07] bg-white/[0.03] hover:border-white/[0.15] hover:bg-white/[0.06]"
      }`}
    >
      <div className="text-sm font-semibold text-slate-200 mb-1">{product.name}</div>
      <div className="text-lg font-black text-amber-400">${Number(product.price).toFixed(2)}</div>
      {product.description && (
        <div className="text-[10px] text-slate-500 mt-1">{product.description}</div>
      )}
    </div>
  );
}

// ─── RECEIPT ──────────────────────────────────────────────────────────────────

interface ReceiptData {
  txnId: string | undefined;
  celaId: string | undefined;
  product: string | undefined;
  buyer: string | undefined;
  seller: string | undefined;
  amount: number | null | undefined;
}

type ReceiptRow = [string, ReactNode] | null;

function Receipt({ data }: { data: ReceiptData }) {
  const rows: ReceiptRow[] = [
    ["Transaction ID", <span key="txn" className="font-mono text-xs text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded">{data.txnId}</span>],
    ["CELA ID",        <span key="cela" className="font-mono text-xs text-amber-400">{data.celaId}</span>],
    null,
    ["Product", data.product ?? "—"],
    ["Buyer",   data.buyer   ?? "—"],
    ["Seller",  data.seller  ?? "—"],
    null,
    ["Amount", <span key="amt" className="text-emerald-400 font-bold">${Number(data.amount ?? 0).toFixed(2)}</span>],
    ["Status", <Badge key="st" status="COMPLETED" />],
  ];

  return (
    <div className="bg-white/[0.02] border border-dashed border-white/[0.1] rounded-xl p-5 my-4 text-sm">
      {rows.map((row, i) =>
        row === null ? (
          <hr key={i} className="border-dashed border-white/[0.08] my-2.5" />
        ) : (
          <div key={i} className="flex justify-between items-center py-1.5">
            <span className="text-slate-500 text-xs">{row[0]}</span>
            <span className="text-slate-200 font-medium">{row[1]}</span>
          </div>
        )
      )}
    </div>
  );
}

// ─── SUCCESS SCREEN ───────────────────────────────────────────────────────────

interface SuccessScreenProps {
  icon: string;
  title: string;
  subtitle: ReactNode;
  children?: ReactNode;
}
function SuccessScreen({ icon, title, subtitle, children }: SuccessScreenProps) {
  return (
    <div className="text-center px-4 py-6">
      <div className="w-16 h-16 rounded-full bg-emerald-500/15 border-2 border-emerald-500/40 flex items-center justify-center text-3xl mx-auto mb-4">
        {icon}
      </div>
      <div className="text-xl font-black text-slate-100 mb-1">{title}</div>
      <div className="text-sm text-slate-400 mb-2">{subtitle}</div>
      {children}
    </div>
  );
}

// ─── PANEL ────────────────────────────────────────────────────────────────────

interface PanelProps {
  icon: string;
  title: string;
  sub: string;
  badge?: BadgeStatus;
  children: ReactNode;
}
function Panel({ icon, title, sub, badge, children }: PanelProps) {
  return (
    <div className="flex flex-col h-full bg-white/[0.02] border border-white/[0.07] rounded-2xl overflow-hidden">
      <div className="flex items-center gap-3 px-5 py-4 border-b border-white/[0.06] shrink-0">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg bg-white/[0.06]">{icon}</div>
        <div className="flex-1 min-w-0">
          <div className="font-black text-slate-100 text-sm">{title}</div>
          <div className="text-[10px] text-slate-500 truncate">{sub}</div>
        </div>
        {badge && <Badge status={badge} />}
      </div>
      <div className="flex-1 overflow-y-auto p-5">{children}</div>
    </div>
  );
}

// ─── BANK DETAIL ROW ──────────────────────────────────────────────────────────

const BANK_KEYS: [string, keyof BankDetails][] = [
  ["Bank",         "bank_name"],
  ["Account Name", "account_name"],
  ["Account No.",  "account_number"],
  ["Routing No.",  "routing_number"],
];

// ─── APP ──────────────────────────────────────────────────────────────────────

export default function CelaApp() {
  const [step, setStep] = useState(1);

  const [seller, setSeller]         = useState<OnboardResponse | null>(null);
  const [sellerData, setSellerData] = useState<Seller | null>(null);
  const [sellerProducts, setSellerProducts] = useState<ProductInputRow[]>([
    { name: "", price: "" },
    { name: "", price: "" },
  ]);
  const [sellerForm, setSellerForm] = useState<SellerFormState>({
    business_name: "", seller_name: "", category: "Electronics",
  });

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [buyerForm, setBuyerForm]             = useState<BuyerFormState>({ buyer_name: "", message: "", quantity: 1 });
  const [txnData, setTxnData]                 = useState<Transaction | null>(null);

  const [quoteForm, setQuoteForm] = useState<QuoteFormState>({
    amount: "", notes: "", bank_name: "First National Bank",
    account_name: "", account_number: "", routing_number: "",
  });

  const [records, setRecords]     = useState<Transaction[]>([]);
  const [quoteLink, setQuoteLink] = useState("");
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState("");

  const go = (n: number) => { setStep(n); setError(""); };

  // Poll transaction status
  useEffect(() => {
    const pollable: TxnStatus[] = ["PENDING", "AWAITING", "PAYMENT_SUBMITTED"];
    if (!txnData?.txn_id || !pollable.includes(txnData.status)) return;
    const interval = setInterval(async () => {
      const updated = await api.get<Transaction>(`/api/transaction/${txnData.txn_id}`);
      setTxnData(updated);
    }, 2000);
    return () => clearInterval(interval);
  }, [txnData?.txn_id, txnData?.status]);

  // React to status changes
  useEffect(() => {
    if (!txnData) return;
    if (txnData.status === "AWAITING"          && step === 3) go(5);
    if (txnData.status === "PAYMENT_SUBMITTED" && step === 5) go(6);
    if (txnData.status === "COMPLETED"         && step < 7)   go(7);
    if (txnData.status === "DECLINED"          && step !== 7) go(99);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [txnData?.status]);

  // ── HANDLERS ────────────────────────────────────────────────────────────────

  const handleOnboard = async () => {
    const products = sellerProducts.filter((p) => p.name.trim() && p.price);
    if (!sellerForm.business_name || !sellerForm.seller_name) return setError("Fill in all seller fields.");
    if (products.length === 0) return setError("Add at least one product.");
    setLoading(true);
    try {
      const res = await api.post<OnboardResponse>("/api/seller/onboard", {
        ...sellerForm,
        products: products.map((p) => ({ name: p.name, price: parseFloat(p.price) })),
      });
      setSeller(res);
      const data = await api.get<Seller>(`/api/seller/${res.cela_id}`);
      setSellerData(data);
      setQuoteForm((f) => ({ ...f, account_name: sellerForm.business_name }));
      go(2);
    } catch {
      setError("Backend error — make sure Next.js is running.");
    } finally {
      setLoading(false);
    }
  };

  const handleRequestQuote = async () => {
    if (!selectedProduct) return setError("Select a product.");
    if (!buyerForm.buyer_name.trim()) return setError("Enter your name.");
    if (!seller) return setError("No active seller.");
    setLoading(true);
    try {
      const res = await api.post<Transaction>("/api/buyer/request-quote", {
        cela_id: seller.cela_id,
        buyer_name: buyerForm.buyer_name,
        product_name: selectedProduct.name,
        quantity: buyerForm.quantity,
        message: buyerForm.message,
      });
      setTxnData(res);
      go(3);
    } catch {
      setError("Failed to submit request.");
    } finally {
      setLoading(false);
    }
  };

  const handleSendQuote = async () => {
    if (!quoteForm.amount || !quoteForm.account_number || !quoteForm.routing_number)
      return setError("Fill in quote amount and bank details.");
    if (!txnData) return;
    setLoading(true);
    try {
      const res = await api.post<Transaction>("/api/seller/send-quote", {
        txn_id: txnData.txn_id,
        amount: parseFloat(quoteForm.amount),
        notes: quoteForm.notes,
        bank_name: quoteForm.bank_name,
        account_name: quoteForm.account_name,
        account_number: quoteForm.account_number,
        routing_number: quoteForm.routing_number,
      });
      setTxnData(res);
      go(4);
    } catch {
      setError("Failed to send quote.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeclineRequest = async () => {
    if (!txnData) return;
    setLoading(true);
    await api.post<Transaction>(`/api/seller/decline-request/${txnData.txn_id}`, {});
    setTxnData((t) => t ? { ...t, status: "DECLINED" } : t);
    go(99);
    setLoading(false);
  };

  const handleBuyerPaid = async () => {
    if (!txnData) return;
    setLoading(true);
    const res = await api.post<Transaction>(`/api/buyer/paid/${txnData.txn_id}`, {});
    setTxnData(res);
    go(6);
    setLoading(false);
  };

  const handleConfirmPayment = async (confirmed: boolean) => {
    if (!txnData) return;
    setLoading(true);
    const res = await api.post<Transaction>("/api/seller/confirm-payment", {
      txn_id: txnData.txn_id, confirmed,
    });
    setTxnData(res);
    confirmed ? go(7) : go(99);
    setLoading(false);
  };

  const loadRecords = async () => {
    if (!seller) return;
    const res = await api.get<{ transactions: Transaction[] }>(`/api/seller/${seller.cela_id}/transactions`);
    setRecords(res.transactions ?? []);
    const data = await api.get<Seller>(`/api/seller/${seller.cela_id}`);
    setSellerData(data);
    go(8);
  };

  const loadQuoteLink = async () => {
    if (!seller) return;
    const res = await api.get<{ link: string }>(`/api/seller/${seller.cela_id}/quote-link`);
    setQuoteLink(res.link);
    go(9);
  };

  const resetTransaction = () => {
    setTxnData(null); setSelectedProduct(null);
    setBuyerForm({ buyer_name: "", message: "", quantity: 1 });
    setError(""); go(2);
  };

  const fullReset = () => {
    setSeller(null); setSellerData(null); setTxnData(null); setSelectedProduct(null);
    setSellerForm({ business_name: "", seller_name: "", category: "Electronics" });
    setSellerProducts([{ name: "", price: "" }, { name: "", price: "" }]);
    setBuyerForm({ buyer_name: "", message: "", quantity: 1 });
    setError(""); go(1);
  };

  const stats = sellerData?.stats ?? { pending: 0, awaiting: 0, completed: 0, declined: 0 };
  const isDeclined = step === 99;

  // ── BUYER VIEW ───────────────────────────────────────────────────────────────

  const renderBuyer = (): ReactNode => {
    if (step === 1) return (
      <div className="flex flex-col items-center justify-center h-full py-16 text-center text-slate-600 gap-3">
        <span className="text-4xl">⏳</span>
        <p className="text-sm">Waiting for seller to complete onboarding...</p>
      </div>
    );

    if (step === 2) return (
      <>
        <Notif icon="🏪" title={`${sellerData?.business_name ?? "Store"} is live!`} body="Browse products and submit a quote request." variant="green" />
        <SectionTitle>Products</SectionTitle>
        <div className="grid grid-cols-2 gap-2 mb-4">
          {(sellerData?.products ?? []).map((p, i) => (
            <ProductCard key={i} product={p} selected={selectedProduct?.name === p.name} onClick={() => setSelectedProduct(p)} />
          ))}
        </div>
        {selectedProduct && (
          <div className="bg-amber-500/[0.07] border border-amber-500/20 rounded-xl p-3 mb-4 text-xs text-amber-300">
            Selected: <strong>{selectedProduct.name}</strong> — ${Number(selectedProduct.price).toFixed(2)}
          </div>
        )}
        <SectionTitle>Your Details</SectionTitle>
        <Input label="Your Name" placeholder="e.g. Alex Johnson" value={buyerForm.buyer_name}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setBuyerForm((f) => ({ ...f, buyer_name: e.target.value }))} />
        <Textarea label="Message to Seller" placeholder="Describe what you need..." value={buyerForm.message}
          onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setBuyerForm((f) => ({ ...f, message: e.target.value }))} />
        <Input label="Quantity" type="number" min={1} value={buyerForm.quantity}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setBuyerForm((f) => ({ ...f, quantity: parseInt(e.target.value) || 1 }))} />
        {error && <p className="text-red-400 text-xs mb-3">⚠ {error}</p>}
        <Btn className="w-full" onClick={handleRequestQuote} disabled={loading}>
          {loading ? "Submitting..." : "📨 Submit Quote Request"}
        </Btn>
      </>
    );

    if (step === 3) return (
      <>
        <Notif icon="⏳" title="Request submitted!" body="Waiting for seller to review and send a quote." variant="amber" />
        <InfoCard label="Status" value={<Badge status="PENDING" />} />
        <InfoCard label="Transaction ID" value={txnData?.txn_id ?? "—"} mono />
        <InfoCard label="CELA ID" value={seller?.cela_id ?? "—"} mono />
        <div className="text-center text-slate-600 text-xs mt-6">Polling for updates every 2s...</div>
      </>
    );

    if (step === 5) return (
      <>
        <Notif icon="📩" title="Quote received!" body="Seller reviewed your request. Review the quote below." variant="green" />
        <div className="bg-amber-500/[0.07] border border-amber-500/20 rounded-2xl p-5 mb-4">
          <div className="text-[9px] font-semibold text-amber-500/70 uppercase tracking-widest mb-1">Total Amount</div>
          <div className="text-4xl font-black text-amber-400 font-mono">${Number(txnData?.amount ?? 0).toFixed(2)}</div>
          {txnData?.notes && <div className="text-xs text-slate-400 mt-1">{txnData.notes}</div>}
        </div>
        <InfoCard label="Status" value={<Badge status="AWAITING_CONFIRMATION" />} />
        <SectionTitle>Bank Transfer Details</SectionTitle>
        {BANK_KEYS.map(([label, key]) => (
          <div key={key} className="flex justify-between items-center py-2 border-b border-white/[0.05] text-sm last:border-none">
            <span className="text-slate-500 text-xs">{label}</span>
            <span className="text-slate-200 font-medium font-mono text-xs">{txnData?.bank_details?.[key] ?? "—"}</span>
          </div>
        ))}
        <div className="flex gap-2 mt-5">
          <Btn variant="green" className="flex-1" onClick={handleBuyerPaid} disabled={loading}>✅ I Have Paid</Btn>
          <Btn variant="red" className="flex-1" onClick={() => { setTxnData((t) => t ? { ...t, status: "DECLINED" } : t); go(99); }}>✗ Decline</Btn>
        </div>
      </>
    );

    if (step === 6) return (
      <>
        <Notif icon="🔍" title="Payment submitted!" body="Seller is verifying your bank transfer..." variant="amber" />
        <InfoCard label="Status" value={<Badge status="PAYMENT_SUBMITTED" />} />
        <InfoCard label="Amount" value={`$${Number(txnData?.amount ?? 0).toFixed(2)}`} highlight />
        <div className="text-center text-slate-600 text-xs mt-6">Polling for confirmation...</div>
      </>
    );

    if (step === 7) return (
      <SuccessScreen icon="✅" title="Transaction Complete!" subtitle="Your receipt has been issued automatically.">
        <Receipt data={{ txnId: txnData?.txn_id, celaId: seller?.cela_id, product: txnData?.product_name, buyer: txnData?.buyer_name, seller: sellerData?.business_name, amount: txnData?.amount }} />
        <Btn variant="outline" className="w-full" onClick={resetTransaction}>🔄 New Transaction</Btn>
      </SuccessScreen>
    );

    if (isDeclined) return (
      <div className="text-center py-16">
        <div className="w-16 h-16 rounded-full bg-red-500/15 border-2 border-red-500/30 flex items-center justify-center text-3xl mx-auto mb-4">✗</div>
        <div className="text-lg font-black text-red-400 mb-1">Transaction Declined</div>
        <div className="text-sm text-slate-500 mb-6">This transaction was declined.</div>
        <Btn variant="outline" onClick={resetTransaction}>🔄 Try Again</Btn>
      </div>
    );

    return null;
  };

  // ── SELLER VIEW ──────────────────────────────────────────────────────────────

  const renderSeller = (): ReactNode => {
    if (step === 1) return (
      <>
        <SectionTitle>1 · Seller Onboarding</SectionTitle>
        <div className="flex gap-1 mb-5">
          {[1,2,3,4].map((n) => (
            <div key={n} className={`h-1 flex-1 rounded-full ${n === 1 ? "bg-amber-500" : "bg-white/[0.07]"}`} />
          ))}
        </div>
        <Input label="Business Name" placeholder="e.g. TechParts Co." value={sellerForm.business_name}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setSellerForm((f) => ({ ...f, business_name: e.target.value }))} />
        <Input label="Your Name" placeholder="e.g. Jamie Smith" value={sellerForm.seller_name}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setSellerForm((f) => ({ ...f, seller_name: e.target.value }))} />
        <Select label="Category" value={sellerForm.category}
          onChange={(e: ChangeEvent<HTMLSelectElement>) => setSellerForm((f) => ({ ...f, category: e.target.value }))}>
          {["Electronics","Software & Licenses","Consulting Services","Physical Goods","Digital Products"].map((c) => (
            <option key={c}>{c}</option>
          ))}
        </Select>
        <SectionTitle>Products</SectionTitle>
        {sellerProducts.map((p, i) => (
          <div key={i} className="flex gap-2 mb-2">
            <input className="flex-[2] bg-white/[0.04] border border-white/[0.07] rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-500/50"
              placeholder="Product name" value={p.name}
              onChange={(e: ChangeEvent<HTMLInputElement>) => {
                const next = [...sellerProducts]; next[i] = { ...next[i], name: e.target.value }; setSellerProducts(next);
              }} />
            <input className="flex-1 bg-white/[0.04] border border-white/[0.07] rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-500/50"
              placeholder="$" type="number" min={1} value={p.price}
              onChange={(e: ChangeEvent<HTMLInputElement>) => {
                const next = [...sellerProducts]; next[i] = { ...next[i], price: e.target.value }; setSellerProducts(next);
              }} />
          </div>
        ))}
        <Btn variant="ghost" className="text-xs mb-4" onClick={() => setSellerProducts((p) => [...p, { name: "", price: "" }])}>+ Add row</Btn>
        {error && <p className="text-red-400 text-xs mb-3">⚠ {error}</p>}
        <Btn className="w-full" onClick={handleOnboard} disabled={loading}>
          {loading ? "Launching..." : "🚀 Launch Storefront"}
        </Btn>
      </>
    );

    if (step === 2) return (
      <>
        <SectionTitle>3 · Seller Dashboard</SectionTitle>
        <div className="grid grid-cols-2 gap-2 mb-5">
          <StatBox value={stats.pending}   label="Pending"   color="bg-red-500/10 border-red-500/20 text-red-400" />
          <StatBox value={stats.awaiting}  label="Awaiting"  color="bg-amber-500/10 border-amber-500/20 text-amber-400" />
          <StatBox value={stats.completed} label="Completed" color="bg-emerald-500/10 border-emerald-500/20 text-emerald-400" />
          <StatBox value={stats.declined}  label="Declined"  color="bg-slate-500/10 border-slate-500/20 text-slate-400" />
        </div>
        <Notif icon="📭" title="Storefront is live!" body="Waiting for a buyer to submit a quote request..." />
        <div className="mt-3 p-3 bg-white/[0.02] border border-white/[0.05] rounded-xl text-xs text-slate-500">
          <div className="font-semibold text-slate-400 mb-1">CELA ID</div>
          <div className="font-mono text-amber-400 text-[11px]">{seller?.cela_id}</div>
        </div>
      </>
    );

    if (step === 3) return (
      <>
        <SectionTitle>4 · Review Request</SectionTitle>
        <Notif icon="🔔" title="New quote request!" body={`${txnData?.buyer_name ?? "Buyer"} wants a quote.`} variant="amber" />
        <InfoCard label="Product Requested" value={txnData?.product_name ?? "—"} />
        <InfoCard label="Buyer"    value={txnData?.buyer_name ?? "—"} />
        <InfoCard label="Message"  value={txnData?.message || "(no message)"} />
        <InfoCard label="Quantity" value={txnData?.quantity ?? "—"} />
        <SectionTitle>Generate Quote</SectionTitle>
        <Input label="Quote Amount ($)" type="number" min={1} placeholder="0.00" value={quoteForm.amount}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setQuoteForm((f) => ({ ...f, amount: e.target.value }))} />
        <Input label="Notes for Buyer" placeholder="e.g. Includes 1 year warranty" value={quoteForm.notes}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setQuoteForm((f) => ({ ...f, notes: e.target.value }))} />
        <SectionTitle>Bank Details</SectionTitle>
        <Input label="Bank Name"       value={quoteForm.bank_name}     onChange={(e: ChangeEvent<HTMLInputElement>) => setQuoteForm((f) => ({ ...f, bank_name: e.target.value }))} />
        <Input label="Account Name"    value={quoteForm.account_name}   onChange={(e: ChangeEvent<HTMLInputElement>) => setQuoteForm((f) => ({ ...f, account_name: e.target.value }))} />
        <Input label="Account Number"  placeholder="1234567890" value={quoteForm.account_number} onChange={(e: ChangeEvent<HTMLInputElement>) => setQuoteForm((f) => ({ ...f, account_number: e.target.value }))} />
        <Input label="Routing Number"  placeholder="021000089"  value={quoteForm.routing_number} onChange={(e: ChangeEvent<HTMLInputElement>) => setQuoteForm((f) => ({ ...f, routing_number: e.target.value }))} />
        {error && <p className="text-red-400 text-xs mb-3">⚠ {error}</p>}
        <div className="flex gap-2 mt-2">
          <Btn className="flex-1" onClick={handleSendQuote} disabled={loading}>📤 Send Quote</Btn>
          <Btn variant="red" className="flex-1" onClick={handleDeclineRequest} disabled={loading}>✗ Decline</Btn>
        </div>
      </>
    );

    if (step === 4) return (
      <>
        <SectionTitle>5 · Awaiting Payment</SectionTitle>
        <Notif icon="📤" title="Quote sent!" body="Waiting for buyer to make the bank transfer..." variant="amber" />
        <InfoCard label="Status"       value={<Badge status="AWAITING" />} />
        <InfoCard label="Quote Amount" value={`$${parseFloat(quoteForm.amount || "0").toFixed(2)}`} highlight />
        <InfoCard label="Transaction ID" value={txnData?.txn_id ?? "—"} mono />
        <div className="text-center text-slate-600 text-xs mt-4">Polling for buyer payment...</div>
      </>
    );

    if (step === 6) return (
      <>
        <SectionTitle>6 · Confirm Payment</SectionTitle>
        <Notif icon="💳" title="Buyer says they've paid!" body="Check your bank account then confirm or reject." variant="green" />
        <InfoCard label="Expected Amount" value={`$${Number(txnData?.amount ?? 0).toFixed(2)}`} highlight />
        <InfoCard label="Transaction ID"  value={txnData?.txn_id ?? "—"} mono />
        <div className="text-xs text-amber-400/70 bg-amber-500/[0.06] border border-amber-500/15 rounded-lg px-3 py-2 mb-4">
          ⚠️ Only confirm after verifying in your banking portal.
        </div>
        <div className="flex gap-2">
          <Btn variant="green" className="flex-1" onClick={() => handleConfirmPayment(true)}  disabled={loading}>✅ Confirm</Btn>
          <Btn variant="red"   className="flex-1" onClick={() => handleConfirmPayment(false)} disabled={loading}>✗ Not Received</Btn>
        </div>
      </>
    );

    if (step === 7) return (
      <SuccessScreen icon="🎉" title="Payment Confirmed!" subtitle={<><strong className="text-emerald-400">COMPLETED</strong> — receipt issued to buyer</>}>
        <div className="bg-white/[0.02] border border-dashed border-white/[0.1] rounded-xl p-4 my-4 text-sm">
          {([["Transaction", txnData?.txn_id], ["Buyer", txnData?.buyer_name], ["Amount", `$${Number(txnData?.amount ?? 0).toFixed(2)}`]] as [string, string | undefined][]).map(([k, v]) => (
            <div key={k} className="flex justify-between py-1.5 border-b border-white/[0.07] last:border-none">
              <span className="text-slate-500 text-xs">{k}</span>
              <span className={k === "Amount" ? "text-emerald-400 font-bold" : "text-slate-200 font-medium text-xs font-mono"}>{v ?? "—"}</span>
            </div>
          ))}
          <div className="flex justify-between py-1.5">
            <span className="text-slate-500 text-xs">Unfinished Money</span>
            <span className="text-amber-400">+💰 Credited</span>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 mb-3">
          <Btn variant="outline" className="text-xs" onClick={loadRecords}>📊 Records</Btn>
          <Btn variant="outline" className="text-xs" onClick={loadQuoteLink}>🔗 Quote Link</Btn>
        </div>
        <Btn variant="outline" className="w-full" onClick={resetTransaction}>🔄 New Transaction</Btn>
      </SuccessScreen>
    );

    if (step === 8) return (
      <>
        <SectionTitle>8 · Records & Analytics</SectionTitle>
        <div className="grid grid-cols-2 gap-2 mb-4">
          <InfoCard label="Total Revenue"  value={`$${records.filter((r) => r.status === "COMPLETED").reduce((s, r) => s + (r.amount ?? 0), 0).toFixed(2)}`} highlight />
          <InfoCard label="Transactions"   value={records.length} highlight />
        </div>
        <SectionTitle>Recent Transactions</SectionTitle>
        {records.length === 0 ? (
          <p className="text-slate-600 text-xs text-center py-6">No transactions yet.</p>
        ) : records.map((t) => (
          <div key={t.txn_id} className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-3.5 mb-2">
            <div className="flex justify-between items-center mb-1">
              <span className="font-mono text-[10px] text-amber-400">{t.txn_id}</span>
              <Badge status={t.status} />
            </div>
            <div className="text-xs text-slate-400">{t.buyer_name} · {t.product_name}</div>
            <div className="text-sm font-bold text-emerald-400 mt-1">${Number(t.amount ?? 0).toFixed(2)}</div>
          </div>
        ))}
        <Btn variant="outline" className="w-full mt-2" onClick={() => go(7)}>← Back</Btn>
      </>
    );

    if (step === 9) return (
      <>
        <SectionTitle>9 · Manual Quote Link</SectionTitle>
        <Notif icon="🔗" body="Share this link directly with buyers to start a quote request." />
        <Input label="Quote Link" value={quoteLink} readOnly />
        <Btn className="w-full mb-2" onClick={() => navigator.clipboard.writeText(quoteLink).catch(() => {})}>📋 Copy Link</Btn>
        <Btn variant="outline" className="w-full" onClick={() => go(7)}>← Back</Btn>
      </>
    );

    if (isDeclined) return (
      <div className="text-center py-16">
        <div className="w-16 h-16 rounded-full bg-red-500/15 border-2 border-red-500/30 flex items-center justify-center text-3xl mx-auto mb-4">✗</div>
        <div className="text-lg font-black text-red-400 mb-1">Declined</div>
        <div className="text-sm text-slate-500 mb-6">Transaction was declined.</div>
        <Btn variant="outline" onClick={resetTransaction}>🔄 New Transaction</Btn>
      </div>
    );

    return null;
  };

  const buyerBadge: BadgeStatus | undefined =
    txnData?.status === "PENDING"           ? "PENDING"   :
    txnData?.status === "AWAITING"          ? "AWAITING"  :
    txnData?.status === "COMPLETED"         ? "COMPLETED" :
    txnData?.status === "DECLINED"          ? "DECLINED"  : undefined;

  return (
    <div className="min-h-screen bg-[#0d1b2a] text-slate-100 flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06] bg-[#0d1b2a]/90 backdrop-blur-sm sticky top-0 z-50">
        <div className="font-black text-xl tracking-tight" style={{ fontFamily: "Syne, sans-serif" }}>
          CELA <span className="text-amber-400">PAY</span>
        </div>
        <div className="px-3 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] font-bold rounded-full uppercase tracking-widest">
          MVP Demo
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-500">
          Step <span className="text-amber-400 font-bold text-base">{Math.min(step, 9)}</span> / 9
          <span className="hidden sm:inline text-slate-600">·</span>
          <span className="hidden sm:inline text-xs">{FLOW_STEPS[Math.min(step, 9) - 1]}</span>
          <Btn variant="ghost" className="text-xs ml-2 px-2 py-1" onClick={fullReset}>↺ Reset</Btn>
        </div>
      </header>

      <FlowBar currentStep={Math.min(step, 9)} />

      <main className="flex-1 grid grid-cols-[1fr_60px_1fr] gap-0 p-5 max-w-6xl mx-auto w-full" style={{ minHeight: 0 }}>
        <Panel icon="🛒" title="Buyer" sub={txnData?.buyer_name ?? "Browse & purchase"} badge={buyerBadge}>
          {renderBuyer()}
        </Panel>

        <div className="flex flex-col items-center justify-start pt-32 relative">
          <div className="absolute top-0 bottom-0 left-1/2 w-px bg-white/[0.06]" />
          <div className="relative z-10 w-9 h-9 rounded-full bg-[#1b2d42] border border-white/[0.1] flex items-center justify-center text-amber-400 text-sm animate-pulse">↔</div>
        </div>

        <Panel icon="🏪" title="Seller" sub={sellerData?.business_name ?? "Set up your store"} badge={seller ? "LIVE" : undefined}>
          {renderSeller()}
        </Panel>
      </main>
    </div>
  );
}