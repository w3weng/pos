import React from 'react';
import { FiMinus, FiPlus, FiTrash2 } from 'react-icons/fi';
import { Button } from './ui';
import { formatCurrency, resolveImageUrl } from '../utils/helpers';

export const ProductCard = ({ product, isDark = false, isAvailable = true, onAdd }) => (
    <article
        className={`group flex min-h-[11.5rem] flex-col overflow-hidden rounded-xl border shadow-sm transition-colors duration-150 ${
            isDark ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-white'
        } ${isAvailable ? 'cursor-pointer hover:border-blue-300 hover:shadow-md' : 'opacity-60'}`}
    >
        <button
            type="button"
            onClick={isAvailable ? onAdd : undefined}
            disabled={!isAvailable}
            className="flex flex-1 flex-col text-left disabled:cursor-not-allowed"
        >
            <div className={`h-24 w-full ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`}>
                {product.image_url ? (
                    <img
                        src={resolveImageUrl(product.image_url)}
                        alt={product.name}
                        className="h-full w-full object-cover"
                    />
                ) : (
                    <div className={`flex h-full items-center justify-center text-xs font-bold uppercase tracking-wide ${
                        isDark ? 'text-slate-500' : 'text-slate-400'
                    }`}>
                        No Image
                    </div>
                )}
            </div>

            <div className="flex flex-1 flex-col gap-2 p-3">
                <div className="min-w-0">
                    <h3 className={`line-clamp-2 text-sm font-black leading-snug ${
                        isDark ? 'text-white' : 'text-slate-950'
                    }`}>
                        {product.name}
                    </h3>
                    <p className={`mt-1 truncate text-xs font-semibold ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
                        {product.sku || 'No SKU'}
                    </p>
                </div>

                <div className="mt-auto flex items-end justify-between gap-2">
                    <p className="text-lg font-black text-emerald-600">
                        {formatCurrency(product.selling_price)}
                    </p>
                    {!isAvailable && (
                        <span className={`rounded-full px-2 py-1 text-xs font-black ${
                            isDark ? 'bg-amber-950 text-amber-300' : 'bg-amber-100 text-amber-700'
                        }`}>
                            Off
                        </span>
                    )}
                </div>
            </div>
        </button>
    </article>
);

export const CartItem = ({ item, isDark = false, onDecrease, onIncrease, onQuantityChange, onRemove }) => (
    <article className={`rounded-xl border p-2.5 ${isDark ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-white'}`}>
        <div className="mb-1.5 flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
                <h4 className={`truncate text-sm font-black ${isDark ? 'text-white' : 'text-slate-950'}`}>
                    {item.name}
                </h4>
                <p className={`text-xs font-semibold ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
                    {formatCurrency(item.unitPrice)}
                </p>
            </div>
            <Button type="button" size="icon" variant="danger" className="h-8 w-8 rounded-lg" onClick={onRemove}>
                <FiTrash2 size={16} />
            </Button>
        </div>

        <div className="flex items-center justify-between gap-3">
            <div className="flex shrink-0 items-center gap-2">
                <Button type="button" size="icon" variant="secondary" className="h-8 w-8 rounded-lg" onClick={onDecrease}>
                    <FiMinus size={15} />
                </Button>
                <input
                    type="number"
                    min="1"
                    max="999"
                    value={item.quantity}
                    onChange={onQuantityChange}
                    className={`h-8 w-14 rounded-lg border px-2 text-center text-sm font-black ${
                        isDark
                            ? 'border-slate-700 bg-slate-800 text-white'
                            : 'border-slate-300 bg-white text-slate-950'
                    }`}
                />
                <Button type="button" size="icon" variant="secondary" className="h-8 w-8 rounded-lg" onClick={onIncrease}>
                    <FiPlus size={15} />
                </Button>
            </div>
            <p className={`shrink-0 text-right text-base font-black ${isDark ? 'text-white' : 'text-slate-950'}`}>
                {formatCurrency(item.quantity * item.unitPrice)}
            </p>
        </div>
    </article>
);
