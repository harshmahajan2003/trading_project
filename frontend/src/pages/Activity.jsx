import { useState, useEffect } from 'react';
import { History, ArrowUpRight, ArrowDownRight, Clock, AlertCircle, Wallet, Activity as ActivityIcon } from 'lucide-react';
import { tradeService } from '../services/api';

const Activity = () => {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTransactions = async () => {
            try {
                const data = await tradeService.getTransactions();
                setTransactions(Array.isArray(data) ? data : []);
            } catch (err) {
                console.error("Activity fetch error:", err);
                setTransactions([]);
            } finally {
                setLoading(false);
            }
        };
        fetchTransactions();
    }, []);

    if (loading) return (
        <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
            <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-slate-400">Loading your activity...</p>
        </div>
    );

    return (
        <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-white mb-2">Activity Log</h1>
                <p className="text-slate-400">Track all your wallet transactions and stock trades.</p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-800/50 border-b border-slate-700">
                                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase">Date</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase">Type</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase">Description</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase text-right">Amount</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                            {transactions.length > 0 ? transactions.map((tx, i) => (
                                <tr key={i} className="hover:bg-slate-800/30 transition-colors">
                                    <td className="px-6 py-4 text-sm">
                                        <div className="text-white font-medium">
                                            {tx.createdAt ? new Date(tx.createdAt).toLocaleDateString() : '---'}
                                        </div>
                                        <div className="text-xs text-slate-500">
                                            {tx.createdAt ? new Date(tx.createdAt).toLocaleTimeString() : '---'}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${tx.type === 'CREDIT' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'
                                            }`}>
                                            {tx.type === 'CREDIT' ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                                            {tx.type}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-slate-800 rounded-lg">
                                                {tx.description?.includes('BUY') || tx.description?.includes('SELL') ? (
                                                    <ActivityIcon className="w-4 h-4 text-indigo-400" />
                                                ) : (
                                                    <Wallet className="w-4 h-4 text-emerald-400" />
                                                )}
                                            </div>
                                            <span className="text-slate-200 font-medium">{tx.description}</span>
                                        </div>
                                    </td>
                                    <td className={`px-6 py-4 text-right font-bold ${tx.type === 'CREDIT' ? 'text-emerald-400' : 'text-slate-200'
                                        }`}>
                                        {tx.type === 'CREDIT' ? '+' : '-'}₹{(tx.amount || 0).toLocaleString('en-IN')}
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan="4" className="px-6 py-20 text-center text-slate-500">
                                        No recent activity to show.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Activity;
