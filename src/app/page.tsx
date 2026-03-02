"use client";

import { useState, useEffect, useCallback } from "react";
import { ShoppingCart, Store, CheckCircle2, ChevronRight, Share2, BarChart3, RotateCcw, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Seller, Transaction, Product, BankDetails } from "@/lib/types";
import { smartQuoteNotes } from "@/ai/flows/smart-quote-notes-flow";
import { summarizeTransactionPerformance } from "@/ai/flows/transaction-performance-summary";

const FLOW_STEPS = [
  "Onboarding", "Storefront", "Dashboard", "Review", "Buyer Pays", "Confirm", "Receipt", "Records", "Quote Link",
];

export default function CelaPayGateway() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Seller State
  const [seller, setSeller] = useState<Seller | null>(null);
  const [sellerForm, setSellerForm] = useState({ 
    business_name: "", 
    seller_name: "", 
    category: "Electronics" 
  });
  const [sellerProducts, setSellerProducts] = useState<Product[]>([
    { name: "", price: 0, description: "" },
    { name: "", price: 0, description: "" },
  ]);

  // Buyer State
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [buyerForm, setBuyerForm] = useState({ buyer_name: "", message: "", quantity: 1 });
  const [currentTxn, setCurrentTxn] = useState<Transaction | null>(null);

  // Quote state
  const [quoteForm, setQuoteForm] = useState({
    amount: "", 
    notes: "", 
    bank_name: "First National Bank",
    account_name: "", 
    account_number: "", 
    routing_number: "",
  });

  // AI Generated
  const [aiSummary, setAiSummary] = useState<string>("");
  const [aiSuggestedNote, setAiSuggestedNote] = useState<string>("");

  // Navigation
  const go = (n: number) => { setStep(n); setError(""); };

  // Status Polling Simulation
  useEffect(() => {
    if (!currentTxn) return;
    if (currentTxn.status === "AWAITING" && step === 3) go(5);
    if (currentTxn.status === "PAYMENT_SUBMITTED" && step === 5) go(6);
    if (currentTxn.status === "COMPLETED" && step < 7) go(7);
  }, [currentTxn?.status, step]);

  // Handle AI Features
  const generateSmartNote = async () => {
    if (!currentTxn || !selectedProduct) return;
    setLoading(true);
    try {
      const res = await smartQuoteNotes({
        productName: selectedProduct.name,
        productPrice: selectedProduct.price,
        buyerMessage: buyerForm.message,
        productDescription: selectedProduct.description
      });
      setAiSuggestedNote(res.suggestedNote);
      setQuoteForm(prev => ({ ...prev, notes: res.suggestedNote }));
    } catch (e) {
      setError("Failed to generate AI note");
    } finally {
      setLoading(false);
    }
  };

  const getAnalyticsSummary = async (transactions: Transaction[]) => {
    setLoading(true);
    try {
      const formattedTxns = transactions.map(t => ({
        txn_id: t.txn_id,
        status: t.status,
        buyer_name: t.buyer_name,
        product_name: t.product_name,
        amount: t.amount
      }));
      const res = await summarizeTransactionPerformance({ transactions: formattedTxns });
      setAiSummary(res.summaryText);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Actions
  const handleOnboard = async () => {
    const products = sellerProducts.filter(p => p.name.trim() && p.price > 0);
    if (!sellerForm.business_name || !sellerForm.seller_name) return setError("Fill in all seller fields.");
    if (products.length === 0) return setError("Add at least one product.");
    
    setLoading(true);
    // Simulate API delay
    setTimeout(() => {
      const newSeller: Seller = {
        cela_id: `CELA-${Math.random().toString(36).substring(7).toUpperCase()}`,
        ...sellerForm,
        products,
        stats: { pending: 0, awaiting: 0, completed: 0, declined: 0 }
      };
      setSeller(newSeller);
      setQuoteForm(f => ({ ...f, account_name: sellerForm.business_name }));
      setLoading(false);
      go(2);
    }, 800);
  };

  const handleRequestQuote = async () => {
    if (!selectedProduct) return setError("Select a product.");
    if (!buyerForm.buyer_name.trim()) return setError("Enter your name.");
    setLoading(true);
    setTimeout(() => {
      const txn: Transaction = {
        txn_id: `TXN-${Math.random().toString(36).substring(7).toUpperCase()}`,
        status: "PENDING",
        buyer_name: buyerForm.buyer_name,
        product_name: selectedProduct.name,
        quantity: buyerForm.quantity,
        message: buyerForm.message,
        amount: selectedProduct.price * buyerForm.quantity,
      };
      setCurrentTxn(txn);
      setQuoteForm(prev => ({ ...prev, amount: txn.amount.toString() }));
      setLoading(false);
      go(3);
    }, 800);
  };

  const handleSendQuote = async () => {
    if (!quoteForm.amount || !quoteForm.account_number || !quoteForm.routing_number)
      return setError("Fill in quote amount and bank details.");
    setLoading(true);
    setTimeout(() => {
      setCurrentTxn(prev => prev ? { 
        ...prev, 
        status: "AWAITING",
        amount: parseFloat(quoteForm.amount),
        notes: quoteForm.notes,
        bank_details: {
          bank_name: quoteForm.bank_name,
          account_name: quoteForm.account_name,
          account_number: quoteForm.account_number,
          routing_number: quoteForm.routing_number,
        }
      } : null);
      setLoading(false);
      go(4);
    }, 800);
  };

  const handleConfirmPayment = (confirmed: boolean) => {
    setLoading(true);
    setTimeout(() => {
      setCurrentTxn(prev => prev ? { 
        ...prev, 
        status: confirmed ? "COMPLETED" : "DECLINED" 
      } : null);
      setLoading(false);
      if (confirmed) go(7);
      else go(99);
    }, 800);
  };

  const resetAll = () => {
    setStep(1);
    setSeller(null);
    setCurrentTxn(null);
    setSelectedProduct(null);
    setSellerProducts([{ name: "", price: 0, description: "" }, { name: "", price: 0, description: "" }]);
    setError("");
  };

  return (
    <div className="min-h-screen bg-[#161514] text-slate-100 flex flex-col font-body">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06] bg-[#161514]/90 backdrop-blur-md sticky top-0 z-50">
        <div className="font-display font-black text-2xl tracking-tighter uppercase">
          CELA <span className="text-primary">PAY</span>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-2 text-sm text-slate-500">
            Step <span className="text-primary font-display font-bold text-lg">{Math.min(step, 9)}</span> / 9
            <ChevronRight className="w-3 h-3" />
            <span className="text-xs uppercase tracking-widest">{FLOW_STEPS[Math.min(step, 9) - 1]}</span>
          </div>
          <Button variant="ghost" size="sm" onClick={resetAll} className="text-slate-500 hover:text-white">
            <RotateCcw className="w-3.5 h-3.5 mr-2" />
            Reset
          </Button>
        </div>
      </header>

      {/* Flow Steps Progress */}
      <div className="flex items-center gap-0 px-6 py-2 bg-black/20 border-b border-white/[0.06] overflow-x-auto no-scrollbar">
        {FLOW_STEPS.map((label, i) => {
          const num = i + 1;
          const active = num === step;
          const done = num < step;
          return (
            <div key={label} className="flex items-center shrink-0">
              {i > 0 && <span className="text-slate-800 px-1 text-[10px]">/</span>}
              <div className={cn(
                "px-3 py-1 text-[10px] font-bold uppercase tracking-widest transition-all",
                active ? "text-primary scale-105" : done ? "text-emerald-500" : "text-slate-600"
              )}>
                {num}. {label}
              </div>
            </div>
          );
        })}
      </div>

      {/* Main content grid */}
      <main className="flex-1 max-w-[1400px] mx-auto w-full grid grid-cols-1 md:grid-cols-[1fr_2px_1fr] gap-0 p-4 lg:p-8">
        
        {/* BUYER PANEL */}
        <section className="flex flex-col gap-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
              <ShoppingCart className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-display font-bold text-lg leading-none">Buyer Panel</h2>
              <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-1">Browse and Request Quote</p>
            </div>
          </div>

          <div className="flex-1 bg-white/[0.02] border border-white/[0.07] rounded-[2rem] p-6 lg:p-8 space-y-6">
            {step === 1 && (
              <div className="h-full flex flex-col items-center justify-center text-center py-20 opacity-40">
                <Store className="w-12 h-12 mb-4 text-slate-600" />
                <p className="text-sm font-medium">Waiting for merchant setup...</p>
              </div>
            )}

            {step === 2 && seller && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
                <div>
                  <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 mb-4">Storefront: {seller.business_name}</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {seller.products.map((p, i) => (
                      <button 
                        key={i} 
                        onClick={() => setSelectedProduct(p)}
                        className={cn(
                          "p-4 rounded-2xl border text-left transition-all group",
                          selectedProduct?.name === p.name 
                            ? "bg-primary/10 border-primary shadow-[0_0_20px_rgba(216,166,42,0.1)]" 
                            : "bg-white/[0.03] border-white/[0.07] hover:bg-white/[0.06] hover:border-white/[0.15]"
                        )}
                      >
                        <div className="text-sm font-bold group-hover:text-primary transition-colors">{p.name}</div>
                        <div className="text-lg font-display font-black text-primary mt-1">${p.price.toFixed(2)}</div>
                        <div className="text-[10px] text-slate-500 mt-2 line-clamp-2 uppercase tracking-tight">{p.description || "Premium Quality Service"}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Your Details</h3>
                  <div className="space-y-4 bg-white/[0.02] p-6 rounded-[1.5rem] border border-white/[0.05]">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-[10px] uppercase tracking-widest text-slate-500">Buyer Name</Label>
                        <Input 
                          placeholder="Alex Rivera" 
                          value={buyerForm.buyer_name}
                          onChange={e => setBuyerForm(f => ({ ...f, buyer_name: e.target.value }))}
                          className="bg-black/20 border-white/10 rounded-xl" 
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] uppercase tracking-widest text-slate-500">Quantity</Label>
                        <Input 
                          type="number" 
                          min={1} 
                          value={buyerForm.quantity}
                          onChange={e => setBuyerForm(f => ({ ...f, quantity: parseInt(e.target.value) }))}
                          className="bg-black/20 border-white/10 rounded-xl" 
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] uppercase tracking-widest text-slate-500">Message</Label>
                      <Textarea 
                        placeholder="Additional context or requirements..." 
                        value={buyerForm.message}
                        onChange={e => setBuyerForm(f => ({ ...f, message: e.target.value }))}
                        className="bg-black/20 border-white/10 rounded-xl resize-none h-24" 
                      />
                    </div>
                    <Button onClick={handleRequestQuote} className="w-full h-12 rounded-2xl font-bold bg-primary hover:bg-primary/80 transition-all">
                      Submit Request
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {step === 3 && currentTxn && (
              <div className="space-y-6 text-center py-12 animate-in fade-in zoom-in-95">
                <div className="w-20 h-20 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto mb-6">
                  <RotateCcw className="w-10 h-10 text-amber-500 animate-spin-slow" />
                </div>
                <h3 className="text-xl font-display font-black">Request Pending</h3>
                <p className="text-sm text-slate-400 max-w-xs mx-auto">The merchant is reviewing your request for <strong>{currentTxn.product_name}</strong>. You will be notified once a quote is sent.</p>
                <div className="bg-white/[0.03] p-4 rounded-2xl border border-white/10 font-mono text-xs text-primary">
                  REF: {currentTxn.txn_id}
                </div>
              </div>
            )}

            {step === 5 && currentTxn && (
              <div className="space-y-6 animate-in slide-in-from-bottom-8 duration-500">
                <div className="bg-primary/10 border border-primary/20 rounded-3xl p-8 text-center">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/60 mb-2">Quote Received</h3>
                  <div className="text-5xl font-display font-black text-primary">${currentTxn.amount.toFixed(2)}</div>
                  {currentTxn.notes && (
                    <div className="mt-4 p-4 bg-black/20 rounded-2xl text-xs italic text-slate-400 border border-white/5">
                      "{currentTxn.notes}"
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Payment Details (Bank Transfer)</h3>
                  <div className="bg-white/[0.03] p-6 rounded-[2rem] border border-white/10 space-y-3">
                    {[
                      ["Bank Name", currentTxn.bank_details?.bank_name],
                      ["Account Name", currentTxn.bank_details?.account_name],
                      ["Account No.", currentTxn.bank_details?.account_number],
                      ["Routing No.", currentTxn.bank_details?.routing_number],
                    ].map(([label, val]) => (
                      <div key={label} className="flex justify-between items-center py-1">
                        <span className="text-xs text-slate-500">{label}</span>
                        <span className="text-sm font-mono text-white">{val}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button onClick={() => go(6)} className="flex-1 h-14 rounded-2xl bg-accent hover:bg-accent/90 text-white font-bold">
                    Mark as Paid
                  </Button>
                  <Button onClick={() => go(99)} variant="outline" className="flex-1 h-14 rounded-2xl border-white/10 text-slate-400">
                    Decline
                  </Button>
                </div>
              </div>
            )}

            {step === 6 && (
              <div className="text-center py-12 space-y-4">
                <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mx-auto text-accent">
                  <RotateCcw className="w-8 h-8 animate-spin" />
                </div>
                <h3 className="text-xl font-display font-black">Verifying Payment</h3>
                <p className="text-sm text-slate-500 italic">Merchant is verifying your bank transfer. Please wait...</p>
              </div>
            )}

            {step === 7 && currentTxn && (
              <div className="text-center py-8 animate-in zoom-in-95">
                <div className="w-20 h-20 rounded-full bg-accent/20 border-2 border-accent flex items-center justify-center mx-auto mb-6 text-accent">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <h2 className="text-2xl font-display font-black mb-2">Payment Completed</h2>
                <p className="text-sm text-slate-400 mb-8 tracking-tight">Receipt generated successfully. Merchant has confirmed receipt of funds.</p>
                
                <div className="bg-white/[0.03] border-2 border-dashed border-white/10 rounded-3xl p-6 text-left space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Transaction ID</h4>
                      <p className="font-mono text-sm">{currentTxn.txn_id}</p>
                    </div>
                    <StatusBadge status="COMPLETED" />
                  </div>
                  <div className="grid grid-cols-2 gap-4 py-4 border-y border-white/5">
                    <div>
                      <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Product</h4>
                      <p className="text-sm font-medium">{currentTxn.product_name}</p>
                    </div>
                    <div>
                      <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Merchant</h4>
                      <p className="text-sm font-medium">{seller?.business_name}</p>
                    </div>
                  </div>
                  <div className="flex justify-between items-center pt-2">
                    <span className="text-sm text-slate-400 font-bold uppercase tracking-tighter">Total Amount Paid</span>
                    <span className="text-2xl font-display font-black text-accent">${currentTxn.amount.toFixed(2)}</span>
                  </div>
                </div>

                <Button variant="ghost" className="mt-8 text-slate-500 hover:text-white" onClick={() => go(2)}>
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Start New Purchase
                </Button>
              </div>
            )}

            {step === 99 && (
              <div className="text-center py-20 space-y-6">
                <div className="text-6xl">🚫</div>
                <h3 className="text-2xl font-display font-black text-red-400">Transaction Failed</h3>
                <p className="text-sm text-slate-500 max-w-xs mx-auto">This transaction was declined or canceled. No funds were processed.</p>
                <Button variant="outline" className="rounded-xl border-white/10" onClick={() => go(2)}>Back to Storefront</Button>
              </div>
            )}
          </div>
        </section>

        {/* CENTER DIVIDER */}
        <div className="hidden md:flex flex-col items-center justify-center py-32 relative">
          <div className="absolute top-0 bottom-0 left-1/2 w-[1px] bg-gradient-to-b from-transparent via-white/[0.1] to-transparent" />
          <div className="relative z-10 w-12 h-12 rounded-full bg-[#161514] border border-white/[0.1] flex items-center justify-center text-primary text-xl shadow-[0_0_15px_rgba(0,0,0,0.5)]">
            ⚡
          </div>
        </div>

        {/* SELLER PANEL */}
        <section className="flex flex-col gap-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-2xl bg-accent/10 flex items-center justify-center text-accent border border-accent/20">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-display font-bold text-lg leading-none">Seller Panel</h2>
              <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-1">Manage Business & Payments</p>
            </div>
          </div>

          <div className="flex-1 bg-white/[0.02] border border-white/[0.07] rounded-[2rem] p-6 lg:p-8 space-y-6">
            {step === 1 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-top-4">
                <div className="space-y-1">
                  <h3 className="text-xl font-display font-black tracking-tight">Merchant Onboarding</h3>
                  <p className="text-xs text-slate-500">Register your business and list your first products.</p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] uppercase tracking-widest text-slate-500">Business Name</Label>
                    <Input 
                      placeholder="Digital Nexus Ltd." 
                      value={sellerForm.business_name}
                      onChange={e => setSellerForm(f => ({ ...f, business_name: e.target.value }))}
                      className="bg-black/20 border-white/10 rounded-xl h-11" 
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-[10px] uppercase tracking-widest text-slate-500">Contact Person</Label>
                      <Input 
                        placeholder="Jordan Smith" 
                        value={sellerForm.seller_name}
                        onChange={e => setSellerForm(f => ({ ...f, seller_name: e.target.value }))}
                        className="bg-black/20 border-white/10 rounded-xl h-11" 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] uppercase tracking-widest text-slate-500">Category</Label>
                      <Select 
                        value={sellerForm.category}
                        onValueChange={v => setSellerForm(f => ({ ...f, category: v }))}
                      >
                        <SelectTrigger className="bg-black/20 border-white/10 rounded-xl h-11">
                          <SelectValue placeholder="Select Category" />
                        </SelectTrigger>
                        <SelectContent className="bg-card border-white/10">
                          <SelectItem value="Electronics">Electronics</SelectItem>
                          <SelectItem value="Software">Software & Licenses</SelectItem>
                          <SelectItem value="Consulting">Consulting</SelectItem>
                          <SelectItem value="Design">Design Services</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="space-y-3 pt-4">
                    <div className="flex justify-between items-center">
                      <Label className="text-[10px] uppercase tracking-widest text-slate-500">Initial Catalog</Label>
                      <Button variant="ghost" size="sm" className="text-[10px] uppercase tracking-widest text-primary hover:text-white" onClick={() => setSellerProducts([...sellerProducts, { name: "", price: 0 }])}>+ Add Product</Button>
                    </div>
                    <div className="space-y-3">
                      {sellerProducts.map((p, i) => (
                        <div key={i} className="flex gap-3">
                          <Input 
                            placeholder="Service/Product name" 
                            value={p.name}
                            onChange={e => {
                              const n = [...sellerProducts];
                              n[i].name = e.target.value;
                              setSellerProducts(n);
                            }}
                            className="bg-black/20 border-white/10 rounded-xl flex-1 h-11" 
                          />
                          <Input 
                            type="number" 
                            placeholder="$ Price" 
                            value={p.price || ""}
                            onChange={e => {
                              const n = [...sellerProducts];
                              n[i].price = parseFloat(e.target.value);
                              setSellerProducts(n);
                            }}
                            className="bg-black/20 border-white/10 rounded-xl w-24 h-11" 
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  {error && <p className="text-[10px] text-red-500 font-bold uppercase animate-pulse">⚠ {error}</p>}
                  
                  <Button onClick={handleOnboard} className="w-full h-14 rounded-2xl bg-primary text-white font-black uppercase tracking-widest shadow-xl shadow-primary/10">
                    Launch Storefront
                  </Button>
                </div>
              </div>
            )}

            {step === 2 && seller && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-display font-black">Dashboard</h3>
                  <StatusBadge status="LIVE" />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Card className="bg-white/[0.03] border-white/10 rounded-2xl">
                    <CardHeader className="p-4 pb-0">
                      <CardTitle className="text-[10px] uppercase tracking-widest text-slate-500">Pending</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-2">
                      <p className="text-2xl font-display font-black">0</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-white/[0.03] border-white/10 rounded-2xl">
                    <CardHeader className="p-4 pb-0">
                      <CardTitle className="text-[10px] uppercase tracking-widest text-slate-500">Live Views</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-2">
                      <p className="text-2xl font-display font-black text-primary">12</p>
                    </CardContent>
                  </Card>
                </div>

                <div className="bg-primary/5 border border-primary/10 p-6 rounded-[1.5rem] flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg"><Share2 className="w-4 h-4 text-primary" /></div>
                    <div>
                      <p className="text-[10px] font-bold uppercase text-slate-400">Merchant Link</p>
                      <p className="text-xs font-mono text-primary truncate max-w-[150px]">{seller.cela_id}</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" className="rounded-xl border-primary/20 hover:bg-primary/10">Copy</Button>
                </div>

                <div className="py-12 text-center opacity-30">
                  <ShoppingCart className="w-8 h-8 mx-auto mb-2" />
                  <p className="text-xs">Waiting for incoming buyer requests...</p>
                </div>
              </div>
            )}

            {step === 3 && currentTxn && (
              <div className="space-y-6 animate-in slide-in-from-right-8">
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-display font-black">Review Request</h3>
                  <span className="text-[10px] font-mono text-slate-500">#{currentTxn.txn_id}</span>
                </div>

                <div className="bg-white/[0.03] p-5 rounded-2xl border border-white/10 space-y-3">
                  <div className="flex justify-between">
                    <span className="text-xs text-slate-500">Buyer</span>
                    <span className="text-xs font-bold">{currentTxn.buyer_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-slate-500">Product</span>
                    <span className="text-xs font-bold text-primary">{currentTxn.product_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-slate-500">Requested Qty</span>
                    <span className="text-xs font-bold">{currentTxn.quantity}</span>
                  </div>
                  {currentTxn.message && (
                    <div className="pt-2 mt-2 border-t border-white/5">
                      <p className="text-[10px] uppercase tracking-widest text-slate-500 mb-1">Message</p>
                      <p className="text-xs text-slate-300 italic">"{currentTxn.message}"</p>
                    </div>
                  )}
                </div>

                <div className="space-y-4 pt-2">
                  <div className="flex justify-between items-center">
                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Create Quote</h4>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-[10px] text-primary h-6 flex items-center gap-1.5"
                      onClick={generateSmartNote}
                      disabled={loading}
                    >
                      <Sparkles className="w-3 h-3" />
                      AI Suggest Notes
                    </Button>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-[10px] uppercase tracking-widest text-slate-500">Total Quote Amount ($)</Label>
                      <Input 
                        type="number" 
                        value={quoteForm.amount}
                        onChange={e => setQuoteForm(f => ({ ...f, amount: e.target.value }))}
                        className="bg-black/20 border-white/10 rounded-xl h-12 text-lg font-bold text-primary" 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] uppercase tracking-widest text-slate-500">Terms / Notes</Label>
                      <Textarea 
                        placeholder="Payment terms, delivery estimates, or custom notes..." 
                        value={quoteForm.notes}
                        onChange={e => setQuoteForm(f => ({ ...f, notes: e.target.value }))}
                        className="bg-black/20 border-white/10 rounded-xl min-h-[80px]" 
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4 bg-white/[0.03] p-6 rounded-3xl border border-white/5">
                   <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Recipient Bank Details</h4>
                   <div className="grid grid-cols-2 gap-3">
                      <Input placeholder="Bank Name" value={quoteForm.bank_name} onChange={e => setQuoteForm(f => ({ ...f, bank_name: e.target.value }))} className="bg-black/20 border-white/5 text-xs h-10" />
                      <Input placeholder="Account Name" value={quoteForm.account_name} onChange={e => setQuoteForm(f => ({ ...f, account_name: e.target.value }))} className="bg-black/20 border-white/5 text-xs h-10" />
                      <Input placeholder="Acc Number" value={quoteForm.account_number} onChange={e => setQuoteForm(f => ({ ...f, account_number: e.target.value }))} className="bg-black/20 border-white/5 text-xs h-10" />
                      <Input placeholder="Routing No." value={quoteForm.routing_number} onChange={e => setQuoteForm(f => ({ ...f, routing_number: e.target.value }))} className="bg-black/20 border-white/5 text-xs h-10" />
                   </div>
                </div>

                {error && <p className="text-[10px] text-red-500 font-bold">⚠ {error}</p>}

                <div className="flex gap-3">
                  <Button onClick={handleSendQuote} className="flex-1 h-14 rounded-2xl bg-primary text-white font-bold">
                    Send Quote
                  </Button>
                  <Button variant="outline" className="flex-1 h-14 rounded-2xl border-white/10 text-slate-500" onClick={() => go(2)}>
                    Discard
                  </Button>
                </div>
              </div>
            )}

            {step === 4 && currentTxn && (
              <div className="space-y-6 animate-in fade-in">
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-display font-black">Awaiting Buyer</h3>
                  <StatusBadge status="AWAITING" />
                </div>
                <Card className="bg-primary/5 border-primary/20 rounded-3xl p-8 text-center">
                  <p className="text-[10px] uppercase font-bold text-slate-500 mb-2">Quote Sent For</p>
                  <p className="text-4xl font-display font-black text-primary">${currentTxn.amount.toFixed(2)}</p>
                  <p className="text-xs text-slate-400 mt-4 italic tracking-tight">"Awaiting payment confirmation from the buyer's banking portal..."</p>
                </Card>
                <div className="bg-white/[0.03] p-5 rounded-2xl border border-white/10">
                   <div className="flex items-center gap-3">
                      <div className="p-2 bg-white/5 rounded-xl"><RotateCcw className="w-4 h-4 text-slate-500 animate-spin-slow" /></div>
                      <p className="text-xs text-slate-500">System is polling buyer's status in real-time...</p>
                   </div>
                </div>
              </div>
            )}

            {step === 6 && currentTxn && (
              <div className="space-y-6 animate-in slide-in-from-right-8 duration-700">
                <div className="space-y-2">
                  <h3 className="text-2xl font-display font-black">Verify Payment</h3>
                  <p className="text-sm text-slate-500">Buyer <strong>{currentTxn.buyer_name}</strong> reported payment was sent via Bank Transfer.</p>
                </div>

                <div className="bg-accent/5 border border-accent/20 p-8 rounded-3xl text-center space-y-4">
                  <div>
                    <p className="text-[10px] uppercase font-bold text-slate-500 mb-1">Incoming Amount</p>
                    <p className="text-5xl font-display font-black text-accent">${currentTxn.amount.toFixed(2)}</p>
                  </div>
                  <div className="p-4 bg-black/20 rounded-2xl border border-white/5 flex flex-col items-center">
                    <p className="text-[10px] uppercase font-bold text-amber-400/80 tracking-widest mb-1 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" /> Check your bank account
                    </p>
                    <p className="text-[10px] text-slate-500 leading-tight">Verify the transaction reference matches <strong>{currentTxn.txn_id}</strong> before confirming.</p>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                   <Button onClick={() => handleConfirmPayment(true)} className="flex-1 h-16 rounded-2xl bg-accent hover:bg-accent/90 text-white font-bold text-lg">
                      Yes, Received
                   </Button>
                   <Button onClick={() => handleConfirmPayment(false)} variant="outline" className="flex-1 h-16 rounded-2xl border-white/10 text-slate-500">
                      Not Yet
                   </Button>
                </div>
              </div>
            )}

            {step === 7 && (
              <div className="space-y-6 animate-in fade-in">
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-display font-black">Transaction Closed</h3>
                  <StatusBadge status="COMPLETED" />
                </div>
                
                <div className="bg-accent/10 p-8 rounded-[2rem] text-center border border-accent/20">
                  <CheckCircle2 className="w-12 h-12 text-accent mx-auto mb-4" />
                  <p className="text-lg font-bold">Payment Verified</p>
                  <p className="text-xs text-slate-500 mt-2">The buyer has received their receipt and the funds are credited to your merchant balance.</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Button variant="outline" className="h-12 rounded-2xl border-white/10" onClick={() => {
                    // Load records
                    go(8);
                    if (currentTxn) getAnalyticsSummary([currentTxn]);
                  }}>
                    <BarChart3 className="w-4 h-4 mr-2" />
                    Records
                  </Button>
                  <Button variant="outline" className="h-12 rounded-2xl border-white/10" onClick={() => go(9)}>
                    <Share2 className="w-4 h-4 mr-2" />
                    Share Link
                  </Button>
                </div>
                <Button className="w-full h-14 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 text-white font-bold" onClick={() => go(2)}>
                  Back to Dashboard
                </Button>
              </div>
            )}

            {step === 8 && (
              <div className="space-y-6 animate-in slide-in-from-right-12">
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-display font-black">Records & Analytics</h3>
                  <Button variant="ghost" size="sm" onClick={() => go(7)}>Back</Button>
                </div>

                <div className="space-y-4">
                  {aiSummary && (
                    <div className="bg-primary/10 p-5 rounded-2xl border border-primary/20 text-xs italic text-slate-200">
                      <Sparkles className="w-4 h-4 text-primary mb-2" />
                      {aiSummary}
                    </div>
                  )}

                  <div className="space-y-2">
                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Historical Log</h4>
                    <div className="space-y-2">
                      {[currentTxn].filter(Boolean).map((t, i) => (
                        <div key={i} className="bg-white/[0.03] p-4 rounded-xl border border-white/5 flex justify-between items-center">
                          <div>
                            <p className="text-xs font-bold">{t?.product_name}</p>
                            <p className="text-[10px] text-slate-500">{t?.buyer_name}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-display font-black text-accent">${t?.amount.toFixed(2)}</p>
                            <StatusBadge status={t?.status || 'PENDING'} className="scale-75 origin-right" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {step === 9 && seller && (
              <div className="space-y-6 animate-in slide-in-from-right-12">
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-display font-black">Storefront Link</h3>
                  <Button variant="ghost" size="sm" onClick={() => go(7)}>Back</Button>
                </div>
                <div className="bg-white/[0.02] p-8 rounded-3xl border border-white/10 text-center space-y-6">
                  <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto text-primary">
                    <Share2 className="w-8 h-8" />
                  </div>
                  <p className="text-sm text-slate-500 px-4">Share this unique ID with your customers to direct them to your secure storefront.</p>
                  <div className="bg-black/40 p-4 rounded-2xl border border-white/5 font-mono text-primary text-lg">
                    {seller.cela_id}
                  </div>
                  <Button className="w-full h-12 rounded-xl bg-primary hover:bg-primary/80">Copy Gateway URL</Button>
                </div>
              </div>
            )}
          </div>
        </section>

      </main>

      {/* Footer Info */}
      <footer className="px-6 py-4 border-t border-white/[0.06] text-center text-[9px] uppercase tracking-[0.3em] text-slate-700">
        Cela Gateway Protocol &copy; 2024 &middot; Institutional Grade B2B Payments
      </footer>
    </div>
  );
}
