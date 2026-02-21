// providers/AuthProvider.tsx
"use client";
import { createContext, useContext, useEffect, useState, Dispatch, SetStateAction } from "react";

interface AuthType {
    _id: string;
    name: string;
    role: string;
    phone: string;
    email?: string;
    isGuest?: boolean;
    loyaltyPoints?: number;
}

interface AuthContextType {
    user: AuthType | null;       
    setUser: Dispatch<SetStateAction<AuthType | null>>;
    isAuthenticated: boolean;  // ⬅️ TAMBAHKAN INI
    isLoading: boolean;        // ⬅️ TAMBAHKAN INI (optional tapi recommended)
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    setUser: () => {},
    isAuthenticated: false,    // ⬅️ DEFAULT VALUE
    isLoading: true            // ⬅️ DEFAULT VALUE
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<AuthType | null>(null); 
    const [isLoading, setIsLoading] = useState(true);  // ⬅️ TAMBAHKAN

    useEffect(() => {
        fetch("/api/me")
            .then((res) => res.json())
            .then((data) => {
                if (data.success && data.user) {
                    setUser(data.user);
                }
            })
            .catch((err) => console.error("Auth error:", err))
            .finally(() => setIsLoading(false));  // ⬅️ SET LOADING FALSE
    }, []);

    // ⬅️ DERIVED VALUE
    const isAuthenticated = !!user;

    return (
        <AuthContext.Provider value={{ user, setUser, isAuthenticated, isLoading }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within AuthProvider");
    }
    return context;
};