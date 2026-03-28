import React, { useEffect, useState } from 'react';
import { Newspaper, TrendingUp, TrendingDown, Minus, Loader2, Sparkles, X, ChevronRight, Share2, Bookmark } from 'lucide-react';
import { newsService } from '../services/api';

const NewsDetailModal = ({ item, onClose }) => {
    if (!item) return null;

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div 
                className="bg-slate-900 border border-slate-800 w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 slide-in-from-bottom-4 duration-500"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="relative h-64 sm:h-80">
                    <img src={item.image} alt={item.headline} className="w-full h-full object-cover" />
                    <div className="absolute top-4 right-4 flex gap-2">
                        <button onClick={onClose} className="p-2 bg-black/50 hover:bg-black/80 rounded-full text-white transition-all">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent p-6 pt-20">
                        <div className="flex items-center gap-3 mb-3">
                            <span className="bg-indigo-500 text-white text-[10px] font-black px-2 py-0.5 rounded-sm uppercase tracking-tighter">
                                {item.source}
                            </span>
                            <span className="text-slate-300 text-[10px] font-bold uppercase tracking-widest">{item.time}</span>
                        </div>
                        <h2 className="text-xl sm:text-2xl font-black text-white leading-tight">{item.headline}</h2>
                    </div>
                </div>

                <div className="p-6 sm:p-8 space-y-6 max-h-[50vh] overflow-y-auto custom-scrollbar">
                    <div className="flex items-center justify-between py-4 border-y border-slate-800/50">
                        <div className="flex gap-4">
                            <div className="flex items-center gap-2">
                                {item.sentiment === 'Bullish' ? <TrendingUp className="w-4 h-4 text-emerald-500" /> : item.sentiment === 'Bearish' ? <TrendingDown className="w-4 h-4 text-rose-500" /> : <Minus className="w-4 h-4 text-slate-500" />}
                                <span className={`text-xs font-bold ${item.sentiment === 'Bullish' ? 'text-emerald-400' : item.sentiment === 'Bearish' ? 'text-rose-400' : 'text-slate-400'}`}>
                                    {item.sentiment} Market Impact
                                </span>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <button className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all"><Share2 className="w-4 h-4" /></button>
                            <button className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all"><Bookmark className="w-4 h-4" /></button>
                        </div>
                    </div>

                    <div className="prose prose-invert max-w-none">
                        <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">
                            {item.content || "Full report content is currently being processed by our AI analysis engine. Check back shortly for deep-dive insights."}
                        </p>
                    </div>

                    {item.summary && (
                        <div className="bg-indigo-500/5 border border-indigo-500/10 rounded-2xl p-4 relative">
                            <div className="absolute top-4 right-4">
                                <Sparkles className="w-4 h-4 text-indigo-400" />
                            </div>
                            <h4 className="text-indigo-400 text-xs font-black uppercase tracking-widest mb-2">AI Key Takeaway</h4>
                            <p className="text-slate-100 text-xs leading-relaxed font-medium italic">"{item.summary}"</p>
                        </div>
                    )}

                    {item.impact && item.impact.length > 0 && (
                        <div className="space-y-3">
                            <h4 className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Ticker Watchlist</h4>
                            <div className="flex flex-wrap gap-2">
                                {item.impact.map((tag) => (
                                    <span key={tag} className="bg-slate-800 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg border border-slate-700">
                                        ${tag}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
                
                <div className="p-4 bg-slate-800/30 border-t border-slate-800 flex justify-end">
                    <button 
                        onClick={onClose}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-6 py-2.5 rounded-xl transition-all shadow-lg shadow-indigo-600/20"
                    >
                        Done Reading
                    </button>
                </div>
            </div>
        </div>
    );
};

const News = () => {
    const [news, setNews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedNews, setSelectedNews] = useState(null);

    useEffect(() => {
        const fetchNews = async () => {
            try {
                const data = await newsService.getLatestNews();
                setNews(data);
            } catch (err) {
                console.error("Failed to load news", err);
            } finally {
                setLoading(false);
            }
        };
        fetchNews();
    }, []);

    const getSentimentBadge = (sentiment) => {
        if (sentiment === 'Bullish') return <span className="flex items-center gap-1 bg-emerald-500/20 text-emerald-400 text-xs font-bold px-2 py-1 rounded-full border border-emerald-500/30"><TrendingUp className="w-3 h-3" /> Bullish</span>;
        if (sentiment === 'Bearish') return <span className="flex items-center gap-1 bg-rose-500/20 text-rose-400 text-xs font-bold px-2 py-1 rounded-full border border-rose-500/30"><TrendingDown className="w-3 h-3" /> Bearish</span>;
        return <span className="flex items-center gap-1 bg-slate-500/20 text-slate-400 text-xs font-bold px-2 py-1 rounded-full border border-slate-500/30"><Minus className="w-3 h-3" /> Neutral</span>;
    };

    return (
        <div className="text-white font-sans selection:bg-indigo-500/30 min-h-screen">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <header className="mb-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <h1 className="text-4xl font-black tracking-tighter mb-2 flex items-center gap-3">
                        <Newspaper className="w-8 h-8 text-indigo-500" />
                        Market Pulse
                    </h1>
                    <p className="text-slate-400 text-lg">Real-time financial news powered by <span className="text-indigo-400 font-bold flex items-center gap-1 inline-flex"><Sparkles className="w-3 h-3" /> AI Analysis</span></p>
                </header>

                {loading ? (
                    <div className="flex flex-col items-center justify-center h-64 space-y-4">
                        <div className="relative">
                            <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
                            <Sparkles className="absolute -top-1 -right-1 w-4 h-4 text-indigo-400 animate-pulse" />
                        </div>
                        <p className="text-slate-500 text-sm font-medium animate-pulse">Analyzing global market sentiment...</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {news.map((item, idx) => (
                            <div 
                                key={item.id} 
                                onClick={() => setSelectedNews(item)}
                                className="bg-slate-900/40 border border-slate-800 rounded-3xl overflow-hidden hover:border-indigo-500/30 transition-all hover:shadow-2xl hover:shadow-indigo-500/10 group animate-in fade-in zoom-in duration-500 cursor-pointer flex flex-col" 
                                style={{ animationDelay: `${idx * 100}ms` }}
                            >
                                <div className="h-48 overflow-hidden relative">
                                    <img src={item.image} alt={item.headline} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                                    <div className="absolute top-3 right-3">
                                        {getSentimentBadge(item.sentiment)}
                                    </div>
                                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent p-4 pt-12">
                                        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                                            <span className="text-indigo-400">{item.source}</span>
                                            <span>•</span>
                                            <span>{item.time}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-6 space-y-4 flex-grow flex flex-col justify-between">
                                    <h3 className="text-lg font-bold leading-snug group-hover:text-indigo-300 transition-colors line-clamp-2">
                                        {item.headline}
                                    </h3>

                                    {/* AI Summary Preview */}
                                    <div className="bg-indigo-500/5 border border-indigo-500/10 rounded-2xl p-3 relative group-hover:bg-indigo-500/10 transition-colors">
                                        <div className="absolute -top-2 -right-2">
                                            <Sparkles className="w-4 h-4 text-indigo-400 fill-indigo-400/20" />
                                        </div>
                                        <p className="text-[11px] text-slate-300 leading-relaxed line-clamp-2 italic">
                                            {item.summary}
                                        </p>
                                    </div>

                                    <div className="flex items-center justify-between pt-2 border-t border-white/5">
                                        <div className="flex -space-x-1">
                                            {item.impact?.slice(0, 2).map((tag) => (
                                                <div key={tag} className="w-6 h-6 rounded-full bg-slate-800 border-2 border-slate-900 flex items-center justify-center text-[8px] font-bold text-slate-400">
                                                    {tag[0]}
                                                </div>
                                            ))}
                                        </div>
                                        <span className="flex items-center gap-1 text-[10px] uppercase font-black tracking-widest text-indigo-400 group-hover:translate-x-1 transition-transform">
                                            Read More <ChevronRight className="w-3 h-3" />
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Detail Modal */}
            {selectedNews && (
                <NewsDetailModal 
                    item={selectedNews} 
                    onClose={() => setSelectedNews(null)} 
                />
            )}
        </div>
    );
};

export default News;
