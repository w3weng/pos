import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { authService } from '../services/api';
import toast from 'react-hot-toast';
import { Button, Input, LoadingSpinner } from '../components/ui';
import { useThemeStore } from '../store/index';
import { getApiBaseUrl } from '../utils/apiConfig';
import { FiMoon, FiSun } from 'react-icons/fi';

const LoginPage = () => {
    const [login, setLogin] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const navigate = useNavigate();
    const { setUser } = useAuth();
    const { isDark, toggleTheme } = useThemeStore();

    const handleLogin = async (e) => {
        e.preventDefault();
        setErrors({});
        setLoading(true);

        try {
            const response = await authService.login({ login, password });
            if (response.data.success) {
                const { user, token } = response.data.data;
                setUser(user, token);
                localStorage.setItem('token', token);
                localStorage.setItem('user', JSON.stringify(user));
                toast.success('Login successful!');
                navigate('/');
            }
        } catch (error) {
            const message = error.response?.data?.message
                || (
                    !error.response
                        ? `Cannot reach the server at ${getApiBaseUrl()}. Check that port 5000 is reachable from your phone.`
                        : 'Login failed. Please try again.'
                );
            toast.error(message);
            setErrors({ submit: message });
            setPassword('');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={`relative flex min-h-[100dvh] items-center justify-center px-4 py-8 sm:px-6 ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
            <button
                type="button"
                onClick={toggleTheme}
                className={`absolute right-4 top-4 inline-flex min-h-[2.5rem] items-center gap-2 rounded-xl border px-4 text-sm font-bold transition-colors ${
                    isDark
                        ? 'border-slate-700 bg-slate-800 text-slate-100 hover:bg-slate-700'
                        : 'border-slate-200 bg-white text-slate-700 shadow-sm hover:bg-slate-50'
                }`}
            >
                {isDark ? <FiSun size={17} /> : <FiMoon size={17} />}
                {isDark ? 'Light Mode' : 'Dark Mode'}
            </button>
            <div className="w-full max-w-md">
                <div className="mb-6 text-center sm:mb-8">
                    <h1 className={`mb-2 text-3xl font-bold sm:text-4xl ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        POS Pro
                    </h1>
                    <p className={`text-base sm:text-lg ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        Enterprise Point of Sale System
                    </p>
                </div>

                <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-lg p-5 sm:p-8`}>
                    <h2 className={`mb-6 text-center text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        Login to Your Account
                    </h2>

                    {errors.submit && (
                        <div className="mb-4 break-words rounded border border-red-400 bg-red-100 p-4 text-red-700">
                            {errors.submit}
                        </div>
                    )}

                    <form onSubmit={handleLogin} className="space-y-4">
                        <Input
                            label="Username or Email"
                            placeholder="username or you@example.com"
                            value={login}
                            onChange={(e) => setLogin(e.target.value)}
                            error={errors.login}
                            isDark={isDark}
                            required
                        />

                        <Input
                            label="Password"
                            type="password"
                            placeholder="Enter your password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            error={errors.password}
                            isDark={isDark}
                            required
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
                                    <span>Logging in...</span>
                                </>
                            ) : (
                                'Login'
                            )}
                        </Button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
