import { useState, useEffect } from 'react';
import { ipoService, walletService } from '../services/api';
import { Rocket, Clock, Info, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { cn } from '../utils/cn';
import ConfirmDialog from '../components/ConfirmDialog';

const IPOHub = () => {
    const [ipos, setIpos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [applying, setApplying] = useState(null); // ID of IPO being applied for
    const [bidLots, setBidLots] = useState(1);
    const [balance, setBalance] = useState(0);

    // Premium Confirmation Modal State
    const [confirmModal, setConfirmModal] = useState({ show: false, ipo: null });
    const [alertModal, setAlertModal] = useState({ show: false, title: '', message: '', type: 'info' });
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        try {
            const [ipoData, walletData] = await Promise.all([
                ipoService.getIPOs(),
                walletService.getBalance()
            ]);
            setIpos(Array.isArray(ipoData) ? ipoData : []);
            setBalance(walletData.balance);
        } catch (err) {
            console.error("IPO Hub load error:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleApply = async () => {
        const { ipo } = confirmModal;
        if (!ipo) return;

        setIsSubmitting(true);
        try {
            await ipoService.apply({ ipoId: ipo._id, lots: bidLots });
            setConfirmModal({ show: false, ipo: null });
            setAlertModal({
                show: true,
                title: 'Application Success',
                message: `Congratulations! Your bid for ${ipo.symbol} has been successfully placed. ₹${(bidLots * ipo.lotSize * ipo.price).toLocaleString()} has been blocked.`,
                type: 'success'
            });
            fetchInitialData(); // Refresh data
        } catch (err) {
            setAlertModal({
                show: true,
                title: 'Application Failed',
                message: err.response?.data?.message || "There was an error processing your IPO application. Please try again.",
                type: 'danger'
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const initiateApply = (ipo) => {
        const numLots = Number(bidLots);
        if (isNaN(numLots) || numLots <= 0 || !Number.isInteger(numLots)) {
            setAlertModal({
                show: true,
                title: 'Invalid Bid',
                message: 'Please select or enter a valid number of lots.',
                type: 'danger'
            });
            return;
        }

        const cost = numLots * ipo.lotSize * ipo.price;
        if (cost > balance) {
            setAlertModal({
                show: true,
                title: 'Insufficient Balance',
                message: `You need ₹${cost.toLocaleString()} to apply for ${numLots} lots, but your current balance is ₹${balance.toLocaleString()}.`,
                type: 'danger'
            });
            return;
        }
        setConfirmModal({ show: true, ipo });
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-black text-white tracking-tight flex items-center gap-3">
                        <Rocket className="w-10 h-10 text-indigo-500" />
                        IPO Hub
                    </h1>
                    <p className="text-slate-400 mt-2">Invest in the next big companies before they go live on market</p>
                </div>
                <div className="bg-indigo-600/10 border border-indigo-500/20 px-6 py-3 rounded-2xl">
                    <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Available for Bidding</p>
                    <p className="text-xl font-black text-white">₹{balance.toLocaleString('en-IN')}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {ipos.filter(ipo => ipo.status !== 'LISTED').length > 0 ? (
                    ipos.filter(ipo => ipo.status !== 'LISTED').map((ipo) => (
                        <div key={ipo._id} className="group bg-slate-900/40 border border-slate-800 hover:border-indigo-500/30 rounded-[2.5rem] p-8 transition-all duration-500 backdrop-blur-sm relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-8">
                                <span className={cn(
                                    "px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em]",
                                    ipo.status === 'OPEN' ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" : "bg-orange-500/10 text-orange-400 border border-orange-500/20"
                                )}>
                                    {ipo.status}
                                </span>
                            </div>

                            <div className="flex items-start gap-6">
                                <div className="w-20 h-20 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-3xl flex items-center justify-center text-3xl font-black text-white shadow-xl shadow-indigo-600/20">
                                    {ipo.symbol?.[0]}
                                </div>
                                <div className="flex-1">
                                    <h2 className="text-2xl font-black text-white group-hover:text-indigo-400 transition-colors">{ipo.companyName}</h2>
                                    <p className="text-slate-500 font-mono text-sm mt-1">{ipo.symbol}</p>
                                </div>
                            </div>

                            <p className="mt-6 text-slate-400 text-sm leading-relaxed line-clamp-2">
                                {ipo.description || `Special Initial Public Offering for ${ipo.companyName}. Be early and secure your shares at IPO price.`}
                            </p>

                            <div className="mt-8 grid grid-cols-3 gap-4 border-t border-slate-800/50 pt-8">
                                <div>
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Issue Price</p>
                                    <p className="text-xl font-black text-white">₹{ipo.price}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Lot Size</p>
                                    <p className="text-xl font-black text-white">{ipo.lotSize} <span className="text-[10px] text-slate-500 font-bold uppercase">Shares</span></p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Min Invest</p>
                                    <p className="text-xl font-black text-indigo-400 font-mono">₹{(ipo.price * ipo.lotSize).toLocaleString()}</p>
                                </div>
                            </div>

                            {ipo.status === 'OPEN' && (
                                <div className="mt-8 space-y-4">
                                    <div className="flex items-center gap-4">
                                        <div className="flex-1">
                                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block ml-1">Number of Lots</label>
                                            <select
                                                className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-white outline-none focus:ring-2 focus:ring-indigo-500/50 appearance-none font-bold"
                                                value={ipo._id === applying ? bidLots : 1}
                                                onChange={(e) => setBidLots(parseInt(e.target.value))}
                                                disabled={applying === ipo._id}
                                            >
                                                {[1, 2, 3, 4, 5, 10, 15].map(n => (
                                                    <option key={n} value={n}>{n} Lot ({n * ipo.lotSize} Shares)</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="flex-none pt-6 text-right">
                                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Total Bid</p>
                                            <p className="text-lg font-black text-white font-mono">₹{(bidLots * ipo.lotSize * ipo.price).toLocaleString()}</p>
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => initiateApply(ipo)}
                                        disabled={applying === ipo._id}
                                        className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-800 text-white font-black py-4 rounded-[1.25rem] transition-all shadow-xl shadow-indigo-600/20 flex items-center justify-center gap-2 group/btn"
                                    >
                                        {applying === ipo._id ? (
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                        ) : (
                                            <>
                                                Place IPO Bid
                                                <Rocket className="w-4 h-4 group-hover/btn:translate-x-1 group-hover/btn:-translate-y-1 transition-transform" />
                                            </>
                                        )}
                                    </button>
                                </div>
                            )}

                            {ipo.status === 'UPCOMING' && (
                                <div className="mt-8 bg-orange-500/5 border border-orange-500/10 rounded-2xl p-4 flex items-center gap-3">
                                    <Clock className="w-5 h-5 text-orange-400" />
                                    <p className="text-xs font-bold text-orange-400 uppercase tracking-widest">Bidding opens soon</p>
                                </div>
                            )}
                        </div>
                    ))
                ) : (
                    <div className="col-span-full py-20 text-center bg-slate-900/20 border border-dashed border-slate-800 rounded-[3rem]">
                        <Info className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                        <h3 className="text-xl font-black text-slate-400">No active IPOs at the moment</h3>
                        <p className="text-slate-500 mt-2">Check back later for new investment opportunities</p>
                    </div>
                )}
            </div>

            {/* Info Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-slate-900/20 p-6 rounded-3xl border border-slate-800/50">
                    <CheckCircle2 className="w-6 h-6 text-emerald-500 mb-3" />
                    <h4 className="font-black text-white text-sm mb-1 uppercase tracking-tight">Guaranteed Price</h4>
                    <p className="text-slate-500 text-xs leading-relaxed">Secure shares at fixed issue price before secondary market trading starts.</p>
                </div>
                <div className="bg-slate-900/20 p-6 rounded-3xl border border-slate-800/50">
                    <AlertCircle className="w-6 h-6 text-indigo-500 mb-3" />
                    <h4 className="font-black text-white text-sm mb-1 uppercase tracking-tight">Automated Selection</h4>
                    <p className="text-slate-500 text-xs leading-relaxed">Allotment is processed via a fair, randomized system once the bidding period ends.</p>
                </div>
                <div className="bg-slate-900/20 p-6 rounded-3xl border border-slate-800/50">
                    <div className="w-6 h-6 bg-slate-800 rounded-full flex items-center justify-center text-[10px] font-black text-slate-400 mb-3">₹</div>
                    <h4 className="font-black text-white text-sm mb-1 uppercase tracking-tight">Zero Brokerage</h4>
                    <p className="text-slate-500 text-xs leading-relaxed">No additional platform fees or brokerage on IPO applications.</p>
                </div>
            </div>

            {/* Premium Confirmation Dialog for IPO Application */}
            <ConfirmDialog
                isOpen={confirmModal.show}
                onClose={() => setConfirmModal({ show: false, ipo: null })}
                onConfirm={handleApply}
                title="Confirm Subscription"
                message={`You are about to subscribe to ${bidLots} Lot(s) of ${confirmModal.ipo?.symbol}. An amount of ₹${(bidLots * (confirmModal.ipo?.lotSize || 0) * (confirmModal.ipo?.price || 0)).toLocaleString()} will be blocked in your wallet for allotment.`}
                confirmText="Apply & Block Funds"
                type="info"
                loading={isSubmitting}
            />

            {/* Premium Alert Dialog */}
            <ConfirmDialog
                isOpen={alertModal.show}
                onClose={() => setAlertModal({ ...alertModal, show: false })}
                onConfirm={() => setAlertModal({ ...alertModal, show: false })}
                title={alertModal.title}
                message={alertModal.message}
                confirmText="Got it"
                type={alertModal.type}
                alertOnly={true}
            />
        </div>
    );
};

export default IPOHub;
