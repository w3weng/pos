import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';

const PrivateRoute = ({ children, roles }) => {
    const { isAuthenticated, canAccess } = useAuth();

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    if (roles && !canAccess(roles)) {
        toast.error('You do not have permission to access this page');
        return <Navigate to="/" replace />;
    }

    return children;
};

export default PrivateRoute;
