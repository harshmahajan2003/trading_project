import { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/api';

const AuthContext = createContext({
    user: null,
    loading: true,
    login: () => { },
    register: () => { },
    logout: () => { }
});

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const initAuth = async () => {
            const storedUser = authService.getCurrentUser();
            if (storedUser) {
                // If we have a token but no name, fetch the profile
                if (storedUser.token && !storedUser.name) {
                    try {
                        const profile = await authService.getProfile();
                        const fullUser = { ...storedUser, ...profile };
                        setUser(fullUser);
                        // Sync back to sessionStorage
                        sessionStorage.setItem('trading_user', JSON.stringify(fullUser));
                    } catch (err) {
                        console.error("Failed to fetch profile on init:", err);
                        setUser(storedUser);
                    }
                } else {
                    setUser(storedUser);
                }
            }
            setLoading(false);
        };
        initAuth();
    }, []);

    const login = async (email, password) => {
        const data = await authService.login(email, password);
        setUser(data);
        return data;
    };

    const register = async (name, email, password) => {
        const data = await authService.register(name, email, password);
        setUser(data);
        return data;
    };

    const logout = () => {
        authService.logout();
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, register, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
