import React from 'react';

const surfaceStyles = {
    light: 'border-slate-200 bg-white text-slate-900 shadow-sm',
    dark: 'border-slate-700 bg-slate-900 text-slate-100 shadow-black/10',
};

export const Card = ({ children, className = '', isDark = false }) => (
    <section
        className={`min-w-0 rounded-xl border p-4 shadow-sm sm:p-5 ${
            isDark ? surfaceStyles.dark : surfaceStyles.light
        } ${className}`}
    >
        {children}
    </section>
);

export const Button = ({
    variant = 'primary',
    size = 'md',
    className = '',
    disabled = false,
    children,
    ...props
}) => {
    const baseStyles = [
        'inline-flex items-center justify-center gap-2 rounded-xl font-semibold',
        'transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2',
        'disabled:pointer-events-none disabled:opacity-50 whitespace-nowrap active:scale-[0.99]',
    ].join(' ');

    const variants = {
        primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
        secondary: 'bg-slate-100 text-slate-900 hover:bg-slate-200 focus:ring-slate-400 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700',
        outline: 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800',
        ghost: 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 focus:ring-slate-400 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white',
        danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
        success: 'bg-emerald-600 text-white hover:bg-emerald-700 focus:ring-emerald-500',
        warning: 'bg-amber-500 text-slate-950 hover:bg-amber-400 focus:ring-amber-500',
    };

    const sizes = {
        sm: 'min-h-[2.25rem] px-3 py-1.5 text-sm',
        md: 'min-h-[2.75rem] px-4 py-2 text-base',
        lg: 'min-h-[3.25rem] px-5 py-3 text-lg',
        icon: 'h-10 w-10 p-0',
    };

    return (
        <button
            className={`${baseStyles} ${variants[variant] || variants.primary} ${sizes[size] || sizes.md} ${className}`}
            disabled={disabled}
            {...props}
        >
            {children}
        </button>
    );
};

export const Input = React.forwardRef(({ label, error, isDark = false, className = '', inputClassName = '', ...props }, ref) => (
    <div className={className}>
        {label && (
            <label className={`mb-2 block text-sm font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                {label}
            </label>
        )}
        <input
            ref={ref}
            className={`min-h-[2.875rem] w-full rounded-xl border px-4 py-2.5 text-base transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                error
                    ? 'border-red-500'
                    : isDark
                        ? 'border-slate-700 bg-slate-800 text-white placeholder:text-slate-500'
                        : 'border-slate-300 bg-white text-slate-900 placeholder:text-slate-400'
            } ${inputClassName}`}
            {...props}
        />
        {error && <p className="mt-1.5 text-sm font-medium text-red-500">{error}</p>}
    </div>
));

Input.displayName = 'Input';

export const Badge = ({ variant = 'primary', children, className = '' }) => {
    const variants = {
        primary: 'bg-blue-100 text-blue-800',
        success: 'bg-emerald-100 text-emerald-800',
        warning: 'bg-amber-100 text-amber-800',
        danger: 'bg-red-100 text-red-800',
        info: 'bg-slate-100 text-slate-700',
    };

    return (
        <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold ${variants[variant] || variants.info} ${className}`}>
            {children}
        </span>
    );
};

export const Modal = ({ children, isDark = false, className = '' }) => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-[3px]">
        <Card isDark={isDark} className={`max-h-[90dvh] w-full overflow-y-auto shadow-2xl ring-1 ring-black/10 dark:ring-white/10 ${className}`}>
            {children}
        </Card>
    </div>
);

export const Table = ({ children, className = '' }) => (
    <div className={`overflow-x-auto ${className}`}>
        <table className="data-table w-full min-w-[44rem] text-sm">
            {children}
        </table>
    </div>
);

const buildPaginationPages = (currentPage, totalPages) => {
    const pages = [];
    const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);

    for (let page = 1; page <= totalPages; page += 1) {
        const isBoundary = page === 1 || page === totalPages;
        const isNearCurrent = Math.abs(page - safeCurrentPage) <= 1;

        if (isBoundary || isNearCurrent) {
            pages.push(page);
        } else if (pages[pages.length - 1] !== 'ellipsis') {
            pages.push('ellipsis');
        }
    }

    return pages;
};

export const Pagination = ({
    currentPage = 1,
    totalPages = 1,
    totalItems = 0,
    pageSize = 20,
    onPageChange,
    isDark = false,
    itemLabel = 'items',
}) => {
    const safeTotalPages = Math.max(1, Number(totalPages) || 1);
    const safeCurrentPage = Math.min(Math.max(1, Number(currentPage) || 1), safeTotalPages);
    const safePageSize = Math.max(1, Number(pageSize) || 1);
    const startItem = totalItems === 0 ? 0 : (safeCurrentPage - 1) * safePageSize + 1;
    const endItem = Math.min(safeCurrentPage * safePageSize, totalItems);
    const pages = buildPaginationPages(safeCurrentPage, safeTotalPages);

    const buttonClass = (isActive = false) =>
        `inline-flex h-9 min-w-9 items-center justify-center rounded-lg border px-3 text-sm font-bold transition-colors disabled:pointer-events-none disabled:opacity-50 ${
            isActive
                ? 'border-blue-600 bg-blue-600 text-white'
                : isDark
                    ? 'border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800'
                    : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
        }`;

    return (
        <div className={`mt-4 flex flex-col gap-3 border-t pt-4 lg:flex-row lg:items-center lg:justify-between ${
            isDark ? 'border-gray-700' : 'border-gray-200'
        }`}>
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Showing {startItem}-{endItem} of {totalItems} {itemLabel}
            </p>
            <div className="flex flex-wrap items-center gap-2">
                <button
                    type="button"
                    className={buttonClass()}
                    disabled={safeCurrentPage === 1}
                    onClick={() => onPageChange?.(1)}
                >
                    First
                </button>
                <button
                    type="button"
                    className={buttonClass()}
                    disabled={safeCurrentPage === 1}
                    onClick={() => onPageChange?.(safeCurrentPage - 1)}
                >
                    Prev
                </button>
                {pages.map((page, index) =>
                    page === 'ellipsis' ? (
                        <span
                            key={`ellipsis-${index}`}
                            className={`flex h-9 min-w-9 items-center justify-center text-sm font-bold ${
                                isDark ? 'text-slate-500' : 'text-slate-400'
                            }`}
                        >
                            ...
                        </span>
                    ) : (
                        <button
                            key={page}
                            type="button"
                            className={buttonClass(page === safeCurrentPage)}
                            onClick={() => onPageChange?.(page)}
                            aria-current={page === safeCurrentPage ? 'page' : undefined}
                        >
                            {page}
                        </button>
                    )
                )}
                <button
                    type="button"
                    className={buttonClass()}
                    disabled={safeCurrentPage === safeTotalPages}
                    onClick={() => onPageChange?.(safeCurrentPage + 1)}
                >
                    Next
                </button>
                <button
                    type="button"
                    className={buttonClass()}
                    disabled={safeCurrentPage === safeTotalPages}
                    onClick={() => onPageChange?.(safeTotalPages)}
                >
                    Last
                </button>
            </div>
        </div>
    );
};

export const LoadingSpinner = () => (
    <div className="flex items-center justify-center">
        <div className="h-9 w-9 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
    </div>
);
