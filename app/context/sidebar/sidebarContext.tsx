"use client"

import { useState, useContext, createContext } from "react";

interface SidebarContextType {
    sidebarStatus: boolean;
    sidebarToggle: () => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export function SidebarProvider({ children }: { children: React.ReactNode }) {

    const [sidebarStatus, setSidebarStatus] = useState(false);

    const sidebarToggle = () => {
        setSidebarStatus(prev => !prev);
    };

    return (
        <SidebarContext.Provider value={{ sidebarStatus, sidebarToggle }}>
            {children}
        </SidebarContext.Provider>
    );
}

export const useSidebar = () => {
    const context = useContext(SidebarContext);

    if (!context) {
        throw new Error("useSidebar must be used inside SidebarProvider");
    }

    return context;
};
