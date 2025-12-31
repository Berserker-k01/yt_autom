import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { getAuthHeaders, getCurrentUser } from '../utils/auth';
import '../Scripty.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

function AdminDashboard() {
    const [stats, setStats] = useState(null);
    const [users, setUsers] = useState([]);
    const [activity, setActivity] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedUser, setSelectedUser] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        const user = getCurrentUser();
        if (!user?.is_admin) {
            navigate('/dashboard');
            return;
        }
        fetchAdminData();
    }, [navigate]);

    const fetchAdminData = async () => {
        try {
            const [statsRes, usersRes, activityRes] = await Promise.all([
                axios.get(`${API_URL}/api/admin/stats`, { headers: getAuthHeaders() }),
                axios.get(`${API_URL}/api/admin/users?per_page=20`, { headers: getAuthHeaders() }),
                axios.get(`${API_URL}/api/admin/activity`, { headers: getAuthHeaders() })
            ]);

            setStats(statsRes.data);
            setUsers(usersRes.data.users);
            setActivity(activityRes.data);
        } catch (error) {
            console.error('Admin data fetch error:', error);
            if (error.response?.status === 403) {
                navigate('/dashboard');
            }
        } finally {
            setLoading(false);
        }
    };

    const updateUserPlan = async (userId, newPlan) => {
        try {
            await axios.put(
                `${API_URL}/api/admin/users/${userId}/subscription`,
                { plan_type: newPlan },
                { headers: getAuthHeaders() }
            );
            fetchAdminData();
            alert(`Plan updated to ${newPlan}`);
        } catch (error) {
            alert('Failed to update plan');
        }
    };

    const toggleAdminRole = async (userId) => {
        try {
            await axios.put(
                `${API_URL}/api/admin/users/${userId}/admin`,
                {},
                { headers: getAuthHeaders() }
            );
            fetchAdminData();
        } catch (error) {
            alert('Failed to toggle admin role');
        }
    };

    const deleteUser = async (userId) => {
        if (!window.confirm('Are you sure you want to delete this user?')) return;

        try {
            await axios.delete(
                `${API_URL}/api/admin/users/${userId}`,
                { headers: getAuthHeaders() }
            );
            fetchAdminData();
            alert('User deleted');
        } catch (error) {
            alert(error.response?.data?.error || 'Failed to delete user');
        }
    };

    if (loading) {
        return <div className="admin-container">Loading admin panel...</div>;
    }

    return (
        <div className="admin-container">
            <h1 className="admin-title">🛠️ Admin Dashboard</h1>

            {/* Stats Grid */}
            <div className="admin-stats-grid">
                <div className="admin-stat-card glass-card">
                    <h3>Total Users</h3>
                    <div className="stat-value">{stats?.users?.total || 0}</div>
                    <p className="stat-subtitle">{stats?.users?.recent_signups || 0} this week</p>
                </div>

                <div className="admin-stat-card glass-card">
                    <h3>Pro Subscribers</h3>
                    <div className="stat-value">{stats?.subscriptions?.pro || 0}</div>
                    <p className="stat-subtitle">${stats?.revenue?.monthly || 0}/mo</p>
                </div>

                <div className="admin-stat-card glass-card">
                    <h3>Total Scripts</h3>
                    <div className="stat-value">{stats?.scripts?.total || 0}</div>
                    <p className="stat-subtitle">{stats?.scripts?.today || 0} today</p>
                </div>

                <div className="admin-stat-card glass-card">
                    <h3>MRR</h3>
                    <div className="stat-value">${stats?.revenue?.monthly || 0}</div>
                    <p className="stat-subtitle">${stats?.revenue?.annual || 0}/yr</p>
                </div>
            </div>

            {/* Users Table */}
            <div className="admin-section glass-card">
                <div className="section-header">
                    <h2>Users Management</h2>
                    <input
                        type="text"
                        placeholder="Search users..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="search-input"
                    />
                </div>

                <table className="users-table">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Email</th>
                            <th>Plan</th>
                            <th>Scripts</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users
                            .filter(u =>
                                u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                u.name.toLowerCase().includes(searchQuery.toLowerCase())
                            )
                            .map(user => (
                                <tr key={user.id}>
                                    <td>
                                        {user.name}
                                        {user.is_admin && <span className="admin-badge">ADMIN</span>}
                                    </td>
                                    <td>{user.email}</td>
                                    <td>
                                        <select
                                            value={user.subscription?.plan_type || 'free'}
                                            onChange={(e) => updateUserPlan(user.id, e.target.value)}
                                            className="plan-select"
                                        >
                                            <option value="free">Free</option>
                                            <option value="pro">Pro</option>
                                            <option value="enterprise">Enterprise</option>
                                        </select>
                                    </td>
                                    <td>{user.scripts_count}</td>
                                    <td>
                                        <span className={`status-badge ${user.email_verified ? 'verified' : 'unverified'}`}>
                                            {user.email_verified ? '✓ Verified' : '✗ Unverified'}
                                        </span>
                                    </td>
                                    <td className="actions-cell">
                                        <button
                                            onClick={() => toggleAdminRole(user.id)}
                                            className="btn-small btn-secondary"
                                        >
                                            {user.is_admin ? 'Remove Admin' : 'Make Admin'}
                                        </button>
                                        <button
                                            onClick={() => deleteUser(user.id)}
                                            className="btn-small btn-danger"
                                            disabled={user.is_admin}
                                        >
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            ))}
                    </tbody>
                </table>
            </div>

            {/* Recent Activity */}
            <div className="admin-section glass-card">
                <h2>Recent Activity</h2>
                <div className="activity-grid">
                    <div>
                        <h3>Recent Scripts</h3>
                        <ul className="activity-list">
                            {activity?.recent_scripts?.slice(0, 5).map(script => (
                                <li key={script.id}>
                                    <strong>{script.title}</strong>
                                    <span className="platform-tag">{script.platform}</span>
                                    <small>{script.user_email}</small>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div>
                        <h3>New Users</h3>
                        <ul className="activity-list">
                            {activity?.recent_users?.map(user => (
                                <li key={user.id}>
                                    <strong>{user.name}</strong>
                                    <small>{user.email}</small>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default AdminDashboard;
