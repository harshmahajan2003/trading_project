import { useNavigate } from 'react-router-dom';
import { TrendingUp, ShieldCheck, Zap, Globe, ArrowRight, BarChart3, Rocket } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useEffect } from 'react';

const Landing = () => {
    const navigate = useNavigate();
    const { user, logout } = useAuth();

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-slate-100 font-sans selection:bg-indigo-500/30 overflow-x-hidden">
            {/* Background Orbs */}
            <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-600/10 blur-[120px] rounded-full animate-pulse"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-600/10 blur-[120px] rounded-full animate-pulse delay-700"></div>
            </div>

            {/* Navbar */}
            <nav className="relative z-10 flex items-center justify-between px-8 py-6 max-w-7xl mx-auto">
                <div className="flex items-center gap-2 group cursor-pointer">
                    <div className="w-8 h-8 md:w-10 md:h-10 bg-indigo-600 rounded-lg md:rounded-xl flex items-center justify-center shadow-lg shadow-indigo-600/20 group-hover:scale-110 transition-transform">
                        <TrendingUp className="w-5 h-5 md:w-6 md:h-6 text-white" />
                    </div>
                    <span className="text-xl md:text-2xl font-black bg-gradient-to-r from-white to-slate-500 bg-clip-text text-transparent tracking-tighter">
                        TRADE.AI
                    </span>
                </div>
                <div className="hidden md:flex items-center gap-8 text-sm font-bold text-slate-400 uppercase tracking-widest">
                    <a href="#features" className="hover:text-white transition-colors">Features</a>
                    <a href="#security" className="hover:text-white transition-colors">Security</a>
                    <button
                        onClick={() => navigate(user ? "/ipo" : "/login")}
                        className="hover:text-white transition-colors uppercase"
                    >
                        IPO Hub
                    </button>
                </div>
                <div className="flex items-center gap-4">
                    {user ? (
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => navigate('/dashboard')}
                                className="px-6 py-2 text-sm font-bold text-slate-300 hover:text-white transition-colors"
                            >
                                Dashboard
                            </button>
                            <button
                                onClick={logout}
                                className="bg-red-500/10 hover:bg-red-500/20 text-red-500 px-6 py-3 rounded-2xl font-bold transition-all active:scale-95 text-sm uppercase tracking-widest"
                            >
                                Logout
                            </button>
                        </div>
                    ) : (
                        <>
                            <button
                                onClick={() => navigate('/login')}
                                className="px-6 py-2 text-sm font-bold text-slate-300 hover:text-white transition-colors"
                            >
                                Sign In
                            </button>
                            <button
                                onClick={() => navigate('/register')}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-2xl font-bold transition-all shadow-lg shadow-indigo-600/20 active:scale-95"
                            >
                                Get Started
                            </button>
                        </>
                    )}
                </div>
            </nav>

            {/* Hero Section */}
            <section className="relative z-10 pt-12 md:pt-20 pb-20 md:pb-32 px-4 md:px-8 max-w-7xl mx-auto text-center">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 bg-indigo-600/10 border border-indigo-500/20 rounded-full mb-6 md:mb-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
                    <Zap className="w-3 h-3 md:w-4 md:h-4 text-indigo-400" />
                    <span className="text-[8px] md:text-[10px] font-black text-indigo-400 uppercase tracking-widest">The Future of Digital Trading is Here</span>
                </div>

                <h1 className="text-4xl sm:text-5xl md:text-8xl font-black text-white tracking-tighter leading-[0.95] md:leading-[0.9] mb-6 md:mb-8 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-200 uppercase">
                    Trade like the <br className="hidden sm:block" />
                    <span className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">top 1 percent.</span>
                </h1>

                <p className="max-w-xl mx-auto text-sm md:text-lg text-slate-400 mb-8 md:mb-12 px-4 md:px-0 animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-400">
                    Join over 2 million traders using Trade.AI to build wealth through real-time assets, institutional-grade IPOs, and AI-powered market insights.
                </p>

                <div className="flex flex-col md:flex-row items-center justify-center gap-6 md:gap-8 animate-in fade-in slide-in-from-bottom-16 duration-1000 delay-600">
                    <button
                        onClick={() => navigate(user ? '/dashboard' : '/register')}
                        className="w-full md:w-auto group flex items-center justify-center gap-3 bg-white text-black px-8 md:px-10 py-4 md:py-5 rounded-2xl md:rounded-[2rem] font-black uppercase tracking-widest hover:bg-indigo-500 hover:text-white transition-all shadow-2xl hover:shadow-indigo-500/40 active:scale-95 text-xs md:text-base"
                    >
                        {user ? 'Go to Dashboard' : 'Start Your Journey'}
                        <ArrowRight className="w-4 h-4 md:w-5 md:h-5 group-hover:translate-x-1 transition-transform" />
                    </button>
                    <div className="flex items-center gap-4">
                        <div className="flex -space-x-3 md:-space-x-4">
                            {[1, 2, 3, 4].map(i => (
                                <div key={i} className={`w-10 h-10 md:w-12 md:h-12 rounded-full border-2 md:border-4 border-[#0a0a0a] bg-slate-800 flex items-center justify-center text-[10px] md:text-xs font-bold text-white`}>
                                    {String.fromCharCode(64 + i)}
                                </div>
                            ))}
                        </div>
                        <div className="text-left">
                            <p className="text-xs md:text-sm font-black text-white leading-none">50k+ Members</p>
                            <p className="text-[10px] md:text-xs text-slate-500 mt-1 uppercase tracking-wider font-bold">Trusting us with wealth</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Stats Grid */}
            <section className="relative z-10 px-8 py-20 bg-slate-900/40 border-y border-slate-800/50 backdrop-blur-sm">
                <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12 text-center">
                    <div>
                        <h3 className="text-4xl font-black text-white mb-2">₹10Cr+</h3>
                        <p className="text-xs font-black text-slate-500 uppercase tracking-widest">Volume Processed</p>
                    </div>
                    <div>
                        <h3 className="text-4xl font-black text-indigo-500 mb-2">0.1ms</h3>
                        <p className="text-xs font-black text-slate-500 uppercase tracking-widest">Execution Speed</p>
                    </div>
                    <div>
                        <h3 className="text-4xl font-black text-white mb-2">250+</h3>
                        <p className="text-xs font-black text-slate-500 uppercase tracking-widest">Active Assets</p>
                    </div>
                    <div>
                        <h3 className="text-4xl font-black text-white mb-2">99.9%</h3>
                        <p className="text-xs font-black text-slate-500 uppercase tracking-widest">System Uptime</p>
                    </div>
                </div>
            </section>

            {/* Features Preview */}
            <section id="features" className="relative z-10 py-32 px-8 max-w-7xl mx-auto">
                <div className="text-center mb-20">
                    <h2 className="text-4xl font-black text-white mb-4">ENGINEERED FOR EXCELLENCE</h2>
                    <p className="text-slate-400">Everything you need to master the markets in one unified platform.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {[
                        { icon: BarChart3, title: 'Real-time Analytics', desc: 'Predictive market analysis powered by deep learning models.', color: 'text-indigo-400', bg: 'bg-indigo-400/10' },
                        { id: 'security', icon: ShieldCheck, title: 'Ironclad Security', desc: 'State-of-the-art encryption and dual-factor session protection.', color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
                        { icon: Globe, title: 'Global Access', desc: 'Trade from anywhere, anytime with our global edge network.', color: 'text-purple-400', bg: 'bg-purple-400/10' },
                        { icon: Rocket, title: 'Premium IPOs', desc: 'Exclusive early access to high-potential company listings.', color: 'text-pink-400', bg: 'bg-pink-400/10' },
                        { icon: Zap, title: 'Instant Fundings', desc: 'Deposit and withdraw funds instantly via Stripe integration.', color: 'text-orange-400', bg: 'bg-orange-400/10' },
                        { icon: TrendingUp, title: 'Advanced Trading', desc: 'Multi-chart layouts and rapid-order execution system.', color: 'text-blue-400', bg: 'bg-blue-400/10' },
                    ].map((feature, i) => (
                        <div key={i} className="bg-slate-900/40 border border-slate-800 p-8 rounded-[2.5rem] hover:border-indigo-500/30 transition-all duration-300 group">
                            <div id={feature.id} className={`${feature.bg} ${feature.color} w-16 h-16 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                                <feature.icon className="w-8 h-8" />
                            </div>
                            <h4 className="text-xl font-black text-white mb-4 uppercase tracking-tight">{feature.title}</h4>
                            <p className="text-slate-500 text-sm leading-relaxed">{feature.desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* Footer */}
            <footer className="relative z-10 border-t border-slate-800 bg-[#050505] py-20 px-8">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-12">
                    <div>
                        <div className="flex items-center gap-2 mb-6">
                            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                                <TrendingUp className="w-5 h-5 text-white" />
                            </div>
                            <span className="text-xl font-black text-white tracking-widest uppercase">TRADE.AI</span>
                        </div>
                        <p className="text-slate-500 text-sm max-w-sm leading-relaxed">
                            The world's most advanced social trading application. Build your future today with Trade.AI
                        </p>
                    </div>
                    <div className="flex gap-12 text-sm font-bold text-slate-500 uppercase tracking-widest">
                        <a href="#" className="hover:text-white transition-colors">Privacy</a>
                        <a href="#" className="hover:text-white transition-colors">Terms</a>
                        <a href="#" className="hover:text-white transition-colors">Support</a>
                    </div>
                    <p className="text-slate-600 text-[10px] font-black uppercase tracking-[0.3em]">
                        © 2026 trade.ai corp. all rights reserved
                    </p>
                </div>
            </footer>
        </div>
    );
};

export default Landing;
