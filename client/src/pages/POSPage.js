import React, { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { Card, Button, Input, Modal } from '../components/ui';
import { CartItem, ProductCard } from '../components/pos';
import { posService, storeService } from '../services/api';
import { useCartStore, useThemeStore } from '../store/index';
import { calculateChange, formatCurrency, formatDate } from '../utils/helpers';

const PAYMENT_METHOD_OPTIONS = [
    { value: 'CASH', label: 'Cash' },
    { value: 'GCASH', label: 'GCash' },
    { value: 'MAYA', label: 'Maya' },
    { value: 'BANK_TRANSFER', label: 'Bank Transfer' },
    { value: 'QR', label: 'QR' },
];

const MAX_CART_ITEM_QUANTITY = 999;

const createInitialPaymentData = () => ({
    amountPaid: 0,
    discountPercent: 0,
    paymentMethod: 'CASH',
    notes: '',
});

const fetchPosProducts = async (search) => {
    const response = await posService.getProducts({ search });
    return response.data.data;
};

const normalizeDiscountPercent = (value) => {
    const parsedValue = Number(value);

    if (!Number.isFinite(parsedValue)) {
        return 0;
    }

    return Math.min(100, Math.max(0, parsedValue));
};

const normalizeReceiptItems = (items = []) =>
    (Array.isArray(items) ? items : []).map((item) => {
        const quantity = Number(item.quantity) || 0;
        const unitPrice = Number(item.unitPrice ?? item.unit_price) || 0;
        const discountPerItem = Number(item.discountPerItem ?? item.discount_per_item) || 0;
        const fallbackLineTotal = quantity * unitPrice - discountPerItem;

        return {
            productId: item.productId ?? item.product_id,
            name: item.name ?? item.product_name ?? 'Item',
            sku: item.sku ?? '',
            quantity,
            unitPrice,
            lineTotal: Number(item.lineTotal ?? item.line_total) || fallbackLineTotal,
        };
    });

const normalizeCompletedSale = (sale, fallbackItems = []) => ({
    id: sale.id,
    transactionId: sale.transactionId ?? sale.transaction_id,
    createdAt: sale.createdAt ?? sale.created_at ?? new Date().toISOString(),
    paymentMethod: sale.paymentMethod ?? sale.payment_method ?? 'CASH',
    subtotal: Number(sale.subtotal) || 0,
    discountAmount: Number(sale.discountAmount ?? sale.discount_amount) || 0,
    discountPercent: Number(sale.discountPercent ?? sale.discount_percent) || 0,
    taxAmount: Number(sale.taxAmount ?? sale.tax_amount) || 0,
    totalAmount: Number(sale.totalAmount ?? sale.total_amount) || 0,
    amountPaid: Number(sale.amountPaid ?? sale.amount_paid) || 0,
    changeAmount: Number(sale.changeAmount ?? sale.change_amount) || 0,
    notes: sale.notes ?? '',
    items: normalizeReceiptItems(Array.isArray(sale.items) ? sale.items : fallbackItems),
});

const formatPaymentMethodLabel = (value) =>
    PAYMENT_METHOD_OPTIONS.find((option) => option.value === value)?.label
    ?? String(value || 'CASH')
        .replace(/_/g, ' ')
        .toLowerCase()
        .replace(/\b\w/g, (character) => character.toUpperCase());

const createCheckoutRequestId = () =>
    (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function')
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

const isProductAvailable = (product) => Number(product.is_active ?? 1) === 1;

const buildReceiptMarkup = (sale, storeInfo) => `
    <div style="width: 80mm; font-family: monospace; font-size: 12px; line-height: 1.4;">
        <div style="text-align: center; margin-bottom: 10px;">
            <h2 style="margin: 5px 0;">${storeInfo?.name || 'POS PRO'}</h2>
            <p style="margin: 2px 0;">OFFICIAL RECEIPT</p>
            ${storeInfo?.address ? `<p style="margin: 2px 0;">${storeInfo.address}</p>` : ''}
            ${storeInfo?.phone ? `<p style="margin: 2px 0;">${storeInfo.phone}</p>` : ''}
            <p style="margin: 2px 0;">Transaction ID: ${sale.transactionId}</p>
            <p style="margin: 2px 0;">${new Date(sale.createdAt).toLocaleString()}</p>
            <p style="margin: 2px 0;">Payment: ${formatPaymentMethodLabel(sale.paymentMethod)}</p>
        </div>
        <hr />
        <table style="width: 100%; margin: 10px 0;">
            <tr>
                <td>ITEM</td>
                <td style="text-align: right;">QTY</td>
                <td style="text-align: right;">TOTAL</td>
            </tr>
            ${sale.items
                .map(
                    (item) => `
                        <tr>
                            <td>${item.name}</td>
                            <td style="text-align: right;">${item.quantity}</td>
                            <td style="text-align: right;">${formatCurrency(item.lineTotal)}</td>
                        </tr>
                    `
                )
                .join('')}
        </table>
        <hr />
        <div style="margin: 10px 0;">
            <div style="display: flex; justify-content: space-between;">
                <span>Subtotal:</span>
                <span>${formatCurrency(sale.subtotal)}</span>
            </div>
            ${
                sale.discountAmount > 0
                    ? `
                        <div style="display: flex; justify-content: space-between;">
                            <span>Discount${sale.discountPercent > 0 ? ` (${sale.discountPercent}%)` : ''}:</span>
                            <span>-${formatCurrency(sale.discountAmount)}</span>
                        </div>
                    `
                    : ''
            }
            ${
                sale.taxAmount > 0
                    ? `
                        <div style="display: flex; justify-content: space-between;">
                            <span>Tax:</span>
                            <span>${formatCurrency(sale.taxAmount)}</span>
                        </div>
                    `
                    : ''
            }
            <div style="display: flex; justify-content: space-between; font-weight: bold; border-top: 1px solid #000; margin-top: 5px; padding-top: 5px;">
                <span>Total:</span>
                <span>${formatCurrency(sale.totalAmount)}</span>
            </div>
            <div style="display: flex; justify-content: space-between;">
                <span>Paid:</span>
                <span>${formatCurrency(sale.amountPaid)}</span>
            </div>
            <div style="display: flex; justify-content: space-between; color: green; font-weight: bold;">
                <span>Change:</span>
                <span>${formatCurrency(sale.changeAmount)}</span>
            </div>
        </div>
        <hr />
        <p style="text-align: center; margin-top: 10px; font-size: 10px;">Thank you for your purchase!</p>
    </div>
`;

const POSPage = () => {
    const { isDark } = useThemeStore();
    const cart = useCartStore();
    const [products, setProducts] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [paymentData, setPaymentData] = useState(createInitialPaymentData);
    const [processing, setProcessing] = useState(false);
    const [loadingProducts, setLoadingProducts] = useState(true);
    const [isCheckoutReviewOpen, setIsCheckoutReviewOpen] = useState(false);
    const [completedSale, setCompletedSale] = useState(null);
    const [storeInfo, setStoreInfo] = useState(null);
    const [checkoutRequestId, setCheckoutRequestId] = useState('');
    const searchInputRef = useRef(null);
    const checkoutInFlightRef = useRef(false);
    const isReceiptOpen = Boolean(completedSale);

    useEffect(() => {
        if (completedSale) {
            setIsCheckoutReviewOpen(false);
        }
    }, [completedSale]);

    useEffect(() => {
        let cancelled = false;

        const fetchStoreInfo = async () => {
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

        fetchStoreInfo();

        return () => {
            cancelled = true;
        };
    }, []);

    useEffect(() => {
        let cancelled = false;
        let hasReportedError = false;

        const fetchProducts = async () => {
            try {
                const nextProducts = await fetchPosProducts(searchQuery);

                if (cancelled) {
                    return;
                }

                setProducts(nextProducts);
                hasReportedError = false;
            } catch (error) {
                if (!cancelled && !hasReportedError) {
                    toast.error('Failed to load products');
                    hasReportedError = true;
                }
            } finally {
                if (!cancelled) {
                    setLoadingProducts(false);
                }
            }
        };

        const refreshVisibleProducts = () => {
            if (document.visibilityState === 'visible') {
                fetchProducts();
            }
        };

        const debounceTimer = setTimeout(fetchProducts, 300);
        const pollTimer = setInterval(fetchProducts, 5000);

        document.addEventListener('visibilitychange', refreshVisibleProducts);
        window.addEventListener('focus', fetchProducts);

        return () => {
            cancelled = true;
            clearTimeout(debounceTimer);
            clearInterval(pollTimer);
            document.removeEventListener('visibilitychange', refreshVisibleProducts);
            window.removeEventListener('focus', fetchProducts);
        };
    }, [searchQuery]);

    useEffect(() => {
        const handleKeyboardShortcuts = (event) => {
            const target = event.target;
            const isTyping =
                target instanceof HTMLInputElement ||
                target instanceof HTMLTextAreaElement ||
                target instanceof HTMLSelectElement;

            if (event.key === '/' && !isTyping) {
                event.preventDefault();
                searchInputRef.current?.focus();
            }

            if (event.key === 'F2') {
                event.preventDefault();
                handleOpenCheckoutReview();
            }
        };

        window.addEventListener('keydown', handleKeyboardShortcuts);

        return () => {
            window.removeEventListener('keydown', handleKeyboardShortcuts);
        };
    });

    const addToCart = (product) => {
        cart.addItem({
            productId: product.id,
            name: product.name,
            sku: product.sku,
            unitPrice: product.selling_price,
            quantity: 1,
            discountPerItem: 0,
        });
        toast.success(`${product.name} added to cart`);
    };

    const subtotal = cart.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
    const discountPercent = normalizeDiscountPercent(paymentData.discountPercent);
    const totalDiscount = (subtotal * discountPercent) / 100;
    const total = Math.max(0, subtotal - totalDiscount);
    const change = calculateChange(paymentData.amountPaid, total);

    const validateCheckout = () => {
        if (cart.items.length === 0) {
            toast.error('Cart is empty');
            return false;
        }

        if (paymentData.amountPaid < total) {
            toast.error('Insufficient payment amount');
            return false;
        }

        return true;
    };

    const refreshProductGrid = async () => {
        try {
            const nextProducts = await fetchPosProducts('');
            setProducts(nextProducts);
        } catch (error) {
            toast.error('Product refresh failed');
        }
    };

    const handleOpenCheckoutReview = () => {
        if (processing) {
            return;
        }

        if (!validateCheckout()) {
            return;
        }

        setCheckoutRequestId(createCheckoutRequestId());
        setIsCheckoutReviewOpen(true);
    };

    const handleCheckout = async () => {
        if (checkoutInFlightRef.current) {
            return;
        }

        if (!validateCheckout()) {
            return;
        }

        const requestId = checkoutRequestId || createCheckoutRequestId();
        const cartSnapshot = cart.items.map((item) => ({ ...item }));
        const shouldRestoreReview = isCheckoutReviewOpen;
        checkoutInFlightRef.current = true;
        setCheckoutRequestId(requestId);
        setIsCheckoutReviewOpen(false);
        setProcessing(true);

        try {
            const response = await posService.createSale({
                items: cartSnapshot.map((item) => ({
                    productId: item.productId,
                    quantity: item.quantity,
                    unitPrice: item.unitPrice,
                    discountPerItem: item.discountPerItem || 0,
                })),
                discountAmount: totalDiscount,
                discountPercent,
                amountPaid: paymentData.amountPaid,
                paymentMethod: paymentData.paymentMethod,
                notes: paymentData.notes,
                requestId,
            });

            if (response.data.success) {
                const immediateCompletedSale = normalizeCompletedSale(response.data.data, cartSnapshot);

                setCompletedSale(immediateCompletedSale);
                toast.success('Sale completed successfully!');
                cart.clearCart();
                setPaymentData(createInitialPaymentData());
                setCheckoutRequestId('');
                setSearchQuery('');
                refreshProductGrid();

                try {
                    const saleResponse = await posService.getSale(response.data.data.id);
                    setCompletedSale(normalizeCompletedSale(saleResponse.data.data, cartSnapshot));
                } catch (error) {
                    toast.error('Sale completed, but receipt details could not be fully refreshed');
                }
            }
        } catch (error) {
            if (shouldRestoreReview) {
                setIsCheckoutReviewOpen(true);
            }
            toast.error(error.response?.data?.message || 'Checkout failed');
        } finally {
            checkoutInFlightRef.current = false;
            setProcessing(false);
        }
    };

    const handlePrintReceipt = (sale) => {
        const printWindow = window.open('', '', 'width=400,height=600');

        if (!printWindow) {
            toast.error('Allow pop-ups to print the receipt');
            return;
        }

        printWindow.document.write(buildReceiptMarkup(sale, storeInfo));
        printWindow.document.close();
        printWindow.print();
    };

    const handleTakeAnotherCustomer = async () => {
        setCompletedSale(null);
        setCheckoutRequestId('');
        setSearchQuery('');
        await refreshProductGrid();
    };

    return (
        <div className={`flex min-h-full w-full flex-col gap-4 overflow-x-hidden pb-[30rem] pt-3 sm:pt-6 xl:h-full xl:min-h-0 xl:flex-row xl:overflow-hidden xl:pb-6 ${isDark ? 'bg-slate-950' : 'bg-slate-100'}`}>
            <section className="flex min-w-0 flex-1 flex-col gap-4 xl:min-h-0">
                <div className="grid grid-cols-1 gap-3 xl:grid-cols-[1fr_auto] xl:items-center">
                    <div>
                        <h1 className={`text-2xl font-black tracking-tight sm:text-3xl ${isDark ? 'text-white' : 'text-slate-950'}`}>
                            Point of Sale
                        </h1>
                        <p className={`text-sm font-semibold ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
                            Quick add products, review cart, and complete checkout.
                        </p>
                    </div>
                </div>

                <Input
                    ref={searchInputRef}
                    placeholder="Search products by name or barcode..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    isDark={isDark}
                    inputClassName="text-lg font-semibold"
                />

                <div className="min-h-0 flex-1 overflow-y-auto pr-1">
                    {loadingProducts ? (
                        <div className={`rounded-xl border p-8 text-center font-semibold ${isDark ? 'border-slate-800 text-slate-400' : 'border-slate-200 bg-white text-slate-600'}`}>
                            Loading products...
                        </div>
                    ) : products.length === 0 ? (
                        <div className={`rounded-xl border p-8 text-center font-semibold ${isDark ? 'border-slate-800 text-slate-400' : 'border-slate-200 bg-white text-slate-600'}`}>
                            No products found.
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 2xl:grid-cols-5">
                            {products.map((product) => (
                                <ProductCard
                                    key={product.id}
                                    product={product}
                                    isDark={isDark}
                                    isAvailable={isProductAvailable(product)}
                                    onAdd={() => addToCart(product)}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </section>

            <aside className="fixed inset-x-0 bottom-0 z-30 flex max-h-[calc(100dvh-1rem)] flex-col px-3 pb-3 xl:static xl:z-0 xl:h-full xl:min-h-0 xl:w-[27rem] xl:min-w-[27rem] xl:px-0 xl:pb-0">
                <Card isDark={isDark} className="flex min-h-0 flex-col overflow-hidden rounded-t-2xl shadow-2xl xl:h-full xl:rounded-xl xl:shadow-sm">
                    <div className="mb-3 flex shrink-0 items-center justify-between gap-3">
                        <div>
                            <h2 className={`text-lg font-black ${isDark ? 'text-white' : 'text-slate-950'}`}>
                                Cart
                            </h2>
                        </div>
                        {cart.items.length > 0 && (
                            <Button size="sm" variant="secondary" onClick={() => cart.clearCart()}>
                                Clear
                            </Button>
                        )}
                    </div>

                    {cart.items.length === 0 ? (
                        <p className={`flex min-h-[10rem] shrink items-center justify-center rounded-xl border border-dashed text-center text-sm font-semibold ${isDark ? 'border-slate-800 text-slate-500' : 'border-slate-300 text-slate-500'}`}>
                            Cart is empty
                        </p>
                    ) : (
                        <div className="h-[17.5rem] min-h-0 shrink-0 space-y-2 overflow-y-auto py-1 pr-1">
                            {cart.items.map((item) => (
                                <CartItem
                                    key={item.productId}
                                    item={item}
                                    isDark={isDark}
                                    onRemove={() => cart.removeItem(item.productId)}
                                    onDecrease={() =>
                                        cart.updateItem(item.productId, {
                                            quantity: Math.max(1, item.quantity - 1),
                                        })
                                    }
                                    onIncrease={() => {
                                        if (item.quantity >= MAX_CART_ITEM_QUANTITY) {
                                            toast.error(`Maximum quantity is ${MAX_CART_ITEM_QUANTITY}`);
                                            return;
                                        }

                                        cart.updateItem(item.productId, {
                                            quantity: item.quantity + 1,
                                        });
                                    }}
                                    onQuantityChange={(event) =>
                                        cart.updateItem(item.productId, {
                                            quantity: Math.min(
                                                MAX_CART_ITEM_QUANTITY,
                                                Math.max(1, parseInt(event.target.value, 10) || 1)
                                            ),
                                        })
                                    }
                                />
                            ))}
                        </div>
                    )}

                    <div className={`mt-3 shrink-0 border-t pt-3 ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
                        <div className="mb-3 space-y-2.5 text-sm">
                            <div className="flex items-center justify-between gap-3">
                                <span className={isDark ? 'text-slate-400' : 'text-slate-600'}>Subtotal</span>
                                <span className={`font-black ${isDark ? 'text-white' : 'text-slate-950'}`}>
                                    {formatCurrency(subtotal)}
                                </span>
                            </div>

                            <div className="flex items-center justify-between gap-3">
                                <span className={isDark ? 'text-slate-400' : 'text-slate-600'}>Discount</span>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="number"
                                        min="0"
                                        max="100"
                                        step="0.01"
                                        value={paymentData.discountPercent === 0 ? '' : paymentData.discountPercent}
                                        onChange={(e) =>
                                            setPaymentData({
                                                ...paymentData,
                                                discountPercent: normalizeDiscountPercent(e.target.value),
                                            })
                                        }
                                        className={`h-10 w-20 rounded-xl border px-2 text-right font-bold ${
                                            isDark ? 'border-slate-700 bg-slate-800 text-white' : 'border-slate-300 bg-white text-slate-950'
                                        }`}
                                        placeholder="0"
                                    />
                                    <span className={`font-bold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>%</span>
                                </div>
                            </div>

                            {totalDiscount > 0 && (
                                <div className="flex items-center justify-between gap-3">
                                    <span className={isDark ? 'text-slate-400' : 'text-slate-600'}>Discount Value</span>
                                    <span className={`font-bold ${isDark ? 'text-white' : 'text-slate-950'}`}>
                                        -{formatCurrency(totalDiscount)}
                                    </span>
                                </div>
                            )}

                            <div className={`rounded-xl p-2.5 ${isDark ? 'bg-slate-800' : 'bg-slate-50'}`}>
                                <div className="flex items-center justify-between gap-3">
                                    <span className={`text-base font-black ${isDark ? 'text-white' : 'text-slate-950'}`}>Total</span>
                                    <span className="text-2xl font-black text-emerald-600">{formatCurrency(total)}</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                                <div className="space-y-1.5">
                                    <label className={`text-sm font-bold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                                        Payment
                                    </label>
                                    <select
                                        value={paymentData.paymentMethod}
                                        onChange={(e) =>
                                            setPaymentData({
                                                ...paymentData,
                                                paymentMethod: e.target.value,
                                            })
                                        }
                                        className={`min-h-[2.625rem] w-full rounded-xl border px-3 py-2 font-bold ${
                                            isDark ? 'border-slate-700 bg-slate-800 text-white' : 'border-slate-300 bg-white text-slate-950'
                                        }`}
                                        required
                                    >
                                        {PAYMENT_METHOD_OPTIONS.map((option) => (
                                            <option key={option.value} value={option.value}>
                                                {option.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="space-y-1.5">
                                    <label className={`text-sm font-bold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                                        Paid
                                    </label>
                                    <input
                                        type="number"
                                        value={paymentData.amountPaid === 0 ? '' : paymentData.amountPaid}
                                        onChange={(e) =>
                                            setPaymentData({
                                                ...paymentData,
                                                amountPaid: parseFloat(e.target.value) || 0,
                                            })
                                        }
                                        className={`min-h-[2.625rem] w-full rounded-xl border px-3 py-2 text-lg font-black ${
                                            isDark ? 'border-slate-700 bg-slate-800 text-white' : 'border-slate-300 bg-white text-slate-950'
                                        }`}
                                        placeholder="0.00"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center justify-between gap-3">
                                <span className={isDark ? 'text-slate-400' : 'text-slate-600'}>Change</span>
                                <span className="text-lg font-black text-blue-600">{formatCurrency(change)}</span>
                            </div>
                        </div>

                        <Button
                            variant="success"
                            size="lg"
                            className="w-full"
                            disabled={cart.items.length === 0 || processing}
                            onClick={handleOpenCheckoutReview}
                        >
                            {processing ? 'Processing...' : 'Complete Sale'}
                        </Button>
                    </div>
                </Card>
            </aside>

            {isCheckoutReviewOpen && !isReceiptOpen && (
                <Modal isDark={isDark} className="max-w-2xl">
                        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                            <div className="min-w-0">
                                <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                    Confirm Sale
                                </h3>
                                <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                    Review the items first so you can repeat them back to the customer before completing the sale.
                                </p>
                            </div>
                            <Button
                                variant="secondary"
                                size="sm"
                                disabled={processing}
                                onClick={() => {
                                    setCheckoutRequestId('');
                                    setIsCheckoutReviewOpen(false);
                                }}
                            >
                                Back
                            </Button>
                        </div>

                        <div className={`rounded-lg border ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                            {cart.items.map((item) => (
                                <div
                                    key={item.productId}
                                    className={`flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4 border-b last:border-b-0 ${
                                        isDark ? 'border-gray-700' : 'border-gray-200'
                                    }`}
                                >
                                    <div>
                                        <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                            {item.name}
                                        </p>
                                        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                            {item.quantity} x {formatCurrency(item.unitPrice)}
                                        </p>
                                    </div>
                                    <p className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                        {formatCurrency(item.quantity * item.unitPrice)}
                                    </p>
                                </div>
                            ))}
                        </div>

                        <div className={`mt-4 space-y-2 text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                            <div className="flex items-center justify-between gap-3">
                                <span>Subtotal</span>
                                <span>{formatCurrency(subtotal)}</span>
                            </div>
                            <div className="flex items-center justify-between gap-3">
                                <span>Discount</span>
                                <span>-{formatCurrency(totalDiscount)}</span>
                            </div>
                            <div className="flex items-center justify-between gap-3">
                                <span>Total Due</span>
                                <span className="font-semibold">{formatCurrency(total)}</span>
                            </div>
                            <div className="flex items-center justify-between gap-3">
                                <span>Payment Method</span>
                                <span>{formatPaymentMethodLabel(paymentData.paymentMethod)}</span>
                            </div>
                            <div className="flex items-center justify-between gap-3">
                                <span>Amount Paid</span>
                                <span>{formatCurrency(paymentData.amountPaid)}</span>
                            </div>
                            <div className="flex items-center justify-between gap-3">
                                <span>Change</span>
                                <span className="font-semibold text-blue-600">{formatCurrency(change)}</span>
                            </div>
                        </div>

                        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 mt-6">
                            <Button
                                variant="secondary"
                                disabled={processing}
                                onClick={() => {
                                    setCheckoutRequestId('');
                                    setIsCheckoutReviewOpen(false);
                                }}
                            >
                                Edit Order
                            </Button>
                            <Button
                                variant="success"
                                disabled={processing}
                                onClick={handleCheckout}
                            >
                                {processing ? 'Confirming...' : 'Confirm'}
                            </Button>
                        </div>
                </Modal>
            )}

            {isReceiptOpen && (
                <Modal isDark={isDark} className="max-w-2xl">
                        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                            <div className="min-w-0">
                                <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                    Sale Details: {completedSale.transactionId}
                                </h3>
                                <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                    The sale is completed. Review the details or print the receipt before moving to the next customer.
                                </p>
                            </div>
                        </div>

                        <div className={`space-y-4 border-t pt-4 ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                            <div className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
                                <div>
                                    <p className={`font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                        Transaction ID
                                    </p>
                                    <p className={`font-mono ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                        {completedSale.transactionId}
                                    </p>
                                </div>
                                <div>
                                    <p className={`font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                        Date
                                    </p>
                                    <p className={isDark ? 'text-white' : 'text-gray-900'}>
                                        {formatDate(completedSale.createdAt)}
                                    </p>
                                </div>
                                <div>
                                    <p className={`font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                        Payment Method
                                    </p>
                                    <p className={isDark ? 'text-white' : 'text-gray-900'}>
                                        {formatPaymentMethodLabel(completedSale.paymentMethod)}
                                    </p>
                                </div>
                                <div>
                                    <p className={`font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                        Store
                                    </p>
                                    <p className={isDark ? 'text-white' : 'text-gray-900'}>
                                        {storeInfo?.name || 'POS PRO'}
                                    </p>
                                </div>
                            </div>

                            <div className={`border-t pt-4 ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                                <p className={`font-bold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>Items</p>
                                <div className="space-y-3">
                                    {completedSale.items.map((item) => (
                                        <div
                                            key={`${completedSale.id}-${item.productId ?? item.name}`}
                                            className={`flex flex-col gap-2 rounded-lg px-4 py-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4 ${
                                                isDark ? 'bg-gray-700' : 'bg-gray-100'
                                            }`}
                                        >
                                            <div className="flex-1">
                                                <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                                    {item.name}
                                                </p>
                                                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                                    {item.quantity} x {formatCurrency(item.unitPrice)}
                                                </p>
                                            </div>
                                            <p className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                                {formatCurrency(item.lineTotal)}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className={`border-t pt-4 ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                                <div className="space-y-2 text-sm">
                                    <div className="flex items-center justify-between gap-3">
                                        <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Subtotal:</span>
                                        <span className={isDark ? 'text-white' : 'text-gray-900'}>
                                            {formatCurrency(completedSale.subtotal)}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between gap-3">
                                        <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Discount:</span>
                                        <span className={isDark ? 'text-white' : 'text-gray-900'}>
                                            -{formatCurrency(completedSale.discountAmount)}
                                        </span>
                                    </div>
                                    {completedSale.taxAmount > 0 && (
                                        <div className="flex items-center justify-between gap-3">
                                            <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Tax:</span>
                                            <span className={isDark ? 'text-white' : 'text-gray-900'}>
                                                {formatCurrency(completedSale.taxAmount)}
                                            </span>
                                        </div>
                                    )}
                                    <div className={`flex items-center justify-between gap-3 font-bold border-t pt-2 ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                                        <span className={isDark ? 'text-white' : 'text-gray-900'}>Total:</span>
                                        <span className={isDark ? 'text-white' : 'text-gray-900'}>
                                            {formatCurrency(completedSale.totalAmount)}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between gap-3">
                                        <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Paid:</span>
                                        <span className={isDark ? 'text-white' : 'text-gray-900'}>
                                            {formatCurrency(completedSale.amountPaid)}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between gap-3 font-bold text-green-600">
                                        <span>Change:</span>
                                        <span>{formatCurrency(completedSale.changeAmount)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 mt-6">
                            <Button
                                variant="secondary"
                                onClick={() => handlePrintReceipt(completedSale)}
                            >
                                Print Receipt
                            </Button>
                            <Button
                                variant="success"
                                onClick={handleTakeAnotherCustomer}
                            >
                                Take Another Sale
                            </Button>
                        </div>
                </Modal>
            )}
        </div>
    );
};

export default POSPage;
