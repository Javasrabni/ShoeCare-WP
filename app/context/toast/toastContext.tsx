"use client";

import { createContext, useContext, useState, ReactNode } from "react";

type ToastType = "success" | "error" | "info";

interface Toast {
    message: string;
    type: ToastType;
}

interface ToastContextType {
    showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider = ({ children }: { children: ReactNode }) => {
    const [toast, setToast] = useState<Toast | null>(null);

    const showToast = (message: string, type: ToastType = "info") => {
        setToast({ message, type });

        setTimeout(() => {
            setToast(null);
        }, 3000);
    };

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}

            {toast && (
                <div
                    className={`fixed top-16 z-200 min-w-48 max-w-xs w-full left-1/2 transform -translate-x-1/2 px-4 py-3 rounded-lg shadow-lg text-white ${toast.type === "success"
                            ? "bg-green-500"
                            : toast.type === "error"
                                ? "bg-red-500"
                                : "bg-blue-500"
                        }`}
                >
                    <p className="text-xs font-medium font-[inter]">
                        {toast.message}
                    </p>
                </div>
            )}
        </ToastContext.Provider>
    );
};

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error("useToast must be used inside ToastProvider");
    }
    return context;
};
