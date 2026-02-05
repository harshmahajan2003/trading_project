import { useState, useEffect, useRef } from 'react';
import { Bell, User, Search, Clock, CheckCircle2, XCircle, Rocket, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { notificationService, stockService } from '../services/api';
import { useNavigate } from 'react-router-dom';
import { cn } from '../utils/cn';

const Navbar = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState([]);
    const [showNotifications, setShowNotifications] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);

    // Search state
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [allStocks, setAllStocks] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const searchRef = useRef(null);

    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                const [notifsData, stocksData] = await Promise.all([
                    notificationService.getNotifications(),
                    stockService.getStocks()
                ]);
                const actualNotifs = Array.isArray(notifsData) ? notifsData : [];
                setNotifications(actualNotifs);
                setUnreadCount(actualNotifs.filter(n => !n.isRead).length);
                setAllStocks(Array.isArray(stocksData) ? stocksData : []);
            } catch (err) {
                console.error("Navbar data fetch error:", err);
            }
        };
        fetchInitialData();
        const interval = setInterval(fetchInitialData, 30000);
        return () => clearInterval(interval);
    }, []);

    // Handle search filtering
    useEffect(() => {
        if (!searchQuery.trim()) {
            setSearchResults([]);
            return;
        }
        const filtered = allStocks.filter(s =>
            s.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
            s.name.toLowerCase().includes(searchQuery.toLowerCase())
        ).slice(0, 5);
        setSearchResults(filtered);
    }, [searchQuery, allStocks]);

    // Close search dropdown on click outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (searchRef.current && !searchRef.current.contains(e.target)) {
                setSearchResults([]);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleMarkRead = async () => {
        try {
            await notificationService.markRead();
            setUnreadCount(0);
            setNotifications(notifications.map(n => ({ ...n, isRead: true })));
        } catch (err) {
            console.error("Mark read error:", err);
        }
    };

    return (
        <header className="h-16 border-b border-slate-800 bg-[#0a0a0a]/80 backdrop-blur-md sticky top-0 z-[100] px-4 md:px-8 flex items-center justify-between">
            <div className="relative w-96 hidden md:block" ref={searchRef}>
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search stocks, indices..."
                    className="w-full bg-slate-900 border border-slate-700 rounded-full py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium text-slate-100"
                />

                {/* Search Results Dropdown */}
                {searchResults.length > 0 && (
                    <div className="absolute top-full left-0 mt-2 w-full bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-2 animate-in fade-in slide-in-from-top-2 duration-200 z-[101]">
                        {searchResults.map((stock) => (
                            <button
                                key={stock.symbol}
                                onClick={() => {
                                    navigate(`/market/${stock.symbol}`);
                                    setSearchQuery('');
                                    setSearchResults([]);
                                }}
                                className="w-full flex items-center justify-between p-3 hover:bg-slate-800/50 rounded-xl transition-all group"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-500 font-bold text-xs uppercase">
                                        {stock.symbol[0]}
                                    </div>
                                    <div className="text-left">
                                        <p className="text-xs font-bold text-white uppercase">{stock.symbol}</p>
                                        <p className="text-[10px] text-slate-500 font-medium">{stock.name}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs font-bold text-white">₹{stock.price.toLocaleString('en-IN')}</p>
                                    <p className={cn(
                                        "text-[9px] font-bold uppercase",
                                        stock.change >= 0 ? "text-emerald-500" : "text-rose-500"
                                    )}>
                                        {stock.change >= 0 ? '+' : ''}{stock.change}%
                                    </p>
                                </div>
                            </button>
                        ))}
                    </div>
                )}
            </div>

            <div className="flex items-center gap-3 md:gap-6">
                {/* Add News Button - Hidden on mobile, shown on desktop */}
                <button
                    onClick={() => navigate('/news')}
                    className="hidden md:flex text-slate-400 hover:text-indigo-400 transition-colors p-2 text-xs font-bold uppercase tracking-widest items-center gap-2"
                    title="Market News"
                >
                    NEWS
                </button>
                <div className="relative">
                    <button
                        onClick={() => {
                            setShowNotifications(!showNotifications);
                            if (!showNotifications && unreadCount > 0) handleMarkRead();
                        }}
                        className="relative text-slate-400 hover:text-slate-100 transition-colors p-2"
                    >
                        <Bell className="w-5 h-5" />
                        {unreadCount > 0 && (
                            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-indigo-500 rounded-full border-2 border-[#0a0a0a]"></span>
                        )}
                    </button>

                    {showNotifications && (
                        <div className="absolute top-full right-0 mt-2 w-80 bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-4 animate-in fade-in slide-in-from-top-2 duration-300 z-[101]">
                            <div className="flex items-center justify-between mb-4 px-2">
                                <h4 className="font-black text-white text-xs uppercase tracking-widest">Alert Center</h4>
                                {unreadCount > 0 && <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">{unreadCount} New</span>}
                            </div>
                            <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                                {notifications.length > 0 ? (
                                    notifications.map(n => (
                                        <div key={n._id} className={cn(
                                            "p-4 rounded-2xl transition-all border",
                                            n.isRead ? "bg-slate-900/50 border-transparent opacity-60" : "bg-indigo-600/5 border-indigo-500/10"
                                        )}>
                                            <div className="flex gap-3">
                                                <div className="mt-1">
                                                    {n.type === 'IPO_UPDATE' ? <Rocket className="w-4 h-4 text-indigo-500" /> : <Clock className="w-4 h-4 text-slate-500" />}
                                                </div>
                                                <div>
                                                    <p className="font-black text-white text-xs leading-tight">{n.title}</p>
                                                    <p className="text-slate-400 text-[11px] mt-1 leading-snug">{n.message}</p>
                                                    <p className="text-slate-600 text-[9px] mt-2 font-black uppercase">{new Date(n.createdAt).toLocaleDateString('en-IN')}</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="py-8 text-center">
                                        <p className="text-slate-500 text-xs font-bold italic">No alerts yet</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-3 pl-0 md:pl-6 border-l-0 md:border-l border-slate-800">
                    <div className="text-right hidden sm:block">
                        <p className="text-sm font-medium text-slate-100">{user?.name}</p>
                        <p className="text-xs text-slate-500">{user?.email}</p>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-white font-bold shadow-lg shadow-indigo-500/20">
                        {user?.name?.[0].toUpperCase()}
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Navbar;
