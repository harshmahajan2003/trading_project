import { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, Wallet, Clock, ArrowRight, ShieldCheck, Zap, Loader2, Info, Briefcase, Plus, Minus, CreditCard, Activity } from 'lucide-react';
import { cn } from '../utils/cn';
import ConfirmDialog from '../components/ConfirmDialog';
import { walletService, tradeService, stockService } from '../services/api';
import { socket } from '../services/socket';
import { useWallet } from '../context/WalletContext';
import QuickTradeModal from '../components/QuickTradeModal';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
    const { balance, refreshBalance } = useWallet();
    const [holdings, setHoldings] = useState([]);
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [livePrices, setLivePrices] = useState({});
    const [allStocks, setAllStocks] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');

    // Premium Alert State
    const [alertModal, setAlertModal] = useState({ show: false, title: '', message: '', type: 'info' });
    const [tradeModal, setTradeModal] = useState({ show: false, symbol: '', side: 'BUY', price: 0 });

    const navigate = useNavigate();

    const fetchData = async () => {
        try {
            const [holdingsData, transData] = await Promise.all([
                tradeService.getHoldings(),
                tradeService.getTransactions()
            ]);
            setHoldings(Array.isArray(holdingsData) ? holdingsData : []);
            setTransactions(Array.isArray(transData) ? transData : []);

            // Initialize live prices if not already set
            const stocksData = await stockService.getStocks();
            setAllStocks(Array.isArray(stocksData) ? stocksData : []);

            if (Object.keys(livePrices).length === 0) {
                const prices = {};
                if (Array.isArray(stocksData)) {
                    stocksData.forEach(s => {
                        prices[s.symbol] = { price: s.price, change: s.changePercent || 0 };
                    });
                }
                setLivePrices(prices);
            }
        } catch (err) {
            console.error("Dashboard refresh error:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        refreshBalance();

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

    // Consolidated Portfolio Calculations
    const portfolioMetrics = holdings.reduce((acc, h) => {
        const liveData = livePrices[h.symbol];
        const ltp = (liveData && typeof liveData === 'object' ? liveData.price : liveData) || h.currentPrice || h.averagePrice || h.avgPrice || 0;
        const avg = h.avgPrice || h.averagePrice || 0;
        const qty = h.quantity || 0;
        const changePct = (liveData && typeof liveData === 'object' ? liveData.change : 0) || 0;

        const invested = qty * avg;
        const current = qty * ltp;
        const pnl = current - invested;

        // Day P&L Calculation: Prev Close = LTP / (1 + change/100)
        const prevClose = ltp / (1 + (changePct / 100));
        const dayPnlAmt = ltp > 0 ? (ltp - prevClose) * qty : 0;

        acc.totalInvested += invested;
        acc.totalCurrentValue += current;
        acc.totalPnl += pnl;
        acc.totalDayPnl += dayPnlAmt;
        return acc;
    }, { totalInvested: 0, totalCurrentValue: 0, totalPnl: 0, totalDayPnl: 0 });

    const { totalInvested, totalCurrentValue, totalPnl, totalDayPnl } = portfolioMetrics;

    const filteredStocks = searchQuery
        ? allStocks.filter(s =>
            (s.symbol || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            (s.name || '').toLowerCase().includes(searchQuery.toLowerCase())
        ).slice(0, 5)
        : [];


    const stats = [
        { label: 'Buying Power', value: `₹${(balance || 0).toLocaleString('en-IN')}`, icon: Wallet, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
        { label: 'Total P&L', value: `${totalPnl >= 0 ? '+' : ''}₹${(totalPnl || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`, icon: TrendingUp, color: totalPnl >= 0 ? 'text-emerald-500' : 'text-red-500', bg: totalPnl >= 0 ? 'bg-emerald-500/10' : 'bg-red-500/10' },
        { label: 'Current Value', value: `₹${(totalCurrentValue || 0).toLocaleString('en-IN')}`, icon: Briefcase, color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
        { label: 'Day\'s P&L', value: `${totalDayPnl >= 0 ? '+' : ''}₹${(totalDayPnl || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`, icon: Activity, color: totalDayPnl >= 0 ? 'text-emerald-500' : 'text-red-500', bg: totalDayPnl >= 0 ? 'bg-emerald-500/10' : 'bg-red-500/10' },
    ];

    if (loading) return <div className="animate-pulse text-indigo-500 p-8 flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-10 h-10 animate-spin" />
    </div>;

    return (
        <div className="space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header / Stats */}
            <div>
                <div className="flex items-center justify-between mb-2">
                    <h2 className="text-xl font-bold text-white tracking-tight">Overview</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                    {stats.map((stat, i) => {
                        const Icon = stat.icon;
                        return (
                            <div key={i} className="bg-slate-900/40 border border-slate-800 rounded-3xl p-6 backdrop-blur-sm">
                                <div className="flex items-center justify-between mb-4">
                                    <div className={`${stat.bg} ${stat.color} p-3 rounded-2xl`}>
                                        <Icon className="w-6 h-6" />
                                    </div>
                                </div>
                                <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">{stat.label}</p>
                                <h3 className={cn(
                                    "text-2xl font-black mt-1 tracking-tight",
                                    (stat.label === "Total P&L" || stat.label === "Day's P&L") ? stat.color : "text-white"
                                )}>
                                    {stat.value}
                                </h3>
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Holdings Table */}
                <div className="lg:col-span-2 bg-slate-900/40 border border-slate-800 rounded-3xl md:rounded-[2.5rem] overflow-hidden backdrop-blur-sm">
                    <div className="p-6 md:p-8 border-b border-slate-800 flex items-center justify-between">
                        <h3 className="text-xl font-black text-white uppercase tracking-widest">My Portfolio</h3>
                        <div className="px-4 py-1.5 bg-indigo-500/10 border border-indigo-500/20 rounded-full">
                            <span className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em]">{holdings.length} Positions</span>
                        </div>
                    </div>

                    {/* P&L Summary Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-slate-800 border-b border-slate-800">
                        <div className="bg-[#0a0a0a]/40 p-4 md:p-6">
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Total Invested</p>
                            <p className="text-lg md:text-xl font-black text-white">₹{totalInvested.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</p>
                        </div>
                        <div className="bg-[#0a0a0a]/40 p-4 md:p-6 border-l border-slate-800">
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Current Value</p>
                            <p className="text-lg md:text-xl font-black text-white">₹{totalCurrentValue.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</p>
                        </div>
                        <div className="bg-[#0a0a0a]/40 p-4 md:p-6 border-l border-slate-800">
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Total P&L</p>
                            <p className={cn(
                                "text-lg md:text-xl font-black",
                                totalPnl >= 0 ? "text-emerald-500" : "text-rose-500"
                            )}>
                                {totalPnl >= 0 ? '+' : ''}₹{totalPnl.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                            </p>
                        </div>
                        <div className="bg-[#0a0a0a]/40 p-4 md:p-6 border-l border-slate-800">
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Day's P&L</p>
                            <p className={cn(
                                "text-lg md:text-xl font-black",
                                totalDayPnl >= 0 ? "text-emerald-500" : "text-rose-500"
                            )}>
                                {totalDayPnl >= 0 ? '+' : ''}₹{totalDayPnl.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                            </p>
                        </div>
                    </div>

                    {/* Mobile Card View */}
                    <div className="block md:hidden border-t border-slate-800">
                        {holdings.length > 0 ? holdings.map((h, i) => {
                            const liveData = livePrices[h.symbol] || {};
                            const ltp = (typeof liveData === 'object' ? liveData.price : liveData) || h.currentPrice || h.avgPrice || 0;
                            const avg = h.avgPrice || h.averagePrice || 0;
                            const investedVal = h.quantity * avg;
                            const currentVal = h.quantity * ltp;
                            const totalProfit = currentVal - investedVal;
                            const totalProfitPct = (investedVal > 0) ? (totalProfit / investedVal) * 100 : 0;
                            const isTotalProfit = totalProfit >= 0;

                            return (
                                <div key={i} className="p-4 border-b border-slate-800/50 active:bg-slate-800/50 transition-colors" onClick={() => navigate(`/market/${(h.symbol || h.stockSymbol || '').toUpperCase()}`)}>
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center font-black text-white shadow-lg shadow-indigo-600/20 text-xs">
                                                {(h.symbol || h.stockSymbol || 'S')[0]}
                                            </div>
                                            <div>
                                                <p className="font-black text-white uppercase tracking-tight text-sm">{h.symbol || h.stockSymbol || 'STOCK'}</p>
                                                <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest leading-none mt-1">Equity • {h.quantity} Shares</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-black text-white">₹{ltp.toLocaleString('en-IN')}</p>
                                            <p className={cn(
                                                "text-[10px] font-black uppercase tracking-widest mt-1",
                                                isTotalProfit ? 'text-emerald-500' : 'text-rose-500'
                                            )}>
                                                {isTotalProfit ? '+' : ''}{totalProfitPct.toFixed(2)}%
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between pt-3 border-t border-slate-800/30">
                                        <div className="flex gap-2">
                                            <button
                                                onClick={(e) => { e.stopPropagation(); setTradeModal({ show: true, symbol: h.symbol, side: 'BUY', price: ltp }); }}
                                                className="px-4 py-2 bg-emerald-500/10 text-emerald-500 rounded-xl hover:bg-emerald-500 hover:text-white transition-all text-[10px] font-black uppercase tracking-widest border border-emerald-500/20"
                                            >
                                                Buy
                                            </button>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); setTradeModal({ show: true, symbol: h.symbol, side: 'SELL', price: ltp }); }}
                                                className="px-4 py-2 bg-rose-500/10 text-rose-500 rounded-xl hover:bg-rose-500 hover:text-white transition-all text-[10px] font-black uppercase tracking-widest border border-rose-500/20"
                                            >
                                                Sell
                                            </button>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">Total Value</p>
                                            <p className="font-black text-white">₹{currentVal.toLocaleString('en-IN')}</p>
                                        </div>
                                    </div>
                                </div>
                            );
                        }) : (
                            <div className="p-10 text-center">
                                <Briefcase className="w-10 h-10 text-slate-800 mx-auto mb-4" />
                                <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">No active positions</p>
                            </div>
                        )}
                    </div>

                    <div className="hidden md:block overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-950/50 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                <tr>
                                    <th className="px-4 md:px-5 py-4">Asset</th>
                                    <th className="px-4 md:px-5 py-4 hidden sm:table-cell">Qty</th>
                                    <th className="px-4 md:px-5 py-4 hidden lg:table-cell">Avg Price</th>
                                    <th className="px-4 md:px-5 py-4 hidden md:table-cell">LTP</th>
                                    <th className="px-4 md:px-5 py-4 hidden xl:table-cell">Day P&L</th>
                                    <th className="px-4 md:px-5 py-4 hidden lg:table-cell">Value</th>
                                    <th className="px-4 md:px-5 py-4 text-right">Returns</th>
                                    <th className="px-4 md:px-5 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/50">
                                {holdings.length > 0 ? holdings.map((h, i) => {
                                    const liveData = livePrices[h.symbol] || {};
                                    const ltp = (typeof liveData === 'object' ? liveData.price : liveData) || h.currentPrice || h.avgPrice || 0;
                                    const dayChangePct = liveData.change || 0;

                                    const avg = h.avgPrice || h.averagePrice || 0;
                                    const investedVal = h.quantity * avg;
                                    const currentVal = h.quantity * ltp;

                                    // Day P&L calculation (based on ltp and change %)
                                    // Prev Close = LTP / (1 + change/100)
                                    const prevClose = ltp / (1 + (dayChangePct / 100));
                                    const dayPnl = ltp > 0 ? (ltp - prevClose) * h.quantity : 0;

                                    const totalProfit = currentVal - investedVal;
                                    const totalProfitPct = (investedVal > 0) ? (totalProfit / investedVal) * 100 : 0;
                                    const isTotalProfit = totalProfit >= 0;
                                    const isDayProfit = dayPnl >= 0;

                                    return (
                                        <tr key={i} className="hover:bg-slate-800/30 transition-colors group cursor-pointer" onClick={() => navigate(`/market/${(h.symbol || h.stockSymbol || '').toUpperCase()}`)}>
                                            <td className="px-4 md:px-5 py-4">
                                                <div className="flex items-center gap-2 md:gap-3">
                                                    <div className="w-8 h-8 md:w-9 md:h-9 bg-indigo-600 rounded-lg flex items-center justify-center font-black text-white shadow-lg shadow-indigo-600/20 text-xs group-hover:scale-110 transition-transform">
                                                        {(h.symbol || h.stockSymbol || 'S')[0]}
                                                    </div>
                                                    <div>
                                                        <p className="font-black text-white uppercase tracking-tight text-xs">{h.symbol || h.stockSymbol || 'STOCK'}</p>
                                                        <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest hidden xs:block">Equity</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 md:px-5 py-4 font-bold text-white uppercase text-xs hidden sm:table-cell">{h.quantity}</td>
                                            <td className="px-4 md:px-5 py-4 font-mono text-slate-400 text-xs hidden lg:table-cell">
                                                ₹{avg.toLocaleString('en-IN')}
                                            </td>
                                            <td className="px-4 md:px-5 py-4 font-mono text-white font-bold text-xs hidden md:table-cell">
                                                ₹{ltp.toLocaleString('en-IN')}
                                            </td>
                                            <td className={cn(
                                                "px-4 md:px-5 py-4 font-mono text-xs hidden xl:table-cell font-bold",
                                                isDayProfit ? 'text-emerald-500' : 'text-rose-500'
                                            )}>
                                                {isDayProfit ? '+' : ''}{dayPnl.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                                                <span className="text-[9px] block opacity-60">({dayChangePct > 0 ? '+' : ''}{dayChangePct.toFixed(2)}%)</span>
                                            </td>
                                            <td className="px-4 md:px-5 py-4 hidden lg:table-cell">
                                                <div className="flex flex-col">
                                                    <p className="text-[10px] font-black text-white">₹{currentVal.toLocaleString('en-IN')}</p>
                                                    <p className="text-[8px] text-slate-500 font-bold uppercase tracking-widest">Inv: ₹{investedVal.toLocaleString('en-IN')}</p>
                                                </div>
                                            </td>
                                            <td className={cn(
                                                "px-4 md:px-5 py-4 text-right font-black text-xs transition-colors",
                                                isTotalProfit ? 'text-emerald-500' : 'text-rose-500'
                                            )}>
                                                <div className="flex flex-col items-end">
                                                    <span className="flex items-center gap-1">
                                                        {isTotalProfit ? '+' : ''}{totalProfit.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                                                    </span>
                                                    <span className="text-[9px] opacity-60 font-bold">
                                                        ({isTotalProfit ? '+' : ''}{totalProfitPct.toFixed(1)}%)
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-4 md:px-5 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                                                <div className="flex items-center justify-end gap-1.5">
                                                    <button
                                                        onClick={() => setTradeModal({ show: true, symbol: h.symbol, side: 'BUY', price: ltp })}
                                                        className="px-2.5 py-1.5 bg-emerald-500/10 text-emerald-500 rounded-lg hover:bg-emerald-500 hover:text-white transition-all text-[9px] font-black uppercase tracking-widest border border-emerald-500/20"
                                                    >
                                                        Buy
                                                    </button>
                                                    <button
                                                        onClick={() => setTradeModal({ show: true, symbol: h.symbol, side: 'SELL', price: ltp })}
                                                        className="px-2.5 py-1.5 bg-rose-500/10 text-rose-500 rounded-lg hover:bg-rose-500 hover:text-white transition-all text-[9px] font-black uppercase tracking-widest border border-rose-500/20"
                                                    >
                                                        Sell
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                }) : (
                                    <tr>
                                        <td colSpan="5" className="px-8 py-20 text-center">
                                            <Briefcase className="w-12 h-12 text-slate-800 mx-auto mb-4" />
                                            <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">No active positions</p>
                                            <p className="text-slate-600 text-[10px] mt-1">Visit the market to start trading</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Right Column: Quick Trade & Pulse */}
                <div className="space-y-8">
                    {/* Quick Trade Widget */}
                    <div className="bg-slate-900/40 border border-slate-800 rounded-3xl md:rounded-[2.5rem] p-6 md:p-8 backdrop-blur-sm">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2.5 bg-indigo-500/10 text-indigo-500 rounded-xl">
                                <Zap className="w-5 h-5" />
                            </div>
                            <h3 className="text-xl font-black text-white uppercase tracking-widest">Quick Trade</h3>
                        </div>

                        <div className="relative">
                            <div className="relative group">
                                <input
                                    type="text"
                                    placeholder="Search stock symbol..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full bg-slate-950/50 border border-slate-800 rounded-2xl px-5 py-4 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all font-bold uppercase tracking-tight"
                                />
                                <div className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-600">
                                    <ArrowRight className="w-5 h-5" />
                                </div>
                            </div>

                            {searchQuery && (
                                <div className="absolute top-full left-0 right-0 mt-2 bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden z-50 shadow-2xl animate-in fade-in slide-in-from-top-2 duration-200">
                                    {filteredStocks.length > 0 ? filteredStocks.map((s, i) => (
                                        <div key={i} className="p-4 hover:bg-slate-800/50 border-b border-slate-800/50 last:border-none flex items-center justify-between group">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center font-black text-white text-xs">
                                                    {(s.symbol || 'S')[0]}
                                                </div>
                                                <div>
                                                    <p className="font-black text-white text-sm uppercase">{s.symbol || 'Unknown'}</p>
                                                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">₹{(s.price || 0).toLocaleString('en-IN')}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => {
                                                        setTradeModal({ show: true, symbol: s.symbol, side: 'BUY', price: s.price });
                                                        setSearchQuery('');
                                                    }}
                                                    className="px-3 py-1.5 bg-emerald-500/10 text-emerald-500 rounded-lg hover:bg-emerald-500 hover:text-white transition-all text-[10px] font-black uppercase tracking-widest"
                                                >
                                                    Buy
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setTradeModal({ show: true, symbol: s.symbol, side: 'SELL', price: s.price });
                                                        setSearchQuery('');
                                                    }}
                                                    className="px-3 py-1.5 bg-rose-500/10 text-rose-500 rounded-lg hover:bg-rose-500 hover:text-white transition-all text-[10px] font-black uppercase tracking-widest"
                                                >
                                                    Sell
                                                </button>
                                            </div>
                                        </div>
                                    )) : (
                                        <div className="p-8 text-center">
                                            <Info className="w-8 h-8 text-slate-700 mx-auto mb-2" />
                                            <p className="text-slate-500 font-bold text-xs uppercase tracking-widest">No stocks found</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="mt-6 flex items-center gap-2 text-slate-500">
                            <ShieldCheck className="w-4 h-4" />
                            <p className="text-[10px] font-bold uppercase tracking-widest">Secure Direct Execution</p>
                        </div>
                    </div>

                    {/* Pulse (Recent Activity) */}
                    <div className="bg-slate-900/40 border border-slate-800 rounded-3xl md:rounded-[2.5rem] p-6 md:p-8 backdrop-blur-sm">
                        <h3 className="text-xl font-black text-white uppercase tracking-widest mb-6 md:mb-8">Pulse</h3>
                        <div className="space-y-6">
                            {transactions.length > 0 ? transactions.slice(0, 5).map((t, i) => {
                                // Fallback logic for existing transactions missing metadata
                                const displaySymbol = t.symbol || (t.description?.split(' ')[1]) || 'CASH';
                                const displaySide = t.side || (t.type === 'DEBIT' ? 'BUY' : 'SELL');
                                const displayQty = t.quantity || '';

                                return (
                                    <div key={i} className="flex items-center justify-between group">
                                        <div className="flex items-center gap-4">
                                            <div className={`p-3 rounded-2xl ${displaySide === 'BUY' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                                                <Zap className="w-4 h-4" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-black text-white uppercase tracking-tight">{displaySymbol}</p>
                                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{displaySide} {displayQty ? `• ${displayQty} Shares` : ''}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-black text-white font-mono">₹{t.amount?.toLocaleString()}</p>
                                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{t.createdAt ? new Date(t.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}</p>
                                        </div>
                                    </div>
                                );
                            }) : (
                                <div className="text-center py-10">
                                    <Info className="w-10 h-10 text-slate-700 mx-auto mb-4" />
                                    <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">No recent activity</p>
                                    <p className="text-slate-600 text-[10px] mt-1">Your latest trades will appear here</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Premium Alert Dialog */}
            <ConfirmDialog
                isOpen={alertModal.show}
                onClose={() => setAlertModal({ ...alertModal, show: false })}
                onConfirm={() => setAlertModal({ ...alertModal, show: false })}
                title={alertModal.title}
                message={alertModal.message}
                confirmText="Awesome"
                type={alertModal.type}
                alertOnly={true}
            />

            {/* Quick Trade Modal */}
            <QuickTradeModal
                isOpen={tradeModal.show}
                onClose={() => setTradeModal({ ...tradeModal, show: false })}
                symbol={tradeModal.symbol}
                initialSide={tradeModal.side}
                currentPrice={tradeModal.price}
                onTradeSuccess={fetchData}
            />
        </div>
    );
};

export default Dashboard;
