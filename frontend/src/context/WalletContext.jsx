import { createContext, useContext, useState, useEffect } from 'react';
import { walletService } from '../services/api';
import { socket } from '../services/socket';
import { useAuth } from './AuthContext';

const WalletContext = createContext({
    balance: 0,
    lockedBalance: 0,
    loading: true,
    refreshBalance: () => { }
});

export const WalletProvider = ({ children }) => {
    const { user } = useAuth();
    const [balance, setBalance] = useState(0);
    const [lockedBalance, setLockedBalance] = useState(0);
    const [loading, setLoading] = useState(true);

    const fetchBalance = async () => {
        if (!user) return;
        try {
            const data = await walletService.getBalance();
            setBalance(data.balance || 0);
            setLockedBalance(data.lockedBalance || 0);
        } catch (err) {
            console.error("Wallet fetch error:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user) {
            fetchBalance();

            const handleUpdate = () => {
                fetchBalance();
            };

            socket.on('walletUpdate', handleUpdate);
            return () => socket.off('walletUpdate', handleUpdate);
        } else {
            setBalance(0);
            setLockedBalance(0);
            setLoading(false);
        }
    }, [user]);

    return (
        <WalletContext.Provider value={{ balance, lockedBalance, loading, refreshBalance: fetchBalance }}>
            {children}
        </WalletContext.Provider>
    );
};

export const useWallet = () => useContext(WalletContext);
