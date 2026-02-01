import { useState, useEffect } from 'react';
import { Loader2, X, AlertTriangle, CheckCircle2, TrendingUp, TrendingDown, ArrowRight, Zap, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { walletService, tradeService, stockService } from '../services/api';
import { cn } from '../utils/cn';
import Modal from './Modal';

const QuickTradeModal = ({ isOpen, onClose, symbol, initialSide = 'BUY', onTradeSuccess, currentPrice }) => {
    const [quantity, setQuantity] = useState(1);
    const [tradeType, setTradeType] = useState(initialSide);
    const [loading, setLoading] = useState(false);
    const [wallet, setWallet] = useState(null);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [lastTrade, setLastTrade] = useState(null);

    const fetchWallet = async () => {
        try {
            const data = await walletService.getBalance();
            setWallet(data);
        } catch (err) {
            console.error("Wallet fetch error:", err);
        }
    };

    useEffect(() => {
        if (isOpen) {
            fetchWallet();
            setTradeType(initialSide);
            setSuccess(false);
            setError('');
            setQuantity(1);
        }
    }, [isOpen, initialSide]);

    const handleTrade = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        const numQty = Number(quantity);
        if (isNaN(numQty) || numQty <= 0 || !Number.isInteger(numQty)) {
            setError('Please enter a valid quantity.');
            setLoading(false);
            return;
        }

        const totalCost = numQty * currentPrice;
        if (tradeType === 'BUY' && totalCost > (wallet?.balance || 0)) {
            setError('Insufficient funds.');
            setLoading(false);
            return;
        }

        try {
            await tradeService.placeOrder({
                symbol,
                side: tradeType,
                type: 'MARKET',
                quantity: numQty
            });

            setLastTrade({
                symbol,
                side: tradeType,
                quantity: numQty,
                price: currentPrice,
                total: totalCost
            });
            setSuccess(true);
            setTimeout(() => {
                onTradeSuccess();
                onClose();
            }, 3000); // 3 seconds to enjoy the success screen
        } catch (err) {
            setError(err.response?.data?.message || 'Trade failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const totalCost = (Number(quantity) || 0) * (currentPrice || 0);

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={success ? 'Trade Successful' : `Quick ${tradeType === 'BUY' ? 'Buy' : 'Sell'} ${symbol}`}
        >
            <div className="space-y-6 py-2">
                {success ? (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        className="flex flex-col items-center py-6"
                    >
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", damping: 12, stiffness: 200, delay: 0.2 }}
                            className="w-24 h-24 bg-emerald-500/10 rounded-full flex items-center justify-center mb-6 relative"
                        >
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="absolute inset-0 bg-emerald-500/5 rounded-full animate-ping"
                            />
                            <CheckCircle2 className="w-12 h-12 text-emerald-500 relative z-10" />
                        </motion.div>

                        <h4 className="text-2xl font-black text-white uppercase tracking-tight mb-2">Order Executed</h4>
                        <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-8">Transaction Complete</p>

                        <div className="w-full bg-slate-950/50 border border-slate-800 rounded-3xl p-6 space-y-4">
                            <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-500">
                                <span>Asset</span>
                                <span className="text-white">{lastTrade?.symbol}</span>
                            </div>
                            <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-500">
                                <span>Side</span>
                                <span className={lastTrade?.side === 'BUY' ? 'text-emerald-500' : 'text-rose-500'}>{lastTrade?.side}</span>
                            </div>
                            <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-500">
                                <span>Quantity</span>
                                <span className="text-white">{lastTrade?.quantity}</span>
                            </div>
                            <div className="border-t border-slate-800 pt-4 flex justify-between items-center">
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Total Value</span>
                                <span className="text-lg font-black text-white">₹{lastTrade?.total?.toLocaleString('en-IN')}</span>
                            </div>
                        </div>

                        <div className="mt-8 flex items-center gap-2 text-slate-500">
                            <ShieldCheck className="w-4 h-4" />
                            <p className="text-[9px] font-black uppercase tracking-widest">Verified by Trade Engine</p>
                        </div>
                    </motion.div>
                ) : (
                    <>
                        {/* Price Banner */}
                        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
                            <div>
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Current LTP</p>
                                <p className="text-lg font-black text-white">₹{currentPrice?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Available Funds</p>
                                <p className="text-lg font-black text-indigo-400">₹{wallet?.balance?.toLocaleString('en-IN')}</p>
                            </div>
                        </div>

                        {/* Trade Toggle */}
                        <div className="flex bg-slate-950 p-1 rounded-2xl border border-slate-800">
                            <button
                                onClick={() => setTradeType('BUY')}
                                className={cn(
                                    "flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
                                    tradeType === 'BUY' ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20" : "text-slate-500 hover:text-slate-300"
                                )}
                            >
                                Buy
                            </button>
                            <button
                                onClick={() => setTradeType('SELL')}
                                className={cn(
                                    "flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
                                    tradeType === 'SELL' ? "bg-rose-500 text-white shadow-lg shadow-rose-500/20" : "text-slate-500 hover:text-slate-300"
                                )}
                            >
                                Sell
                            </button>
                        </div>

                        {/* Quantity Input */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Quantity</label>
                            <div className="relative">
                                <input
                                    type="number"
                                    min="1"
                                    value={quantity}
                                    onChange={(e) => setQuantity(e.target.value)}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-4 px-6 text-white font-black text-2xl outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                                    placeholder="0"
                                />
                            </div>
                        </div>

                        {/* Error Message */}
                        {error && (
                            <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-3 flex items-center gap-3 animate-in shake-in-from-top-1 duration-300">
                                <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
                                <p className="text-[10px] font-black text-rose-500 uppercase tracking-tight">{error}</p>
                            </div>
                        )}

                        {/* Footer Summary & Button */}
                        <div className="space-y-4 pt-4 border-t border-slate-800">
                            <div className="flex justify-between items-center px-2">
                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Estimated Value</span>
                                <span className="text-base font-black text-white">₹{totalCost.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                            </div>

                            <button
                                onClick={handleTrade}
                                disabled={loading}
                                className={cn(
                                    "w-full py-4 rounded-[1.5rem] font-black text-xs uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 shadow-2xl",
                                    tradeType === 'BUY'
                                        ? "bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-600/20"
                                        : "bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/20",
                                    loading && "opacity-50 cursor-not-allowed"
                                )}
                            >
                                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : `${tradeType} ${symbol}`}
                            </button>
                        </div>
                    </>
                )}
            </div>
        </Modal>
    );
};

export default QuickTradeModal;
