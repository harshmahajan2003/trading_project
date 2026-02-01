import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, Package, ShoppingBag, ShieldCheck, LogOut, ChevronLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { cn } from '../utils/cn';

const AdminLayout = ({ children }) => {
    const location = useLocation();
    const { logout } = useAuth();

    const menuItems = [
        { icon: LayoutDashboard, label: 'Control Center', path: '/admin' },
        { icon: Users, label: 'User Management', path: '/admin/users' },
        { icon: Package, label: 'Asset Management', path: '/admin/stocks' },
        { icon: ShoppingBag, label: 'Order Monitor', path: '/admin/orders' },
    ];

    return (
        <div className="flex min-h-screen bg-[#020617] text-slate-100 font-sans selection:bg-indigo-500/30">
            {/* Admin Specific Sidebar */}
            <aside className="w-72 border-r border-indigo-500/10 bg-[#020617] flex flex-col h-screen sticky top-0">
                <div className="p-8">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="bg-indigo-600 p-2 rounded-xl">
                            <ShieldCheck className="w-6 h-6 text-white" />
                        </div>
                        <h1 className="text-xl font-black tracking-tighter text-white uppercase">
                            Admin <span className="text-indigo-500">Hub</span>
                        </h1>
                    </div>
                    <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] ml-11">
                        Secure System Access
                    </p>
                </div>

                <nav className="flex-1 px-4 space-y-1">
                    <div className="px-4 mb-4">
                        <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">Main Modules</p>
                    </div>
                    {menuItems.map((item) => (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={cn(
                                "flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-300 group",
                                location.pathname === item.path
                                    ? "bg-indigo-600 text-white shadow-[0_10px_20px_rgba(79,70,229,0.2)]"
                                    : "text-slate-500 hover:bg-slate-900 hover:text-slate-300"
                            )}
                        >
                            <item.icon className={cn(
                                "w-5 h-5 transition-colors",
                                location.pathname === item.path ? "text-white" : "group-hover:text-slate-300"
                            )} />
                            <span className="font-bold text-sm">{item.label}</span>
                        </Link>
                    ))}
                </nav>

                <div className="p-6 space-y-4">
                    <Link
                        to="/"
                        className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-indigo-400 p-3 rounded-xl hover:bg-indigo-500/5 transition-all w-full"
                    >
                        <ChevronLeft className="w-4 h-4" /> Exit to Trading App
                    </Link>
                    <button
                        onClick={logout}
                        className="flex items-center gap-3 px-4 py-3.5 rounded-2xl text-slate-500 hover:bg-red-500 hover:text-white transition-all w-full group shadow-none hover:shadow-[0_10px_20px_rgba(239,68,68,0.2)]"
                    >
                        <LogOut className="w-5 h-5" />
                        <span className="font-bold text-sm">Terminate Session</span>
                    </button>
                </div>
            </aside>

            {/* Admin Content Area */}
            <main className="flex-1 p-10 overflow-y-auto bg-gradient-to-br from-[#020617] via-[#020617] to-[#080c24]">
                <div className="max-w-6xl mx-auto">
                    {children}
                </div>
            </main>
        </div>
    );
};

export default AdminLayout;
