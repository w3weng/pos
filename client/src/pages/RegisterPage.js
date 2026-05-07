import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { authService } from '../services/api';
import toast from 'react-hot-toast';
import { Button, Input, LoadingSpinner } from '../components/ui';
import { useThemeStore } from '../store/index';

const RegisterPage = () => {
    const [formData, setFormData] = useState({
        storeName: '',
        email: '',
        password: '',
        confirmPassword: '',
        phone: '',
    });
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const navigate = useNavigate();
    const { setUser } = useAuth();
    const { isDark } = useThemeStore();

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.storeName.trim()) {
            newErrors.storeName = 'Store name is required';
        }

        if (!formData.email) {
            newErrors.email = 'Email is required';
        }

        if (!formData.password || formData.password.length < 6) {
            newErrors.password = 'Password must be at least 6 characters';
        }

        if (formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = 'Passwords do not match';
        }

        return newErrors;
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        const newErrors = validateForm();

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        setErrors({});
        setLoading(true);

        try {
            const response = await authService.register({
                storeName: formData.storeName,
                email: formData.email,
                password: formData.password,
                phone: formData.phone,
            });

            if (response.data.success) {
                const { user, token } = response.data.data;
                setUser(user, token);
                localStorage.setItem('token', token);
                localStorage.setItem('user', JSON.stringify(user));
                toast.success('Registration successful! Welcome to POS Pro!');
                navigate('/');
            }
        } catch (error) {
            const message = error.response?.data?.message || 'Registration failed. Please try again.';
            toast.error(message);
            setErrors({ submit: message });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div
            className={`flex min-h-[100dvh] items-center justify-center px-4 py-8 sm:px-6 ${
                isDark
                    ? 'bg-slate-950 bg-[radial-gradient(ellipse_120%_80%_at_50%_-20%,rgba(59,130,246,0.14),transparent)]'
                    : 'bg-slate-100 bg-[radial-gradient(ellipse_100%_60%_at_50%_-10%,rgba(59,130,246,0.08),transparent)]'
            }`}
        >
            <div className="w-full max-w-md">
                <div className="mb-6 text-center sm:mb-8">
                    <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-blue-700 text-2xl font-black text-white shadow-lg shadow-blue-600/30">
                        P
                    </div>
                    <h1 className={`mb-2 text-3xl font-black tracking-tight sm:text-4xl ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        POS Pro
                    </h1>
                    <p className={`text-base font-semibold sm:text-lg ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                        Create your store workspace
                    </p>
                </div>

                <div
                    className={`rounded-2xl border p-5 shadow-xl sm:p-8 ${
                        isDark
                            ? 'border-slate-800 bg-slate-900/90 shadow-black/40 backdrop-blur-md'
                            : 'border-slate-200/80 bg-white/95 shadow-slate-200/50 backdrop-blur-md'
                    }`}
                >
                    <h2 className={`mb-6 text-center text-xl font-black sm:text-2xl ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        Get started
                    </h2>

                    {errors.submit && (
                        <div
                            className={`mb-4 break-words rounded-xl border p-4 text-sm font-semibold ${
                                isDark ? 'border-red-500/40 bg-red-950/50 text-red-200' : 'border-red-200 bg-red-50 text-red-800'
                            }`}
                        >
                            {errors.submit}
                        </div>
                    )}

                    <form onSubmit={handleRegister} className="space-y-4">
                        <Input
                            label="Store Name"
                            type="text"
                            name="storeName"
                            placeholder="My Store"
                            value={formData.storeName}
                            onChange={handleChange}
                            error={errors.storeName}
                            isDark={isDark}
                            required
                        />

                        <Input
                            label="Email Address"
                            type="email"
                            name="email"
                            placeholder="you@example.com"
                            value={formData.email}
                            onChange={handleChange}
                            error={errors.email}
                            isDark={isDark}
                            required
                        />

                        <Input
                            label="Password"
                            type="password"
                            name="password"
                            placeholder="Create a password"
                            value={formData.password}
                            onChange={handleChange}
                            error={errors.password}
                            isDark={isDark}
                            required
                        />

                        <Input
                            label="Confirm Password"
                            type="password"
                            name="confirmPassword"
                            placeholder="Confirm your password"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            error={errors.confirmPassword}
                            isDark={isDark}
                            required
                        />

                        <Input
                            label="Phone (Optional)"
                            type="tel"
                            name="phone"
                            placeholder="+1 (555) 000-0000"
                            value={formData.phone}
                            onChange={handleChange}
                            isDark={isDark}
                        />

                        <Button
                            type="submit"
                            variant="primary"
                            size="lg"
                            disabled={loading}
                            className="w-full"
                        >
                            {loading ? (
                                <>
                                    <LoadingSpinner />
                                    <span>Creating account...</span>
                                </>
                            ) : (
                                'Create Account'
                            )}
                        </Button>
                    </form>

                    <p className={`mt-6 text-center text-sm font-semibold ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                        Already have an account?{' '}
                        <Link to="/login" className="font-bold text-blue-600 hover:text-blue-500 dark:text-blue-400">
                            Log in
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default RegisterPage;
