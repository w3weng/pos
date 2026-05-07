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
        <div
            className={`flex h-[100dvh] overflow-hidden ${
                isDark
                    ? 'bg-slate-950 bg-[radial-gradient(ellipse_120%_80%_at_50%_-20%,rgba(59,130,246,0.12),transparent)]'
                    : 'bg-slate-100 bg-[radial-gradient(ellipse_100%_60%_at_50%_-10%,rgba(59,130,246,0.06),transparent)]'
            }`}
        >
            <Sidebar isOpen={sidebarOpen} toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />

            <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
                <TopBar
                    user={user}
                    isDark={isDark}
                    toggleTheme={toggleTheme}
                    toggleSidebar={() => setSidebarOpen(!sidebarOpen)}
                />

                <main
                    className={`relative min-h-0 flex-1 overflow-x-hidden overflow-y-auto scroll-smooth ${
                        isDark ? 'bg-transparent' : 'bg-transparent'
                    }`}
                >
                    <div className="mx-auto flex min-h-full w-full min-w-0 max-w-[1920px] px-3 sm:px-6 lg:px-8">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default Layout;
