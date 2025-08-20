import React, { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  Download,
  Edit,
  Trash2,
  Eye,
  UserCheck,
  Mail,
  Loader,
  EyeOff,
  Send
} from 'lucide-react';



/**
 * Defines the structure for a user object as returned by the API.
 */
interface User {
  id: number;
  email: string;
  name: string;
  role: 'admin' | 'accountant';
  created_at: string;
  updated_at: string;
}

const API_URL = import.meta.env.VITE_API_BASE_URL;



const UserManagement: React.FC = () => {
  // State for the user data fetched from the API
  const [users, setUsers] = useState<User[]>([]);
  // State to manage loading and error states for fetching users
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // States for the add user form
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserRole, setNewUserRole] = useState<'admin' | 'accountant'>('accountant');
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [addUserError, setAddUserError] = useState<string | null>(null);

  // New state to toggle password visibility
  const [showPassword, setShowPassword] = useState(false);

  // States for the edit user form
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editUserName, setEditUserName] = useState('');
  const [editUserEmail, setEditUserEmail] = useState('');
  const [editUserRole, setEditUserRole] = useState<'admin' | 'accountant'>('accountant');
  const [editUserPassword, setEditUserPassword] = useState('');
  const [isUpdatingUser, setIsUpdatingUser] = useState(false);
  const [updateUserError, setUpdateUserError] = useState<string | null>(null);

  // States for deleting a user
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // New state to track the ID of the user being mailed
  const [mailingUserId, setMailingUserId] = useState<number | null>(null);
  const [mailSuccessMessage, setMailSuccessMessage] = useState<string | null>(null);
  const [mailError, setMailError] = useState<string | null>(null);

  // Existing states for search and filters
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  // New state to manage the view user modal
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewingUser, setViewingUser] = useState<User | null>(null);
  // New state for export loading
  const [isExporting, setIsExporting] = useState(false);


  /**
   * Fetches users from the API when the search term or filters change.
   * This hook handles the new API response structure.
   */
  const fetchUsers = async () => {
    setIsLoading(true);
    setError(null);
    const token = localStorage.getItem('token');
    const url = new URL(`${API_URL}/users`);
    // Append search term if it exists
    if (searchTerm) {
      url.searchParams.append('q', searchTerm);
    }

    try {
      const response = await fetch(url.toString(), {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Destructure the 'data' array from the JSON response
      const { data }: { data: User[] } = await response.json();
      setUsers(data);
    } catch (e: any) {
      setError(e.message);
      setUsers([]); // Clear users on error
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [searchTerm]); // Re-run the effect whenever the search term changes

  /**
   * Handles creating a new user by sending a POST request to the API.
   */
  const handleAddUser = async () => {
    setIsAddingUser(true);
    setAddUserError(null);
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`${API_URL}/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: newUserName,
          email: newUserEmail,
          password: newUserPassword,
          role: newUserRole,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to add user! Status: ${response.status}`);
      }

      // Refresh the user list after successful creation
      fetchUsers();
      // Reset form and close modal
      setNewUserName('');
      setNewUserEmail('');
      setNewUserPassword('');
      setNewUserRole('accountant'); // New default role
      setShowCreateModal(false);

    } catch (e: any) {
      setAddUserError(e.message);
    } finally {
      setIsAddingUser(false);
    }
  };

  /**
   * Handles populating the edit modal with user data.
   * Also clears the password field for security.
   * @param user The user object to edit.
   */
  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setEditUserName(user.name);
    setEditUserEmail(user.email);
    setEditUserRole(user.role);
    setEditUserPassword(''); // Clear the password field when opening the modal
    setShowEditModal(true);
  };

  /**
   * Handles updating an existing user by sending a PATCH request to the API.
   * This is a change from PUT to PATCH to allow partial updates.
   */
  const handleUpdateUser = async () => {
    if (!editingUser) return;

    setIsUpdatingUser(true);
    setUpdateUserError(null);
    const token = localStorage.getItem('token');

    // Build the request body, only including the password if it's not empty
    const updatedData: { name: string; email: string; role: 'admin' | 'accountant'; password?: string; } = {
      name: editUserName,
      email: editUserEmail,
      role: editUserRole,
    };
    if (editUserPassword) {
      updatedData.password = editUserPassword;
    }

    try {
      const response = await fetch(`${API_URL}/users/${editingUser.id}`, {
        method: 'PATCH', 
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updatedData),
      });

      if (!response.ok) {
        throw new Error(`Failed to update user! Status: ${response.status}`);
      }

      fetchUsers();
      // Reset states and close modal
      setEditingUser(null);
      setEditUserName('');
      setEditUserEmail('');
      setEditUserRole('accountant');
      setShowEditModal(false);

    } catch (e: any) {
      setUpdateUserError(e.message);
    } finally {
      setIsUpdatingUser(false);
    }
  };

  /**
   * Handles a user deletion request.
   * @param userId The ID of the user to delete.
   */
  const handleDeleteUser = async () => {
    if (!userToDelete) return;

    setIsDeleting(true);
    setDeleteError(null);
    const token = localStorage.getItem('token');

    try {
      const response = await fetch(`${API_URL}/users/${userToDelete.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to delete user! Status: ${response.status}`);
      }

      // Refresh the user list after successful deletion
      fetchUsers();
      // Reset state and close modal
      setUserToDelete(null);
      setShowDeleteModal(false);
    } catch (e: any) {
      setDeleteError(e.message);
    } finally {
      setIsDeleting(false);
    }
  };

  /**
   * Opens the delete confirmation modal.
   * @param user The user object to be deleted.
   */
  const confirmDelete = (user: User) => {
    setUserToDelete(user);
    setShowDeleteModal(true);
  };

  /**
   * Generates and downloads a CSV file from the current user data.
   */
  const handleExportUsers = () => {
    setIsExporting(true);
    try {
      const headers = ['id', 'name', 'email', 'role', 'created_at', 'updated_at'];
      // Map user data to CSV rows
      const csvRows = filteredUsers.map(user =>
        [
          user.id,
          `"${user.name.replace(/"/g, '""')}"`, // Handle names with commas or quotes
          `"${user.email.replace(/"/g, '""')}"`,
          user.role,
          `"${user.created_at}"`,
          `"${user.updated_at}"`
        ].join(',')
      );
      // Combine headers and rows
      const csvContent = [headers.join(','), ...csvRows].join('\n');

      // Create a Blob and a temporary URL to trigger download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', 'users.csv');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url); // Clean up the temporary URL
    } catch (e) {
      console.error("Failed to export users:", e);
    } finally {
      setIsExporting(false);
    }
  };

  /**
   * Triggers a password reset and email notification via the API.
   * @param user The user to send the new password to.
   */
  const handleMailUser = async (user: User) => {
    setMailingUserId(user.id);
    setMailError(null);
    setMailSuccessMessage(null);
    const token = localStorage.getItem('token');

    try {
      const response = await fetch(`${API_URL}/users/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ email: user.email }),
      });

      if (!response.ok) {
        throw new Error(`Failed to initiate password reset! Status: ${response.status}`);
      }

      setMailSuccessMessage(`A password reset link has been "sent" to ${user.email}.`);
    } catch (e: any) {
      setMailError(e.message);
    } finally {
      setMailingUserId(null);
    }
  };

  /**
   * Applies client-side filters on the fetched data.
   */
  const filteredUsers = users.filter(user => {
    // The search is now handled by the API call in the useEffect hook, so we only need to filter by role here.
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    return matchesRole;
  });

  /**
   * Handles displaying a user's details in the view modal.
   * @param user The user object to display.
   */
  const handleViewUser = (user: User) => {
    setViewingUser(user);
    setShowViewModal(true);
  };

  const getRoleColor = (role: User['role']) => {
    switch (role) {
      case 'admin':
        return 'bg-purple-100 text-purple-800';
      case 'accountant':
        return 'bg-yellow-100 text-yellow-800';
      default:
        // This case should not be reached with the new roles, but kept for safety.
        return 'bg-gray-100 text-gray-800';
    }
  };

  const totalUsers = filteredUsers.length;

  return (
    <div className="space-y-6 p-4 md:p-8 bg-gray-50 min-h-screen font-sans">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-600 mt-1">Manage user accounts, roles, and permissions</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="mt-4 md:mt-0 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add User
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <div className="bg-white overflow-hidden shadow-sm rounded-lg border border-gray-200">
          <div className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 p-3 rounded-lg bg-blue-500">
                <UserCheck className="h-6 w-6 text-white" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Users</dt>
                  <dd className="text-2xl font-semibold text-gray-900">{totalUsers}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        {/* Removed other summary cards as the data is not available from the API */}
      </div>

      {/* Filters and Search */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              />
            </div>
          </div>
          <div className="flex gap-2 items-center">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
            >
              <option value="all">All Roles</option>
              <option value="admin">Admin</option>
              <option value="accountant">Accountant</option>
            </select>
            {/* Removed status filter as the data is not available from the API */}
            <button
              onClick={handleExportUsers}
              disabled={isExporting}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isExporting ? (
                <Loader className="animate-spin h-4 w-4 mr-2" />
              ) : (
                <Download className="h-4 w-4 mr-2" />
              )}
              Export
            </button>
          </div>
        </div>
      </div>

      {/* User Table */}
      <div className="bg-white shadow-sm rounded-lg overflow-hidden border border-gray-200">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created At
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Updated At
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">Loading users...</td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-sm text-red-500">Error: {error}</td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">No users found.</td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center">
                            <span className="text-white text-sm font-medium">
                              {user.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{user.name}</div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleColor(user.role)}`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(user.updated_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        {/* View user button */}
                        <button
                          onClick={() => handleViewUser(user)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        {/* Edit user button */}
                        <button
                          onClick={() => handleEditUser(user)}
                          className="text-green-600 hover:text-green-900"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        {/* Mail/Password Reset button */}
                        <button
                          onClick={() => handleMailUser(user)}
                          disabled={mailingUserId === user.id}
                          className="text-purple-600 hover:text-purple-900 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {/* Conditional rendering for the spinner */}
                          {mailingUserId === user.id ? (
                             <Loader className="animate-spin h-4 w-4" />
                           ) : (
                            <Send className="h-4 w-4" />
                          )}
                        </button>
                        {/* Delete user button with confirmation modal */}
                        <button
                          onClick={() => confirmDelete(user)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Success/Error Message for mailing */}
      {mailSuccessMessage && (
        <div className="fixed inset-x-0 bottom-4 flex justify-center z-50 animate-fade-in-up">
          <div className="bg-green-600 text-white px-6 py-3 rounded-full shadow-lg">
            {mailSuccessMessage}
          </div>
        </div>
      )}

      {mailError && (
        <div className="fixed inset-x-0 bottom-4 flex justify-center z-50 animate-fade-in-up">
          <div className="bg-red-600 text-white px-6 py-3 rounded-full shadow-lg">
            Error: {mailError}
          </div>
        </div>
      )}


      {/* Create User Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
          <div className="relative top-0 md:top-20 p-5 border w-full max-w-sm shadow-lg rounded-lg bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Add New User</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Full Name</label>
                  <input
                    type="text"
                    value={newUserName}
                    onChange={(e) => setNewUserName(e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                    placeholder="Enter full name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <input
                    type="email"
                    value={newUserEmail}
                    onChange={(e) => setNewUserEmail(e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                    placeholder="Enter email address"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={newUserPassword}
                      onChange={(e) => setNewUserPassword(e.target.value)}
                      className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                      placeholder="Enter password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Role</label>
                  <select
                    value={newUserRole}
                    onChange={(e) => setNewUserRole(e.target.value as 'admin' | 'accountant')}
                    className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                  >
                    <option value="admin">Admin</option>
                    <option value="accountant">Accountant</option>
                  </select>
                </div>
              </div>
              {addUserError && <p className="mt-4 text-sm text-red-600">{addUserError}</p>}
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddUser}
                  disabled={isAddingUser}
                  className="px-4 py-2 text-sm font-medium rounded-lg transition-colors
                  disabled:bg-blue-300 disabled:cursor-not-allowed
                  text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  {isAddingUser ? (
                    <div className="flex items-center">
                      <Loader className="animate-spin h-4 w-4 mr-2" />
                      Adding...
                    </div>
                  ) : (
                    'Add User'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditModal && editingUser && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
          <div className="relative top-0 md:top-20 p-5 border w-full max-w-sm shadow-lg rounded-lg bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Edit User</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Full Name</label>
                  <input
                    type="text"
                    value={editUserName}
                    onChange={(e) => setEditUserName(e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                    placeholder="Enter full name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <input
                    type="email"
                    value={editUserEmail}
                    onChange={(e) => setEditUserEmail(e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                    placeholder="Enter email address"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={editUserPassword}
                      onChange={(e) => setEditUserPassword(e.target.value)}
                      className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                      placeholder="Enter new password (optional)"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Role</label>
                  <select
                    value={editUserRole}
                    onChange={(e) => setEditUserRole(e.target.value as 'admin' | 'accountant')}
                    className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                  >
                    <option value="admin">Admin</option>
                    <option value="accountant">Accountant</option>
                  </select>
                </div>
              </div>
              {updateUserError && <p className="mt-4 text-sm text-red-600">{updateUserError}</p>}
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateUser}
                  disabled={isUpdatingUser}
                  className="px-4 py-2 text-sm font-medium rounded-lg transition-colors
                  disabled:bg-green-300 disabled:cursor-not-allowed
                  text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  {isUpdatingUser ? (
                    <div className="flex items-center">
                      <Loader className="animate-spin h-4 w-4 mr-2" />
                      Saving...
                    </div>
                  ) : (
                    'Save Changes'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && userToDelete && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
          <div className="relative top-0 md:top-20 p-5 border w-full max-w-sm shadow-lg rounded-lg bg-white">
            <div className="mt-3 text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                <Trash2 className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-lg leading-6 font-medium text-gray-900 mt-2">Delete User</h3>
              <div className="mt-2 px-7 py-3">
                <p className="text-sm text-gray-500">
                  Are you sure you want to delete the user "{userToDelete.name}"? This action cannot be undone.
                </p>
              </div>
              {deleteError && <p className="mt-4 text-sm text-red-600">{deleteError}</p>}
              <div className="flex justify-center space-x-4 mt-6">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteUser}
                  disabled={isDeleting}
                  className="px-4 py-2 text-sm font-medium rounded-lg transition-colors
                  disabled:bg-red-300 disabled:cursor-not-allowed
                  text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  {isDeleting ? (
                    <div className="flex items-center">
                      <Loader className="animate-spin h-4 w-4 mr-2" />
                      Deleting...
                    </div>
                  ) : (
                    'Delete'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View User Modal */}
      {showViewModal && viewingUser && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
          <div className="relative top-0 md:top-20 p-5 border w-full max-w-sm shadow-lg rounded-lg bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">User Details</h3>
              <div className="space-y-4 text-sm text-gray-700">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Full Name:</span>
                  <span>{viewingUser.name}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-medium">Email:</span>
                  <span>{viewingUser.email}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-medium">Role:</span>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleColor(viewingUser.role)}`}>
                    {viewingUser.role}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-medium">Created At:</span>
                  <span>{new Date(viewingUser.created_at).toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-medium">Updated At:</span>
                  <span>{new Date(viewingUser.updated_at).toLocaleString()}</span>
                </div>
              </div>
              <div className="flex justify-end mt-6">
                <button
                  onClick={() => setShowViewModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
