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
        <div
            className={`relative flex min-h-[100dvh] items-center justify-center px-4 py-8 sm:px-6 ${
                isDark
                    ? 'bg-slate-950 bg-[radial-gradient(ellipse_120%_80%_at_50%_-20%,rgba(59,130,246,0.14),transparent)]'
                    : 'bg-slate-100 bg-[radial-gradient(ellipse_100%_60%_at_50%_-10%,rgba(59,130,246,0.08),transparent)]'
            }`}
        >
            <button
                type="button"
                onClick={toggleTheme}
                className={`absolute right-4 top-4 inline-flex min-h-[2.5rem] items-center gap-2 rounded-xl border px-4 text-sm font-bold backdrop-blur-sm transition-colors ${
                    isDark
                        ? 'border-slate-700/80 bg-slate-900/80 text-slate-100 hover:bg-slate-800'
                        : 'border-slate-200/90 bg-white/90 text-slate-700 shadow-sm hover:bg-white'
                }`}
            >
                {isDark ? <FiSun size={17} /> : <FiMoon size={17} />}
                {isDark ? 'Light' : 'Dark'}
            </button>
            <div className="w-full max-w-md">
                <div className="mb-6 text-center sm:mb-8">
                    <div
                        className={`mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-blue-700 text-2xl font-black text-white shadow-lg shadow-blue-600/30`}
                    >
                        P
                    </div>
                    <h1 className={`mb-2 text-3xl font-black tracking-tight sm:text-4xl ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        POS Pro
                    </h1>
                    <p className={`text-base font-semibold sm:text-lg ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                        Sign in to your store workspace
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
                        Log in
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
