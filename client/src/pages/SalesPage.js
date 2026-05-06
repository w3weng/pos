import React, { useCallback, useEffect, useState } from 'react';
import { FiEye, FiPrinter, FiXCircle } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { Badge, Button, Card, Input, LoadingSpinner, Modal, Pagination, Table } from '../components/ui';
import { posService, storeService } from '../services/api';
import { useThemeStore } from '../store/index';
import { useAuth } from '../hooks/useAuth';
import { formatCurrency, formatDate } from '../utils/helpers';

const PAYMENT_METHOD_LABELS = {
    CASH: 'Cash',
    GCASH: 'GCash',
    MAYA: 'Maya',
    BANK_TRANSFER: 'Bank Transfer',
    QR: 'QR',
};

const formatPaymentMethodLabel = (value) =>
    PAYMENT_METHOD_LABELS[String(value || 'CASH').toUpperCase()] ??
    String(value || 'CASH')
        .replace(/_/g, ' ')
        .toLowerCase()
        .replace(/\b\w/g, (character) => character.toUpperCase());

const SALES_PAGE_SIZE = 20;

const escapeHtml = (value) =>
    String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');

const buildReceiptMarkup = (sale, storeInfo) => {
    const transactionId = sale.transaction_id ?? sale.transactionId;
    const itemsMarkup = (sale.items || []).map((item) => `
        <tr>
            <td>
                <div>${escapeHtml(item.product_name ?? item.name)}</div>
                <div class="muted">${escapeHtml(item.quantity)} x ${escapeHtml(formatCurrency(item.unit_price ?? item.unitPrice))}</div>
            </td>
            <td class="right">${escapeHtml(formatCurrency(item.line_total ?? item.lineTotal))}</td>
        </tr>
    `).join('');

    return `
        <!doctype html>
        <html>
            <head>
                <title>Receipt ${escapeHtml(transactionId)}</title>
                <style>
                    @page { size: 80mm auto; margin: 4mm; }
                    * { box-sizing: border-box; }
                    body { margin: 0; color: #111; background: #fff; font-family: "Courier New", monospace; font-size: 11px; line-height: 1.35; }
                    .receipt { width: 72mm; margin: 0 auto; }
                    .center { text-align: center; }
                    h1 { margin: 0 0 3px; font-size: 16px; line-height: 1.15; }
                    p { margin: 2px 0; }
                    hr { border: 0; border-top: 1px dashed #111; margin: 8px 0; }
                    table { width: 100%; border-collapse: collapse; }
                    td { padding: 3px 0; vertical-align: top; }
                    .right { text-align: right; white-space: nowrap; padding-left: 8px; }
                    .row { display: flex; justify-content: space-between; gap: 8px; margin: 3px 0; }
                    .strong { font-weight: 700; }
                    .total { border-top: 1px solid #111; margin-top: 5px; padding-top: 5px; font-size: 13px; }
                    .muted { color: #444; }
                    .void { border: 1px dashed #111; padding: 6px; white-space: pre-wrap; overflow-wrap: anywhere; }
                </style>
            </head>
            <body>
                <div class="receipt">
                    <div class="center">
                        <h1>${escapeHtml(storeInfo?.name || 'POS PRO')}</h1>
                        <p>OFFICIAL RECEIPT</p>
                        ${storeInfo?.address ? `<p>${escapeHtml(storeInfo.address)}</p>` : ''}
                        ${storeInfo?.phone ? `<p>${escapeHtml(storeInfo.phone)}</p>` : ''}
                    </div>
                    <hr />
                    <p>Transaction: ${escapeHtml(transactionId)}</p>
                    <p>Date: ${escapeHtml(formatDate(sale.created_at ?? sale.createdAt))}</p>
                    <p>Status: ${escapeHtml(sale.status)}</p>
                    <p>Payment: ${escapeHtml(formatPaymentMethodLabel(sale.payment_method ?? sale.paymentMethod))}</p>
                    <hr />
                    <table><tbody>${itemsMarkup}</tbody></table>
                    <hr />
                    <div class="row"><span>Subtotal</span><span>${escapeHtml(formatCurrency(sale.subtotal))}</span></div>
                    <div class="row"><span>Discount</span><span>-${escapeHtml(formatCurrency(sale.discount_amount ?? sale.discountAmount))}</span></div>
                    <div class="row"><span>Tax</span><span>${escapeHtml(formatCurrency(sale.tax_amount ?? sale.taxAmount))}</span></div>
                    <div class="row strong total"><span>Total</span><span>${escapeHtml(formatCurrency(sale.total_amount ?? sale.totalAmount))}</span></div>
                    <div class="row"><span>Paid</span><span>${escapeHtml(formatCurrency(sale.amount_paid ?? sale.amountPaid))}</span></div>
                    <div class="row"><span>Change</span><span>${escapeHtml(formatCurrency(sale.change_amount ?? sale.changeAmount))}</span></div>
                    ${sale.notes ? `<hr /><div class="void">${escapeHtml(sale.notes)}</div>` : ''}
                    <hr />
                    <p class="center">Thank you for your purchase!</p>
                </div>
                <script>window.print(); window.close();</script>
            </body>
        </html>
    `;
};

