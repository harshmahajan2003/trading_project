import React, { useEffect, useState } from 'react';
import { Newspaper, TrendingUp, TrendingDown, Minus, Loader2, Sparkles } from 'lucide-react';
import { newsService } from '../services/api';

const News = () => {
    const [news, setNews] = useState([]);
    const [loading, setLoading] = useState(true);

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
        <div className="text-white font-sans selection:bg-indigo-500/30">
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
                        <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
                        <p className="text-slate-500 text-sm animate-pulse">Analyzing market sentiment...</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {news.map((item, idx) => (
                            <div key={item.id} className="bg-slate-900/40 border border-slate-800 rounded-2xl overflow-hidden hover:border-indigo-500/30 transition-all hover:shadow-2xl hover:shadow-indigo-500/10 group animate-in fade-in zoom-in duration-500" style={{ animationDelay: `${idx * 100}ms` }}>
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

                                <div className="p-5 space-y-4">
                                    <h3 className="text-lg font-bold leading-snug group-hover:text-indigo-300 transition-colors">
                                        {item.headline}
                                    </h3>

                                    {/* AI Summary Block */}
                                    <div className="bg-indigo-500/5 border border-indigo-500/10 rounded-xl p-3 relative">
                                        <div className="absolute -top-2 -right-2">
                                            <Sparkles className="w-4 h-4 text-indigo-400 fill-indigo-400/20" />
                                        </div>
                                        <p className="text-xs text-slate-300 leading-relaxed">
                                            <span className="text-indigo-400 font-bold mr-1">AI Summary:</span>
                                            {item.summary}
                                        </p>
                                    </div>

                                    {/* Impact Tags */}
                                    {item.impact && item.impact.length > 0 && (
                                        <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-800/50">
                                            {item.impact.map((tag, tIdx) => (
                                                <span key={tIdx} className="text-[10px] font-bold px-2 py-1 bg-slate-800 rounded-md text-slate-400 hover:text-white transition-colors cursor-default">
                                                    #{tag}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default News;
