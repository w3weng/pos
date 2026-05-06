import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useThemeStore } from './store/index';

// Pages
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import POSPage from './pages/POSPage';
import ProductsPage from './pages/ProductsPage';
import SalesPage from './pages/SalesPage';
import AnalyticsPage from './pages/AnalyticsPage';
import UsersPage from './pages/UsersPage';
import SettingsPage from './pages/SettingsPage';
import ActivityLogsPage from './pages/ActivityLogsPage';

// Components
import PrivateRoute from './components/PrivateRoute';
import Layout from './components/Layout';

function App() {
    const { isDark } = useThemeStore();
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Simulate loading
        const timer = setTimeout(() => setLoading(false), 500);
        return () => clearTimeout(timer);
    }, []);

    if (loading) {
        return (
            <div className={`flex min-h-[100dvh] items-center justify-center ${isDark ? 'bg-gray-900' : 'bg-white'}`}>
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className={`text-lg font-semibold ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <div className={isDark ? 'dark' : ''}>
            <BrowserRouter>
                <Routes>
                    {/* Public Routes */}
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/register" element={<RegisterPage />} />

                    {/* Protected Routes */}
                    <Route
                        path="/"
                        element={
                            <PrivateRoute>
                                <Layout>
                                    <DashboardPage />
                                </Layout>
                            </PrivateRoute>
                        }
                    />

                    <Route
                        path="/pos"
                        element={
                            <PrivateRoute roles={['Cashier', 'Admin']}>
                                <Layout>
                                    <POSPage />
                                </Layout>
                            </PrivateRoute>
                        }
                    />

                    <Route
                        path="/products"
                        element={
                            <PrivateRoute roles={['Manager', 'Admin']}>
                                <Layout>
                                    <ProductsPage />
                                </Layout>
                            </PrivateRoute>
                        }
                    />

                    <Route
                        path="/sales"
                        element={
                            <PrivateRoute roles={['Manager', 'Admin']}>
                                <Layout>
                                    <SalesPage />
                                </Layout>
                            </PrivateRoute>
                        }
                    />

                    <Route
                        path="/analytics"
                        element={
                            <PrivateRoute roles={['Manager', 'Admin']}>
                                <Layout>
                                    <AnalyticsPage />
                                </Layout>
                            </PrivateRoute>
                        }
                    />

                    <Route
                        path="/users"
                        element={
                            <PrivateRoute roles={['Admin']}>
                                <Layout>
                                    <UsersPage />
                                </Layout>
                            </PrivateRoute>
                        }
                    />

                    <Route
                        path="/activity-logs"
                        element={
                            <PrivateRoute roles={['Manager', 'Admin']}>
                                <Layout>
                                    <ActivityLogsPage />
                                </Layout>
                            </PrivateRoute>
                        }
                    />

                    <Route
                        path="/settings"
                        element={
                            <PrivateRoute>
                                <Layout>
                                    <SettingsPage />
                                </Layout>
                            </PrivateRoute>
                        }
                    />

                    {/* Catch all - redirect to home */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </BrowserRouter>
        </div>
    );
}

export default App;
