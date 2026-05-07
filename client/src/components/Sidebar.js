import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useThemeStore } from '../store/index';
import { useAuth } from '../hooks/useAuth';
import { FiX } from 'react-icons/fi';
import { MdDashboard, MdPointOfSale, MdReceiptLong, MdBarChart, MdPeople, MdSettings, MdStore, MdHistory } from 'react-icons/md';

const Sidebar = ({ isOpen, toggleSidebar }) => {
    const location = useLocation();
    const { isDark } = useThemeStore();
    const { user, canAccess } = useAuth();

    const menuItems = [
        { path: '/', label: 'Dashboard', icon: MdDashboard, roles: ['Admin', 'Manager', 'Cashier'] },
        { path: '/pos', label: 'POS', icon: MdPointOfSale, roles: ['Cashier', 'Admin'] },
        { path: '/products', label: 'Products', icon: MdStore, roles: ['Manager', 'Admin'] },
        { path: '/sales', label: 'Sales', icon: MdReceiptLong, roles: ['Manager', 'Admin'] },
        { path: '/analytics', label: 'Analytics', icon: MdBarChart, roles: ['Manager', 'Admin'] },
        { path: '/users', label: 'Users', icon: MdPeople, roles: ['Admin'] },
        { path: '/activity-logs', label: 'Activity Logs', icon: MdHistory, roles: ['Manager', 'Admin'] },
        { path: '/settings', label: 'Settings', icon: MdSettings, roles: ['Admin', 'Manager', 'Cashier'] },
    ];

    const filteredMenu = menuItems.filter((item) => canAccess(item.roles));

    return (
        <>
            {isOpen && (
                <div
                    className="fixed inset-0 z-20 bg-slate-950/50 backdrop-blur-[2px] lg:hidden"
                    aria-hidden
                    onClick={toggleSidebar}
                />
            )}

            <aside
                className={`fixed top-0 left-0 z-30 flex h-[100dvh] w-[17rem] max-w-[min(85vw,18rem)] shrink-0 flex-col border-r shadow-[4px_0_24px_-8px_rgba(0,0,0,0.12)] transition-transform duration-200 dark:shadow-black/40 lg:static lg:z-0 lg:max-w-none ${
                    isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
                } ${
                    isDark
                        ? 'border-slate-800/80 bg-slate-950/95 backdrop-blur-md'
                        : 'border-slate-200/90 bg-white/95 backdrop-blur-md'
                }`}
            >
                <div
                    className={`flex items-center justify-between border-b px-4 py-4 sm:px-5 sm:py-5 ${
                        isDark ? 'border-slate-800' : 'border-slate-200'
                    }`}
                >
                    <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-blue-700 text-white shadow-md shadow-blue-600/25">
                            <MdPointOfSale size={24} aria-hidden />
                        </div>
                        <div className="min-w-0">
                            <h1 className={`truncate text-lg font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-950'}`}>
                                POS Pro
                            </h1>
                            <p className={`text-xs font-semibold ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>Retail console</p>
                        </div>
                    </div>
                    <button
                        type="button"
                        aria-label="Close menu"
                        onClick={toggleSidebar}
                        className={`rounded-lg p-2 lg:hidden ${
                            isDark ? 'text-slate-400 hover:bg-slate-900 hover:text-white' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
                        }`}
                    >
                        <FiX size={22} />
                    </button>
                </div>

                <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-3 sm:py-4">
                    {filteredMenu.map((item) => {
                        const Icon = item.icon;
                        const isActive = location.pathname === item.path;

                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                onClick={() => {
                                    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
                                        toggleSidebar();
                                    }
                                }}
                                className={`relative flex min-h-[2.875rem] items-center gap-3 rounded-xl px-3 text-sm font-bold transition-colors ${
                                    isActive
                                        ? isDark
                                            ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                                            : 'bg-blue-600 text-white shadow-md shadow-blue-600/25'
                                        : isDark
                                            ? 'text-slate-300 hover:bg-slate-900/80'
                                            : 'text-slate-700 hover:bg-slate-100'
                                } ${isActive ? 'before:absolute before:left-0 before:top-1/2 before:h-7 before:w-1 before:-translate-y-1/2 before:rounded-full before:bg-white/90' : ''}`}
                            >
                                <Icon size={21} className="relative shrink-0" />
                                <span className="relative truncate">{item.label}</span>
                            </Link>
                        );
                    })}
                </nav>

                <div className={`border-t p-3 sm:p-4 ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
                    <div
                        className={`min-w-0 rounded-xl border p-3 text-sm ${
                            isDark ? 'border-slate-800 bg-slate-900/80 text-slate-400' : 'border-slate-200/80 bg-slate-50 text-slate-600'
                        }`}
                    >
                        <p className={`truncate font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{user?.name}</p>
                        <p className="text-xs font-semibold opacity-90">{user?.role}</p>
                    </div>
                </div>
            </aside>
        </>
    );
};

export default Sidebar;
