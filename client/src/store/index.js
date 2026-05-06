import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useAuthStore = create(
    persist(
        (set) => ({
            user: null,
            token: null,
            isAuthenticated: false,

            setUser: (user, token) =>
                set({
                    user,
                    token,
                    isAuthenticated: !!token,
                }),

            logout: () =>
                set({
                    user: null,
                    token: null,
                    isAuthenticated: false,
                }),
        }),
        {
            name: 'auth-store',
        }
    )
);

export const useCartStore = create((set) => ({
    items: [],
    discount: 0,
    discountPercent: 0,
    taxRate: 0,

    addItem: (item) =>
        set((state) => {
            const existing = state.items.find((i) => i.productId === item.productId);
            if (existing) {
                return {
                    items: state.items.map((i) =>
                        i.productId === item.productId
                            ? { ...i, quantity: i.quantity + item.quantity }
                            : i
                    ),
                };
            }
            return { items: [...state.items, item] };
        }),

    updateItem: (productId, updates) =>
        set((state) => ({
            items: state.items.map((i) =>
                i.productId === productId ? { ...i, ...updates } : i
            ),
        })),

    removeItem: (productId) =>
        set((state) => ({
            items: state.items.filter((i) => i.productId !== productId),
        })),

    setDiscount: (discount, discountPercent) =>
        set({ discount, discountPercent }),

    clearCart: () =>
        set({ items: [], discount: 0, discountPercent: 0 }),

    getTotal: (items, discount) => {
        const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
        const finalDiscount = discount || 0;
        return subtotal - finalDiscount;
    },
}));

export const useThemeStore = create(
    persist(
        (set) => ({
            isDark: false,
            toggleTheme: () => set((state) => ({ isDark: !state.isDark })),
        }),
        {
            name: 'theme-store',
        }
    )
);
