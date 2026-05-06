import { useAuthStore } from '../store/index';

export const useAuth = () => {
    const { user, token, isAuthenticated, setUser, logout } = useAuthStore();

    const canAccess = (roles) => {
        if (!isAuthenticated || !user) return false;
        return roles.includes(user.role);
    };

    return {
        user,
        token,
        isAuthenticated,
        setUser,
        logout,
        canAccess,
    };
};
