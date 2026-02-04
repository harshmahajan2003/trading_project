import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, Clock, ArrowRight, ShieldCheck, Timer, ChevronLeft, Loader2, Info, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { stockService, tradeService, walletService } from '../services/api';
import { socket } from '../services/socket';
import CandleChart from '../components/CandleChart';
import { cn } from '../utils/cn';
import ConfirmDialog from '../components/ConfirmDialog';

const StockDetail = () => {
    const { symbol } = useParams();
    const navigate = useNavigate();
    const [stock, setStock] = useState(null);
    const [candles, setCandles] = useState([]);
    const [wallet, setWallet] = useState(null);
    const [loading, setLoading] = useState(true);
    const [trading, setTrading] = useState(false);

    // Premium Alert State
    const [alertModal, setAlertModal] = useState({ show: false, title: '', message: '', type: 'info' });
    const [orderSuccess, setOrderSuccess] = useState(false);

    // Trade form state
    const [quantity, setQuantity] = useState(1);
    const [tradeType, setTradeType] = useState('BUY');
    const [timeframe, setTimeframe] = useState('1m');
    const [candlesLoading, setCandlesLoading] = useState(false);

    // Advanced Trade State
    const [orderType, setOrderType] = useState('MARKET');
    const [triggerPrice, setTriggerPrice] = useState(0);
    const [stopLoss, setStopLoss] = useState('');
    const [target, setTarget] = useState('');

    const timeframes = [
        { label: '1m', value: '1m' },
        { label: '5m', value: '5m' },
        { label: '10m', value: '10m' },
        { label: '15m', value: '15m' },
        { label: '30m', value: '30m' },
        { label: '1h', value: '1h' },
        { label: '1d', value: '1d' },
    ];

    useEffect(() => {
        const fetchStockAndWallet = async () => {
            try {
                const [stockData, walletData] = await Promise.all([
                    stockService.getStockBySymbol(symbol),
                    walletService.getBalance()
                ]);
                setStock(stockData);
                setWallet(walletData);
            } catch (err) {
                console.error("Stock Detail core fetch error:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchStockAndWallet();

        // Socket Listener for Live Updates
        const handleUpdate = (data) => {
            if (data && data.symbol === symbol) {
                setStock(prev => prev ? ({
                    ...prev,
                    price: data.price || prev.price,
                    change: data.change || prev.change
                }) : null);
            }
        };

        socket.on('stockUpdate', handleUpdate);

        return () => {
            socket.off('stockUpdate', handleUpdate);
        };
    }, [symbol]);

    useEffect(() => {
        const fetchCandles = async () => {
            setCandlesLoading(true);
            try {
                const candleData = await stockService.getCandles(symbol, timeframe);
                setCandles(candleData);
            } catch (err) {
                console.error("Candle fetch error:", err);
            } finally {
                setCandlesLoading(false);
            }
        };
        fetchCandles();
    }, [symbol, timeframe]);

    const handleTrade = async (e) => {
        e.preventDefault();

        // Client-side validation
        const numQty = Number(quantity);
        if (isNaN(numQty) || numQty <= 0 || !Number.isInteger(numQty)) {
            setAlertModal({ show: true, title: 'Invalid Quantity', message: 'Please enter a valid whole number of shares.', type: 'danger' });
            return;
        }

        if (numQty > 100000) {
            setAlertModal({ show: true, title: 'Order Too Large', message: 'Maximum order size is 100,000 shares per transaction for safety.', type: 'danger' });
            return;
        }

        const executionPrice = orderType === 'LIMIT' ? Number(triggerPrice) : (stock?.price || 0);

        if (orderType === 'LIMIT' && (isNaN(executionPrice) || executionPrice <= 0)) {
            setAlertModal({ show: true, title: 'Invalid Limit Price', message: 'Please enter a valid price for the limit order.', type: 'danger' });
            return;
        }

        const totalCost = numQty * executionPrice;

        if (tradeType === 'BUY' && totalCost > (wallet?.balance || 0)) {
            setAlertModal({
                show: true,
                title: 'Insufficient Funds',
                message: `Your balance (₹${(wallet?.balance || 0).toLocaleString('en-IN')}) is not enough for this trade (₹${totalCost.toLocaleString('en-IN')}).`,
                type: 'danger'
            });
            return;
        }

        if (tradeType === 'BUY') {
            if (stopLoss && Number(stopLoss) >= executionPrice) {
                setAlertModal({ show: true, title: 'Invalid Stop Loss', message: 'Stop Loss must be lower than the buy price.', type: 'danger' });
                return;
            }
            if (target && Number(target) <= executionPrice) {
                setAlertModal({ show: true, title: 'Invalid Target', message: 'Target must be higher than the buy price.', type: 'danger' });
                return;
            }
        }

        setTrading(true);
        try {
            const side = tradeType;
            await tradeService.placeOrder({
                symbol,
                side,
                type: orderType,
                quantity: numQty,
                triggerPrice: orderType === 'LIMIT' ? executionPrice : undefined,
                stopLoss: stopLoss ? Number(stopLoss) : undefined,
                target: target ? Number(target) : undefined
            });

            setOrderSuccess(true);
            setTimeout(() => setOrderSuccess(false), 3000);

            setAlertModal({
                show: true,
                title: orderType === 'LIMIT' ? 'Order Placed' : 'Order Executed',
                message: orderType === 'LIMIT'
                    ? `Your limit order to buy ${numQty} shares @ ₹${executionPrice} is pending.`
                    : `Successfully ${side.toLowerCase()}s ${numQty} shares of ${symbol}. Your portfolio has been updated.`,
                type: 'success'
            });

            // Refresh wallet balance
            const [walletData, stockData] = await Promise.all([
                walletService.getBalance(),
                stockService.getStockBySymbol(symbol)
            ]);
            setWallet(walletData);
            setStock(stockData);
        } catch (err) {
            setAlertModal({
                show: true,
                title: 'Trade Failed',
                message: err.response?.data?.message || "There was an error executing your trade. Please check your balance and try again.",
                type: 'danger'
            });
        } finally {
            setTrading(false);
        }
    };

    if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="w-10 h-10 text-indigo-500 animate-spin" /></div>;

    return (
        <div className="space-y-6 md:space-y-8 animate-in fade-in slide-in-from-left-4 duration-500 pb-20 lg:pb-0">
            <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
                <ArrowLeft className="w-4 h-4" /> Back to Market
            </button>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
                        <div className="flex items-center gap-3 md:gap-4">
                            <div className="w-12 h-12 md:w-16 md:h-16 rounded-xl md:rounded-2xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-xl md:text-2xl font-bold text-indigo-500">
                                {symbol?.[0]}
                            </div>
                            <div>
                                <h1 className="text-2xl md:text-3xl font-bold text-white uppercase tracking-tight">{symbol}</h1>
                                <p className="text-xs md:text-sm text-slate-400 font-medium">{stock?.name}</p>
                            </div>
                        </div>
                        <div className="text-left sm:text-right flex flex-row sm:flex-col items-baseline sm:items-end gap-3 sm:gap-1">
                            <h2 className="text-3xl md:text-4xl font-black text-white">₹{(stock?.price || 0).toLocaleString('en-IN')}</h2>
                            <p className={cn(
                                "text-sm md:text-lg font-bold flex items-center gap-1",
                                (stock?.change || 0) >= 0 ? "text-emerald-500" : "text-red-500"
                            )}>
                                {(stock?.change || 0) >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                                {(stock?.change || 0) > 0 ? '+' : ''}{stock?.change || 0}%
                                <span className="text-slate-500 text-[10px] md:text-sm ml-1 md:ml-2 font-normal">TODAY</span>
                            </p>
                        </div>
                    </div>

                    {/* Chart Container */}
                    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-3 md:p-4 overflow-hidden shadow-2xl min-h-[400px] md:min-h-[450px] relative">
                        <div className="flex flex-col xs:flex-row items-start xs:items-center justify-between mb-4 px-2 gap-3">
                            <div className="flex items-center gap-2">
                                <div className="p-1.5 bg-indigo-500/10 rounded-lg">
                                    <Clock className="w-4 h-4 text-indigo-400" />
                                </div>
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Resolution</span>
                            </div>
                            <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 w-full xs:w-auto overflow-x-auto no-scrollbar">
                                {timeframes.map((tf) => (
                                    <button
                                        key={tf.value}
                                        onClick={() => setTimeframe(tf.value)}
                                        className={cn(
                                            "px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
                                            timeframe === tf.value ? "bg-indigo-600 text-white" : "text-slate-500 hover:text-slate-300"
                                        )}
                                    >
                                        {tf.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                        {candlesLoading && (
                            <div className="absolute inset-0 z-20 bg-slate-900/40 backdrop-blur-[2px] flex items-center justify-center rounded-3xl">
                                <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
                            </div>
                        )}
                        <CandleChart data={candles || []} symbol={symbol} timeframe={timeframe} />
                    </div>

                    {/* Stats List */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[
                            { label: 'Volume', value: '45.2M' },
                            { label: 'Avg Vol', value: '38.5M' },
                            { label: 'Market Cap', value: '$2.4T' },
                            { label: 'P/E Ratio', value: '32.4' },
                            { label: 'Div Yield', value: '0.85%' },
                            { label: '52W High', value: '$198.40' },
                            { label: '52W Low', value: '$124.15' },
                            { label: 'Open Price', value: `₹${(stock?.price || 0).toLocaleString('en-IN')}` },
                        ].map((s, i) => (
                            <div key={i} className="bg-slate-950/50 border border-slate-800 p-4 rounded-xl">
                                <p className="text-xs text-slate-500 font-medium mb-1 uppercase tracking-wider">{s.label}</p>
                                <p className="text-sm font-bold text-white">{s.value}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Trade Sidebar */}
                <div className="space-y-6">
                    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 lg:sticky lg:top-24">
                        <div className="flex bg-slate-950 p-1 rounded-2xl mb-8">
                            <button
                                onClick={() => setTradeType('BUY')}
                                className={cn(
                                    "flex-1 py-3 rounded-xl font-bold transition-all",
                                    tradeType === 'BUY' ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20" : "text-slate-500 hover:text-slate-300"
                                )}
                            >
                                Buy
                            </button>
                            <button
                                onClick={() => setTradeType('SELL')}
                                className={cn(
                                    "flex-1 py-3 rounded-xl font-bold transition-all",
                                    tradeType === 'SELL' ? "bg-red-500 text-white shadow-lg shadow-red-500/20" : "text-slate-500 hover:text-slate-300"
                                )}
                            >
                                Sell
                            </button>
                        </div>

                        <form onSubmit={handleTrade} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-400 ml-1">Order Type</label>
                                <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
                                    <button
                                        type="button"
                                        onClick={() => setOrderType('MARKET')}
                                        className={cn(
                                            "flex-1 py-2 rounded-lg text-xs font-bold transition-all",
                                            orderType === 'MARKET' ? "bg-slate-800 text-white" : "text-slate-500 hover:text-slate-300"
                                        )}
                                    >
                                        Market
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setOrderType('LIMIT');
                                            if (!triggerPrice) setTriggerPrice(stock?.price || 0);
                                        }}
                                        className={cn(
                                            "flex-1 py-2 rounded-lg text-xs font-bold transition-all",
                                            orderType === 'LIMIT' ? "bg-slate-800 text-white" : "text-slate-500 hover:text-slate-300"
                                        )}
                                    >
                                        Limit
                                    </button>
                                </div>
                            </div>

                            {orderType === 'LIMIT' && (
                                <div className="space-y-2 animate-in fade-in zoom-in-95 duration-200">
                                    <label className="text-sm font-medium text-slate-400 ml-1">Limit Price</label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold">₹</span>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={triggerPrice}
                                            onChange={(e) => setTriggerPrice(e.target.value)}
                                            className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-8 pr-4 text-white font-bold outline-none focus:ring-2 focus:ring-indigo-500/50"
                                            placeholder="Enter price"
                                        />
                                    </div>
                                </div>
                            )}

                            <div className="space-y-2">
                                <div className="flex justify-between items-center ml-1">
                                    <label className="text-sm font-medium text-slate-400">Quantity</label>
                                    <span className="text-[10px] font-black text-slate-600 uppercase">Max: 1,00,000</span>
                                </div>
                                <input
                                    type="number"
                                    min="1"
                                    max="100000"
                                    value={quantity}
                                    onChange={(e) => {
                                        const val = e.target.value === '' ? '' : Math.min(100000, Math.max(0, parseInt(e.target.value) || 0));
                                        setQuantity(val);
                                    }}
                                    className={cn(
                                        "w-full bg-slate-950 border rounded-xl py-3 px-4 text-white font-bold text-xl outline-none transition-all focus:ring-2 focus:ring-indigo-500/50",
                                        (quantity * (orderType === 'LIMIT' ? Number(triggerPrice) : (stock?.price || 0))) > (wallet?.balance || 0) && tradeType === 'BUY'
                                            ? "border-rose-500/50 bg-rose-500/5"
                                            : "border-slate-800"
                                    )}
                                />
                            </div>

                            {tradeType === 'BUY' && (
                                <div className="grid grid-cols-2 gap-4 animate-in slide-in-from-top-2 duration-300">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-rose-500/80 uppercase tracking-widest ml-1">Stop Loss</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={stopLoss}
                                            onChange={(e) => setStopLoss(e.target.value)}
                                            className="w-full bg-slate-950 border border-rose-500/20 rounded-xl py-2 px-3 text-white text-sm font-bold outline-none focus:border-rose-500/50"
                                            placeholder="Exit price"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-emerald-500/80 uppercase tracking-widest ml-1">Target</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={target}
                                            onChange={(e) => setTarget(e.target.value)}
                                            className="w-full bg-slate-950 border border-emerald-500/20 rounded-xl py-2 px-3 text-white text-sm font-bold outline-none focus:border-emerald-500/50"
                                            placeholder="Profit price"
                                        />
                                    </div>
                                </div>
                            )}

                            <div className={cn(
                                "p-4 rounded-2xl border border-dashed space-y-3 transition-all",
                                (quantity * (orderType === 'LIMIT' ? Number(triggerPrice) : (stock?.price || 0))) > (wallet?.balance || 0) && tradeType === 'BUY'
                                    ? "bg-rose-500/5 border-rose-500/20"
                                    : "bg-slate-950/50 border-slate-800"
                            )}>
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-400">Estimate Cost</span>
                                    <span className={cn(
                                        "font-bold",
                                        (quantity * (orderType === 'LIMIT' ? Number(triggerPrice) : (stock?.price || 0))) > (wallet?.balance || 0) && tradeType === 'BUY'
                                            ? "text-rose-500"
                                            : "text-white"
                                    )}>
                                        ₹{(quantity * (orderType === 'LIMIT' ? Number(triggerPrice) : (stock?.price || 0))).toLocaleString('en-IN')}
                                    </span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-400">Available Balance</span>
                                    <span className="text-white font-bold">₹{(wallet?.balance || 0).toLocaleString('en-IN')}</span>
                                </div>
                                {(quantity * (orderType === 'LIMIT' ? Number(triggerPrice) : (stock?.price || 0))) > (wallet?.balance || 0) && tradeType === 'BUY' && (
                                    <p className="text-[10px] text-rose-500 font-bold uppercase tracking-wider text-center animate-pulse">Insufficient Funds</p>
                                )}
                            </div>

                            <button
                                type="submit"
                                disabled={trading || orderSuccess}
                                className={cn(
                                    "w-full py-4 rounded-2xl font-black text-lg transition-all flex items-center justify-center gap-2",
                                    tradeType === 'BUY'
                                        ? "bg-indigo-600 hover:bg-indigo-700 text-white shadow-xl shadow-indigo-600/30"
                                        : "bg-red-500 hover:bg-red-600 text-white shadow-xl shadow-red-500/30",
                                    orderSuccess && "bg-emerald-500 shadow-emerald-500/30"
                                )}
                            >
                                {trading ? <Loader2 className="w-6 h-6 animate-spin" /> :
                                    orderSuccess ? <><CheckCircle2 className="w-6 h-6" /> Success!</> :
                                        `${tradeType} ${symbol}`}
                            </button>
                        </form>
                    </div>

                    <div className="bg-gradient-to-br from-indigo-900/20 to-transparent border border-indigo-500/10 rounded-3xl p-6">
                        <h4 className="text-indigo-400 text-sm font-bold mb-2">Pro Tip</h4>
                        <p className="text-xs text-slate-400 leading-relaxed">
                            Market orders execute instantly at the current price. Use limit orders to specify exactly what you're willing to pay.
                        </p>
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
                confirmText="Understood"
                type={alertModal.type}
                alertOnly={true}
            />
        </div>
    );
};

export default StockDetail;
