import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, TrendingUp, Wallet, History, LogOut, ShieldCheck, PlusCircle, Rocket, LifeBuoy } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useWallet } from '../context/WalletContext';
import { cn } from '../utils/cn';

const Sidebar = ({ isOpen, onClose }) => {
    const location = useLocation();
    const { logout, user } = useAuth();
    const { balance } = useWallet();

    // Close mobile drawer when route changes
    useEffect(() => {
        if (isOpen) onClose();
    }, [location.pathname]);

    const menuItems = [
        { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
        { icon: TrendingUp, label: 'Market', path: '/market' },
        { icon: Wallet, label: 'Portfolio', path: '/portfolio' },
        { icon: Rocket, label: 'IPO Hub', path: '/ipo' },
        { icon: History, label: 'Activity', path: '/activity' },
        { icon: LifeBuoy, label: 'Support', path: '/support' },
    ];

    if (user?.role === 'admin') {
        menuItems.push({ icon: ShieldCheck, label: 'Admin Panel', path: '/admin' });
    }

    return (
        <>
            {/* Backdrop for mobile */}
            <div
                className={cn(
                    "fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300",
                    isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
                )}
                onClick={onClose}
            />

            <aside className={cn(
                "fixed inset-y-0 left-0 w-64 border-r border-slate-800 bg-[#0a0a0a] flex flex-col h-screen z-50 transition-transform duration-300 lg:sticky lg:translate-x-0 lg:z-30",
                isOpen ? "translate-x-0" : "-translate-x-full"
            )}>
                <div className="flex items-center justify-between lg:block">
                    <Link to="/" className="p-6 flex items-center gap-2 hover:opacity-80 transition-opacity">
                        <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center overflow-hidden p-1 shadow-lg shadow-indigo-500/10">
                            <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
                        </div>
                        <h1 className="text-2xl font-black bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent tracking-tighter">
                            Trade AI
                        </h1>
                    </Link>
                    <button onClick={onClose} className="p-6 lg:hidden text-slate-400">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <nav className="flex-1 px-4 space-y-2 overflow-y-auto">
                    {menuItems.map((item) => (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={cn(
                                "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group",
                                location.pathname === item.path
                                    ? "bg-indigo-600/10 text-indigo-500 shadow-[inset_0_0_12px_rgba(79,70,229,0.1)]"
                                    : "text-slate-400 hover:bg-slate-900 hover:text-slate-100"
                            )}
                        >
                            <item.icon className={cn(
                                "w-5 h-5 transition-colors",
                                location.pathname === item.path ? "text-indigo-500" : "group-hover:text-slate-100"
                            )} />
                            <span className="font-medium">{item.label}</span>
                        </Link>
                    ))}
                </nav>

                <div className="px-6 py-6 border-t border-slate-800/50">
                    <div className="bg-slate-900 rounded-2xl p-4 border border-slate-800">
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Available Balance</p>
                        <div className="flex items-center justify-between">
                            <h4 className="text-lg font-black text-white">₹{balance.toLocaleString('en-IN')}</h4>
                            <Link to="/add-funds" className="text-indigo-500 hover:text-indigo-400 transition-colors">
                                <PlusCircle className="w-5 h-5" />
                            </Link>
                        </div>
                    </div>
                </div>

                <div className="p-4 border-t border-slate-800">
                    <button
                        onClick={logout}
                        className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-400 hover:bg-red-500/10 hover:text-red-500 transition-all w-full group"
                    >
                        <LogOut className="w-5 h-5 group-hover:text-red-500" />
                        <span className="font-medium">Logout</span>
                    </button>
                </div>
            </aside>
        </>
    );
};

export default Sidebar;
