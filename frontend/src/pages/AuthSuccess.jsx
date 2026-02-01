import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/api';
import { Loader2 } from 'lucide-react';

const AuthSuccess = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { login } = useAuth();

    useEffect(() => {
        const token = searchParams.get('token');
        if (token) {
            // Store token first for auth interceptor
            localStorage.setItem('trading_user', JSON.stringify({ token }));

            // Now fetch profile
            authService.getProfile()
                .then(user => {
                    const fullUser = { ...user, token };
                    localStorage.setItem('trading_user', JSON.stringify(fullUser));
                    window.location.href = '/dashboard';
                })
                .catch(err => {
                    console.error("Profile fetch failed:", err);
                    navigate('/login');
                });
        } else {
            navigate('/login');
        }
    }, [searchParams, navigate]);

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-[#0a0a0a]">
            <Loader2 className="w-12 h-12 text-indigo-500 animate-spin mb-4" />
            <h2 className="text-xl font-bold text-white uppercase tracking-widest">Authenticating Session...</h2>
            <p className="text-slate-500 mt-2">Setting up your trading environment</p>
        </div>
    );
};

export default AuthSuccess;