const SalesPage = () => {
    const { isDark } = useThemeStore();
    const { canAccess } = useAuth();
    const [sales, setSales] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState({ total: 0, page: 1, limit: SALES_PAGE_SIZE, pages: 1 });
    const [selectedSale, setSelectedSale] = useState(null);
    const [storeInfo, setStoreInfo] = useState(null);
    const [loadingSaleDetails, setLoadingSaleDetails] = useState(false);
    const canVoidSales = canAccess(['Admin', 'Manager']);

    const fetchSales = useCallback(async (nextPage, searchTerm) => {
        try {
            setLoading(true);
            const response = await posService.getSales({
                page: nextPage,
                limit: SALES_PAGE_SIZE,
                search: searchTerm.trim() || undefined,
            });
            setSales(response.data.data);
            setPagination(response.data.pagination || { total: response.data.data.length, page: nextPage, limit: SALES_PAGE_SIZE, pages: 1 });
        } catch (error) {
            toast.error('Failed to load sales');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchSales(page, search);
    }, [fetchSales, page, search]);

    useEffect(() => {
        let cancelled = false;

        const loadStoreInfo = async () => {
            try {
                const response = await storeService.getStoreInfo();

                if (!cancelled) {
                    setStoreInfo(response.data.data);
                }
            } catch (_error) {
                if (!cancelled) {
                    setStoreInfo(null);
                }
            }
        };

        loadStoreInfo();

        return () => {
            cancelled = true;
        };
    }, []);

    const openSaleDetails = async (sale) => {
        setSelectedSale({ ...sale, items: null });
        setLoadingSaleDetails(true);

        try {
            const response = await posService.getSale(sale.id);
            setSelectedSale(response.data.data);
        } catch (error) {
            setSelectedSale({ ...sale, items: [] });
            toast.error('Failed to load sale details');
        } finally {
            setLoadingSaleDetails(false);
        }
    };

    const handleVoidSale = async (sale) => {
        const reason = window.prompt(`Void sale ${sale.transaction_id}? Enter a reason:`);

        if (reason === null) {
            return;
        }

        if (!reason.trim()) {
            toast.error('Void reason is required');
            return;
        }

        try {
            const response = await posService.voidSale(sale.id, { reason });
            toast.success('Sale voided');
            setSales((currentSales) =>
                currentSales.map((currentSale) =>
                    currentSale.id === sale.id
                        ? { ...currentSale, status: 'VOIDED', notes: response.data.data?.notes || currentSale.notes }
                        : currentSale
                )
            );
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to void sale');
        }
    };

    const handlePrintSale = () => {
        if (!selectedSale || loadingSaleDetails) {
            return;
        }

        const printWindow = window.open('', '_blank', 'width=720,height=900');

        if (!printWindow) {
            toast.error('Popup blocked. Allow popups to print sales.');
            return;
        }

        printWindow.document.write(buildReceiptMarkup(selectedSale, storeInfo));
        printWindow.document.close();
    };

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
                <h1 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Sales History</h1>
                <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>View all sales transactions</p>
            </div>

            <Input
                placeholder="Search by transaction ID..."
                value={search}
                onChange={(e) => {
                    setSearch(e.target.value.toUpperCase());
                    setPage(1);
                }}
                isDark={isDark}
            />

            <Card isDark={isDark}>
                {sales.length === 0 ? (
                    <p className={`text-center py-8 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        No sales found
                    </p>
                ) : (
                    <Table>
                            <thead>
                                <tr className={`border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                                    <th className={`text-left py-3 px-4 font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                        Transaction ID
                                    </th>
                                    <th className={`text-left py-3 px-4 font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                        Date
                                    </th>
                                    <th className={`text-right py-3 px-4 font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                        Amount
                                    </th>
                                    <th className={`text-center py-3 px-4 font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                        Status
                                    </th>
                                    <th className={`text-center py-3 px-4 font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {sales.map((sale) => (
                                    <tr key={sale.id} className={`border-b ${isDark ? 'border-gray-700 hover:bg-gray-700' : 'border-gray-200 hover:bg-gray-50'}`}>
                                        <td className={`py-3 px-4 font-mono ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
                                            {sale.transaction_id}
                                        </td>
                                        <td className={`py-3 px-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                            {formatDate(sale.created_at)}
                                        </td>
                                        <td className={`py-3 px-4 text-right font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                            {formatCurrency(sale.total_amount)}
                                        </td>
                                        <td className="py-3 px-4 text-center">
                                            <Badge variant={sale.status === 'COMPLETED' ? 'success' : 'danger'}>
                                                {sale.status}
                                            </Badge>
                                        </td>
                                        <td className="py-3 px-4 text-center">
                                            <div className="flex flex-wrap justify-center gap-2">
                                                <Button
                                                    size="sm"
                                                    variant="secondary"
                                                    onClick={() => openSaleDetails(sale)}
                                                    className="flex items-center gap-1"
                                                >
                                                    <FiEye size={14} /> View
                                                </Button>
                                                {canVoidSales && sale.status === 'COMPLETED' && (
                                                    <Button
                                                        size="sm"
                                                        variant="danger"
                                                        onClick={() => handleVoidSale(sale)}
                                                        className="flex items-center gap-1"
                                                    >
                                                        <FiXCircle size={14} /> Void
                                                    </Button>
                                                )}
                                            </div>
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
                    pageSize={SALES_PAGE_SIZE}
                    onPageChange={setPage}
                    isDark={isDark}
                    itemLabel="sales"
                />
            </Card>

            {selectedSale && (
                <Modal isDark={isDark} className="max-w-2xl">
                        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <h3 className={`min-w-0 text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                Sale Details: {selectedSale.transaction_id ?? selectedSale.transactionId}
                            </h3>
                            <div className="flex gap-2">
                                <Button
                                    size="sm"
                                    variant="secondary"
                                    onClick={handlePrintSale}
                                    disabled={loadingSaleDetails}
                                >
                                    <FiPrinter /> Print
                                </Button>
                                <Button
                                    size="sm"
                                    variant="secondary"
                                    onClick={() => setSelectedSale(null)}
                                >
                                    Close
                                </Button>
                            </div>
                        </div>

                        <div className={`space-y-4 border-t pt-4 ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                            <div className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
                                <div>
                                    <p className={`font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Status</p>
                                    <Badge variant={selectedSale.status === 'COMPLETED' ? 'success' : 'danger'}>
                                        {selectedSale.status}
                                    </Badge>
                                </div>
                                <div>
                                    <p className={`font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Date</p>
                                    <p className={isDark ? 'text-white' : 'text-gray-900'}>
                                        {formatDate(selectedSale.created_at ?? selectedSale.createdAt)}
                                    </p>
                                </div>
                                <div>
                                    <p className={`font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Payment Method</p>
                                    <p className={isDark ? 'text-white' : 'text-gray-900'}>
                                        {formatPaymentMethodLabel(selectedSale.payment_method ?? selectedSale.paymentMethod)}
                                    </p>
                                </div>
                            </div>

                            {(selectedSale.status === 'VOIDED' || selectedSale.notes) && selectedSale.notes && (
                                <div className={`rounded-lg border p-4 ${
                                    isDark ? 'border-red-900/70 bg-red-950/20 text-red-200' : 'border-red-200 bg-red-50 text-red-800'
                                }`}>
                                    <p className="mb-2 font-bold">Void Details</p>
                                    <p className="whitespace-pre-wrap text-sm">{selectedSale.notes}</p>
                                </div>
                            )}

                            <div className={`border-t pt-4 ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                                <p className={`font-bold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>Items</p>
                                {loadingSaleDetails ? (
                                    <div className="py-6">
                                        <LoadingSpinner />
                                    </div>
                                ) : selectedSale.items?.length ? (
                                    <div className="space-y-3">
                                        {selectedSale.items.map((item) => (
                                            <div
                                                key={item.id ?? `${item.product_id}-${item.product_name}`}
                                                className={`flex flex-col gap-2 rounded-lg px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4 ${
                                                    isDark ? 'bg-gray-700' : 'bg-gray-100'
                                                }`}
                                            >
                                                <div>
                                                    <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                                        {item.product_name ?? item.name}
                                                    </p>
                                                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                                        {item.quantity} x {formatCurrency(item.unit_price ?? item.unitPrice)}
                                                    </p>
                                                </div>
                                                <p className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                                    {formatCurrency(item.line_total ?? item.lineTotal)}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>
                                        No items found for this sale.
                                    </p>
                                )}
                            </div>

                            <div className={`border-t pt-4 ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Subtotal:</span>
                                        <span className={isDark ? 'text-white' : 'text-gray-900'}>
                                            {formatCurrency(selectedSale.subtotal)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Discount:</span>
                                        <span className={isDark ? 'text-white' : 'text-gray-900'}>
                                            -{formatCurrency(selectedSale.discount_amount ?? selectedSale.discountAmount)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Tax:</span>
                                        <span className={isDark ? 'text-white' : 'text-gray-900'}>
                                            {formatCurrency(selectedSale.tax_amount ?? selectedSale.taxAmount)}
                                        </span>
                                    </div>
                                    <div className={`flex justify-between font-bold border-t pt-2 ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                                        <span className={isDark ? 'text-white' : 'text-gray-900'}>Total:</span>
                                        <span className={isDark ? 'text-white' : 'text-gray-900'}>
                                            {formatCurrency(selectedSale.total_amount ?? selectedSale.totalAmount)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Paid:</span>
                                        <span className={isDark ? 'text-white' : 'text-gray-900'}>
                                            {formatCurrency(selectedSale.amount_paid ?? selectedSale.amountPaid)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-green-600 font-bold">
                                        <span>Change:</span>
                                        <span>{formatCurrency(selectedSale.change_amount ?? selectedSale.changeAmount)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                </Modal>
            )}
        </div>
    );
};

export default SalesPage;
