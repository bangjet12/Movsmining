import { createContext, useContext, useEffect, useState } from 'react';
import { apiClient, setAuthToken } from './api';

const AuthContext = createContext({});

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const t = localStorage.getItem('movs_jwt');
        if (!t) {
            setLoading(false);
            return;
        }
        apiClient
            .get('/auth/me')
            .then((r) => setUser(r.data))
            .catch(() => setAuthToken(null))
            .finally(() => setLoading(false));
    }, []);

    const refresh = async () => {
        try {
            const r = await apiClient.get('/auth/me');
            setUser(r.data);
            return r.data;
        } catch (e) {
            return null;
        }
    };

    const loginWithToken = async (jwt, userData) => {
        setAuthToken(jwt);
        if (userData) {
            setUser(userData);
        } else {
            await refresh();
        }
    };

    const logout = () => {
        setAuthToken(null);
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, setUser, loading, refresh, loginWithToken, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}
