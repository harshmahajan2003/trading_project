import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { adminService, stockService, ipoService } from '../services/api';
import { Users, Package, ShoppingBag, ShieldAlert, ShieldCheck, Plus, Search, Loader2, Rocket, CheckCircle, XCircle, Trash2 } from 'lucide-react';
import { cn } from '../utils/cn';
import ConfirmDialog from '../components/ConfirmDialog';
import Modal from '../components/Modal';

const AdminDashboard = () => {
    const [users, setUsers] = useState([]);
    const [orders, setOrders] = useState([]);
    const [stocks, setStocks] = useState([]); // Add stocks state
    const location = useLocation();
    const [loading, setLoading] = useState(true);
    const [ipos, setIpos] = useState([]);
    const [activeTab, setActiveTab] = useState('users'); // 'users', 'stocks', 'orders', 'ipo'

    // Sync tab with URL
    useEffect(() => {
        const path = location.pathname;
        if (path === '/admin/users' || path === '/admin') setActiveTab('users');
        else if (path === '/admin/stocks') setActiveTab('stocks');
        else if (path === '/admin/orders') setActiveTab('orders');
        else if (path === '/admin/ipo') setActiveTab('ipo');
    }, [location.pathname]);

    // Add stock modal state
    const [showAddStock, setShowAddStock] = useState(false);
    const [newStock, setNewStock] = useState({ symbol: '', name: '', price: '' });
    const [adding, setAdding] = useState(false);

    // IPO Application Modal State
    const [selectedIpo, setSelectedIpo] = useState(null);
    const [applications, setApplications] = useState([]);
    const [viewingApps, setViewingApps] = useState(false);
    const [processingApp, setProcessingApp] = useState(null);

    // Add IPO modal state
    const [showAddIPO, setShowAddIPO] = useState(false);
    const [newIPO, setNewIPO] = useState({
        symbol: '',
        companyName: '',
        price: '',
        totalShares: '',
        lotSize: 10,
        minLot: 1,
        status: 'UPCOMING',
        description: ''
    });
    const [addingIPO, setAddingIPO] = useState(false);

    // Delete Stock Modal State
    const [deleteConfirm, setDeleteConfirm] = useState({ show: false, stock: null });
    const [deleting, setDeleting] = useState(false);

    // Premium Alert State
    const [alertModal, setAlertModal] = useState({ show: false, title: '', message: '', type: 'info' });

    useEffect(() => {
        const fetchAdminData = async () => {
            try {
                const [uRes, oRes, sRes, iRes] = await Promise.allSettled([
                    adminService.getUsers(),
                    adminService.getAllOrders(),
                    stockService.getStocks(),
                    ipoService.getIPOs()
                ]);

                setUsers(uRes.status === 'fulfilled' ? (Array.isArray(uRes.value) ? uRes.value : []) : []);
                setOrders(oRes.status === 'fulfilled' ? (Array.isArray(oRes.value) ? oRes.value : []) : []);
                setStocks(sRes.status === 'fulfilled' ? (Array.isArray(sRes.value) ? sRes.value : []) : []);
                setIpos(iRes.status === 'fulfilled' ? (Array.isArray(iRes.value) ? iRes.value : []) : []);

                if ([uRes, oRes, sRes, iRes].some(r => r.status === 'rejected')) {
                    console.warn("Some Admin Dashboard data failed to load");
                }
            } catch (err) {
                console.error("Critical Admin Dashboard Fetch Error:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchAdminData();
    }, []);

    const handleBlockUser = async (id) => {
        try {
            await adminService.blockUser(id);
            // Refresh users
            const usersData = await adminService.getUsers();
            setUsers(users.map(u => u._id === id ? { ...u, isActive: !u.isActive } : u));
        } catch (err) {
            setAlertModal({ show: true, title: 'Action Failed', message: 'Failed to update user status. Please check your connection.', type: 'danger' });
        }
    };

    const handleAddStock = async (e) => {
        e.preventDefault();

        // Client-side validation
        const { symbol, name, price } = newStock;
        if (symbol.trim().length < 2 || symbol.trim().length > 6) {
            setAlertModal({ show: true, title: 'Invalid Symbol', message: 'Ticker symbol must be 2-6 characters.', type: 'danger' });
            return;
        }
        if (name.trim().length < 2) {
            setAlertModal({ show: true, title: 'Invalid Name', message: 'Company name must be at least 2 characters.', type: 'danger' });
            return;
        }
        if (Number(price) <= 0) {
            setAlertModal({ show: true, title: 'Invalid Price', message: 'Price must be a positive number.', type: 'danger' });
            return;
        }

        setAdding(true);
        try {
            await adminService.addStock(newStock);
            setAlertModal({ show: true, title: 'Asset Added', message: `Successfully listed ${newStock.symbol} on the platform.`, type: 'success' });
            setShowAddStock(false);
            const stocksData = await stockService.getStocks();
            setStocks(Array.isArray(stocksData) ? stocksData : []);
            setNewStock({ symbol: '', name: '', price: '' });
        } catch (err) {
            setAlertModal({ show: true, title: 'Add Asset Failed', message: err.response?.data?.message || "Failed to add stock.", type: 'danger' });
        } finally {
            setAdding(false);
        }
    };

    const handleViewApplications = async (ipo) => {
        setSelectedIpo(ipo);
        setViewingApps(true);
        try {
            const apps = await ipoService.adminGetApplications(ipo._id);
            setApplications(Array.isArray(apps) ? apps : []);
        } catch (err) {
            setAlertModal({ show: true, title: 'Fetch Failed', message: 'Could not retrieve applications for this IPO.', type: 'danger' });
        }
    };

    const handleAllotment = async (applicationId, action) => {
        setProcessingApp(applicationId);
        try {
            await ipoService.adminAllot({ applicationId, action });
            // Refresh applications
            const apps = await ipoService.adminGetApplications(selectedIpo._id);
            setApplications(Array.isArray(apps) ? apps : []);
        } catch (err) {
            setAlertModal({ show: true, title: 'Process Failed', message: err.response?.data?.message || `Failed to ${action.toLowerCase()} application`, type: 'danger' });
        } finally {
            setProcessingApp(null);
        }
    };

    const handleRunAllotment = async () => {
        if (!selectedIpo) return;
        setAdding(true); // Re-using adding state for loading
        try {
            const res = await ipoService.adminRunAllotment(selectedIpo._id);
            setAlertModal({
                show: true,
                title: 'Allotment Complete',
                message: `Processed successfully! Allotted: ${res.stats.allotted}, Rejected: ${res.stats.rejected}.`,
                type: 'success'
            });
            // Refresh data
            const apps = await ipoService.adminGetApplications(selectedIpo._id);
            setApplications(Array.isArray(apps) ? apps : []);
            const iposData = await ipoService.getIPOs();
            setIpos(Array.isArray(iposData) ? iposData : []);
            setViewingApps(false);
            setSelectedIpo(null);
        } catch (err) {
            setAlertModal({ show: true, title: 'Allotment Failed', message: err.response?.data?.message || "Failed to process bulk allotment.", type: 'danger' });
        } finally {
            setAdding(false);
        }
    };

    const handleDeleteStock = async () => {
        const { stock } = deleteConfirm;
        if (!stock) return;

        setDeleting(true);
        try {
            await adminService.deleteStock(stock._id);
            // Refresh stocks
            const stocksData = await stockService.getStocks();
            setStocks(stocksData);
            setDeleteConfirm({ show: false, stock: null });
            setAlertModal({ show: true, title: 'Asset Removed', message: 'The stock has been successfully deleted from the database.', type: 'success' });
        } catch (err) {
            setAlertModal({ show: true, title: 'Delete Failed', message: err.response?.data?.message || "Failed to delete stock. It might be linked to other records.", type: 'danger' });
        } finally {
            setDeleting(false);
        }
    };

    const handleAddIPO = async (e) => {
        e.preventDefault();

        // Client-side validation
        const { symbol, companyName, price, totalShares, lotSize } = newIPO;
        if (symbol.trim().length < 2 || symbol.trim().length > 6) {
            setAlertModal({ show: true, title: 'Invalid Symbol', message: 'Ticker symbol must be 2-6 characters.', type: 'danger' });
            return;
        }
        if (companyName.trim().length < 2) {
            setAlertModal({ show: true, title: 'Invalid Name', message: 'Company name must be at least 2 characters.', type: 'danger' });
            return;
        }
        if (Number(price) <= 0 || Number(totalShares) <= 0 || Number(lotSize) <= 0) {
            setAlertModal({ show: true, title: 'Invalid Values', message: 'Price, Shares, and Lot size must be positive numbers.', type: 'danger' });
            return;
        }

        setAddingIPO(true);
        try {
            await ipoService.adminCreate({
                ...newIPO,
                price: Number(newIPO.price),
                totalShares: Number(newIPO.totalShares),
                lotSize: Number(newIPO.lotSize),
                minLot: Number(newIPO.minLot)
            });
            setAlertModal({ show: true, title: 'IPO Listed', message: `Successfully created IPO listing for ${newIPO.symbol}.`, type: 'success' });
            setShowAddIPO(false);
            const iposData = await ipoService.getIPOs();
            setIpos(Array.isArray(iposData) ? iposData : []);
            setNewIPO({ symbol: '', companyName: '', price: '', totalShares: '', lotSize: 10, minLot: 1, status: 'UPCOMING', description: '' });
        } catch (err) {
            setAlertModal({ show: true, title: 'Create IPO Failed', message: err.response?.data?.message || "Failed to create IPO.", type: 'danger' });
        } finally {
            setAddingIPO(false);
        }
    };

    const handleListIPO = async (ipoId) => {
        try {
            await ipoService.adminListOnMarket(ipoId);
            setAlertModal({ show: true, title: 'Listing Success', message: 'The IPO has been successfully listed on the exchange. Trading is now active!', type: 'success' });
            // Refresh data
            const iposData = await ipoService.getIPOs();
            const stocksData = await stockService.getStocks();
            setIpos(Array.isArray(iposData) ? iposData : []);
            setStocks(Array.isArray(stocksData) ? stocksData : []);
        } catch (err) {
            setAlertModal({ show: true, title: 'Listing Failed', message: err.response?.data?.message || "Failed to list IPO on market.", type: 'danger' });
        }
    };

    const handleUpdateStatus = async (ipoId, status) => {
        try {
            await ipoService.adminUpdateStatus(ipoId, status);
            setAlertModal({ show: true, title: 'Status Updated', message: `IPO status changed to ${status}`, type: 'success' });
            // Refresh
            const iposData = await ipoService.getIPOs();
            setIpos(Array.isArray(iposData) ? iposData : []);
        } catch (err) {
            setAlertModal({ show: true, title: 'Update Failed', message: err.response?.data?.message || "Failed to update status", type: 'danger' });
        }
    };

    if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="w-10 h-10 text-indigo-500 animate-spin" /></div>;

    const tabs = [
        { id: 'users', label: 'Users', icon: Users },
        { id: 'stocks', label: 'Assets', icon: Package },
        { id: 'ipo', label: 'IPO Manager', icon: Rocket },
        { id: 'orders', label: 'Order Monitor', icon: ShoppingBag },
    ];

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black text-white">Admin Command Center</h1>
                    <p className="text-slate-400">Manage users, monitor orders, and control assets</p>
                </div>
                <div className="flex gap-3">
                    {activeTab === 'ipo' ? (
                        <button
                            onClick={() => setShowAddIPO(true)}
                            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-2xl font-bold transition-all shadow-lg shadow-indigo-600/20"
                        >
                            <Rocket className="w-5 h-5" /> Create New IPO
                        </button>
                    ) : (
                        <button
                            onClick={() => setShowAddStock(true)}
                            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-2xl font-bold transition-all shadow-lg shadow-indigo-600/20"
                        >
                            <Plus className="w-5 h-5" /> Add New Stock
                        </button>
                    )}
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-slate-900/40 border border-slate-800 p-8 rounded-3xl backdrop-blur-sm">
                    <p className="text-slate-500 text-xs font-black uppercase tracking-widest mb-2">Total Users</p>
                    <h3 className="text-4xl font-black text-white">{users.length}</h3>
                </div>
                <div className="bg-slate-900/40 border border-slate-800 p-8 rounded-3xl backdrop-blur-sm font-mono">
                    <p className="text-slate-500 text-xs font-black uppercase tracking-widest mb-2 font-sans">Trading Volume</p>
                    <h3 className="text-3xl font-black text-white">₹{(orders.reduce((acc, curr) => acc + ((curr.price || 0) * (curr.quantity || 0)), 0)).toLocaleString('en-IN')}</h3>
                </div>
                <div className="bg-slate-900/40 border border-slate-800 p-8 rounded-3xl backdrop-blur-sm">
                    <p className="text-slate-500 text-xs font-black uppercase tracking-widest mb-2">Platform Assets</p>
                    <h3 className="text-4xl font-black text-indigo-500">{stocks.length}</h3>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-slate-800 gap-8">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={cn(
                            "flex items-center gap-2 py-4 font-bold transition-all relative",
                            activeTab === tab.id ? "text-indigo-500" : "text-slate-500 hover:text-slate-300"
                        )}
                    >
                        <tab.icon className="w-5 h-5" />
                        {tab.label}
                        {activeTab === tab.id && <div className="absolute bottom-0 left-0 right-0 h-1 bg-indigo-500 rounded-full" />}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            <div className="bg-slate-900/40 border border-slate-800 rounded-3xl overflow-hidden backdrop-blur-sm">
                {activeTab === 'users' && (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left min-w-[700px]">
                            <thead>
                                <tr className="bg-slate-800/20 border-b border-slate-800 text-slate-400 text-[10px] font-black uppercase tracking-widest">
                                    <th className="px-8 py-5">User Account</th>
                                    <th className="px-8 py-5">Membership</th>
                                    <th className="px-8 py-5">Joined On</th>
                                    <th className="px-8 py-5 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800">
                                {users.map(user => (
                                    <tr key={user._id} className="hover:bg-indigo-600/5 transition-all">
                                        <td className="px-8 py-5">
                                            <div className="font-bold text-white">{user.name || 'Anonymous'}</div>
                                            <div className="text-xs text-slate-500 font-mono italic">{user.email || 'no-email'}</div>
                                        </td>
                                        <td className="px-8 py-5">
                                            <span className={cn(
                                                "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
                                                user.isActive ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-500"
                                            )}>
                                                {user.isActive ? <ShieldCheck className="w-3 h-3" /> : <ShieldAlert className="w-3 h-3" />}
                                                {user.isActive ? 'Active' : 'Blocked'}
                                            </span>
                                        </td>
                                        <td className="px-8 py-5 text-sm text-slate-500 font-medium">
                                            {user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-IN') : 'N/A'}
                                        </td>
                                        <td className="px-8 py-5 text-right">
                                            <button
                                                onClick={() => handleBlockUser(user._id)}
                                                className={cn(
                                                    "text-[10px] font-black px-4 py-2 rounded-xl transition-all uppercase tracking-widest",
                                                    user.isActive ? "text-rose-500 hover:bg-rose-500/10 border border-rose-500/20" : "text-emerald-500 hover:bg-emerald-500/10 border border-emerald-500/20"
                                                )}
                                            >
                                                {user.isActive ? 'Block' : 'Unblock'}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {activeTab === 'stocks' && (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left min-w-[700px]">
                            <thead>
                                <tr className="bg-slate-800/20 border-b border-slate-800 text-slate-400 text-[10px] font-black uppercase tracking-widest">
                                    <th className="px-8 py-5">Asset Symbol</th>
                                    <th className="px-8 py-5">Company Name</th>
                                    <th className="px-8 py-5 text-right">Current Price</th>
                                    <th className="px-8 py-5 text-right">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800">
                                {stocks.map(stock => (
                                    <tr key={stock._id} className="hover:bg-indigo-600/5 transition-all">
                                        <td className="px-8 py-5">
                                            <span className="font-black text-white px-2 py-1 bg-slate-800 rounded-lg border border-slate-700">{stock.symbol || '---'}</span>
                                        </td>
                                        <td className="px-8 py-5 font-bold text-slate-300">{stock.name || '---'}</td>
                                        <td className="px-8 py-5 text-right font-black text-white text-lg">
                                            ₹{(stock.price || 0).toLocaleString('en-IN')}
                                        </td>
                                        <td className="px-8 py-5 text-right">
                                            <div className="flex items-center justify-end gap-3">
                                                <span className="text-[10px] font-black text-emerald-500 bg-emerald-500/10 px-3 py-1 rounded-full uppercase">LISTED</span>
                                                <button
                                                    onClick={() => setDeleteConfirm({ show: true, stock })}
                                                    className="p-2 text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all"
                                                    title="Delete Asset"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {activeTab === 'ipo' && (
                    <div className="p-8 space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {ipos.filter(ipo => ipo.status !== 'LISTED').length > 0 ? ipos.filter(ipo => ipo.status !== 'LISTED').map(ipo => (
                                <div key={ipo?._id} className="group relative bg-[#0B0F19] border border-white/5 hover:border-indigo-500/20 rounded-[2rem] p-8 transition-all duration-500 overflow-hidden shadow-2xl hover:shadow-indigo-500/10 active:scale-[0.99]">
                                    {/* Ambient Glow */}
                                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-transparent to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

                                    <div className="relative z-10">
                                        <div className="flex justify-between items-start mb-8">
                                            <div className="flex items-center gap-5">
                                                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 border border-white/10 flex items-center justify-center text-2xl font-black text-white shadow-xl group-hover:scale-110 transition-transform duration-500">
                                                    {ipo.symbol?.[0]}
                                                </div>
                                                <div>
                                                    <h3 className="text-2xl font-black text-white tracking-tight group-hover:text-indigo-400 transition-colors">{ipo.symbol}</h3>
                                                    <p className="text-slate-500 font-bold text-xs uppercase tracking-widest mt-1">{ipo.companyName}</p>
                                                </div>
                                            </div>
                                            <span className={cn(
                                                "px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] border backdrop-blur-md shadow-lg",
                                                ipo.status === 'OPEN' ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-emerald-500/10 animate-pulse-slow" :
                                                    ipo.status === 'UPCOMING' ? "bg-amber-500/10 text-amber-400 border-amber-500/20 shadow-amber-500/10" :
                                                        ipo.status === 'ALLOTTED' ? "bg-indigo-500/10 text-indigo-400 border-indigo-500/20 shadow-indigo-500/10" :
                                                            "bg-rose-500/10 text-rose-400 border-rose-500/20 shadow-rose-500/10"
                                            )}>
                                                {ipo.status}
                                            </span>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4 mb-8">
                                            <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-colors">
                                                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Offer Price</p>
                                                <div className="flex items-baseline gap-1">
                                                    <span className="text-xl font-black text-white">₹{ipo.price}</span>
                                                </div>
                                            </div>
                                            <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-colors">
                                                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Lot Size</p>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xl font-black text-indigo-400">{ipo.lotSize}</span>
                                                    <span className="text-[10px] text-slate-500 font-bold uppercase">Qty</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex flex-col gap-3">
                                            {ipo.status === 'UPCOMING' && (
                                                <button
                                                    onClick={() => handleUpdateStatus(ipo._id, 'OPEN')}
                                                    className="w-full h-12 flex items-center justify-center bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-xl transition-all text-[10px] uppercase tracking-[0.15em] shadow-lg shadow-indigo-600/20 hover:shadow-indigo-600/40 hover:-translate-y-0.5"
                                                >
                                                    Open Subscription
                                                </button>
                                            )}

                                            {ipo.status === 'OPEN' && (
                                                <button
                                                    onClick={() => handleUpdateStatus(ipo._id, 'CLOSED')}
                                                    className="w-full h-12 flex items-center justify-center bg-rose-500/10 hover:bg-rose-500 text-rose-500 hover:text-white font-black rounded-xl transition-all text-[10px] uppercase tracking-[0.15em] border border-rose-500/20 hover:border-transparent shadow-lg shadow-rose-500/5 hover:shadow-rose-500/30"
                                                >
                                                    Close Subscription
                                                </button>
                                            )}

                                            <button
                                                className="w-full h-12 flex items-center justify-center bg-slate-800 hover:bg-slate-700 text-white font-black rounded-xl transition-all text-[10px] uppercase tracking-[0.15em] border border-slate-700 hover:border-slate-600"
                                                onClick={() => handleViewApplications(ipo)}
                                            >
                                                View Applications
                                            </button>

                                            {ipo.status === 'ALLOTTED' && (
                                                <button
                                                    className="w-full h-12 flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-white font-black rounded-xl transition-all text-[10px] uppercase tracking-[0.15em] shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40 hover:-translate-y-0.5"
                                                    onClick={() => handleListIPO(ipo._id)}
                                                >
                                                    <Rocket className="w-4 h-4" /> Finalize Listing
                                                </button>
                                            )}

                                            {ipo.status === 'LISTED' && (
                                                <div className="w-full h-12 flex items-center justify-center gap-2 bg-emerald-500/5 border border-emerald-500/20 rounded-xl">
                                                    <CheckCircle className="w-4 h-4 text-emerald-500" />
                                                    <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Active on Market</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )) : (
                                <div className="col-span-full py-24 flex flex-col items-center justify-center bg-[#0B0F19] rounded-[2.5rem] border border-dashed border-slate-800/50">
                                    <div className="w-20 h-20 rounded-full bg-slate-800/50 flex items-center justify-center mb-6 animate-pulse-slow">
                                        <Rocket className="w-10 h-10 text-slate-600" />
                                    </div>
                                    <h3 className="text-xl font-black text-white mb-2">No Active IPOs</h3>
                                    <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Create a new listing to get started</p>
                                </div>
                            )}
                        </div>

                        {/* IPO Applications Detailed View */}
                        {viewingApps && selectedIpo && (
                            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
                                <div className="bg-[#0b0f19] border border-slate-700/50 w-full max-w-5xl h-[85vh] rounded-[2rem] flex flex-col shadow-2xl overflow-hidden relative animate-in zoom-in-95 duration-300">
                                    {/* Modal Header with Glassmorphism and Mesh Gradient */}
                                    <div className="relative px-8 py-6 border-b border-sidebar-border bg-sidebar-bg/50 backdrop-blur-sm shrink-0">
                                        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 via-purple-500/5 to-transparent pointer-events-none" />
                                        <div className="relative flex items-center justify-between">
                                            <div className="flex items-center gap-5">
                                                <div className="w-14 h-14 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center text-2xl font-black text-white shadow-xl shadow-indigo-600/20">
                                                    {selectedIpo.symbol?.[0]}
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-3">
                                                        <h2 className="text-2xl font-black text-white tracking-tight">{selectedIpo.symbol}</h2>
                                                        <span className="bg-indigo-500/10 text-indigo-400 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider border border-indigo-500/20">
                                                            {applications.length} Bids
                                                        </span>
                                                        <span className={cn(
                                                            "px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] border backdrop-blur-md",
                                                            selectedIpo.status === 'OPEN' ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-emerald-500/10 animate-pulse-slow" :
                                                                selectedIpo.status === 'UPCOMING' ? "bg-amber-500/10 text-amber-400 border-amber-500/20 shadow-amber-500/10" :
                                                                    selectedIpo.status === 'ALLOTTED' ? "bg-indigo-500/10 text-indigo-400 border-indigo-500/20 shadow-indigo-500/10" :
                                                                        "bg-rose-500/10 text-rose-400 border-rose-500/20 shadow-rose-500/10"
                                                        )}>
                                                            {selectedIpo.status}
                                                        </span>
                                                    </div>
                                                    <p className="text-slate-400 font-bold text-sm mt-1 uppercase tracking-widest opacity-80">{selectedIpo.companyName} • ₹{selectedIpo.price} Per Share</p>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-4">
                                                {/* Status Control Actions */}
                                                {selectedIpo.status === 'UPCOMING' && (
                                                    <button
                                                        onClick={async () => {
                                                            await handleUpdateStatus(selectedIpo._id, 'OPEN');
                                                            setSelectedIpo((prev) => ({ ...prev, status: 'OPEN' }));
                                                        }}
                                                        className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-black text-[10px] uppercase tracking-widest transition-all shadow-lg shadow-indigo-600/20"
                                                    >
                                                        Open Subscription
                                                    </button>
                                                )}

                                                {selectedIpo.status === 'OPEN' && (
                                                    <button
                                                        onClick={async () => {
                                                            await handleUpdateStatus(selectedIpo._id, 'CLOSED');
                                                            setSelectedIpo((prev) => ({ ...prev, status: 'CLOSED' }));
                                                        }}
                                                        className="px-6 py-3 bg-rose-500/10 hover:bg-rose-500 text-rose-500 hover:text-white border border-rose-500/20 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all shadow-lg shadow-rose-500/5 hover:shadow-rose-500/20"
                                                    >
                                                        Close Subscription
                                                    </button>
                                                )}

                                                {selectedIpo.status === 'ALLOTTED' && (
                                                    <button
                                                        onClick={() => handleListIPO(selectedIpo._id)}
                                                        className="flex items-center gap-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-white rounded-xl font-black text-[10px] uppercase tracking-widest transition-all shadow-lg shadow-emerald-500/20"
                                                    >
                                                        <Rocket className="w-4 h-4" /> Finalize Listing
                                                    </button>
                                                )}

                                                {applications.some(a => a.status === 'PENDING') && selectedIpo.status !== 'LISTED' && (
                                                    <button
                                                        onClick={handleRunAllotment}
                                                        disabled={adding}
                                                        className="group relative flex items-center gap-3 bg-emerald-500 hover:bg-emerald-400 text-white px-8 py-4 rounded-[1.5rem] text-xs font-black uppercase tracking-[0.15em] transition-all shadow-2xl shadow-emerald-500/30 disabled:opacity-50 active:scale-95"
                                                    >
                                                        <div className="absolute inset-0 rounded-[1.5rem] bg-emerald-500 animate-pulse-slow blur-xl opacity-20 pointer-events-none group-hover:opacity-40 transition-opacity" />
                                                        {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Rocket className="w-4 h-4 group-hover:-rotate-12 transition-transform" />}
                                                        Run Random Allotment
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => {
                                                        setViewingApps(false);
                                                        setSelectedIpo(null);
                                                    }}
                                                    className="w-10 h-10 rounded-xl bg-slate-800 hover:bg-slate-700 hover:text-white text-slate-400 flex items-center justify-center transition-all border border-slate-700"
                                                >
                                                    <XCircle className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
                                        {applications.length > 0 ? (
                                            <table className="w-full text-left">
                                                <thead className="sticky top-0 bg-[#0b0f19] z-10 shadow-sm shadow-black/50">
                                                    <tr className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] border-b border-white/5">
                                                        <th className="pb-4 pl-2">Applicant Detail</th>
                                                        <th className="pb-6">Bid Strategy</th>
                                                        <th className="pb-6">Blocked Value</th>
                                                        <th className="pb-6">Current Status</th>
                                                        <th className="pb-6 text-right pr-2">Execution</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-white/5">
                                                    {applications.map(app => {
                                                        const initials = app.user?.name?.split(' ').map(n => n[0]).join('') || '??';
                                                        return (
                                                            <tr key={app._id} className="group hover:bg-indigo-500/[0.03] transition-all">
                                                                <td className="py-6 pl-2">
                                                                    <div className="flex items-center gap-4">
                                                                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700/50 flex items-center justify-center text-sm font-black text-indigo-400 uppercase tracking-tighter">
                                                                            {initials}
                                                                        </div>
                                                                        <div>
                                                                            <p className="font-black text-white text-base tracking-tight">{app.user?.name}</p>
                                                                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{app.user?.email}</p>
                                                                        </div>
                                                                    </div>
                                                                </td>
                                                                <td className="py-6">
                                                                    <div className="flex items-center gap-2">
                                                                        <p className="font-black text-white text-lg">{app.lots}</p>
                                                                        <div className="bg-slate-800/50 px-2 py-0.5 rounded-lg border border-slate-700/30">
                                                                            <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest">LOTS</p>
                                                                        </div>
                                                                    </div>
                                                                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">{app.quantity} Equity Shares</p>
                                                                </td>
                                                                <td className="py-6">
                                                                    <p className="font-mono text-indigo-400 font-black text-lg">₹{app.amount.toLocaleString()}</p>
                                                                    <p className="text-[9px] text-slate-600 font-bold uppercase tracking-widest">Fixed Capital</p>
                                                                </td>
                                                                <td className="py-6">
                                                                    <div className={cn(
                                                                        "inline-flex items-center gap-2 px-4 py-2 rounded-2xl border",
                                                                        app.status === 'ALLOTTED' ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-lg shadow-emerald-500/5" :
                                                                            app.status === 'REJECTED' ? "bg-rose-500/10 text-rose-400 border-rose-500/20" :
                                                                                "bg-slate-800/50 text-slate-400 border-slate-700/50"
                                                                    )}>
                                                                        <div className={cn(
                                                                            "w-1.5 h-1.5 rounded-full animate-pulse-slow",
                                                                            app.status === 'ALLOTTED' ? "bg-emerald-400" :
                                                                                app.status === 'REJECTED' ? "bg-rose-400" : "bg-slate-500"
                                                                        )} />
                                                                        <span className="text-[10px] font-black uppercase tracking-widest">{app.status}</span>
                                                                    </div>
                                                                </td>
                                                                <td className="py-6 text-right pr-2">
                                                                    {app.status === 'PENDING' ? (
                                                                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all transform translate-x-4 group-hover:translate-x-0">
                                                                            <button
                                                                                disabled={processingApp === app._id}
                                                                                onClick={() => handleAllotment(app._id, 'ALLOT')}
                                                                                className="h-9 px-4 flex items-center gap-2 transition-all hover:bg-emerald-500 bg-emerald-500/10 text-emerald-500 hover:text-white rounded-xl border border-emerald-500/20 font-black text-[10px] uppercase tracking-widest shadow-lg shadow-emerald-500/10"
                                                                            >
                                                                                <CheckCircle className="w-3.5 h-3.5" /> Allot
                                                                            </button>
                                                                            <button
                                                                                disabled={processingApp === app._id}
                                                                                onClick={() => handleAllotment(app._id, 'REJECT')}
                                                                                className="h-9 px-4 flex items-center gap-2 transition-all hover:bg-rose-500 bg-rose-500/10 text-rose-500 hover:text-white rounded-xl border border-rose-500/20 font-black text-[10px] uppercase tracking-widest shadow-lg shadow-rose-500/10"
                                                                            >
                                                                                <XCircle className="w-3.5 h-3.5" /> Reject
                                                                            </button>
                                                                        </div>
                                                                    ) : (
                                                                        <p className="text-[9px] font-black text-slate-700 uppercase tracking-[0.2em] italic pr-2">Ledger Settled</p>
                                                                    )}
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        ) : (
                                            <div className="flex flex-col items-center justify-center py-20 bg-slate-900/20 border border-dashed border-slate-800 rounded-3xl">
                                                <Rocket className="w-12 h-12 text-slate-700 mb-4" />
                                                <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">No applications found for this IPO</p>
                                            </div>
                                        )}
                                    </div>

                                    <div className="px-8 py-4 bg-[#0b0f19] border-t border-slate-800 flex items-center justify-between shrink-0">
                                        <p className="text-[10px] text-slate-500 max-w-sm leading-relaxed">
                                            Actions are final. Ensure ledger balance before alloting.
                                        </p>
                                        <button
                                            onClick={() => {
                                                setViewingApps(false);
                                                setSelectedIpo(null);
                                            }}
                                            className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold text-[10px] uppercase tracking-wider transition-all border border-slate-700"
                                        >
                                            Close
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'orders' && (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left min-w-[800px]">
                            <thead>
                                <tr className="bg-slate-800/20 border-b border-slate-800 text-slate-400 text-[10px] font-black uppercase tracking-widest">
                                    <th className="px-8 py-5">Order ID</th>
                                    <th className="px-8 py-5">User Account</th>
                                    <th className="px-8 py-5">Asset</th>
                                    <th className="px-8 py-5">Value</th>
                                    <th className="px-8 py-5 text-right">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800">
                                {orders.length > 0 ? orders.map(order => (
                                    <tr key={order._id} className="hover:bg-white/5 transition-all">
                                        <td className="px-8 py-5 text-[10px] font-mono text-slate-500 uppercase">{order._id.slice(-8)}</td>
                                        <td className="px-8 py-5 font-bold text-white uppercase text-sm">
                                            {order.user?.name || 'Anonymous'}
                                        </td>
                                        <td className="px-8 py-5">
                                            <div className="flex items-center gap-2">
                                                <span className={cn(
                                                    "font-black text-[10px] p-1.5 rounded-lg border",
                                                    order.side === 'BUY' ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" : "bg-rose-500/10 text-rose-500 border-rose-500/20"
                                                )}>{order.side}</span>
                                                <span className="font-bold text-slate-300 tracking-tight uppercase">{order.symbol}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5">
                                            <p className="font-black text-white">₹{(order.price * order.quantity).toLocaleString()}</p>
                                            <p className="text-[10px] text-slate-500 font-bold uppercase">{order.quantity} Shares @ ₹{order.price}</p>
                                        </td>
                                        <td className="px-8 py-5 text-right">
                                            <span className="text-[10px] font-black text-indigo-400 bg-indigo-500/10 px-3 py-1 rounded-full uppercase tracking-widest">EXECUTED</span>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan="5" className="px-8 py-20 text-center text-slate-500 font-bold uppercase tracking-widest text-xs">No orders processed yet</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Premium Confirmation Dialog for Deletion */}
            <ConfirmDialog
                isOpen={deleteConfirm.show}
                onClose={() => setDeleteConfirm({ show: false, stock: null })}
                onConfirm={handleDeleteStock}
                title="Confirm Deletion"
                message={`Are you sure you want to delete ${deleteConfirm.stock?.symbol}? This action will permanently remove the asset from the platform.`}
                confirmText="Delete Asset"
                type="danger"
                loading={deleting}
            />

            {/* Premium Alert Dialog */}
            <ConfirmDialog
                isOpen={alertModal.show}
                onClose={() => setAlertModal({ ...alertModal, show: false })}
                onConfirm={() => setAlertModal({ ...alertModal, show: false })}
                title={alertModal.title}
                message={alertModal.message}
                confirmText="Understood"
                type={alertModal.type}
                alertOnly={true}
            />

            {/* Add Stock Modal */}
            {showAddStock && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-3xl p-8 shadow-2xl animate-in zoom-in-95 duration-300">
                        <div className="flex items-center justify-between mb-8">
                            <h2 className="text-2xl font-black text-white uppercase tracking-tight">List New Asset</h2>
                            <button onClick={() => setShowAddStock(false)} className="w-10 h-10 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 flex items-center justify-center transition-all">&times;</button>
                        </div>
                        <form onSubmit={handleAddStock} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Symbol (e.g., ADANI)</label>
                                <input
                                    required
                                    type="text"
                                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-white outline-none focus:ring-2 focus:ring-indigo-500/50 uppercase font-black"
                                    value={newStock.symbol}
                                    onChange={e => setNewStock({ ...newStock, symbol: e.target.value.toUpperCase() })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Company Name</label>
                                <input
                                    required
                                    type="text"
                                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-white outline-none focus:ring-2 focus:ring-indigo-500/50 font-bold"
                                    value={newStock.name}
                                    onChange={e => setNewStock({ ...newStock, name: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">IPO Price (₹)</label>
                                <input
                                    required
                                    type="number"
                                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-white outline-none focus:ring-2 focus:ring-indigo-500/50 font-mono"
                                    value={newStock.price}
                                    onChange={e => setNewStock({ ...newStock, price: e.target.value })}
                                />
                            </div>
                            <button
                                disabled={adding}
                                className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-700 text-white font-black py-4 rounded-2xl transition-all shadow-xl shadow-indigo-600/20 flex items-center justify-center gap-2 uppercase tracking-widest text-sm"
                            >
                                {adding ? <Loader2 className="animate-spin" /> : 'Confirm Listing'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Add IPO Modal */}
            {showAddIPO && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-slate-900 border border-slate-800 w-full max-w-2xl rounded-[2.5rem] p-8 shadow-2xl animate-in zoom-in-95 duration-300 max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-8">
                            <h2 className="text-2xl font-black text-white uppercase tracking-tight">Create IPO Listing</h2>
                            <button onClick={() => setShowAddIPO(false)} className="w-10 h-10 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 flex items-center justify-center transition-all">&times;</button>
                        </div>
                        <form onSubmit={handleAddIPO} className="space-y-6">
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Symbol</label>
                                    <input
                                        required
                                        type="text"
                                        className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-white outline-none focus:ring-2 focus:ring-indigo-500/50 uppercase font-black"
                                        placeholder="E.G. RELIANCE"
                                        value={newIPO.symbol}
                                        onChange={e => setNewIPO({ ...newIPO, symbol: e.target.value.toUpperCase() })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Company Name</label>
                                    <input
                                        required
                                        type="text"
                                        className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-white outline-none focus:ring-2 focus:ring-indigo-500/50 font-bold"
                                        value={newIPO.companyName}
                                        onChange={e => setNewIPO({ ...newIPO, companyName: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">IPO Price (₹)</label>
                                    <input
                                        required
                                        type="number"
                                        className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-white outline-none focus:ring-2 focus:ring-indigo-500/50 font-mono"
                                        value={newIPO.price}
                                        onChange={e => setNewIPO({ ...newIPO, price: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Total Shares</label>
                                    <input
                                        required
                                        type="number"
                                        className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-white outline-none focus:ring-2 focus:ring-indigo-500/50 font-mono"
                                        value={newIPO.totalShares}
                                        onChange={e => setNewIPO({ ...newIPO, totalShares: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Lot Size (Shares)</label>
                                    <input
                                        required
                                        type="number"
                                        className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-white outline-none focus:ring-2 focus:ring-indigo-500/50 font-mono"
                                        value={newIPO.lotSize}
                                        onChange={e => setNewIPO({ ...newIPO, lotSize: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Status</label>
                                    <select
                                        className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-white outline-none focus:ring-2 focus:ring-indigo-500/50 font-bold appearance-none"
                                        value={newIPO.status}
                                        onChange={e => setNewIPO({ ...newIPO, status: e.target.value })}
                                    >
                                        <option value="UPCOMING">Upcoming</option>
                                        <option value="OPEN">Open</option>
                                        <option value="CLOSED">Closed</option>
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Description</label>
                                <textarea
                                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-white outline-none focus:ring-2 focus:ring-indigo-500/50 text-sm min-h-[100px]"
                                    value={newIPO.description}
                                    onChange={e => setNewIPO({ ...newIPO, description: e.target.value })}
                                />
                            </div>

                            <button
                                disabled={addingIPO}
                                className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-700 text-white font-black py-4 rounded-2xl transition-all shadow-xl shadow-indigo-600/20 flex items-center justify-center gap-2 uppercase tracking-widest text-sm"
                            >
                                {addingIPO ? <Loader2 className="animate-spin" /> : 'Launch IPO Listing'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;
