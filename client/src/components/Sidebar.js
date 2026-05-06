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
                    className="fixed inset-0 z-20 bg-black bg-opacity-50 lg:hidden"
                    onClick={toggleSidebar}
                />
            )}

            <aside
                className={`fixed top-0 left-0 z-30 flex h-[100dvh] w-[16.5rem] max-w-[85vw] shrink-0 flex-col border-r transition-transform duration-200 lg:static lg:z-0 ${
                    isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
                } ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200'}`}
            >
                <div className={`flex items-center justify-between border-b p-4 sm:p-5 ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white">
                            <MdPointOfSale size={22} />
                        </div>
                        <div>
                            <h1 className={`text-lg font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-950'}`}>
                                POS Pro
                            </h1>
                            <p className={`text-xs font-semibold ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>Retail console</p>
                        </div>
                    </div>
                    <button
                        onClick={toggleSidebar}
                        className="text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white lg:hidden"
                    >
                        <FiX size={24} />
                    </button>
                </div>

                <nav className="flex-1 space-y-1.5 overflow-y-auto px-3 py-4">
                    {filteredMenu.map((item) => {
                        const Icon = item.icon;
                        const isActive = location.pathname === item.path;

                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={`flex min-h-[3rem] items-center gap-3 rounded-xl px-3.5 text-sm font-bold transition-colors ${
                                    isActive
                                        ? isDark
                                            ? 'bg-blue-600 text-white shadow-sm'
                                            : 'bg-blue-50 text-blue-700 shadow-sm'
                                        : isDark
                                            ? 'text-slate-300 hover:bg-slate-900'
                                            : 'text-slate-700 hover:bg-slate-100'
                                }`}
                            >
                                <Icon size={21} />
                                <span>{item.label}</span>
                            </Link>
                        );
                    })}
                </nav>

                <div className={`border-t p-4 ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
                    <div className={`min-w-0 rounded-xl p-3 text-sm ${isDark ? 'bg-slate-900 text-slate-400' : 'bg-slate-50 text-slate-600'}`}>
                        <p className={`truncate font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{user?.name}</p>
                        <p className="text-xs font-semibold">{user?.role}</p>
                    </div>
                </div>
            </aside>
        </>
    );
};

export default Sidebar;
