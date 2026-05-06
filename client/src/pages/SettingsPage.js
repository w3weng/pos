import React, { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import {
    FiAtSign,
    FiBriefcase,
    FiLock,
    FiMail,
    FiMapPin,
    FiPhone,
    FiSave,
    FiShield,
    FiUser,
} from 'react-icons/fi';
import { useThemeStore } from '../store/index';
import { Button, LoadingSpinner } from '../components/ui';
import { useAuth } from '../hooks/useAuth';
import { authService, storeService } from '../services/api';

const createInitialStoreForm = () => ({
    name: '',
    address: '',
    phone: '',
    email: '',
    taxRate: '0',
    currency: 'PHP',
});

const createInitialPasswords = () => ({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
});

const createProfileForm = (user) => ({
    firstName: splitName(user?.name).firstName,
    lastName: splitName(user?.name).lastName,
    username: user?.username || '',
    email: user?.email || '',
    phone: user?.phone || '',
});

const splitName = (name = '') => {
    const parts = name.trim().split(/\s+/).filter(Boolean);

    return {
        firstName: parts[0] || '',
        lastName: parts.slice(1).join(' '),
    };
};

const getInitials = (name = '') =>
    name
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase())
        .join('') || 'U';

const getPasswordStrength = (password) => {
    let score = 0;

    if (password.length >= 6) score += 1;
    if (password.length >= 10) score += 1;
    if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score += 1;
    if (/\d/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;

    if (!password) {
        return { label: 'Not set', score: 0, tone: 'slate' };
    }

    if (score <= 2) {
        return { label: 'Weak', score: 1, tone: 'red' };
    }

    if (score <= 4) {
        return { label: 'Medium', score: 2, tone: 'amber' };
    }

    return { label: 'Strong', score: 3, tone: 'emerald' };
};

const hasRequiredPasswordComplexity = (password) =>
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password) &&
    /\d/.test(password) &&
    /[^A-Za-z0-9]/.test(password);

const SettingsCard = ({ children, className = '', isDark = false, accent = 'default' }) => {
    const accents = {
        default: isDark ? 'border-slate-800' : 'border-slate-200',
        security: isDark ? 'border-amber-900/70' : 'border-amber-200',
    };

    return (
        <section
            className={`min-w-0 rounded-2xl border p-5 shadow-sm transition-shadow duration-150 hover:shadow-md sm:p-6 ${
                isDark ? 'bg-slate-900 text-slate-100 shadow-black/10' : 'bg-white text-slate-950'
            } ${accents[accent] || accents.default} ${className}`}
        >
            {children}
        </section>
    );
};

