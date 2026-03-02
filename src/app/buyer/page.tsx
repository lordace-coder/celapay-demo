
"use client";

import { useState, useEffect } from "react";
import { ShoppingCart, CheckCircle2, RotateCcw, ArrowRight, ShieldCheck, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Navbar } from "@/components/shared/Navbar";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Seller, Transaction, Product } from "@/lib/types";
import * as API from "@/lib/api";

export default function BuyerPage() {
  const [storeIdInput, setStoreIdInput] = useState("");
  const [seller, setSeller] = useState<Seller | null>(null);
  const [txn, setTxn] = useState<Transaction | null>(null);
  const [step, setStep] = useState<"SEARCH" | "STOREFRONT" | "PENDING" | "PAYMENT" | "RECEIPT">("SEARCH");
  
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [buyerForm, setBuyerForm] = useState({ buyer_name: "", message: "", quantity: 1 });
  const [loading, setLoading] = useState(false);

  // Poll for status updates when pending
  useEffect(() => {
    let interval: any;
    if (txn && (txn.status === "PENDING" || txn.status === "AWAITING" || txn.status === "PAYMENT_SUBMITTED")) {
      interval = setInterval(async () => {
        const updated = await API.fetchTransaction(txn.txn_id);
        if (updated) {
          setTxn(updated);
          if (updated.status === "AWAITING" && step === "PENDING") setStep("PAYMENT");
          if (updated.status === "COMPLETED" && step !== "RECEIPT") setStep("RECEIPT");
        }
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [txn, step]);

  const handleSearch = async () => {
    if (!storeIdInput) return;
    setLoading(true);
    const s = await API.fetchSeller(storeIdInput);
    if (s) {
      setSeller(s);
      setStep("STOREFRONT");
    } else {
      alert("Merchant not found.");
    }
    setLoading(false);
  };

  const handleRequestQuote = async () => {
    if (!selectedProduct || !seller) return;
    setLoading(true);

    const txnId = await API.createTransaction({
      status: "PENDING",
      buyer_name: buyerForm.buyer_name || "Guest Buyer",
      product_name: selectedProduct.name,
      quantity: buyerForm.quantity || 1,
      message: buyerForm.message,
      amount: selectedProduct.price * (buyerForm.quantity || 1),
      seller_id: seller.cela_id,
    });

    const newTxn = await API.fetchTransaction(txnId);
    setTxn(newTxn);
    setLoading(false);
    setStep("PENDING");
  };

  const markAsPaid = async () => {
    if (!txn) return;
    await API.updateTransactionStatus(txn.txn_id, "PAYMENT_SUBMITTED");
    setStep("PENDING");
  };

  return (
    <div className="min-h-screen bg-[#161514] text-slate-100 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-4xl mx-auto w-full p-6 lg:p-12 space-y-8">
        
        {step === "SEARCH" && (
          <div className="space-y-12 py-20 text-center animate-in fade-in">
             <div className="space-y-4">
                <h2 className="text-4xl font-display font-black uppercase tracking-tighter">Enter Merchant Portal</h2>
                <p className="text-slate-500 text-sm max-w-sm mx-auto">Input the Merchant ID to access the catalog and request settlements.</p>
             </div>
             <div className="flex flex-col items-center gap-4 max-w-md mx-auto">
                <Input 
                  placeholder="MERCHANT-ID" 
                  value={storeIdInput} 
                  onChange={e => setStoreIdInput(e.target.value)}
                  className="bg-white/[0.03] border-white/10 h-14 rounded-2xl text-center font-mono tracking-widest uppercase"
                />
                <Button onClick={handleSearch} disabled={loading} className="w-full h-14 rounded-2xl bg-primary text-white font-bold group">
                  {loading ? "Locating..." : "Access Storefront"} <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
             </div>
             <div className="pt-12 flex items-center justify-center gap-8 opacity-20">
                <ShieldCheck className="w-8 h-8" />
                <ShoppingCart className="w-8 h-8" />
             </div>
          </div>
        )}

        {step === "STOREFRONT" && seller && (
          <div className="space-y-8 animate-in slide-in-from-bottom-4">
             <div className="space-y-1">
                <h2 className="text-3xl font-display font-black leading-none">{seller.business_name}</h2>
                <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Official Catalog</p>
             </div>

             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {seller.products.map((p, i) => (
                   <button 
                     key={i} 
                     onClick={() => setSelectedProduct(p)}
                     className={cn(
                       "p-6 rounded-[2rem] border text-left transition-all group",
                       selectedProduct?.name === p.name 
                        ? "bg-primary/10 border-primary shadow-2xl" 
                        : "bg-white/[0.02] border-white/10 hover:border-white/20"
                     )}
                   >
                      <div className="text-sm font-bold group-hover:text-primary transition-colors">{p.name}</div>
                      <div className="text-2xl font-display font-black text-primary mt-1">${p.price.toFixed(2)}</div>
                   </button>
                ))}
             </div>

             {selectedProduct && (
               <div className="bg-white/[0.02] border border-white/10 p-8 rounded-[2rem] space-y-6">
                  <h3 className="text-sm font-bold uppercase tracking-widest text-slate-500">Ordering: {selectedProduct.name}</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                       <Label className="text-[10px] uppercase font-bold text-slate-500">Your Identity/Name</Label>
                       <Input value={buyerForm.buyer_name} onChange={e => setBuyerForm(f => ({ ...f, buyer_name: e.target.value }))} className="bg-black/20 border-white/10" />
                    </div>
                    <div className="space-y-2">
                       <Label className="text-[10px] uppercase font-bold text-slate-500">Quantity</Label>
                       <Input 
                          type="number" 
                          value={isNaN(buyerForm.quantity) ? "" : buyerForm.quantity} 
                          onChange={e => setBuyerForm(f => ({ ...f, quantity: parseInt(e.target.value) || 0 }))} 
                          className="bg-black/20 border-white/10" 
                        />
                    </div>
                  </div>
                  <div className="space-y-2">
                     <Label className="text-[10px] uppercase font-bold text-slate-500">Project Requirements / Message</Label>
                     <Textarea value={buyerForm.message} onChange={e => setBuyerForm(f => ({ ...f, message: e.target.value }))} className="bg-black/20 border-white/10" />
                  </div>
                  <Button onClick={handleRequestQuote} disabled={loading} className="w-full h-14 bg-primary rounded-2xl font-bold">
                    {loading ? "Submitting..." : "Request Final Quote"}
                  </Button>
               </div>
             )}
          </div>
        )}

        {step === "PENDING" && txn && (
          <div className="text-center py-20 space-y-8 animate-in zoom-in-95">
             <div className="w-24 h-24 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto text-primary">
                <RotateCcw className="w-12 h-12 animate-spin" />
             </div>
             <div className="space-y-2">
                <h2 className="text-3xl font-display font-black">Awaiting Merchant Review</h2>
                <p className="text-sm text-slate-500 max-w-sm mx-auto">The seller is currently reviewing your request for <strong>{txn.product_name}</strong>. You will be notified once the quote is ready.</p>
             </div>
             <div className="bg-white/[0.02] border border-white/10 p-4 rounded-xl font-mono text-xs text-primary max-w-xs mx-auto">
                REF: {txn.txn_id}
             </div>
          </div>
        )}

        {step === "PAYMENT" && txn && (
           <div className="space-y-8 animate-in slide-in-from-bottom-8">
              <div className="bg-primary/10 border border-primary/20 rounded-[3rem] p-12 text-center">
                 <p className="text-[10px] uppercase font-bold text-primary/60 mb-2">Quote Ready</p>
                 <h4 className="text-6xl font-display font-black text-primary">${txn.amount.toFixed(2)}</h4>
                 {txn.notes && <p className="mt-4 text-xs italic text-slate-400">"{txn.notes}"</p>}
              </div>

              <div className="bg-white/[0.03] border border-white/10 p-8 rounded-[2rem] space-y-4">
                 <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Settlement Details</h4>
                 {[
                    ["Destination Bank", txn.bank_details?.bank_name],
                    ["Account No.", txn.bank_details?.account_number],
                    ["Routing No.", txn.bank_details?.routing_number],
                 ].map(([label, val]) => (
                    <div key={label} className="flex justify-between items-center py-2 border-b border-white/5 last:border-0">
                       <span className="text-xs text-slate-500">{label}</span>
                       <span className="text-sm font-mono">{val || "—"}</span>
                    </div>
                 ))}
              </div>

              <Button onClick={markAsPaid} className="w-full h-16 bg-accent text-white font-bold rounded-2xl text-lg">
                Confirm Settlement Transfer
              </Button>
           </div>
        )}

        {step === "RECEIPT" && txn && (
          <div className="text-center py-12 space-y-8 animate-in zoom-in-95">
             <div className="w-24 h-24 rounded-full bg-accent/20 border-2 border-accent flex items-center justify-center mx-auto text-accent">
                <CheckCircle2 className="w-12 h-12" />
             </div>
             <h2 className="text-4xl font-display font-black">Transaction Verified</h2>
             
             <div className="bg-white/[0.03] border-2 border-dashed border-white/10 rounded-[3rem] p-10 text-left space-y-6">
                <div className="flex justify-between items-start">
                   <div>
                      <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Digital Receipt</h4>
                      <p className="text-lg font-bold">{txn.product_name}</p>
                   </div>
                   <StatusBadge status="COMPLETED" />
                </div>
                <div className="grid grid-cols-2 gap-8 py-6 border-y border-white/5">
                   <div>
                      <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Merchant</h4>
                      <p className="text-sm">{seller?.business_name}</p>
                   </div>
                   <div>
                      <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Timestamp</h4>
                      <p className="text-sm">{new Date().toLocaleDateString()} {new Date().toLocaleTimeString()}</p>
                   </div>
                </div>
                <div className="flex justify-between items-center">
                   <span className="text-xl font-display font-black uppercase">Settled Total</span>
                   <span className="text-4xl font-display font-black text-accent">${txn.amount.toFixed(2)}</span>
                </div>
             </div>

             <Button variant="ghost" className="text-slate-500 hover:text-white" onClick={() => setStep("SEARCH")}>
                <RotateCcw className="w-4 h-4 mr-2" /> Start New Session
             </Button>
          </div>
        )}
      </main>
    </div>
  );
}
