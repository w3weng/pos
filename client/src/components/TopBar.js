import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { FiLogOut, FiMenu, FiMoon, FiSun, FiSettings } from 'react-icons/fi';
import { MdPointOfSale } from 'react-icons/md';

const TopBar = ({ user, isDark, toggleTheme, toggleSidebar }) => {
    const navigate = useNavigate();
    const { logout } = useAuth();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <header
            className={`shrink-0 border-b backdrop-blur-md ${
                isDark
                    ? 'border-slate-800/80 bg-slate-900/85 shadow-[0_1px_0_0_rgba(255,255,255,0.04)]'
                    : 'border-slate-200/90 bg-white/85 shadow-sm'
            }`}
        >
            <div className="mx-auto flex min-h-[3.75rem] max-w-[1920px] items-center gap-3 px-3 sm:min-h-[4rem] sm:px-6 lg:px-8">
                <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
                    <button
                        type="button"
                        aria-label="Open menu"
                        onClick={toggleSidebar}
                        className={`rounded-xl p-2.5 transition-colors ${
                            isDark ? 'text-slate-300 hover:bg-slate-800' : 'text-slate-700 hover:bg-slate-100'
                        } lg:hidden`}
                    >
                        <FiMenu size={24} />
                    </button>
                    <div
                        className={`hidden h-10 w-10 shrink-0 items-center justify-center rounded-xl sm:flex ${
                            isDark ? 'bg-blue-500/15 text-blue-300' : 'bg-blue-50 text-blue-600'
                        }`}
                    >
                        <MdPointOfSale size={22} aria-hidden />
                    </div>
                    <div className="min-w-0">
                        <p className={`truncate text-sm font-bold tracking-tight sm:text-base ${isDark ? 'text-white' : 'text-slate-900'}`}>
                            {user?.name || 'Cashier'}
                        </p>
                        <p className={`hidden text-xs font-semibold sm:block ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                            {user?.role || 'Operator'} · workspace
                        </p>
                    </div>
                </div>

                <div className="ml-auto flex shrink-0 items-center gap-0.5 sm:gap-2">
                    <button
                        type="button"
                        aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
                        onClick={toggleTheme}
                        className={`rounded-xl p-2.5 transition-colors ${
                            isDark ? 'text-amber-300 hover:bg-slate-800' : 'text-slate-700 hover:bg-slate-100'
                        }`}
                    >
                        {isDark ? <FiSun size={20} /> : <FiMoon size={20} />}
                    </button>

                    <button
                        type="button"
                        aria-label="Settings"
                        onClick={() => navigate('/settings')}
                        className={`rounded-xl p-2.5 transition-colors ${
                            isDark ? 'text-slate-300 hover:bg-slate-800' : 'text-slate-700 hover:bg-slate-100'
                        }`}
                    >
                        <FiSettings size={20} />
                    </button>

                    <button
                        type="button"
                        onClick={handleLogout}
                        className={`inline-flex min-h-[2.5rem] items-center justify-center gap-2 rounded-xl px-3 text-sm font-bold transition-colors sm:px-4 ${
                            isDark
                                ? 'bg-red-600 text-white hover:bg-red-500'
                                : 'border border-red-200 bg-red-50 text-red-700 hover:bg-red-100'
                        }`}
                    >
                        <span className="sm:hidden">
                            <FiLogOut size={18} />
                        </span>
                        <span className="hidden items-center gap-2 sm:inline-flex">
                            <FiLogOut size={18} />
                            <span>Logout</span>
                        </span>
                    </button>
                </div>
            </div>
        </header>
    );
};

export default TopBar;
