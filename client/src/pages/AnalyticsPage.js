import React, { useEffect, useState } from 'react';
import { useThemeStore } from '../store/index';
import toast from 'react-hot-toast';
import { Card, LoadingSpinner } from '../components/ui';
import { useObservedWidth } from '../hooks/useObservedWidth';
import { formatRevenueAxisLabel, getRevenueAxisConfig, getVisibleRevenueCategoryCount } from '../utils/chartScale';
import { analyticsService } from '../services/api';
import { formatCurrency } from '../utils/helpers';
import { ResponsiveContainer, BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, LineChart, Line } from 'recharts';

const formatChartDate = (value) =>
    new Date(value).toLocaleDateString('en-PH', {
        month: 'short',
        day: 'numeric',
    });

const AnalyticsPage = () => {
    const { isDark } = useThemeStore();
    const [loading, setLoading] = useState(true);
    const [summary, setSummary] = useState(null);
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
                const [summaryRes, statsRes, trendRes, productsRes, categoryRes, cashierRes] = await Promise.allSettled([
                    analyticsService.getSalesSummary(),
                    analyticsService.getDashboardStats(),
                    analyticsService.getDailySalesTrend({ days: 30 }),
                    analyticsService.getTopProducts({ limit: 5 }),
                    analyticsService.getRevenueByCategory(),
                    analyticsService.getCashierPerformance({ limit: 5 }),
                ]);

                if (summaryRes.status === 'fulfilled') {
                    setSummary(summaryRes.value.data.data);
                } else {
                    hasRequestError = true;
                }

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
                    toast.error('Some analytics data could not be loaded');
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

    return (
        <div className="w-full min-w-0 space-y-6 py-4 sm:py-6">
            <div>
                <h1 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Analytics</h1>
                <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Live business performance across sales, products, and staff</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                <Card isDark={isDark}>
                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Today's Revenue</p>
                    <p className={`mt-2 text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {formatCurrency(summary?.totalRevenue || 0)}
                    </p>
                </Card>
                <Card isDark={isDark}>
                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Today's Orders</p>
                    <p className={`mt-2 text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {stats?.totalOrders || 0}
                    </p>
                </Card>
                <Card isDark={isDark}>
                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Today's Discounts</p>
                    <p className={`mt-2 text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {formatCurrency(summary?.totalDiscount || 0)}
                    </p>
                </Card>
                <Card isDark={isDark}>
                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Today's Profit</p>
                    <p className={`mt-2 text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {formatCurrency(summary?.totalProfit || 0)}
                    </p>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card isDark={isDark}>
                    <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        Sales Trend (Last 30 Days)
                    </h3>
                    <ResponsiveContainer width="100%" height={320}>
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
                                    color: isDark ? '#f3f4f6' : '#111827',
                                }}
                            />
                            <Line type="monotone" dataKey="total" stroke="#3b82f6" strokeWidth={2} />
                        </LineChart>
                    </ResponsiveContainer>
                    {salesTrend.length === 0 && (
                        <p className={`mt-4 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                            No sales trend data available yet.
                        </p>
                    )}
                </Card>

                <Card isDark={isDark}>
                    <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        Revenue by Category
                    </h3>
                    <div ref={revenueCategoryChartRef} className="w-full">
                        <ResponsiveContainer width="100%" height={320}>
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
                                        color: isDark ? '#f3f4f6' : '#111827',
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

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card isDark={isDark} className="lg:col-span-1">
                    <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        Sales Summary
                    </h3>
                    <div className="space-y-3">
                        <div className="flex justify-between">
                            <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Subtotal</span>
                            <span className={isDark ? 'text-white' : 'text-gray-900'}>{formatCurrency(summary?.subtotal || 0)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Discounts</span>
                            <span className={isDark ? 'text-white' : 'text-gray-900'}>{formatCurrency(summary?.totalDiscount || 0)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Tax</span>
                            <span className={isDark ? 'text-white' : 'text-gray-900'}>{formatCurrency(summary?.totalTax || 0)}</span>
                        </div>
                        <div className="flex justify-between border-t pt-3">
                            <span className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Net Revenue</span>
                            <span className="font-semibold text-green-600">{formatCurrency(summary?.totalRevenue || 0)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Profit / Ginansya</span>
                            <span className="font-semibold text-blue-600">{formatCurrency(summary?.totalProfit || 0)}</span>
                        </div>
                    </div>
                </Card>

                <Card isDark={isDark} className="lg:col-span-1">
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
                                        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{product.total_quantity} units sold</p>
                                    </div>
                                    <span className="font-semibold text-green-600">{formatCurrency(product.total_revenue)}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </Card>

                <Card isDark={isDark} className="lg:col-span-1">
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
                                <div key={cashier.id} className="pb-2 border-b border-gray-200 dark:border-gray-700 last:border-0">
                                    <div className="flex items-center justify-between">
                                        <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{cashier.name}</p>
                                        <span className="font-semibold text-blue-600">{formatCurrency(cashier.total_revenue)}</span>
                                    </div>
                                    <p className={`mt-1 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                        {cashier.transactions} transactions, avg {formatCurrency(cashier.avg_transaction)}
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

export default AnalyticsPage;