const SectionHeader = ({ icon: Icon, title, subtitle, action, isDark = false, tone = 'blue' }) => {
    const tones = {
        blue: isDark ? 'bg-blue-950 text-blue-300' : 'bg-blue-50 text-blue-700',
        amber: isDark ? 'bg-amber-950 text-amber-300' : 'bg-amber-50 text-amber-700',
        slate: isDark ? 'bg-slate-800 text-slate-200' : 'bg-slate-100 text-slate-700',
    };

    return (
        <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex min-w-0 items-start gap-3">
                {Icon && (
                    <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${tones[tone] || tones.blue}`}>
                        <Icon size={20} />
                    </div>
                )}
                <div className="min-w-0">
                    <h2 className={`text-lg font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-950'}`}>{title}</h2>
                    {subtitle && (
                        <p className={`mt-1 text-sm leading-6 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{subtitle}</p>
                    )}
                </div>
            </div>
            {action}
        </div>
    );
};

const InputField = ({
    icon: Icon,
    label,
    error,
    help,
    isDark = false,
    className = '',
    inputClassName = '',
    as = 'input',
    ...props
}) => {
    const Control = as;

    return (
        <div className={className}>
            <label className={`mb-2 block text-xs font-black uppercase tracking-wide ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                {label}
            </label>
            <div className="relative">
                {Icon && (
                    <Icon
                        size={18}
                        className={`pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}
                    />
                )}
                <Control
                    className={`min-h-[3rem] w-full rounded-xl border px-4 py-2.5 text-base font-semibold transition-all duration-150 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10 disabled:cursor-not-allowed disabled:opacity-70 ${
                        Icon ? 'pl-10' : ''
                    } ${
                        error
                            ? 'border-red-400'
                            : isDark
                                ? 'border-slate-700 bg-slate-800 text-white placeholder:text-slate-500'
                                : 'border-slate-300 bg-white text-slate-950 placeholder:text-slate-400'
                    } ${inputClassName}`}
                    {...props}
                />
            </div>
            {error && <p className="mt-1.5 text-sm font-semibold text-red-500">{error}</p>}
            {!error && help && <p className={`mt-1.5 text-sm ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>{help}</p>}
        </div>
    );
};

const ProfileField = ({ icon: Icon, label, value, isDark = false }) => (
    <div className={`flex items-center gap-3 border-t py-4 first:border-t-0 ${
        isDark ? 'border-slate-800' : 'border-slate-100'
    }`}>
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
            isDark ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-600'
        }`}>
            <Icon size={18} />
        </div>
        <div className="min-w-0">
            <p className={`text-xs font-black uppercase tracking-wide ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>{label}</p>
            <p className={`mt-0.5 break-words text-base font-bold ${isDark ? 'text-white' : 'text-slate-950'}`}>{value || '-'}</p>
        </div>
    </div>
);

const StrengthMeter = ({ strength, isDark = false }) => {
    const barColors = {
        red: 'bg-red-500',
        amber: 'bg-amber-500',
        emerald: 'bg-emerald-500',
        slate: isDark ? 'bg-slate-700' : 'bg-slate-200',
    };

    const textColors = {
        red: 'text-red-600',
        amber: 'text-amber-600',
        emerald: 'text-emerald-600',
        slate: isDark ? 'text-slate-500' : 'text-slate-500',
    };

    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between">
                <span className={`text-xs font-black uppercase tracking-wide ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
                    Password strength
                </span>
                <span className={`text-sm font-black ${textColors[strength.tone] || textColors.slate}`}>{strength.label}</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
                {[1, 2, 3].map((step) => (
                    <div
                        key={step}
                        className={`h-2 rounded-full ${
                            step <= strength.score
                                ? barColors[strength.tone] || barColors.slate
                                : isDark
                                    ? 'bg-slate-800'
                                    : 'bg-slate-200'
                        }`}
                    />
                ))}
            </div>
        </div>
    );
};

const SettingsPage = () => {
    const { isDark } = useThemeStore();
    const { user, token, setUser } = useAuth();
    const isAdmin = user?.role === 'Admin';
    const [storeForm, setStoreForm] = useState(createInitialStoreForm);
    const [loadingStore, setLoadingStore] = useState(true);
    const [savingStore, setSavingStore] = useState(false);
    const [passwords, setPasswords] = useState(createInitialPasswords);
    const [passwordErrors, setPasswordErrors] = useState({});
    const [passwordSuccess, setPasswordSuccess] = useState('');
    const [savingPassword, setSavingPassword] = useState(false);
    const [editingProfile, setEditingProfile] = useState(false);
    const [savingProfile, setSavingProfile] = useState(false);
    const [profileForm, setProfileForm] = useState(() => createProfileForm(user));
    const passwordStrength = useMemo(() => getPasswordStrength(passwords.newPassword), [passwords.newPassword]);

    useEffect(() => {
        setProfileForm(createProfileForm(user));
    }, [user]);

    useEffect(() => {
        let cancelled = false;

        const loadStore = async () => {
            try {
                const response = await storeService.getStoreInfo();
                const store = response.data.data;

                if (!cancelled) {
                    setStoreForm({
                        name: store.name || '',
                        address: store.address || '',
                        phone: store.phone || '',
                        email: store.email || '',
                        taxRate: String(store.tax_rate ?? 0),
                        currency: store.currency || 'PHP',
                    });
                }
            } catch (_error) {
                if (!cancelled) {
                    toast.error('Failed to load store settings');
                }
            } finally {
                if (!cancelled) {
                    setLoadingStore(false);
                }
            }
        };

        loadStore();

        return () => {
            cancelled = true;
        };
    }, []);

    const handleStoreSave = async (event) => {
        event.preventDefault();

        if (!isAdmin) {
            return;
        }

        setSavingStore(true);

        try {
            await storeService.updateStoreInfo(storeForm);
            toast.success('Store settings saved');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to save store settings');
        } finally {
            setSavingStore(false);
        }
    };

    const handlePasswordChange = async (event) => {
        event.preventDefault();
        const nextErrors = {};
        setPasswordSuccess('');

        if (!passwords.currentPassword) {
            nextErrors.currentPassword = 'Current password is required';
        }

        if (passwords.newPassword.length < 8) {
            nextErrors.newPassword = 'New password must be at least 8 characters';
        } else if (!hasRequiredPasswordComplexity(passwords.newPassword)) {
            nextErrors.newPassword = 'Use uppercase, lowercase, number, and symbol';
        }

        if (passwords.newPassword !== passwords.confirmPassword) {
            nextErrors.confirmPassword = 'Passwords do not match';
        }

        setPasswordErrors(nextErrors);

        if (Object.keys(nextErrors).length > 0) {
            return;
        }

        setSavingPassword(true);

        try {
            await authService.changePassword({
                currentPassword: passwords.currentPassword,
                newPassword: passwords.newPassword,
            });
            toast.success('Password changed successfully');
            setPasswordSuccess('Password changed successfully. Use your new password the next time you log in.');
            setPasswords(createInitialPasswords());
            setPasswordErrors({});
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to change password');
        } finally {
            setSavingPassword(false);
        }
    };

    const handleProfileEdit = () => {
        setEditingProfile(true);
    };

    const handleProfileSave = async (event) => {
        event.preventDefault();
        setSavingProfile(true);
        const fullName = `${profileForm.firstName.trim()} ${profileForm.lastName.trim()}`.trim();

        try {
            const response = await authService.updateProfile({
                name: fullName,
                username: profileForm.username,
                email: profileForm.email,
                phone: profileForm.phone,
            });
            const nextUser = response.data.data;
            setUser(nextUser, token);
            localStorage.setItem('user', JSON.stringify(nextUser));
            toast.success('Profile updated');
            setEditingProfile(false);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to update profile');
        } finally {
            setSavingProfile(false);
        }
    };

    return (
        <div className={`w-full min-w-0 space-y-6 py-4 sm:py-6 ${isDark ? 'text-slate-100' : 'text-slate-950'}`}>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className={`text-3xl font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-950'}`}>Settings</h1>
                    <p className={`mt-1 text-base ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                        Manage account security, store profile, and display preferences
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                <SettingsCard isDark={isDark}>
                    <SectionHeader
                        icon={FiUser}
                        title="Account"
                        subtitle="Profile details used for reports, receipts, and user permissions"
                        isDark={isDark}
                        action={
                            editingProfile ? (
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    onClick={() => {
                                        setProfileForm(createProfileForm(user));
                                        setEditingProfile(false);
                                    }}
                                    className="w-full sm:w-auto"
                                >
                                    Cancel
                                </Button>
                            ) : (
                                <Button variant="outline" size="sm" onClick={handleProfileEdit} className="w-full sm:w-auto">
                                    Edit Profile
                                </Button>
                            )
                        }
                    />

                    <div className={`mb-5 flex items-center gap-4 rounded-2xl border p-4 ${
                        isDark ? 'border-blue-900/60 bg-blue-950/30' : 'border-blue-100 bg-blue-50'
                    }`}>
                        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-xl font-black text-white shadow-sm">
                            {getInitials(user?.name)}
                        </div>
                        <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                                <p className={`truncate text-xl font-black ${isDark ? 'text-white' : 'text-slate-950'}`}>{user?.name || 'User'}</p>
                                <span className={`rounded-full px-3 py-1 text-xs font-black ${
                                    user?.role === 'Admin'
                                        ? 'bg-emerald-100 text-emerald-700'
                                        : user?.role === 'Cashier'
                                            ? 'bg-amber-100 text-amber-700'
                                            : 'bg-blue-100 text-blue-700'
                                }`}>
                                    {user?.role || 'User'}
                                </span>
                            </div>
                            <p className={`mt-1 truncate text-sm font-semibold ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                                @{user?.username || 'username'}
                            </p>
                        </div>
                    </div>

                    {editingProfile ? (
                        <form onSubmit={handleProfileSave} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <InputField
                                icon={FiUser}
                                label="First Name"
                                value={profileForm.firstName}
                                onChange={(event) => setProfileForm({ ...profileForm, firstName: event.target.value })}
                                isDark={isDark}
                                required
                            />
                            <InputField
                                icon={FiUser}
                                label="Last Name"
                                value={profileForm.lastName}
                                onChange={(event) => setProfileForm({ ...profileForm, lastName: event.target.value })}
                                isDark={isDark}
                                required
                            />
                            <InputField
                                icon={FiAtSign}
                                label="Username"
                                value={profileForm.username}
                                onChange={(event) => setProfileForm({ ...profileForm, username: event.target.value })}
                                isDark={isDark}
                                required
                            />
                            <InputField
                                icon={FiMail}
                                label="Email"
                                type="email"
                                value={profileForm.email}
                                onChange={(event) => setProfileForm({ ...profileForm, email: event.target.value })}
                                isDark={isDark}
                                required
                            />
                            <InputField
                                icon={FiPhone}
                                label="Phone"
                                value={profileForm.phone}
                                onChange={(event) => setProfileForm({ ...profileForm, phone: event.target.value })}
                                isDark={isDark}
                            />
                            <div className="sm:col-span-2">
                                <Button type="submit" variant="primary" disabled={savingProfile} className="w-full sm:w-auto">
                                    {savingProfile ? 'Saving...' : 'Save Profile'}
                                </Button>
                            </div>
                        </form>
                    ) : (
                        <div className={`rounded-2xl border px-4 ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
                            <ProfileField icon={FiUser} label="First Name" value={splitName(user?.name).firstName} isDark={isDark} />
                            <ProfileField icon={FiUser} label="Last Name" value={splitName(user?.name).lastName} isDark={isDark} />
                            <ProfileField icon={FiAtSign} label="Username" value={user?.username} isDark={isDark} />
                            <ProfileField icon={FiMail} label="Email" value={user?.email} isDark={isDark} />
                        </div>
                    )}
                </SettingsCard>

                <SettingsCard isDark={isDark} accent="security">
                    <SectionHeader
                        icon={FiShield}
                        title="Security"
                        subtitle="Update your password to keep your account secure"
                        isDark={isDark}
                        tone="amber"
                    />

                    <div className={`mb-5 rounded-2xl border px-4 py-3 ${
                        isDark ? 'border-amber-900/60 bg-amber-950/20 text-amber-200' : 'border-amber-200 bg-amber-50 text-amber-800'
                    }`}>
                        <p className="text-sm font-semibold">
                            Use a unique password. Strong passwords include uppercase, lowercase, numbers, and symbols.
                        </p>
                    </div>

                    <form onSubmit={handlePasswordChange} className="space-y-4">
                        <InputField
                            icon={FiLock}
                            label="Current Password"
                            type="password"
                            value={passwords.currentPassword}
                            onChange={(event) => {
                                setPasswords({ ...passwords, currentPassword: event.target.value });
                                setPasswordErrors({ ...passwordErrors, currentPassword: '' });
                                setPasswordSuccess('');
                            }}
                            error={passwordErrors.currentPassword}
                            isDark={isDark}
                            required
                        />
                        <InputField
                            icon={FiLock}
                            label="New Password"
                            type="password"
                            value={passwords.newPassword}
                            onChange={(event) => {
                                setPasswords({ ...passwords, newPassword: event.target.value });
                                setPasswordErrors({ ...passwordErrors, newPassword: '' });
                                setPasswordSuccess('');
                            }}
                            error={passwordErrors.newPassword}
                            isDark={isDark}
                            required
                        />
                        <StrengthMeter strength={passwordStrength} isDark={isDark} />
                        <InputField
                            icon={FiLock}
                            label="Confirm New Password"
                            type="password"
                            value={passwords.confirmPassword}
                            onChange={(event) => {
                                setPasswords({ ...passwords, confirmPassword: event.target.value });
                                setPasswordErrors({ ...passwordErrors, confirmPassword: '' });
                                setPasswordSuccess('');
                            }}
                            error={passwordErrors.confirmPassword}
                            isDark={isDark}
                            required
                        />
                        <Button type="submit" variant="primary" disabled={savingPassword} className="w-full sm:w-auto">
                            {savingPassword ? 'Updating...' : 'Update Password'}
                        </Button>
                        {passwordSuccess && (
                            <div className={`rounded-xl border px-4 py-3 text-sm font-semibold ${
                                isDark
                                    ? 'border-emerald-900/70 bg-emerald-950/30 text-emerald-200'
                                    : 'border-emerald-200 bg-emerald-50 text-emerald-800'
                            }`}>
                                {passwordSuccess}
                            </div>
                        )}
                    </form>
                </SettingsCard>
            </div>

            <div className="grid grid-cols-1 gap-6">
                <SettingsCard isDark={isDark}>
                    <SectionHeader
                        icon={FiBriefcase}
                        title="Store Profile"
                        subtitle={isAdmin ? 'Business details used across receipts and reports' : 'Business details are managed by Admin users'}
                        isDark={isDark}
                        tone="slate"
                        action={
                            !isAdmin && (
                                <span className={`rounded-full px-3 py-1 text-xs font-black ${
                                    isDark ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-700'
                                }`}>
                                    Read only
                                </span>
                            )
                        }
                    />

                    {loadingStore ? (
                        <div className="flex min-h-[18rem] items-center justify-center">
                            <LoadingSpinner />
                        </div>
                    ) : (
                        <form onSubmit={handleStoreSave} className="space-y-5">
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <InputField
                                    icon={FiBriefcase}
                                    label="Store Name"
                                    value={storeForm.name}
                                    onChange={(event) => setStoreForm({ ...storeForm, name: event.target.value })}
                                    isDark={isDark}
                                    disabled={!isAdmin}
                                    required
                                />
                                <InputField
                                    icon={FiMail}
                                    label="Store Email"
                                    type="email"
                                    value={storeForm.email}
                                    onChange={(event) => setStoreForm({ ...storeForm, email: event.target.value })}
                                    isDark={isDark}
                                    disabled={!isAdmin}
                                />
                                <InputField
                                    icon={FiPhone}
                                    label="Phone"
                                    value={storeForm.phone}
                                    onChange={(event) => setStoreForm({ ...storeForm, phone: event.target.value })}
                                    isDark={isDark}
                                    disabled={!isAdmin}
                                />
                                <div className="grid grid-cols-2 gap-3">
                                    <InputField
                                        label="Tax Rate"
                                        type="number"
                                        min="0"
                                        max="100"
                                        step="0.01"
                                        value={storeForm.taxRate}
                                        onChange={(event) => setStoreForm({ ...storeForm, taxRate: event.target.value })}
                                        isDark={isDark}
                                        disabled={!isAdmin}
                                    />
                                    <InputField
                                        label="Currency"
                                        as="select"
                                        value={storeForm.currency}
                                        onChange={(event) => setStoreForm({ ...storeForm, currency: event.target.value })}
                                        isDark={isDark}
                                        disabled={!isAdmin}
                                    >
                                        <option value="PHP">PHP</option>
                                        <option value="USD">USD</option>
                                    </InputField>
                                </div>
                            </div>

                            <InputField
                                icon={FiMapPin}
                                label="Address"
                                as="textarea"
                                value={storeForm.address}
                                onChange={(event) => setStoreForm({ ...storeForm, address: event.target.value })}
                                isDark={isDark}
                                disabled={!isAdmin}
                                rows="4"
                                inputClassName="resize-none pl-10"
                            />

                            {isAdmin && (
                                <div className={`border-t pt-5 ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
                                    <Button type="submit" variant="success" disabled={savingStore} className="w-full sm:w-auto">
                                        <FiSave />
                                        {savingStore ? 'Saving...' : 'Save Store Settings'}
                                    </Button>
                                </div>
                            )}
                        </form>
                    )}
                </SettingsCard>
            </div>

        </div>
    );
};

export default SettingsPage;
