import React, { useState } from 'react';
import { ArrowLeft, CreditCard, ShieldCheck, Wallet, Info, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '../utils/cn';
import ConfirmDialog from '../components/ConfirmDialog';
import { paymentService } from '../services/api';

const AddFunds = () => {
    const navigate = useNavigate();
    const [amount, setAmount] = useState('');
    const [loading, setLoading] = useState(false);

    // Premium Alert State
    const [alertModal, setAlertModal] = useState({ show: false, title: '', message: '', type: 'info' });

    const handleStripeCheckout = async () => {
        const numAmount = Number(amount);
        if (!amount || isNaN(numAmount) || numAmount < 100) {
            setAlertModal({
                show: true,
                title: 'Invalid Amount',
                message: 'Please enter a valid amount of at least ₹100 to proceed.',
                type: 'danger'
            });
            return;
        }

        if (numAmount > 1000000) {
            setAlertModal({
                show: true,
                title: 'Limit Exceeded',
                message: 'The maximum deposit limit per transaction is ₹10,00,000.',
                type: 'danger'
            });
            return;
        }

        setLoading(true);
        try {
            const { url, msg } = await paymentService.createCheckoutSession(Number(amount));
            if (url) {
                window.location.href = url;
            } else {
                setAlertModal({
                    show: true,
                    title: 'Offline Payment',
                    message: msg || "The payment gateway is currently in maintenance. Please contact support or try again later.",
                    type: 'info'
                });
            }
        } catch (err) {
            setAlertModal({
                show: true,
                title: 'Payment Error',
                message: "Unable to connect to the payment processor. Please check your internet and try again.",
                type: 'danger'
            });
        } finally {
            setLoading(false);
        }
    };

    const quickAmounts = [500, 1000, 5000, 10000];

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
                <ArrowLeft className="w-4 h-4" /> Back
            </button>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                <div className="space-y-6">
                    <div>
                        <h1 className="text-4xl font-black text-white tracking-tight mb-4">Add Trading Capital</h1>
                        <p className="text-slate-400 text-lg leading-relaxed">
                            Fund your account instantly using Stripe. Your balance will be updated automatically once the payment is successful.
                        </p>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center gap-3 text-slate-300">
                            <ShieldCheck className="w-5 h-5 text-emerald-500" />
                            <span className="text-sm">Secure Payment processed by Stripe</span>
                        </div>
                        <div className="flex items-center gap-3 text-slate-300">
                            <Wallet className="w-5 h-5 text-indigo-500" />
                            <span className="text-sm">Instant Credit to Trading Wallet</span>
                        </div>
                    </div>
                </div>

                <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-8 space-y-8">
                    <div className="space-y-4">
                        <label className="text-sm font-bold text-slate-500 uppercase tracking-widest ml-1">Deposit Amount (INR)</label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-black text-slate-600">₹</span>
                            <input
                                type="number"
                                placeholder="0.00"
                                value={amount}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    if (val === '') {
                                        setAmount('');
                                    } else {
                                        const num = parseInt(val);
                                        if (!isNaN(num)) setAmount(num.toString());
                                    }
                                }}
                                className={cn(
                                    "w-full bg-slate-950 border rounded-2xl py-5 pl-12 pr-6 text-3xl font-black text-white outline-none transition-all placeholder:text-slate-800",
                                    (amount && (Number(amount) < 100 || Number(amount) > 1000000))
                                        ? "border-rose-500/50 bg-rose-500/5 focus:ring-rose-500/30"
                                        : "border-slate-800 focus:ring-indigo-600/50"
                                )}
                            />
                        </div>
                        {amount && Number(amount) < 100 && (
                            <p className="text-[10px] font-bold text-rose-500 uppercase tracking-widest ml-1 animate-pulse">Minimum deposit is ₹100</p>
                        )}
                        {amount && Number(amount) > 1000000 && (
                            <p className="text-[10px] font-bold text-rose-500 uppercase tracking-widest ml-1 animate-pulse">Maximum limit is ₹10,00,000</p>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        {quickAmounts.map((amt) => (
                            <button
                                key={amt}
                                onClick={() => setAmount(amt.toString())}
                                className="py-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-400 font-bold hover:border-slate-600 hover:text-white transition-all text-sm"
                            >
                                + ₹{amt.toLocaleString('en-IN')}
                            </button>
                        ))}
                    </div>

                    <button
                        onClick={handleStripeCheckout}
                        disabled={loading}
                        className="w-full bg-indigo-600 hover:bg-indigo-500 py-5 rounded-2xl text-white font-black text-xl shadow-xl shadow-indigo-600/20 transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed group"
                    >
                        {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : (
                            <>
                                <CreditCard className="w-6 h-6 group-hover:scale-110 transition-transform" />
                                Proceed to Pay
                            </>
                        )}
                    </button>

                    <p className="text-center text-[10px] text-slate-500 font-medium">
                        By proceeding, you agree to the Trading Terms & Conditions.
                    </p>
                </div>
            </div>

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
        </div>
    );
};

export default AddFunds;
