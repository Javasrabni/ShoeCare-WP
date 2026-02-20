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
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    setUser: () => {} 
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<AuthType | null>(null); 

    useEffect(() => {
        fetch("/api/me")
            .then((res) => res.json())
            .then((data) => {
                if (data.success && data.user) {
                    setUser(data.user);
                }
            })
            .catch((err) => console.error("Auth error:", err)); 
    }, []);

    return (
        <AuthContext.Provider value={{ user, setUser }}>
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