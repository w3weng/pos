import React, { useState, useEffect } from 'react';
import { useThemeStore } from '../store/index';
import { analyticsService } from '../services/api';
import toast from 'react-hot-toast';
import { Card, LoadingSpinner } from '../components/ui';
import { useObservedWidth } from '../hooks/useObservedWidth';
import { formatRevenueAxisLabel, getRevenueAxisConfig, getVisibleRevenueCategoryCount } from '../utils/chartScale';
import { formatCurrency } from '../utils/helpers';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { MdOutlineShoppingCart, MdTrendingUp, MdInventory } from 'react-icons/md';

const statCardStyles = {
    blue: {
        iconBackground: 'bg-blue-100',
        iconColor: 'text-blue-600',
    },
    green: {
        iconBackground: 'bg-green-100',
        iconColor: 'text-green-600',
    },
    purple: {
        iconBackground: 'bg-violet-100',
        iconColor: 'text-violet-600',
    },
    red: {
        iconBackground: 'bg-red-100',
        iconColor: 'text-red-600',
    },
};

const formatChartDate = (value) =>
    new Date(value).toLocaleDateString('en-PH', {
        month: 'short',
        day: 'numeric',
    });

const DashboardPage = () => {
    const { isDark } = useThemeStore();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState(null);
    const [salesTrend, setSalesTrend] = useState([]);
    const [topProducts, setTopProducts] = useState([]);
    const [revenueCategory, setRevenueCategory] = useState([]);
    const [cashierPerformance, setCashierPerformance] = useState([]);
    const { elementRef: revenueCategoryChartRef, width: revenueCategoryChartWidth } = useObservedWidth();

    useEffect(() => {
        const fetchData = async () => {
            let hasRequestError = false;

            try {
                const [statsRes, trendRes, productsRes, categoryRes, cashierRes] = await Promise.allSettled([
                    analyticsService.getDashboardStats(),
                    analyticsService.getDailySalesTrend({ days: 30 }),
                    analyticsService.getTopProducts({ limit: 5 }),
                    analyticsService.getRevenueByCategory(),
                    analyticsService.getCashierPerformance({ limit: 5 }),
                ]);

                if (statsRes.status === 'fulfilled') {
                    setStats(statsRes.value.data.data);
                } else {
                    hasRequestError = true;
                }

                if (trendRes.status === 'fulfilled') {
                    setSalesTrend(trendRes.value.data.data);
                } else {
                    hasRequestError = true;
                    setSalesTrend([]);
                }

                if (productsRes.status === 'fulfilled') {
                    setTopProducts(productsRes.value.data.data);
                } else {
                    hasRequestError = true;
                    setTopProducts([]);
                }

                if (categoryRes.status === 'fulfilled') {
                    setRevenueCategory(categoryRes.value.data.data);
                } else {
                    hasRequestError = true;
                    setRevenueCategory([]);
                }

                if (cashierRes.status === 'fulfilled') {
                    setCashierPerformance(cashierRes.value.data.data);
                } else {
                    hasRequestError = true;
                    setCashierPerformance([]);
                }

                if (hasRequestError) {
                    toast.error('Some dashboard data could not be loaded');
                }
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    if (loading) {
        return (
            <div className="flex min-h-[60vh] items-center justify-center">
                <LoadingSpinner />
            </div>
        );
    }

    const visibleRevenueCategories = revenueCategory.slice(
        0,
        getVisibleRevenueCategoryCount(revenueCategoryChartWidth)
    );
    const salesTrendAxis = getRevenueAxisConfig(salesTrend, 'total');
    const revenueCategoryAxis = getRevenueAxisConfig(visibleRevenueCategories);

    const StatCard = ({ icon: Icon, label, value, subtext, color = 'blue' }) => (
        <Card isDark={isDark} className="flex items-start space-x-4">
            <div className={`p-3 rounded-lg ${statCardStyles[color]?.iconBackground || statCardStyles.blue.iconBackground}`}>
                <Icon className={statCardStyles[color]?.iconColor || statCardStyles.blue.iconColor} size={24} />
            </div>
            <div className="flex-1">
                <p className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{label}</p>
                <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{value}</p>
                {subtext && <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>{subtext}</p>}
            </div>
        </Card>
    );

    return (
        <div className="w-full min-w-0 space-y-6 py-4 sm:py-6">
            {/* Header */}
            <div>
                <h1 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Dashboard</h1>
                <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Welcome to your POS System</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    icon={MdOutlineShoppingCart}
                    label="Total Orders"
                    value={stats?.totalOrders || 0}
                    color="blue"
                />
                <StatCard
                    icon={MdTrendingUp}
                    label="Total Revenue"
                    value={formatCurrency(stats?.totalRevenue || 0)}
                    color="green"
                />
                <StatCard
                    icon={MdInventory}
                    label="Total Products"
                    value={stats?.totalProducts || 0}
                    color="purple"
                />
                <StatCard
                    icon={MdTrendingUp}
                    label="Today's Profit"
                    value={formatCurrency(stats?.totalProfit || 0)}
                    color="purple"
                />
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Sales Trend */}
                <Card isDark={isDark}>
                    <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        Sales Trend (Last 30 Days)
                    </h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={salesTrend}>
                            <CartesianGrid stroke={isDark ? '#374151' : '#e5e7eb'} />
                            <XAxis dataKey="date" tickFormatter={formatChartDate} stroke={isDark ? '#9ca3af' : '#6b7280'} />
                            <YAxis
                                allowDecimals={false}
                                domain={salesTrendAxis.domain}
                                ticks={salesTrendAxis.ticks}
                                tickFormatter={formatRevenueAxisLabel}
                                width={72}
                                stroke={isDark ? '#9ca3af' : '#6b7280'}
                            />
                            <Tooltip 
                                labelFormatter={formatChartDate}
                                formatter={(value) => [formatCurrency(Number(value) || 0), 'Revenue']}
                                contentStyle={{
                                    backgroundColor: isDark ? '#1f2937' : '#ffffff',
                                    border: `1px solid ${isDark ? '#374151' : '#e5e7eb'}`,
                                    color: isDark ? '#f3f4f6' : '#000000'
                                }}
                            />
                            <Legend />
                            <Line type="monotone" dataKey="total" stroke="#3b82f6" strokeWidth={2} />
                        </LineChart>
                    </ResponsiveContainer>
                    {salesTrend.length === 0 && (
                        <p className={`mt-4 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                            No sales trend data available yet.
                        </p>
                    )}
                </Card>

                {/* Revenue by Category */}
                <Card isDark={isDark}>
                    <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        Revenue by Category
                    </h3>
                    <div ref={revenueCategoryChartRef} className="w-full">
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart
                                data={visibleRevenueCategories}
                                margin={{ top: 8, right: 20, left: 8, bottom: 64 }}
                            >
                                <CartesianGrid stroke={isDark ? '#374151' : '#e5e7eb'} />
                                <XAxis
                                    dataKey="name"
                                    interval={0}
                                    angle={-20}
                                    textAnchor="end"
                                    height={72}
                                    tickMargin={10}
                                    stroke={isDark ? '#9ca3af' : '#6b7280'}
                                />
                                <YAxis
                                    allowDecimals={false}
                                    domain={revenueCategoryAxis.domain}
                                    ticks={revenueCategoryAxis.ticks}
                                    tickFormatter={formatRevenueAxisLabel}
                                    width={72}
                                    stroke={isDark ? '#9ca3af' : '#6b7280'}
                                />
                                <Tooltip 
                                    formatter={(value) => [formatCurrency(Number(value) || 0), 'Revenue']}
                                    contentStyle={{
                                        backgroundColor: isDark ? '#1f2937' : '#ffffff',
                                        border: `1px solid ${isDark ? '#374151' : '#e5e7eb'}`,
                                        color: isDark ? '#f3f4f6' : '#000000'
                                    }}
                                />
                                <Bar dataKey="revenue" fill="#10b981" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                    {visibleRevenueCategories.length < revenueCategory.length && (
                        <p className={`mt-4 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                            Showing top {visibleRevenueCategories.length} of {revenueCategory.length} categories by revenue.
                        </p>
                    )}
                    {revenueCategory.length === 0 && (
                        <p className={`mt-4 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                            No category revenue data available yet.
                        </p>
                    )}
                </Card>
            </div>

            {/* Tables Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Top Selling Products */}
                <Card isDark={isDark}>
                    <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        Top 5 Selling Products
                    </h3>
                    {topProducts.length === 0 ? (
                        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                            No product sales data available yet.
                        </p>
                    ) : (
                        <div className="space-y-3">
                            {topProducts.map((product) => (
                                <div key={product.id} className="flex items-center justify-between pb-2 border-b border-gray-200 dark:border-gray-700 last:border-0">
                                    <div>
                                        <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{product.name}</p>
                                        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{product.total_quantity} units</p>
                                    </div>
                                    <p className={`font-semibold ${isDark ? 'text-green-400' : 'text-green-600'}`}>
                                        {formatCurrency(product.total_revenue)}
                                    </p>
                                </div>
                            ))}
                        </div>
                    )}
                </Card>

                {/* Cashier Performance */}
                <Card isDark={isDark}>
                    <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        Top 5 Cashier Performance
                    </h3>
                    {cashierPerformance.length === 0 ? (
                        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                            No cashier performance data available yet.
                        </p>
                    ) : (
                        <div className="space-y-3">
                            {cashierPerformance.map((cashier) => (
                                <div key={cashier.id} className="flex items-center justify-between pb-2 border-b border-gray-200 dark:border-gray-700 last:border-0">
                                    <div>
                                        <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{cashier.name}</p>
                                        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{cashier.transactions} transactions</p>
                                    </div>
                                    <p className={`font-semibold ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
                                        {formatCurrency(cashier.total_revenue)}
                                    </p>
                                </div>
                            ))}
                        </div>
                    )}
                </Card>
            </div>
        </div>
    );
};

export default DashboardPage;
