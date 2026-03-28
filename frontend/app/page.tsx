"use client";

import { useState } from "react";
import { Search, FileText, Loader2, ThumbsUp, ThumbsDown, Minus, TrendingUp, CheckCircle2, XCircle, Swords, Trophy, Package } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Citation {
  text: string;
  quote: string;
}

interface AnalyzeResponse {
  product_name: string;
  predicted_rating: number;
  sentiment: { positive: number; neutral: number; negative: number; };
  aspects: Record<string, string>;
  summary: string;
  pros: Citation[];
  cons: Citation[];
  verdict: string;
}

interface CompareResponse {
  product_a: AnalyzeResponse;
  product_b: AnalyzeResponse;
  comparison: {
    winner: string;
    summary: string;
    aspect_winners: Record<string, string>;
  };
}

export default function Home() {
  const [activeTab, setActiveTab] = useState<"url" | "manual" | "versus">("url");
  const [url, setUrl] = useState("");
  const [urlB, setUrlB] = useState("");
  const [manualText, setManualText] = useState("");
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<AnalyzeResponse | null>(null);
  const [compareResults, setCompareResults] = useState<CompareResponse | null>(null);

  const handleAnalyze = async () => {
    setLoading(true); setError(null); setResults(null); setCompareResults(null);

    try {
      if (activeTab === "versus") {
        // --- UPDATED RENDER URL ---
        const response = await fetch("https://reviewsense-api.onrender.com/api/v1/compare", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url_a: url, url_b: urlB }),
        });
        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.detail || "Failed to compare products.");
        }
        setCompareResults(await response.json());
      } else {
        // --- UPDATED RENDER URLs ---
        const endpoint = activeTab === "url" 
          ? "https://reviewsense-api.onrender.com/api/v1/analyze" 
          : "https://reviewsense-api.onrender.com/api/v1/analyze/manual";
          
        const payload = activeTab === "url" ? { url } : { reviews: manualText.split("\n").filter((r) => r.trim() !== "") };

        const response = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.detail || "Failed to analyze product.");
        }
        setResults(await response.json());
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getRatingColor = (rating: number) => {
    if (rating >= 4.0) return "text-emerald-500";
    if (rating >= 3.0) return "text-amber-500";
    return "text-rose-500";
  };

  const getVerdictStyles = (verdict: string) => {
    switch (verdict?.toUpperCase()) {
      case "BUY": return "bg-emerald-100 text-emerald-700 border-emerald-200 shadow-emerald-100";
      case "CONSIDER": return "bg-amber-100 text-amber-700 border-amber-200 shadow-amber-100";
      case "AVOID": return "bg-rose-100 text-rose-700 border-rose-200 shadow-rose-100";
      default: return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 font-sans selection:bg-indigo-100 pb-16">
      <div className="bg-slate-900 border-b border-slate-800 pb-24 pt-16 px-8">
        <div className="max-w-5xl mx-auto text-center space-y-4">
          <h1 className="text-5xl font-extrabold tracking-tight text-white">
            Review<span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">Sense</span>
          </h1>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">
            Extract sentiment, identify key aspects, or compare two products head-to-head.
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-8 -mt-12 space-y-8">
        {/* Input Card */}
        <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/40 border border-slate-100 overflow-hidden transition-all">
          <div className="flex border-b border-slate-100 bg-slate-50/50">
            <button onClick={() => setActiveTab("url")} className={`flex-1 py-4 text-sm font-medium flex items-center justify-center gap-2 ${activeTab === "url" ? "border-b-2 border-indigo-600 text-indigo-700 bg-white" : "text-slate-500 hover:text-slate-700"}`}><Search className="w-4 h-4" /> Single URL</button>
            <button onClick={() => setActiveTab("manual")} className={`flex-1 py-4 text-sm font-medium flex items-center justify-center gap-2 ${activeTab === "manual" ? "border-b-2 border-indigo-600 text-indigo-700 bg-white" : "text-slate-500 hover:text-slate-700"}`}><FileText className="w-4 h-4" /> Manual Entry</button>
            <button onClick={() => setActiveTab("versus")} className={`flex-1 py-4 text-sm font-medium flex items-center justify-center gap-2 ${activeTab === "versus" ? "border-b-2 border-purple-600 text-purple-700 bg-white" : "text-slate-500 hover:text-slate-700"}`}><Swords className="w-4 h-4" /> Versus Mode</button>
          </div>

          <div className="p-8 space-y-6">
            {activeTab === "url" && (
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Product URL</label>
                <input type="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="e.g., https://www.amazon.com/dp/B08N5WRWNW" className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all text-slate-900 bg-white placeholder:text-slate-400" />
              </div>
            )}
            
            {activeTab === "manual" && (
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Paste Customer Reviews</label>
                <textarea value={manualText} onChange={(e) => setManualText(e.target.value)} placeholder="Paste reviews here, one per line..." rows={5} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all resize-y text-slate-900 bg-white placeholder:text-slate-400" />
              </div>
            )}

            {activeTab === "versus" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block">Product A</label>
                  <input type="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="First Amazon URL" className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 outline-none transition-all text-slate-900 bg-white placeholder:text-slate-400" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block">Product B</label>
                  <input type="url" value={urlB} onChange={(e) => setUrlB(e.target.value)} placeholder="Second Amazon URL" className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 outline-none transition-all text-slate-900 bg-white placeholder:text-slate-400" />
                </div>
              </div>
            )}

            <button onClick={handleAnalyze} disabled={loading || (activeTab === "url" && !url) || (activeTab === "manual" && !manualText) || (activeTab === "versus" && (!url || !urlB))} className={`w-full text-white font-semibold py-4 px-4 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-md ${activeTab === 'versus' ? 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 shadow-purple-200' : 'bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 shadow-indigo-200'}`}>
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : activeTab === 'versus' ? "Compare Products" : "Generate AI Insights"}
            </button>
            {error && <div className="p-4 bg-rose-50 text-rose-700 rounded-xl text-sm border border-rose-100 flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-rose-500" /> {error}</div>}
          </div>
        </div>

        {/* SINGLE URL / MANUAL DASHBOARD */}
        <AnimatePresence>
          {results && activeTab !== "versus" && (
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: "easeOut" }} className="space-y-6">
              
              <div className="flex items-center gap-3 mb-2">
                <Package className="w-6 h-6 text-indigo-500" />
                <h2 className="text-2xl font-black text-slate-800">{results.product_name}</h2>
              </div>

              <div className="bg-gradient-to-br from-indigo-50 to-blue-50 p-6 rounded-2xl border border-indigo-100 flex gap-4 items-start shadow-sm">
                <div className="bg-indigo-100 p-3 rounded-xl text-indigo-600 shrink-0"><TrendingUp className="w-6 h-6" /></div>
                <div><h3 className="font-semibold text-indigo-900 mb-1">AI Executive Summary</h3><p className="text-indigo-800/80 leading-relaxed">{results.summary}</p></div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center justify-center relative overflow-hidden">
                  <div className="absolute top-0 w-full h-1 bg-gradient-to-r from-indigo-400 to-blue-500" />
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Overall Score</span>
                  <span className={`text-7xl font-black tracking-tighter ${getRatingColor(results.predicted_rating)}`}>{results.predicted_rating.toFixed(1)}</span>
                  <span className="text-slate-400 font-medium mt-1 mb-6">out of 5.0</span>
                  {results.verdict && <div className={`px-6 py-2 rounded-full border shadow-sm font-bold tracking-widest text-sm ${getVerdictStyles(results.verdict)}`}>VERDICT: {results.verdict.toUpperCase()}</div>}
                </div>

                <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 md:col-span-2 flex flex-col justify-center">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6">Sentiment Breakdown</span>
                  <div className="space-y-5 w-full">
                    {Object.entries(results.sentiment).map(([key, value]) => {
                      const total = results.sentiment.positive + results.sentiment.neutral + results.sentiment.negative;
                      const percentage = total === 0 ? 0 : Math.round((value / total) * 100);
                      const colorClass = key === 'positive' ? 'bg-emerald-500' : key === 'neutral' ? 'bg-amber-400' : 'bg-rose-500';
                      return (
                        <div key={key} className="flex items-center gap-4">
                          <span className="w-20 text-sm font-semibold capitalize text-slate-600">{key}</span>
                          <div className="flex-1 h-2.5 bg-slate-100 rounded-full overflow-hidden"><motion.div initial={{ width: 0 }} animate={{ width: `${percentage}%` }} transition={{ duration: 1, delay: 0.2 }} className={`h-full ${colorClass}`} /></div>
                          <span className="w-12 text-right text-sm font-bold text-slate-600">{percentage}%</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {results.pros && results.cons && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Single Product Pros with Quotes */}
                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <span className="text-xs font-bold text-emerald-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4" /> Top Pros
                    </span>
                    <ul className="space-y-4">
                      {results.pros.map((pro, idx) => (
                        <li key={idx} className="flex flex-col gap-1.5">
                          <div className="flex items-start gap-3 text-slate-800 font-medium">
                            <span className="mt-1 w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                            <span>{pro.text}</span>
                          </div>
                          <div className="ml-4 pl-3 border-l-2 border-slate-200 text-xs text-slate-500 italic">
                            "{pro.quote}"
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Single Product Cons with Quotes */}
                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <span className="text-xs font-bold text-rose-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                      <XCircle className="w-4 h-4" /> Top Cons
                    </span>
                    <ul className="space-y-4">
                      {results.cons.map((con, idx) => (
                        <li key={idx} className="flex flex-col gap-1.5">
                          <div className="flex items-start gap-3 text-slate-800 font-medium">
                            <span className="mt-1 w-1.5 h-1.5 rounded-full bg-rose-400 shrink-0" />
                            <span>{con.text}</span>
                          </div>
                          <div className="ml-4 pl-3 border-l-2 border-slate-200 text-xs text-slate-500 italic">
                            "{con.quote}"
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100"><span className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6 block">Feature Consensus</span><div className="grid grid-cols-2 md:grid-cols-4 gap-4">{Object.entries(results.aspects).map(([aspect, sentiment]) => {
                    const isPos = sentiment.toLowerCase() === "positive";
                    const isNeg = sentiment.toLowerCase() === "negative";
                    return (<div key={aspect} className={`flex items-center justify-between p-4 rounded-xl border ${isPos ? 'bg-emerald-50 border-emerald-100' : isNeg ? 'bg-rose-50 border-rose-100' : 'bg-slate-50 border-slate-200'}`}><span className={`font-semibold capitalize ${isPos ? 'text-emerald-700' : isNeg ? 'text-rose-700' : 'text-slate-600'}`}>{aspect}</span>{isPos ? <ThumbsUp className="w-5 h-5 text-emerald-500" /> : isNeg ? <ThumbsDown className="w-5 h-5 text-rose-500" /> : <Minus className="w-5 h-5 text-slate-400" />}</div>)
                  })}</div></div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* VERSUS MODE DASHBOARD */}
        <AnimatePresence>
          {compareResults && activeTab === "versus" && (
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: "easeOut" }} className="space-y-6">
              
              <div className="bg-gradient-to-r from-amber-100 via-yellow-50 to-amber-100 p-8 rounded-2xl border border-yellow-200 text-center shadow-sm">
                <Trophy className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
                <h2 className="text-3xl font-black text-slate-900 mb-2">Winner: {compareResults.comparison.winner}</h2>
                <p className="text-slate-700 max-w-3xl mx-auto">{compareResults.comparison.summary}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[
                  { name: compareResults.product_a.product_name || "Product A", data: compareResults.product_a },
                  { name: compareResults.product_b.product_name || "Product B", data: compareResults.product_b }
                ].map((prod, idx) => (
                  <div key={idx} className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 flex flex-col">
                    <h3 className="text-2xl font-black text-slate-800 mb-6 pb-4 border-b border-slate-100">{prod.name}</h3>
                    <div className="flex items-center justify-between mb-8">
                      <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">Overall Score</span>
                      <span className={`text-6xl font-black tracking-tighter ${getRatingColor(prod.data.predicted_rating)}`}>{prod.data.predicted_rating.toFixed(1)}</span>
                    </div>
                    
                    <div className="space-y-8 flex-1">
                      {/* Versus Mode Pros with Quotes */}
                      <div>
                        <span className="text-xs font-bold text-emerald-500 uppercase flex items-center gap-2 mb-4">
                          <CheckCircle2 className="w-4 h-4"/> Pros
                        </span>
                        <ul className="space-y-4">
                          {prod.data.pros.map((p, i) => (
                            <li key={i} className="flex flex-col gap-1.5">
                              <div className="flex items-start gap-2 text-slate-700 font-medium text-sm">
                                <span className="text-emerald-400 mt-0.5">•</span> 
                                <span>{p.text}</span>
                              </div>
                              <div className="ml-3 pl-3 border-l border-slate-200 text-xs text-slate-500 italic">
                                "{p.quote}"
                              </div>
                            </li>
                          ))}
                        </ul>
                      </div>
                      
                      {/* Versus Mode Cons with Quotes */}
                      <div>
                        <span className="text-xs font-bold text-rose-500 uppercase flex items-center gap-2 mb-4">
                          <XCircle className="w-4 h-4"/> Cons
                        </span>
                        <ul className="space-y-4">
                          {prod.data.cons.map((c, i) => (
                            <li key={i} className="flex flex-col gap-1.5">
                              <div className="flex items-start gap-2 text-slate-700 font-medium text-sm">
                                <span className="text-rose-400 mt-0.5">•</span> 
                                <span>{c.text}</span>
                              </div>
                              <div className="ml-3 pl-3 border-l border-slate-200 text-xs text-slate-500 italic">
                                "{c.quote}"
                              </div>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}