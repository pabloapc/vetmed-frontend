import { createContext, useState, useEffect } from "react";
import { useContext } from "react";
import { useNavigate } from "react-router-dom";
import type { User } from "../types/user";
import { authService } from "../services/authService";

type AuthContextType = {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    loading: boolean;
    login: (credentials: { email: string; password: string }) => Promise<void>;
    register: (payload: any) => Promise<void>;
    logout: () => void;
    updateUser: (user: Partial<User>) => void;
};

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
    children,
}) => {
    const navigate = useNavigate();
    const [user, setUser] = useState<User | null>(() => {
        try {
            const raw = localStorage.getItem("user");
            return raw ? JSON.parse(raw) : null;
        } catch {
            return null;
        }
    });
    const [token, setToken] = useState<string | null>(() => {
        try {
            return localStorage.getItem("token");
        } catch {
            return null;
        }
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        // If token exists but no user, try to fetch profile
        if (token && !user) {
            (async () => {
                try {
                    const profile = await authService.getProfile();
                    setUser(profile as User);
                    localStorage.setItem("user", JSON.stringify(profile));
                } catch (err) {
                    console.warn("Could not fetch profile on init", err);
                    logout();
                }
            })();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // const saveAuth = (tokenValue?: string | null, userValue?: User | null) => {
    //     if (tokenValue) {
    //         localStorage.setItem("token", tokenValue);
    //         setToken(tokenValue);
    //     }
    //     if (userValue) {
    //         localStorage.setItem("user", JSON.stringify(userValue));
    //         setUser(userValue);
    //     }
    // };

    const clearAuth = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setToken(null);
        setUser(null);
    };

    const login = async (credentials: { email: string; password: string }) => {
        setLoading(true);
        try {
            const resp = await authService.login(credentials);
            // resp expected to contain { token, user } or similar
            const tokenVal = resp?.token ?? resp?.data?.token ?? null;
            const userVal =
                resp?.user ?? resp?.data?.user ?? resp?.data ?? resp ?? null;
            if (tokenVal) localStorage.setItem("token", tokenVal);
            if (userVal) localStorage.setItem("user", JSON.stringify(userVal));
            setToken(tokenVal);
            setUser(userVal);
        } finally {
            setLoading(false);
        }
    };

    const register = async (payload: any) => {
        setLoading(true);
        try {
            const resp = await authService.register(payload);
            // backend currently returns message and data.user but not token
            // If backend returns token in future, save it
            const tokenVal = resp?.data?.token ?? resp?.token ?? null;
            const userVal = resp?.data?.user ?? resp?.user ?? null;
            if (tokenVal) localStorage.setItem("token", tokenVal);
            if (userVal) localStorage.setItem("user", JSON.stringify(userVal));
            setToken(tokenVal);
            setUser(userVal);
        } finally {
            setLoading(false);
        }
    };

    const logout = () => {
        clearAuth();
        // Optionally call backend logout route
        navigate("/login");
    };

    const updateUser = (newUser: Partial<User>) => {
        const merged = { ...(user ?? {}), ...newUser } as User;
        setUser(merged);
        localStorage.setItem("user", JSON.stringify(merged));
    };

    const value: AuthContextType = {
        user,
        token,
        isAuthenticated: !!token || !!user,
        loading,
        login,
        register,
        logout,
        updateUser,
    };

    return (
        <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
    );
};

export const useAuth = (): AuthContextType => {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth must be used within AuthProvider");
    return ctx;
};
