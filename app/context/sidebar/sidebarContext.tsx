"use client"

import { useState, useContext, createContext } from "react";

interface SidebarContextType {
    sidebarStatus: boolean;
    sidebarToggle: React.Dispatch<React.SetStateAction<boolean>>;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export function SidebarProvider({ children }: { children: React.ReactNode }) {

    const [sidebarStatus, sidebarToggle] = useState(false);

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
