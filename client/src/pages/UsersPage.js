import React, { useState, useEffect } from 'react';
import { useThemeStore } from '../store/index';
import { userService } from '../services/api';
import toast from 'react-hot-toast';
import { Badge, Card, Button, Input, LoadingSpinner, Modal, Pagination, Table } from '../components/ui';
import { FiTrash2, FiPlus, FiCheckCircle } from 'react-icons/fi';

const createInitialFormData = () => ({
    firstName: '',
    lastName: '',
    username: '',
    email: '',
    password: '',
    phone: '',
    roleId: '',
});

const splitName = (name = '') => {
    const parts = name.trim().split(/\s+/).filter(Boolean);

    return {
        firstName: parts[0] || '',
        lastName: parts.slice(1).join(' '),
    };
};

const UsersPage = () => {
    const { isDark } = useThemeStore();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState(createInitialFormData);
    const [currentPage, setCurrentPage] = useState(1);
    const [pendingDisableUser, setPendingDisableUser] = useState(null);
    const pageSize = 10;

    const loadUsers = async () => {
        const response = await userService.getUsers();
        setUsers(response.data.data);
    };

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const response = await userService.getUsers();
                setUsers(response.data.data);
            } catch (error) {
                toast.error('Failed to load users');
            } finally {
                setLoading(false);
            }
        };

        fetchUsers();
    }, []);

    const closeForm = () => {
        setShowForm(false);
        setEditingId(null);
        setFormData(createInitialFormData());
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);

        try {
            if (editingId) {
                toast.error('Users edit their own profile in Settings');
            } else {
                const name = `${formData.firstName.trim()} ${formData.lastName.trim()}`.trim();
                await userService.createUser({ ...formData, name });
                toast.success('User created successfully');
            }

            closeForm();
            await loadUsers();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to save user');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (user) => {
        if (user.role === 'Admin') {
            toast.error('Admin accounts cannot be disabled or deleted');
            return;
        }

        try {
            const response = await userService.deleteUser(user.id);
            const action = response.data.data?.action;

            if (action === 'deleted') {
                toast.success('User deleted because it had no activity');
                setUsers((currentUsers) => currentUsers.filter((currentUser) => currentUser.id !== user.id));
            } else {
                toast.success('User disabled');
                setUsers((currentUsers) =>
                    currentUsers.map((currentUser) =>
                        currentUser.id === user.id ? { ...currentUser, is_active: 0 } : currentUser
                    )
                );
            }
            setPendingDisableUser(null);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to disable user');
        }
    };

    const handleEnable = async (user) => {
        try {
            await userService.enableUser(user.id);
            toast.success('User enabled');
            setUsers((currentUsers) =>
                currentUsers.map((currentUser) =>
                    currentUser.id === user.id ? { ...currentUser, is_active: 1 } : currentUser
                )
            );
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to enable user');
        }
    };

    const pageCount = Math.max(1, Math.ceil(users.length / pageSize));
    const visibleUsers = users.slice((currentPage - 1) * pageSize, currentPage * pageSize);

    if (loading) {
        return (
            <div className="flex min-h-[60vh] items-center justify-center">
                <LoadingSpinner />
            </div>
        );
    }

    return (
        <div className="w-full min-w-0 space-y-6 py-4 sm:py-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Users</h1>
                    <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Manage user accounts and permissions</p>
                </div>
                <Button
                    variant="primary"
                    size="lg"
                    onClick={() => {
                        if (showForm) {
                            closeForm();
                            return;
                        }

                        setEditingId(null);
                        setFormData(createInitialFormData());
                        setShowForm(true);
                    }}
                    className="w-full sm:w-auto"
                >
                    <FiPlus /> {showForm ? 'Close Form' : 'Add User'}
                </Button>
            </div>

            {/* Form */}
            {showForm && (
                <Card isDark={isDark}>
                    <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {editingId ? 'Edit User' : 'New User'}
                    </h3>
                    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input
                            label="First Name *"
                            value={formData.firstName}
                            onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                            isDark={isDark}
                            required
                        />

                        <Input
                            label="Last Name *"
                            value={formData.lastName}
                            onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                            isDark={isDark}
                            required
                        />

                        <Input
                            label="Username *"
                            value={formData.username}
                            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                            isDark={isDark}
                            required
                        />

                        <Input
                            label="Email *"
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            isDark={isDark}
                            required
                        />

                        {!editingId && (
                            <Input
                                label="Password *"
                                type="password"
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                isDark={isDark}
                                required
                            />
                        )}

                        <Input
                            label="Phone"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            isDark={isDark}
                        />

                        <div>
                            <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                Role *
                            </label>
                            <select
                                value={formData.roleId}
                                onChange={(e) => setFormData({ ...formData, roleId: e.target.value })}
                                className={`w-full px-4 py-2 border rounded-lg ${
                                    isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
                                }`}
                                required
                            >
                                <option value="">Select Role</option>
                                <option value="1">Admin</option>
                                <option value="2">Manager</option>
                                <option value="3">Cashier</option>
                            </select>
                        </div>

                        <div className="md:col-span-2 flex gap-2">
                            <Button type="submit" variant="primary" disabled={saving}>
                                {saving ? 'Saving...' : editingId ? 'Update User' : 'Create User'}
                            </Button>
                            <Button
                                type="button"
                                variant="secondary"
                                onClick={closeForm}
                            >
                                Cancel
                            </Button>
                        </div>
                    </form>
                </Card>
            )}

            {/* Users Table */}
            <Card isDark={isDark}>
                {users.length === 0 ? (
                    <p className={`text-center py-8 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        No users found
                    </p>
                ) : (
                    <Table>
                            <thead>
                                <tr className={`border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                                    <th className={`text-left py-3 px-4 font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                        First Name
                                    </th>
                                    <th className={`text-left py-3 px-4 font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                        Last Name
                                    </th>
                                    <th className={`text-left py-3 px-4 font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                        Email
                                    </th>
                                    <th className={`text-left py-3 px-4 font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                        Username
                                    </th>
                                    <th className={`text-left py-3 px-4 font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                        Role
                                    </th>
                                    <th className={`text-center py-3 px-4 font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                        Status
                                    </th>
                                    <th className={`text-left py-3 px-4 font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                        Last Login
                                    </th>
                                    <th className={`text-center py-3 px-4 font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {visibleUsers.map((user) => (
                                    <tr key={user.id} className={`border-b ${isDark ? 'border-gray-700 hover:bg-gray-700' : 'border-gray-200 hover:bg-gray-50'}`}>
                                        <td className={`py-3 px-4 font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                            {splitName(user.name).firstName}
                                        </td>
                                        <td className={`py-3 px-4 font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                            {splitName(user.name).lastName || '-'}
                                        </td>
                                        <td className={`py-3 px-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                            {user.email}
                                        </td>
                                        <td className={`py-3 px-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                            {user.username}
                                        </td>
                                        <td className={`py-3 px-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                            {user.role}
                                        </td>
                                        <td className="py-3 px-4 text-center">
                                            <Badge variant={Number(user.is_active) === 1 ? 'success' : 'warning'}>
                                                {Number(user.is_active) === 1 ? 'Active' : 'Disabled'}
                                            </Badge>
                                        </td>
                                        <td className={`py-3 px-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                            {user.last_login ? new Date(user.last_login).toLocaleDateString() : 'Never'}
                                        </td>
                                        <td className="py-3 px-4 text-center">
                                            {Number(user.is_active) === 1 ? (
                                                <Button
                                                    size="sm"
                                                    variant="danger"
                                                    disabled={user.role === 'Admin'}
                                                    onClick={() => setPendingDisableUser(user)}
                                                >
                                                    <FiTrash2 /> Disable
                                                </Button>
                                            ) : (
                                                <Button
                                                    size="sm"
                                                    variant="success"
                                                    onClick={() => handleEnable(user)}
                                                >
                                                    <FiCheckCircle /> Enable
                                                </Button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                    </Table>
                )}
                {users.length > pageSize && (
                    <Pagination
                        currentPage={currentPage}
                        totalPages={pageCount}
                        totalItems={users.length}
                        pageSize={pageSize}
                        onPageChange={setCurrentPage}
                        isDark={isDark}
                        itemLabel="users"
                    />
                )}
            </Card>

            {pendingDisableUser && (
                <Modal isDark={isDark} className="max-w-md">
                    <div className="space-y-5">
                        <div className="flex items-start gap-4">
                            <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${
                                isDark ? 'bg-red-950 text-red-300' : 'bg-red-50 text-red-600'
                            }`}>
                                <FiTrash2 size={22} />
                            </div>
                            <div className="min-w-0">
                                <h3 className={`text-xl font-black ${isDark ? 'text-white' : 'text-slate-950'}`}>
                                    Disable account?
                                </h3>
                                <p className={`mt-1 text-sm leading-6 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                                    {pendingDisableUser.name} will lose access immediately. If this account has no sales, logins, or activity history, it will be deleted instead.
                                </p>
                            </div>
                        </div>

                        <div className={`rounded-xl border p-4 text-sm ${
                            isDark ? 'border-amber-900/70 bg-amber-950/20 text-amber-200' : 'border-amber-200 bg-amber-50 text-amber-800'
                        }`}>
                            This action is written to Activity Logs for audit tracking.
                        </div>

                        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                            <Button variant="secondary" onClick={() => setPendingDisableUser(null)}>
                                Cancel
                            </Button>
                            <Button variant="danger" onClick={() => handleDelete(pendingDisableUser)}>
                                Disable Account
                            </Button>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
};

export default UsersPage;
