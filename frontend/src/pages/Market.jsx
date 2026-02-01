import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, TrendingDown, Search, Filter, ArrowUpRight, BarChart3 } from 'lucide-react';
import { stockService } from '../services/api';
import { socket } from '../services/socket';

const Market = () => {
    const navigate = useNavigate();
    const [stocks, setStocks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    useEffect(() => {
        const fetchStocks = async () => {
            try {
                const data = await stockService.getStocks();
                setStocks(Array.isArray(data) ? data : []);
            } catch (err) {
                console.error("Market fetch error:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchStocks();

        const handleUpdate = (updatedStock) => {
            setStocks(prev => prev.map(s =>
                s.symbol === updatedStock.symbol
                    ? { ...s, price: updatedStock.price, changePercent: updatedStock.change, volume: updatedStock.volume || s.volume }
                    : s
            ));
        };

        socket.on('stockUpdate', handleUpdate);
        return () => socket.off('stockUpdate', handleUpdate);
    }, []);

    const filteredStocks = stocks.filter(s =>
        s.symbol.toLowerCase().includes(search.toLowerCase()) ||
        s.name.toLowerCase().includes(search.toLowerCase())
    );

    if (loading) return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
            <div className="w-10 h-10 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
            <p className="text-slate-500 font-medium animate-pulse">Loading Market Data...</p>
        </div>
    );

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white">Market Overview</h1>
                    <p className="text-sm text-slate-400">Real-time stock prices and market trends</p>
                </div>

                <div className="flex items-center gap-2 md:gap-3 w-full md:w-auto">
                    <div className="relative flex-1 md:flex-none">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <input
                            type="text"
                            placeholder="Search stocks..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="bg-slate-900 border border-slate-800 rounded-xl py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all w-full md:w-64"
                        />
                    </div>
                    <button className="bg-slate-900 border border-slate-800 p-2 rounded-xl text-slate-400 hover:text-white transition-colors shrink-0">
                        <Filter className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block bg-slate-900/40 border border-slate-800 rounded-2xl overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-slate-800/20 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                        <tr>
                            <th className="px-6 py-4">Asset</th>
                            <th className="px-6 py-4">Last Price</th>
                            <th className="px-6 py-4">Change</th>
                            <th className="px-6 py-4">Volume</th>
                            <th className="px-6 py-4 text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                        {filteredStocks.length > 0 ? filteredStocks.map((stock, i) => (
                            <tr
                                key={i}
                                onClick={() => navigate(`/market/${stock.symbol.toUpperCase()}`)}
                                className="hover:bg-slate-800/30 transition-colors group cursor-pointer"
                            >
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center font-bold text-indigo-400 group-hover:scale-110 transition-transform">
                                            {stock.symbol[0]}
                                        </div>
                                        <div>
                                            <div className="font-bold text-white uppercase">{stock.symbol}</div>
                                            <div className="text-xs text-slate-500">{stock.name}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 font-mono font-bold text-white">
                                    ₹{(stock.price || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`flex items-center gap-1 ${(stock.changePercent || stock.change) >= 0 ? 'text-emerald-500' : 'text-red-500'} font-medium`}>
                                        {(stock.changePercent || stock.change) >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                                        {(stock.changePercent || stock.change) > 0 ? '+' : ''}{stock.changePercent || stock.change || 0}%
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-sm text-slate-400">
                                    {((stock.volume || 0) / 1000000).toFixed(2)}M
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <button className="bg-indigo-600/10 hover:bg-indigo-600 text-indigo-500 hover:text-white text-xs font-bold py-2.5 px-6 rounded-xl transition-all shadow-lg shadow-indigo-600/0 hover:shadow-indigo-600/20 active:scale-95">
                                        Trade
                                    </button>
                                </td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan="5" className="px-6 py-20 text-center text-slate-500 font-medium">
                                    No stocks found matching your search.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-3">
                {filteredStocks.length > 0 ? filteredStocks.map((stock, i) => (
                    <div
                        key={i}
                        onClick={() => navigate(`/market/${stock.symbol.toUpperCase()}`)}
                        className="bg-slate-900/40 border border-slate-800 p-4 rounded-2xl flex items-center justify-between active:scale-[0.98] transition-all"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center font-bold text-indigo-400">
                                {stock.symbol[0]}
                            </div>
                            <div>
                                <div className="font-bold text-white uppercase text-sm">{stock.symbol}</div>
                                <div className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">{stock.name.split(' ')[0]}</div>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="font-mono font-bold text-white text-sm">₹{(stock.price || 0).toLocaleString('en-IN')}</div>
                            <div className={`text-[10px] font-bold flex items-center justify-end gap-1 ${(stock.changePercent || stock.change) >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                                {(stock.changePercent || stock.change) > 0 ? '+' : ''}{stock.changePercent || stock.change || 0}%
                            </div>
                        </div>
                    </div>
                )) : (
                    <div className="py-20 text-center text-slate-500 font-medium bg-slate-900/40 border border-slate-800 rounded-2xl">
                        No stocks found matching your search.
                    </div>
                )}
            </div>
        </div>
    );
};

export default Market;
