// providers/AuthProvider.tsx
"use client";
import { createContext, useContext, useEffect, useState, Dispatch, SetStateAction } from "react";

interface AuthType {
    _id: string;
    name: string;
    role: string;
}

interface AuthContextType {
    user: AuthType | null;       
    setUser: Dispatch<SetStateAction<AuthType | null>>;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    setUser: () => {}  // dummy function
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<AuthType | null>(null); 

    useEffect(() => {
        fetch("/api/me")
            .then((res) => res.json())
            .then((data) => setUser(data)); 
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