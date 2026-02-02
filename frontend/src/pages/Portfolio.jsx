import { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Briefcase, TrendingUp, TrendingDown, DollarSign, Activity, Timer, Wallet, Zap, ShieldCheck, ArrowRight, Info, Plus, Minus, Loader2 } from 'lucide-react';
import { tradeService, walletService, paymentService, stockService } from '../services/api';
import { socket } from '../services/socket';
import { cn } from '../utils/cn';
import QuickTradeModal from '../components/QuickTradeModal';
import { useNavigate } from 'react-router-dom';

const Portfolio = () => {
    const [holdings, setHoldings] = useState([]);
    const [orders, setOrders] = useState([]);
    const [balance, setBalance] = useState(0);
    const [loading, setLoading] = useState(true);
    const [livePrices, setLivePrices] = useState({});
    const [allStocks, setAllStocks] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [tradeModal, setTradeModal] = useState({ show: false, symbol: '', side: 'BUY', price: 0 });

    const navigate = useNavigate();

    const fetchPortfolio = async () => {
        try {
            const [holdingsData, balData, ordersData, stocksData] = await Promise.all([
                tradeService.getHoldings(),
                walletService.getBalance(),
                tradeService.getOrders(),
                stockService.getStocks()
            ]);

            setHoldings(Array.isArray(holdingsData) ? holdingsData : []);
            setBalance(balData?.balance || 0);
            setOrders(Array.isArray(ordersData) ? ordersData : []);
            setAllStocks(Array.isArray(stocksData) ? stocksData : []);

            const prices = {};
            if (Array.isArray(stocksData)) {
                stocksData.forEach(s => {
                    prices[s.symbol] = { price: s.price, change: s.changePercent || 0 };
                });
            }
            setLivePrices(prices);
        } catch (err) {
            console.error("Portfolio refresh error:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const handlePriceUpdate = (data) => {
            if (data && data.symbol) {
                setLivePrices(prev => ({
                    ...prev,
                    [data.symbol]: {
                        price: data.price,
                        change: data.change
                    }
                }));
            }
        };

        socket.on('stockUpdate', handlePriceUpdate);
        return () => {
            socket.off('stockUpdate', handlePriceUpdate);
        };
    }, []);

    useEffect(() => {
        const checkPayment = async () => {
            const urlParams = new URLSearchParams(window.location.search);
            const sessionId = urlParams.get('session_id');
            const status = urlParams.get('payment');

            if (status === 'success' && sessionId) {
                setLoading(true);
                try {
                    await paymentService.verifyPayment(sessionId);
                    window.history.replaceState({}, document.title, window.location.pathname);
                } catch (err) {
                    console.error("❌ Payment verification failed:", err);
                } finally {
                    fetchPortfolio();
                }
            } else {
                fetchPortfolio();
            }
        };

        checkPayment();
    }, []);

    const portfolioMetrics = holdings.reduce((acc, h) => {
        const symbol = h.symbol || h.stockSymbol || '';
        const liveData = livePrices[symbol] || {};
        const ltp = (liveData && typeof liveData === 'object' ? liveData.price : liveData) || h.currentPrice || h.averagePrice || h.avgPrice || 0;
        const avg = h.avgPrice || h.averagePrice || 0;
        const qty = h.quantity || 0;
        const changePct = (liveData && typeof liveData === 'object' ? liveData.change : 0) || 0;

        const invested = qty * avg;
        const current = qty * ltp;
        const pnl = current - invested;

        const prevClose = ltp / (1 + (changePct / 100));
        const dayPnlAmt = ltp > 0 ? (ltp - prevClose) * qty : 0;

        acc.totalInvested += invested;
        acc.totalCurrentValue += current;
        acc.totalPnl += pnl;
        acc.totalDayPnl += dayPnlAmt;
        return acc;
    }, { totalInvested: 0, totalCurrentValue: 0, totalPnl: 0, totalDayPnl: 0 });

    const { totalInvested, totalCurrentValue, totalPnl, totalDayPnl } = portfolioMetrics;

    const COLORS = ['#4f46e5', '#8b5cf6', '#ec4899', '#f43f5e', '#f59e0b', '#10b981'];

    const pieData = holdings.map(h => {
        const symbol = h.symbol || h.stockSymbol || '';
        const liveData = livePrices[symbol] || {};
        const currentPrice = (liveData && typeof liveData === 'object' ? liveData.price : liveData) || h.avgPrice || h.averagePrice || 0;
        return {
            name: symbol || 'Unknown',
            value: (h.quantity || 0) * currentPrice
        };
    });

    const filteredStocks = searchQuery
        ? allStocks.filter(s =>
            (s.symbol || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            (s.name || '').toLowerCase().includes(searchQuery.toLowerCase())
        ).slice(0, 5)
        : [];

    if (loading) return <div className="animate-pulse text-indigo-500 p-8 flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-10 h-10 animate-spin" />
    </div>;

    return (
        <div className="space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 text-white pb-10">
            {/* Top Header with Title and Buying Power */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 md:gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight uppercase">Portfolio</h1>
                    <p className="text-xs md:text-sm text-slate-500 font-bold uppercase tracking-wider">Monitor your active positions & performance</p>
                </div>
                <div className="bg-emerald-500/10 border border-emerald-500/20 px-5 py-3 rounded-2xl flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
                        <Wallet className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="text-[10px] text-emerald-400 font-black uppercase tracking-widest leading-none mb-1">Buying Power</p>
                        <h2 className="text-lg md:text-xl font-black text-white leading-none">₹{(balance || 0).toLocaleString('en-IN')}</h2>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    {/* Main Portfolio Container */}
                    <div className="bg-slate-900/40 border border-slate-800 rounded-[2.5rem] overflow-hidden backdrop-blur-sm shadow-2xl">
                        <div className="p-6 md:p-8 border-b border-slate-800 flex items-center justify-between bg-slate-800/20">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-indigo-500/10 text-indigo-500 rounded-xl">
                                    <Briefcase className="w-5 h-5 font-bold" />
                                </div>
                                <h3 className="text-xl font-black text-white uppercase tracking-widest">Active Positions</h3>
                            </div>
                            <div className="px-4 py-1.5 bg-indigo-500/10 border border-indigo-500/20 rounded-full">
                                <span className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em]">{holdings.length} Assets</span>
                            </div>
                        </div>

                        {/* Metrics Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-slate-800 border-b border-slate-800">
                            {[
                                { l: 'Invested', v: totalInvested },
                                { l: 'Current', v: totalCurrentValue },
                                { l: 'Total P&L', v: totalPnl, p: true },
                                { l: 'Day P&L', v: totalDayPnl, p: true }
                            ].map((c, i) => (
                                <div key={i} className="bg-[#0f172a]/40 p-5 md:p-7 border-l first:border-l-0 border-slate-800 hover:bg-slate-800/30 transition-colors">
                                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2">{c.l}</p>
                                    <p className={cn("text-lg md:text-2xl font-black tracking-tight", c.p ? (c.v >= 0 ? "text-emerald-500" : "text-rose-500") : "text-white")}>
                                        {c.p && c.v >= 0 ? '+' : ''}₹{c.v.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                                    </p>
                                </div>
                            ))}
                        </div>

                        {/* Mobile Card View */}
                        <div className="block md:hidden border-t border-slate-800">
                            {holdings.length > 0 ? holdings.map((h, i) => {
                                const symbol = h.symbol || h.stockSymbol || '';
                                const liveData = livePrices[symbol] || {};
                                const ltp = (liveData && typeof liveData === 'object' ? liveData.price : liveData) || h.currentPrice || h.averagePrice || h.avgPrice || 0;
                                const cur = h.quantity * ltp;
                                const inv = h.quantity * (h.avgPrice || h.averagePrice || 0);
                                const pnl = cur - inv;
                                const pct = inv > 0 ? (pnl / inv) * 100 : 0;
                                return (
                                    <div key={i} className="p-4 border-b border-slate-800/50 active:bg-slate-800/50 transition-colors" onClick={() => navigate(`/market/${(symbol || '').toUpperCase()}`)}>
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center font-black text-white shadow-lg shadow-indigo-600/20 text-xs text-center p-1">
                                                    {(symbol || 'S')[0]}
                                                </div>
                                                <div>
                                                    <p className="font-black text-white uppercase text-sm tracking-tight">{symbol}</p>
                                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-none mt-1">{h.quantity} Shares • Equity</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm font-black text-white">₹{ltp.toLocaleString('en-IN')}</p>
                                                <p className={cn("text-[10px] font-black uppercase tracking-widest mt-1", pnl >= 0 ? "text-emerald-500" : "text-rose-500")}>
                                                    {pnl >= 0 ? '+' : ''}{pct.toFixed(2)}%
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between pt-4 border-t border-slate-800/30">
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); setTradeModal({ show: true, symbol: symbol, side: 'BUY', price: ltp }); }}
                                                    className="px-4 py-2 bg-emerald-500/10 text-emerald-500 rounded-xl hover:bg-emerald-500 hover:text-white transition-all text-[10px] font-black uppercase border border-emerald-500/20"
                                                >
                                                    Buy
                                                </button>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); setTradeModal({ show: true, symbol: symbol, side: 'SELL', price: ltp }); }}
                                                    className="px-4 py-2 bg-rose-500/10 text-rose-500 rounded-xl hover:bg-rose-500 hover:text-white transition-all text-[10px] font-black uppercase border border-rose-500/20"
                                                >
                                                    Sell
                                                </button>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Position Value</p>
                                                <p className="font-black text-white text-base">₹{cur.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</p>
                                            </div>
                                        </div>
                                    </div>
                                );
                            }) : (
                                <div className="p-12 text-center text-slate-600 font-black uppercase tracking-[0.2em] text-[10px]">No active positions found</div>
                            )}
                        </div>

                        <div className="hidden md:block overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-slate-950/50 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                    <tr>
                                        <th className="px-5 py-5">Asset</th>
                                        <th className="px-5 py-5 text-right">Qty</th>
                                        <th className="px-5 py-5 text-right hidden lg:table-cell">LTP</th>
                                        <th className="px-5 py-5 text-right">Value</th>
                                        <th className="px-5 py-5 text-right">P&L</th>
                                        <th className="px-5 py-5 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800/50">
                                    {holdings.length > 0 ? holdings.map((h, i) => {
                                        const symbol = h.symbol || h.stockSymbol || '';
                                        const liveData = livePrices[symbol] || {};
                                        const ltp = (liveData && typeof liveData === 'object' ? liveData.price : liveData) || h.currentPrice || h.averagePrice || h.avgPrice || 0;
                                        const cur = h.quantity * ltp;
                                        const inv = h.quantity * (h.avgPrice || h.averagePrice || 0);
                                        const pnl = cur - inv;
                                        const pct = inv > 0 ? (pnl / inv) * 100 : 0;
                                        return (
                                            <tr key={i} className="hover:bg-slate-800/40 transition-all group cursor-pointer" onClick={() => navigate(`/market/${(symbol || '').toUpperCase()}`)}>
                                                <td className="px-5 py-5">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center font-black text-white text-xs group-hover:scale-110 transition-transform shadow-lg shadow-indigo-600/20">{(symbol || 'S')[0]}</div>
                                                        <div>
                                                            <p className="font-black text-white uppercase text-sm tracking-tight">{symbol}</p>
                                                            <p className="text-[9px] font-bold text-slate-500 uppercase">Equity</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-5 py-5 text-right font-black text-white text-xs">{h.quantity}</td>
                                                <td className="px-5 py-5 text-right font-mono text-slate-400 text-xs hidden lg:table-cell">₹{ltp.toLocaleString('en-IN')}</td>
                                                <td className="px-5 py-5 text-right font-black text-white text-xs">₹{cur.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</td>
                                                <td className={cn("px-5 py-5 text-right font-black text-xs", pnl >= 0 ? "text-emerald-500" : "text-rose-500")}>
                                                    <div>{pnl >= 0 ? '+' : ''}{pnl.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</div>
                                                    <div className="text-[9px] opacity-60">({pct.toFixed(1)}%)</div>
                                                </td>
                                                <td className="px-5 py-5 text-right" onClick={(e) => e.stopPropagation()}>
                                                    <div className="flex justify-end gap-2">
                                                        <button onClick={() => setTradeModal({ show: true, symbol: symbol, side: 'BUY', price: ltp })} className="px-3 py-2 bg-emerald-500/10 text-emerald-500 rounded-xl hover:bg-emerald-500 hover:text-white transition-all text-[10px] font-black uppercase border border-emerald-500/20">Buy</button>
                                                        <button onClick={() => setTradeModal({ show: true, symbol: symbol, side: 'SELL', price: ltp })} className="px-3 py-2 bg-rose-500/10 text-rose-500 rounded-xl hover:bg-rose-500 hover:text-white transition-all text-[10px] font-black uppercase border border-rose-500/20">Sell</button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    }) : (
                                        <tr><td colSpan="6" className="px-8 py-24 text-center text-slate-600 font-black uppercase tracking-[0.2em] text-xs">No active positions found</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Sidebar */}
                <div className="space-y-8">
                    {/* Quick Trade */}
                    <div className="bg-slate-900/40 border border-slate-800 rounded-[2.5rem] p-7 backdrop-blur-sm">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2.5 bg-indigo-500/10 text-indigo-500 rounded-xl"><Zap className="w-5 h-5 font-bold" /></div>
                            <h3 className="text-lg font-black text-white uppercase tracking-widest">Quick Trade</h3>
                        </div>
                        <div className="relative">
                            <input type="text" placeholder="Search symbol..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-slate-950/50 border border-slate-800 rounded-2xl px-5 py-4 text-white focus:ring-2 focus:ring-indigo-500/50 transition-all font-bold uppercase text-sm tracking-tight" />
                            {searchQuery && (
                                <div className="absolute top-full left-0 right-0 mt-3 bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden z-50 shadow-2xl">
                                    {filteredStocks.length > 0 ? filteredStocks.map((s, i) => (
                                        <div key={i} className="p-4 hover:bg-slate-800/50 flex items-center justify-between border-b border-slate-800 last:border-none">
                                            <div>
                                                <p className="font-black text-white text-xs uppercase">{s.symbol}</p>
                                                <p className="text-[9px] text-slate-500 font-bold uppercase">₹{s.price.toLocaleString('en-IN')}</p>
                                            </div>
                                            <div className="flex gap-2">
                                                <button onClick={() => { setTradeModal({ show: true, symbol: s.symbol, side: 'BUY', price: s.price }); setSearchQuery(''); }} className="px-3 py-1.5 bg-emerald-500/10 text-emerald-500 rounded-lg text-[9px] font-black uppercase">Buy</button>
                                                <button onClick={() => { setTradeModal({ show: true, symbol: s.symbol, side: 'SELL', price: s.price }); setSearchQuery(''); }} className="px-3 py-1.5 bg-rose-500/10 text-rose-500 rounded-lg text-[9px] font-black uppercase">Sell</button>
                                            </div>
                                        </div>
                                    )) : <div className="p-6 text-center text-slate-700 font-black uppercase text-[10px] tracking-widest">No matching stocks</div>}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Allocation */}
                    <div className="bg-slate-900/40 border border-slate-800 rounded-[2.5rem] p-7 backdrop-blur-sm">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2.5 bg-indigo-500/10 text-indigo-500 rounded-xl"><Activity className="w-5 h-5 font-bold" /></div>
                            <h3 className="text-lg font-black text-white uppercase tracking-widest">Allocation</h3>
                        </div>
                        <div className="h-60 relative">
                            {pieData.length > 0 ? (
                                <>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie data={pieData} innerRadius={70} outerRadius={90} paddingAngle={5} dataKey="value" stroke="none">
                                                {pieData.map((_, index) => <Cell key={index} fill={COLORS[index % COLORS.length]} />)}
                                            </Pie>
                                        </PieChart>
                                    </ResponsiveContainer>
                                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                        <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Net Value</span>
                                        <span className="text-xl font-black text-white mt-1">₹{totalCurrentValue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
                                    </div>
                                </>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-slate-700">
                                    <Briefcase className="w-10 h-10 mb-2 opacity-20" />
                                    <p className="font-black uppercase text-[10px] tracking-widest">Empty Portfolio</p>
                                </div>
                            )}
                        </div>
                        {pieData.length > 0 && (
                            <div className="mt-6 space-y-3">
                                {pieData.slice(0, 5).map((item, i) => (
                                    <div key={i} className="flex items-center justify-between text-[11px] font-bold group">
                                        <div className="flex items-center gap-2">
                                            <div className="w-2.5 h-2.5 rounded-xl shadow-[0_0_10px_rgba(0,0,0,0.4)]" style={{ backgroundColor: COLORS[i % COLORS.length] }}></div>
                                            <span className="text-slate-500 uppercase group-hover:text-white transition-colors">{item.name}</span>
                                        </div>
                                        <span className="text-slate-300 font-mono">₹{item.value.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <QuickTradeModal
                isOpen={tradeModal.show}
                onClose={() => setTradeModal({ ...tradeModal, show: false })}
                symbol={tradeModal.symbol}
                initialSide={tradeModal.side}
                currentPrice={tradeModal.price}
                onTradeSuccess={fetchPortfolio}
            />
        </div>
    );
};

export default Portfolio;
