import React, { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Badge, Card, LoadingSpinner, Pagination, Table } from '../components/ui';
import { activityLogService } from '../services/api';
import { useThemeStore } from '../store/index';
import { formatDate } from '../utils/helpers';

const PAGE_SIZE = 20;

const getBadgeVariant = (action) => {
    const normalizedAction = String(action || '').toUpperCase();

    if (['DELETE', 'VOID', 'DISABLE'].includes(normalizedAction)) {
        return 'danger';
    }

    if (['CREATE', 'ENABLE'].includes(normalizedAction)) {
        return 'success';
    }

    if (normalizedAction === 'UPDATE') {
        return 'warning';
    }

    return 'info';
};

const ActivityLogsPage = () => {
    const { isDark } = useThemeStore();
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState({ total: 0, page: 1, limit: PAGE_SIZE, pages: 1 });

    const fetchLogs = useCallback(async (nextPage) => {
        try {
            setLoading(true);
            const response = await activityLogService.getActivityLogs({ page: nextPage, limit: PAGE_SIZE });
            setLogs(response.data.data);
            setPagination(response.data.pagination || { total: response.data.data.length, page: nextPage, limit: PAGE_SIZE, pages: 1 });
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to load activity logs');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchLogs(page);
    }, [fetchLogs, page]);

    if (loading) {
        return (
            <div className="flex min-h-[60vh] items-center justify-center">
                <LoadingSpinner />
            </div>
        );
    }

    return (
        <div className="w-full min-w-0 space-y-6 py-4 sm:py-6">
            <div>
                <h1 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Activity Logs</h1>
                <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    Audit trail for account, product, sale, and system changes
                </p>
            </div>

            <Card isDark={isDark}>
                {logs.length === 0 ? (
                    <p className={`py-8 text-center ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        No activity logs found
                    </p>
                ) : (
                    <Table>
                        <thead>
                            <tr className={`border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                                <th className={`px-4 py-3 text-left font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Date</th>
                                <th className={`px-4 py-3 text-left font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>User</th>
                                <th className={`px-4 py-3 text-left font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Action</th>
                                <th className={`px-4 py-3 text-left font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Entity</th>
                                <th className={`px-4 py-3 text-left font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Details</th>
                            </tr>
                        </thead>
                        <tbody>
                            {logs.map((log) => (
                                <tr key={log.id} className={`border-b ${isDark ? 'border-gray-700 hover:bg-gray-700' : 'border-gray-200 hover:bg-gray-50'}`}>
                                    <td className={`px-4 py-3 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                        {formatDate(log.created_at)}
                                    </td>
                                    <td className={`px-4 py-3 font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                        {log.user_name || 'System'}
                                    </td>
                                    <td className="px-4 py-3">
                                        <Badge variant={getBadgeVariant(log.action)}>{log.action}</Badge>
                                    </td>
                                    <td className={`px-4 py-3 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                        {log.entity_type}
                                    </td>
                                    <td className={`px-4 py-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                        {log.description}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>
                )}

                <Pagination
                    currentPage={pagination.page || page}
                    totalPages={pagination.pages || 1}
                    totalItems={pagination.total || 0}
                    pageSize={PAGE_SIZE}
                    onPageChange={setPage}
                    isDark={isDark}
                    itemLabel="logs"
                />
            </Card>
        </div>
    );
};

export default ActivityLogsPage;
