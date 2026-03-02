
"use client";

import { useState, useEffect } from "react";
import { Store, CheckCircle2, BarChart3, RotateCcw, Sparkles, Share2, PlusCircle, LayoutDashboard } from "lucide-react";
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
import * as API from "@/lib/api";

export default function SellerPage() {
  const [loading, setLoading] = useState(false);
  const [seller, setSeller] = useState<Seller | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [activeTab, setActiveTab] = useState<"DASHBOARD" | "ONBOARDING" | "REVIEW">("ONBOARDING");
  
  const [onboardForm, setOnboardForm] = useState({ business_name: "", seller_name: "", category: "Electronics" });
  const [onboardProducts, setOnboardProducts] = useState<Product[]>([{ name: "", price: 0, description: "" }]);
  const [selectedTxn, setSelectedTxn] = useState<Transaction | null>(null);
  const [quoteForm, setQuoteForm] = useState({ amount: "", notes: "", bank_name: "First National Bank", account_name: "", account_number: "", routing_number: "" });

  const refreshData = async (id: string) => {
    const s = await API.fetchSeller(id);
    const t = await API.fetchTransactions(id);
    setSeller(s);
    setTransactions(t);
    if (s) setActiveTab("DASHBOARD");
  };

  const handleOnboard = async () => {
    setLoading(true);
    const id = onboardForm.business_name.toLowerCase().replace(/\s+/g, '-');
    const newSeller: Seller = {
      cela_id: id,
      ...onboardForm,
      products: onboardProducts.filter(p => p.name && p.price > 0),
      stats: { pending: 0, awaiting: 0, completed: 0, declined: 0 }
    };
    await API.onboardSeller(newSeller);
    await refreshData(id);
    setLoading(false);
  };

  const handleSendQuote = async () => {
    if (!selectedTxn) return;
    setLoading(true);
    await API.updateTransactionStatus(selectedTxn.txn_id, "AWAITING", {
      amount: parseFloat(quoteForm.amount),
      notes: quoteForm.notes,
      bank_details: {
        bank_name: quoteForm.bank_name,
        account_name: quoteForm.account_name || seller?.business_name || "",
        account_number: quoteForm.account_number,
        routing_number: quoteForm.routing_number,
      }
    });
    if (seller) await refreshData(seller.cela_id);
    setLoading(false);
    setActiveTab("DASHBOARD");
    setSelectedTxn(null);
  };

  const handleVerifyPayment = async (confirmed: boolean) => {
    if (!selectedTxn) return;
    await API.updateTransactionStatus(selectedTxn.txn_id, confirmed ? "COMPLETED" : "DECLINED");
    if (seller) await refreshData(seller.cela_id);
    setActiveTab("DASHBOARD");
    setSelectedTxn(null);
  };

  const generateAILegalNote = async () => {
    if (!selectedTxn) return;
    setLoading(true);
    const note = await API.generateAIAssistedNote({
      productName: selectedTxn.product_name,
      buyerMessage: selectedTxn.message || ""
    });
    setQuoteForm(prev => ({ ...prev, notes: note }));
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#161514] text-slate-100 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-4xl mx-auto w-full p-6 lg:p-12 space-y-8">
        {!seller && activeTab === "ONBOARDING" && (
          <div className="space-y-8 animate-in fade-in slide-in-from-top-4">
            <div className="text-center space-y-2">
              <h2 className="text-3xl font-display font-black">Merchant Onboarding</h2>
              <p className="text-sm text-slate-500">Setup your business profile to start accepting settlements.</p>
            </div>

            <div className="bg-white/[0.02] border border-white/[0.07] rounded-[2rem] p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-[10px] uppercase tracking-widest text-slate-500">Business Name</Label>
                  <Input 
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
                  <Label className="text-[10px] uppercase tracking-widest text-slate-500">Catalog</Label>
                  <Button variant="ghost" size="sm" onClick={() => setOnboardProducts([...onboardProducts, { name: "", price: 0 }])} className="text-primary hover:bg-primary/10">
                    <PlusCircle className="w-4 h-4 mr-2" /> Add Item
                  </Button>
                </div>
                {onboardProducts.map((p, i) => (
                  <div key={i} className="flex gap-3">
                    <Input placeholder="Item Name" value={p.name} onChange={e => {
                      const n = [...onboardProducts]; n[i].name = e.target.value; setOnboardProducts(n);
                    }} className="bg-black/20 border-white/10 rounded-xl flex-1" />
                    <Input 
                        type="number" 
                        placeholder="Price" 
                        value={isNaN(p.price) ? "" : p.price} 
                        onChange={e => {
                          const n = [...onboardProducts]; n[i].price = parseFloat(e.target.value) || 0; setOnboardProducts(n);
                        }} 
                        className="bg-black/20 border-white/10 rounded-xl w-28" 
                    />
                  </div>
                ))}
              </div>

              <Button onClick={handleOnboard} disabled={loading} className="w-full h-14 rounded-2xl bg-primary text-white font-bold text-lg">
                {loading ? "Processing..." : "Create Merchant Account"}
              </Button>
            </div>
          </div>
        )}

        {seller && activeTab === "DASHBOARD" && (
          <div className="space-y-8 animate-in fade-in">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-3xl font-display font-black leading-none">{seller.business_name}</h2>
                <div className="flex items-center gap-2 mt-2">
                  <StatusBadge status="LIVE" />
                  <span className="text-[10px] font-mono text-slate-500 uppercase tracking-tighter">Merchant ID: {seller.cela_id}</span>
                </div>
              </div>
              <Button variant="outline" className="rounded-xl border-white/10">
                <BarChart3 className="w-4 h-4 mr-2" /> Analytics
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { label: "New Requests", value: transactions.filter(t => t.status === "PENDING").length, icon: RotateCcw, color: "text-amber-500" },
                { label: "Completed", value: transactions.filter(t => t.status === "COMPLETED").length, icon: CheckCircle2, color: "text-accent" },
                { label: "Share ID", value: seller.cela_id, icon: Share2, color: "text-primary" },
              ].map((stat, i) => (
                <Card key={i} className="bg-white/[0.03] border-white/10 rounded-3xl p-6">
                  <div className="flex justify-between items-start">
                    <stat.icon className={cn("w-5 h-5", stat.color)} />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{stat.label}</span>
                  </div>
                  <div className="mt-4 text-2xl font-display font-black truncate">{stat.value}</div>
                </Card>
              ))}
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-widest text-slate-500">Recent Transactions</h3>
              <div className="grid grid-cols-1 gap-4">
                {transactions.length === 0 ? (
                  <div className="py-20 text-center opacity-30 bg-white/[0.01] border border-dashed border-white/10 rounded-[2rem]">
                    <LayoutDashboard className="w-12 h-12 mx-auto mb-4" />
                    <p className="text-sm">No active transactions at this time.</p>
                  </div>
                ) : (
                  transactions.map((t, i) => (
                    <div key={i} className="bg-white/[0.03] border border-white/10 p-6 rounded-3xl flex flex-col md:flex-row justify-between items-center gap-6">
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-3">
                          <span className="font-bold">{t.buyer_name}</span>
                          <StatusBadge status={t.status} className="scale-75" />
                        </div>
                        <p className="text-xs text-slate-500">{t.product_name} (Qty: {t.quantity})</p>
                      </div>
                      
                      {t.status === "PENDING" && (
                        <Button onClick={() => { setSelectedTxn(t); setActiveTab("REVIEW"); setQuoteForm(f => ({ ...f, amount: t.amount.toString() })); }} className="bg-primary">Review & Quote</Button>
                      )}
                      {t.status === "PAYMENT_SUBMITTED" && (
                         <Button onClick={() => { setSelectedTxn(t); setActiveTab("REVIEW"); }} className="bg-accent text-white">Verify Payment</Button>
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

        {activeTab === "REVIEW" && selectedTxn && (
          <div className="space-y-8 animate-in slide-in-from-bottom-8">
            <div className="flex justify-between items-center">
               <h3 className="text-2xl font-display font-black">
                 {selectedTxn.status === "PENDING" ? "Generate Quote" : "Confirm Settlement"}
               </h3>
               <Button variant="ghost" onClick={() => setActiveTab("DASHBOARD")}>Back to Console</Button>
            </div>

            {selectedTxn.status === "PENDING" ? (
              <div className="space-y-6">
                 <div className="bg-white/[0.03] p-6 rounded-3xl border border-white/10 space-y-4">
                    <div className="flex justify-between text-sm">
                       <span className="text-slate-500">Customer</span>
                       <span>{selectedTxn.buyer_name}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                       <span className="text-slate-500">Service/Item</span>
                       <span className="text-primary font-bold">{selectedTxn.product_name}</span>
                    </div>
                 </div>

                 <div className="space-y-4">
                    <div className="flex justify-between items-center">
                       <Label className="text-[10px] uppercase tracking-widest text-slate-500">Quote Amount ($)</Label>
                       <Button variant="ghost" size="sm" onClick={generateAILegalNote} disabled={loading} className="text-[10px] text-primary">
                          <Sparkles className="w-3 h-3 mr-1" /> Smart Suggest Note
                       </Button>
                    </div>
                    <Input 
                      type="number" 
                      value={quoteForm.amount} 
                      onChange={e => setQuoteForm(f => ({ ...f, amount: e.target.value }))} 
                      className="bg-black/20 border-white/10 h-14 text-xl font-bold" 
                    />
                    <Textarea placeholder="Include professional notes..." value={quoteForm.notes} onChange={e => setQuoteForm(f => ({ ...f, notes: e.target.value }))} className="bg-black/20 border-white/10" />
                 </div>

                 <div className="bg-white/[0.03] p-6 rounded-3xl border border-white/10 space-y-4">
                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Settlement Destination</h4>
                    <div className="grid grid-cols-2 gap-3">
                       <Input placeholder="Account No." value={quoteForm.account_number} onChange={e => setQuoteForm(f => ({ ...f, account_number: e.target.value }))} className="bg-black/20 text-xs" />
                       <Input placeholder="Routing No." value={quoteForm.routing_number} onChange={e => setQuoteForm(f => ({ ...f, routing_number: e.target.value }))} className="bg-black/20 text-xs" />
                    </div>
                 </div>

                 <Button onClick={handleSendQuote} disabled={loading} className="w-full h-14 bg-primary text-white font-bold rounded-2xl">
                    {loading ? "Generating..." : "Submit Official Quote"}
                 </Button>
              </div>
            ) : (
              <div className="space-y-6 text-center">
                 <div className="bg-accent/10 p-12 rounded-[3rem] border border-accent/20">
                    <p className="text-[10px] font-bold uppercase text-slate-500">Settlement Reported</p>
                    <h4 className="text-6xl font-display font-black text-accent mt-2">${selectedTxn.amount.toFixed(2)}</h4>
                 </div>
                 <p className="text-sm text-slate-400 italic">Verify the funds have reached your account before confirming.</p>
                 <div className="flex gap-4">
                    <Button onClick={() => handleVerifyPayment(true)} className="flex-1 h-16 bg-accent text-white font-bold rounded-2xl">Confirm Receipt</Button>
                    <Button onClick={() => handleVerifyPayment(false)} variant="outline" className="flex-1 h-16 border-white/10 text-slate-500">Dispute</Button>
                 </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
