"use client";

import React, { createContext, useContext, ReactNode, useState } from "react";

type SpinnerType = "loading" | "success" | "error";

interface Spinner {
    message: string;
    type: SpinnerType;
}

interface SpinnerContextType {
    spinner: Spinner | null;
    showSpinner: (message: string) => void;
    hideSpinner: () => void;
}

const SpinnerContext = createContext<SpinnerContextType | undefined>(undefined);

export const SpinnerProvider = ({ children }: { children: ReactNode }) => {
    const [spinner, setSpinner] = useState<Spinner | null>(null);

    const showSpinner = (message: string) => {
        setSpinner({ message, type: "loading" });
    };

    const hideSpinner = () => {
        setSpinner(null);
    };

    return (
        <SpinnerContext.Provider value={{ spinner, showSpinner, hideSpinner }}>
            {children}

            {spinner && (
                <div className="fixed inset-0 flex w-full items-center justify-center bg-[#00000070] z-50">
                    <div className="flex flex-row gap-4 items-center justify-between bg-white p-4 rounded-lg shadow-md">
                        <div className="animate-spin rounded-full h-10 w-10 border-4 border-gray-300 border-t-blue-500" />
                        <p className="text-sm font-medium text-gray-700">{spinner.message}</p>
                    </div>
                </div>

            )
            }
        </SpinnerContext.Provider >
    );
};

export const useSpinner = () => {
    const context = useContext(SpinnerContext);
    if (!context) {
        throw new Error("useSpinner must be used inside SpinnerProvider");
    }
    return context;
};
