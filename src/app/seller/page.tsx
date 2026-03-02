"use client";

import { useState, useMemo } from "react";
import { Store, CheckCircle2, BarChart3, RotateCcw, Sparkles, Share2, PlusCircle, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Navbar } from "@/components/shared/Navbar";
import { Seller, Transaction, Product } from "@/lib/types";
import { smartQuoteNotes } from "@/ai/flows/smart-quote-notes-flow";
import { useFirestore, useDoc, useCollection } from "@/firebase";
import { doc, setDoc, collection, query, where, updateDoc } from "firebase/firestore";
import { errorEmitter } from "@/firebase/error-emitter";
import { FirestorePermissionError } from "@/firebase/errors";

const DEMO_SELLER_ID = "demo-merchant-99"; // Hardcoded ID for demo purposes

export default function SellerPage() {
  const db = useFirestore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  const sellerId = DEMO_SELLER_ID;
  const sellerRef = useMemo(() => (sellerId ? doc(db, "sellers", sellerId) : null), [db, sellerId]);
  const { data: seller } = useDoc<Seller>(sellerRef);
  
  const transactionsQuery = useMemo(() => (sellerId ? query(collection(db, "transactions"), where("seller_id", "==", sellerId)) : null), [db, sellerId]);
  const { data: transactions } = useCollection<Transaction>(transactionsQuery);

  const [step, setStep] = useState<"ONBOARDING" | "DASHBOARD" | "REVIEW_TXN" | "RECORDS">("ONBOARDING");
  const [selectedTxn, setSelectedTxn] = useState<Transaction | null>(null);
  const [onboardForm, setOnboardForm] = useState({ business_name: "", seller_name: "", category: "Electronics" });
  const [onboardProducts, setOnboardProducts] = useState<Product[]>([{ name: "", price: 0, description: "" }]);
  const [quoteForm, setQuoteForm] = useState({ amount: "", notes: "", bank_name: "First National Bank", account_name: "", account_number: "", routing_number: "" });

  const handleOnboard = async () => {
    if (!db || !sellerRef) return;
    const products = onboardProducts.filter(p => p.name.trim() && p.price > 0);
    if (!onboardForm.business_name || !onboardForm.seller_name) return setError("Fill in all merchant fields.");
    if (products.length === 0) return setError("Add at least one product.");

    setLoading(true);
    const newSeller: Seller = {
      cela_id: `CELA-${sellerId.substring(0, 6).toUpperCase()}`,
      ...onboardForm,
      products,
      stats: { pending: 0, awaiting: 0, completed: 0, declined: 0 }
    };

    setDoc(sellerRef, newSeller, { merge: true })
      .then(() => setLoading(false))
      .catch(async (e) => {
        const err = new FirestorePermissionError({ path: sellerRef.path, operation: 'write', requestResourceData: newSeller });
        errorEmitter.emit('permission-error', err);
        setLoading(false);
      });
  };

  const handleSendQuote = () => {
    if (!db || !selectedTxn) return;
    const finalAmount = parseFloat(quoteForm.amount);
    if (isNaN(finalAmount) || !quoteForm.account_number) return setError("Fill in quote and bank details.");

    const txnRef = doc(db, "transactions", selectedTxn.txn_id);
    const updateData = {
      status: "AWAITING" as const,
      amount: finalAmount,
      notes: quoteForm.notes,
      bank_details: {
        bank_name: quoteForm.bank_name,
        account_name: quoteForm.account_name || onboardForm.business_name,
        account_number: quoteForm.account_number,
        routing_number: quoteForm.routing_number,
      }
    };

    updateDoc(txnRef, updateData)
      .catch(async (e) => {
        const err = new FirestorePermissionError({ path: txnRef.path, operation: 'update', requestResourceData: updateData });
        errorEmitter.emit('permission-error', err);
      });
    setStep("DASHBOARD");
  };

  const handleVerifyPayment = (confirmed: boolean) => {
    if (!db || !selectedTxn) return;
    const txnRef = doc(db, "transactions", selectedTxn.txn_id);
    updateDoc(txnRef, { status: confirmed ? "COMPLETED" : "DECLINED" });
    setStep("DASHBOARD");
  };

  const generateSmartNote = async () => {
    if (!selectedTxn) return;
    setLoading(true);
    try {
      const res = await smartQuoteNotes({
        productName: selectedTxn.product_name,
        productPrice: selectedTxn.amount,
        buyerMessage: selectedTxn.message || "",
      });
      setQuoteForm(prev => ({ ...prev, notes: res.suggestedNote }));
    } catch (e) {
      setError("Failed to generate AI note");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#161514] text-slate-100 flex flex-col font-body">
      <Navbar />

      <main className="flex-1 max-w-4xl mx-auto w-full p-6 lg:p-12 space-y-8">
        {!seller ? (
          <div className="space-y-8 animate-in fade-in slide-in-from-top-4">
            <div className="text-center space-y-2">
              <h2 className="text-3xl font-display font-black">Merchant Onboarding (Demo)</h2>
              <p className="text-sm text-slate-500">Register your business and start accepting payments.</p>
            </div>

            <div className="bg-white/[0.02] border border-white/[0.07] rounded-[2rem] p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-[10px] uppercase tracking-widest text-slate-500">Business Name</Label>
                  <Input 
                    placeholder="E.g. Digital Nexus" 
                    value={onboardForm.business_name}
                    onChange={e => setOnboardForm(f => ({ ...f, business_name: e.target.value }))}
                    className="bg-black/20 border-white/10 rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] uppercase tracking-widest text-slate-500">Category</Label>
                  <Select value={onboardForm.category} onValueChange={v => setOnboardForm(f => ({ ...f, category: v }))}>
                    <SelectTrigger className="bg-black/20 border-white/10 rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Electronics">Electronics</SelectItem>
                      <SelectItem value="Services">Services</SelectItem>
                      <SelectItem value="Retail">Retail</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <Label className="text-[10px] uppercase tracking-widest text-slate-500">Product Catalog</Label>
                  <Button variant="ghost" size="sm" onClick={() => setOnboardProducts([...onboardProducts, { name: "", price: 0 }])} className="text-primary hover:bg-primary/10">
                    <PlusCircle className="w-4 h-4 mr-2" /> Add Product
                  </Button>
                </div>
                {onboardProducts.map((p, i) => (
                  <div key={i} className="flex gap-3">
                    <Input placeholder="Name" value={p.name} onChange={e => {
                      const n = [...onboardProducts]; n[i].name = e.target.value; setOnboardProducts(n);
                    }} className="bg-black/20 border-white/10 rounded-xl flex-1" />
                    <Input type="number" placeholder="Price" value={isNaN(p.price) ? "" : p.price} onChange={e => {
                      const n = [...onboardProducts]; n[i].price = parseFloat(e.target.value) || 0; setOnboardProducts(n);
                    }} className="bg-black/20 border-white/10 rounded-xl w-28" />
                  </div>
                ))}
              </div>

              {error && <p className="text-xs text-red-500 font-bold">⚠ {error}</p>}
              <Button onClick={handleOnboard} disabled={loading} className="w-full h-14 rounded-2xl bg-primary text-white font-bold text-lg">
                {loading ? "Launching..." : "Launch Storefront"}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-8 animate-in fade-in">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-3xl font-display font-black leading-none">{seller.business_name}</h2>
                <div className="flex items-center gap-2 mt-2">
                  <StatusBadge status="LIVE" />
                  <span className="text-[10px] font-mono text-slate-500">ID: {seller.cela_id}</span>
                </div>
              </div>
              <Button variant="outline" className="rounded-xl border-white/10" onClick={() => setStep("RECORDS")}>
                <BarChart3 className="w-4 h-4 mr-2" /> Analytics
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { label: "New Requests", value: transactions?.filter(t => t.status === "PENDING").length || 0, icon: RotateCcw, color: "text-amber-500" },
                { label: "Completed", value: transactions?.filter(t => t.status === "COMPLETED").length || 0, icon: CheckCircle2, color: "text-accent" },
                { label: "Merchant Link", value: seller.cela_id, icon: Share2, color: "text-primary" },
              ].map((stat, i) => (
                <Card key={i} className="bg-white/[0.03] border-white/10 rounded-3xl p-6">
                  <div className="flex justify-between items-start">
                    <stat.icon className={cn("w-5 h-5", stat.color)} />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{stat.label}</span>
                  </div>
                  <div className="mt-4 text-3xl font-display font-black">{stat.value}</div>
                </Card>
              ))}
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-widest text-slate-500">Incoming Requests</h3>
              <div className="grid grid-cols-1 gap-4">
                {transactions?.length === 0 ? (
                  <div className="py-20 text-center opacity-30 bg-white/[0.01] border border-dashed border-white/10 rounded-[2rem]">
                    <RotateCcw className="w-12 h-12 mx-auto mb-4" />
                    <p className="text-sm">No active transactions found.</p>
                  </div>
                ) : (
                  transactions?.map((t, i) => (
                    <div key={i} className="bg-white/[0.03] border border-white/10 p-6 rounded-3xl flex flex-col md:flex-row justify-between items-center gap-6">
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-3">
                          <span className="font-bold">{t.buyer_name}</span>
                          <StatusBadge status={t.status} className="scale-75" />
                        </div>
                        <p className="text-xs text-slate-500">Requested <strong>{t.product_name}</strong> (Qty: {t.quantity})</p>
                      </div>
                      
                      {t.status === "PENDING" && (
                        <Button onClick={() => { setSelectedTxn(t); setStep("REVIEW_TXN"); setQuoteForm(f => ({ ...f, amount: (t.amount).toString() })); }} className="bg-primary hover:bg-primary/80">Review & Quote</Button>
                      )}
                      {t.status === "PAYMENT_SUBMITTED" && (
                         <Button onClick={() => { setSelectedTxn(t); setStep("REVIEW_TXN"); }} className="bg-accent hover:bg-accent/80 text-white">Verify Payment</Button>
                      )}
                      {t.status === "COMPLETED" && (
                        <div className="text-accent text-sm font-bold flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4" /> Paid ${t.amount.toFixed(2)}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {step === "REVIEW_TXN" && selectedTxn && (
          <div className="fixed inset-0 z-[100] bg-[#161514] p-6 overflow-y-auto animate-in slide-in-from-bottom-8">
            <div className="max-w-xl mx-auto space-y-8 py-12">
               <div className="flex justify-between items-center">
                  <h3 className="text-2xl font-display font-black">
                    {selectedTxn.status === "PENDING" ? "Create Quote" : "Verify Payment"}
                  </h3>
                  <Button variant="ghost" onClick={() => setStep("DASHBOARD")}>Close</Button>
               </div>

               {selectedTxn.status === "PENDING" ? (
                 <div className="space-y-6">
                    <div className="bg-white/[0.03] p-6 rounded-3xl border border-white/10 space-y-4">
                       <div className="flex justify-between text-sm">
                          <span className="text-slate-500">Buyer</span>
                          <span>{selectedTxn.buyer_name}</span>
                       </div>
                       <div className="flex justify-between text-sm">
                          <span className="text-slate-500">Product</span>
                          <span className="text-primary font-bold">{selectedTxn.product_name}</span>
                       </div>
                    </div>

                    <div className="space-y-4">
                       <div className="flex justify-between items-center">
                          <Label className="text-[10px] uppercase tracking-widest text-slate-500">Final Quote Amount ($)</Label>
                          <Button variant="ghost" size="sm" onClick={generateSmartNote} disabled={loading} className="text-[10px] text-primary">
                             <Sparkles className="w-3 h-3 mr-1" /> AI Suggest
                          </Button>
                       </div>
                       <Input type="number" value={quoteForm.amount} onChange={e => setQuoteForm(f => ({ ...f, amount: e.target.value }))} className="bg-black/20 border-white/10 h-14 text-xl font-bold" />
                       <Textarea placeholder="Notes for buyer..." value={quoteForm.notes} onChange={e => setQuoteForm(f => ({ ...f, notes: e.target.value }))} className="bg-black/20 border-white/10" />
                    </div>

                    <div className="bg-white/[0.03] p-6 rounded-3xl border border-white/10 space-y-4">
                       <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Your Bank Details</h4>
                       <div className="grid grid-cols-2 gap-3">
                          <Input placeholder="Acc Number" value={quoteForm.account_number} onChange={e => setQuoteForm(f => ({ ...f, account_number: e.target.value }))} className="bg-black/20 text-xs" />
                          <Input placeholder="Routing No." value={quoteForm.routing_number} onChange={e => setQuoteForm(f => ({ ...f, routing_number: e.target.value }))} className="bg-black/20 text-xs" />
                       </div>
                    </div>

                    <Button onClick={handleSendQuote} className="w-full h-14 bg-primary text-white font-bold rounded-2xl">Send Official Quote</Button>
                 </div>
               ) : (
                 <div className="space-y-6 text-center">
                    <div className="bg-accent/10 p-12 rounded-[3rem] border border-accent/20">
                       <p className="text-[10px] font-bold uppercase text-slate-500">Amount Reported Paid</p>
                       <h4 className="text-6xl font-display font-black text-accent mt-2">${selectedTxn.amount.toFixed(2)}</h4>
                    </div>
                    <p className="text-sm text-slate-400 italic">Verify that the funds are in your account before confirming.</p>
                    <div className="flex gap-4">
                       <Button onClick={() => handleVerifyPayment(true)} className="flex-1 h-16 bg-accent text-white font-bold rounded-2xl">Yes, Confirmed</Button>
                       <Button onClick={() => handleVerifyPayment(false)} variant="outline" className="flex-1 h-16 border-white/10 text-slate-500">Declined</Button>
                    </div>
                 </div>
               )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}