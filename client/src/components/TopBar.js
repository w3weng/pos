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
        <header className={`${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'} shrink-0 border-b shadow-sm`}>
            <div className="flex min-h-[4rem] items-center gap-3 px-3 sm:px-6 lg:px-8">
                <div className="flex min-w-0 flex-1 items-center gap-3">
                    <button
                        onClick={toggleSidebar}
                        className={`rounded-xl p-2.5 transition-colors ${
                            isDark ? 'hover:bg-slate-800 text-slate-300' : 'hover:bg-slate-100 text-slate-700'
                        } lg:hidden`}
                    >
                        <FiMenu size={24} />
                    </button>
                    <div className={`hidden h-10 w-10 items-center justify-center rounded-xl sm:flex ${
                        isDark ? 'bg-blue-500/15 text-blue-300' : 'bg-blue-50 text-blue-600'
                    }`}>
                        <MdPointOfSale size={22} />
                    </div>
                    <div className="min-w-0">
                        <p className={`truncate text-sm font-semibold sm:text-base ${isDark ? 'text-white' : 'text-slate-900'}`}>
                            {user?.name || 'Cashier'}
                        </p>
                        <p className={`hidden text-xs font-medium sm:block ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                            {user?.role || 'Operator'} workspace
                        </p>
                    </div>
                </div>

                <div className="ml-auto flex shrink-0 items-center gap-1 sm:gap-2">
                    <button
                        onClick={toggleTheme}
                        className={`rounded-xl p-2.5 transition-colors ${
                            isDark
                                ? 'hover:bg-slate-800 text-amber-300'
                                : 'hover:bg-slate-100 text-slate-700'
                        }`}
                    >
                        {isDark ? <FiSun size={20} /> : <FiMoon size={20} />}
                    </button>

                    <button
                        onClick={() => navigate('/settings')}
                        className={`rounded-xl p-2.5 transition-colors ${
                            isDark
                                ? 'hover:bg-slate-800 text-slate-300'
                                : 'hover:bg-slate-100 text-slate-700'
                        }`}
                    >
                        <FiSettings size={20} />
                    </button>

                    <button
                        onClick={handleLogout}
                        className={`inline-flex min-h-[2.5rem] items-center justify-center gap-2 rounded-xl px-3 font-semibold transition-colors sm:px-4 ${
                            isDark
                                ? 'bg-red-600 hover:bg-red-700 text-white'
                                : 'bg-red-50 hover:bg-red-100 text-red-600'
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
