import React, { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useThemeStore } from '../store/index';
import Sidebar from './Sidebar';
import TopBar from './TopBar';

const isDesktopViewport = () =>
    (typeof window === 'undefined') || window.innerWidth >= 1024;

const Layout = ({ children }) => {
    const { isDark, toggleTheme } = useThemeStore();
    const { user } = useAuth();
    const [sidebarOpen, setSidebarOpen] = useState(isDesktopViewport);

    useEffect(() => {
        const syncSidebarState = () => {
            setSidebarOpen(isDesktopViewport());
        };

        syncSidebarState();
        window.addEventListener('resize', syncSidebarState);

        return () => {
            window.removeEventListener('resize', syncSidebarState);
        };
    }, []);

    return (
        <div className={`flex h-[100dvh] overflow-hidden ${isDark ? 'bg-slate-950' : 'bg-slate-100'}`}>
            {/* Sidebar */}
            <Sidebar isOpen={sidebarOpen} toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />

            {/* Main content */}
            <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
                {/* Top bar */}
                <TopBar 
                    user={user} 
                    isDark={isDark} 
                    toggleTheme={toggleTheme}
                    toggleSidebar={() => setSidebarOpen(!sidebarOpen)}
                />

                {/* Page content */}
                <main className={`flex-1 overflow-x-hidden overflow-y-auto ${isDark ? 'bg-slate-950' : 'bg-slate-100'}`}>
                    <div className="flex min-h-full w-full min-w-0 px-3 sm:px-6 lg:px-8">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default Layout;
