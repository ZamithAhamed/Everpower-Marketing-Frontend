import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  Download, 
  Edit, 
  Trash2, 
  Eye,
  CreditCard,
  DollarSign,
  TrendingUp,
  CheckCircle,
  Clock,
  XCircle,
  AlertTriangle
} from 'lucide-react';

import { ApiPayment, Payment } from '../types';

const API_URL = import.meta.env.VITE_API_BASE_URL;


const PaymentManagement: React.FC = () => {
  // State for storing the payments data
  const [payments, setPayments] = useState<Payment[]>([]);
  // State to track if the data is being loaded
  const [loading, setLoading] = useState<boolean>(true);
  // State for any errors that occur during the fetch
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [methodFilter, setMethodFilter] = useState('all');
  
  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Data for the currently selected/edited payment
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null);

  // Form and submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  
  // State for the new payment form data
  const [newPayment, setNewPayment] = useState({
    invoiceId: '',
    clientEmail: '',
    amount: '',
    method: 'CASH',
    status: 'COMPLETED',
    reference: '',
    date: ''
  });

  // Function to fetch payments from the API
  const fetchPayments = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('token');
      
      const response = await fetch(`${API_URL}/payments`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      const mappedData: Payment[] = result.data.map((item: ApiPayment) => ({
        id: item.id,
        transactionId: item.id,
        invoiceNumber: item.invoice_id,
        clientName: item.client_email,
        amount: parseFloat(item.amount),
        paymentMethod: item.method.toLowerCase().replace('_', ' '),
        status: item.status.toLowerCase() as Payment['status'],
        paidAt: new Date(item.date).toLocaleDateString(),
        reference: '' // The provided API response example doesn't have a reference field, so we set it to empty
      }));

      setPayments(mappedData);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  // useEffect hook to fetch data when the component mounts
  useEffect(() => {
    fetchPayments();
  }, []);

  // Function to handle form input changes for the create modal
  const handleCreateInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewPayment(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  // Function to handle form input changes for the update modal
  const handleUpdateInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setEditingPayment(prevState => {
      if (!prevState) return null;
      return {
        ...prevState,
        [name]: value
      };
    });
  };
  
  // Function to handle creating a new payment
  const handleCreatePayment = async () => {
    setIsSubmitting(true);
    setSubmitError(null);

    const formattedPaymentDate = new Date(newPayment.date).toISOString();

    const payload = {
      invoiceId: newPayment.invoiceId,
      amount: parseFloat(newPayment.amount),
      method: newPayment.method,
      status: newPayment.status,
      date: formattedPaymentDate,
      clientEmail: newPayment.clientEmail,
      reference: newPayment.reference,
    };
    
    const token = localStorage.getItem("token");

    try {
      const response = await fetch(`${API_URL}/payments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });


      if (!response.ok) {
        const errorData = await response.json();
        const errorMessage = errorData.message || 'An unknown error occurred.';
        throw new Error(errorMessage);
      }

      setShowCreateModal(false);
      setNewPayment({
        invoiceId: '',
        clientEmail: '',
        amount: '',
        method: 'BANK_TRANSFER',
        status: 'COMPLETED',
        reference: '',
        date: ''
      });
      await fetchPayments();

    } catch (e: any) {
      setSubmitError(e.message);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Function to handle updating an existing payment
  const handleUpdatePayment = async () => {
    if (!editingPayment) return;

    setIsSubmitting(true);
    setSubmitError(null);

    const payload = {
      status: editingPayment.status.toUpperCase(),
      reference: editingPayment.reference,
    };
    
    const token = localStorage.getItem("token");

    try {
      const response = await fetch(`${API_URL}/payments/${editingPayment.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json();
        const errorMessage = errorData.message || 'An unknown error occurred.';
        throw new Error(errorMessage);
      }

      setShowUpdateModal(false);
      setEditingPayment(null);
      await fetchPayments();

    } catch (e: any) {
      setSubmitError(e.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Function to handle deleting a payment
  const handleDeletePayment = async () => {
    if (!selectedPayment) return;

    setIsSubmitting(true);
    setSubmitError(null);
    
    const token = localStorage.getItem("token");

    try {
      const response = await fetch(`${API_URL}/payments/${selectedPayment.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        const errorMessage = errorData.message || 'An unknown error occurred.';
        throw new Error(errorMessage);
      }
      
      setShowDeleteModal(false);
      setSelectedPayment(null);
      await fetchPayments();

    } catch (e: any) {
      setSubmitError(e.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter payments based on search term and selected filters
  const filteredPayments = payments.filter(payment => {
    const matchesSearch = payment.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         payment.transactionId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         payment.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || payment.status === statusFilter;
    const matchesMethod = methodFilter === 'all' || payment.paymentMethod.replace(' ', '_') === methodFilter.replace(' ', '_');
    return matchesSearch && matchesStatus && matchesMethod;
  });

  // Helper function to get the color for a status tag
  const getStatusColor = (status: Payment['status']) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'refunded':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Helper function to get the icon for a status tag
  const getStatusIcon = (status: Payment['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'refunded':
        return <AlertTriangle className="h-4 w-4 text-purple-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  // Helper function to get the color for a payment method tag
  const getMethodColor = (method: string) => {
    switch (method.toLowerCase().replace(' ', '_')) {
      case 'credit_card':
        return 'bg-blue-100 text-blue-800';
      case 'bank_transfer':
        return 'bg-green-100 text-green-800';
      case 'cash':
        return 'bg-yellow-100 text-yellow-800';
      case 'check':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Function to handle the export to CSV
  const exportToCsv = () => {
    const headers = [
      "Transaction ID",
      "Invoice Number",
      "Client Name",
      "Amount",
      "Payment Method",
      "Status",
      "Paid At"
    ];
    
    const csvRows = filteredPayments.map(payment => [
      `"${payment.transactionId}"`,
      `"${payment.invoiceNumber}"`,
      `"${payment.clientName}"`,
      payment.amount.toFixed(2),
      `"${payment.paymentMethod}"`,
      `"${payment.status}"`,
      `"${payment.paidAt}"`
    ]);
    
    const csvString = [
      headers.join(','),
      ...csvRows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'payments.csv');
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };


  // Calculate summary statistics
  const totalAmount = filteredPayments.reduce((sum, payment) => sum + payment.amount, 0);
  const completedAmount = filteredPayments
    .filter(payment => payment.status === 'completed')
    .reduce((sum, payment) => sum + payment.amount, 0);
  const pendingAmount = filteredPayments
    .filter(payment => payment.status === 'pending')
    .reduce((sum, payment) => sum + payment.amount, 0);

  return (
    <div className="space-y-6 bg-gray-50 p-6 rounded-lg font-sans">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payment Management</h1>
          <p className="text-gray-600">Track and manage all payment transactions</p>
        </div>
        <button
          onClick={() => {
            setShowCreateModal(true);
            setSubmitError(null);
          }}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
        >
          <Plus className="h-4 w-4 mr-2" />
          Record Payment
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        <div className="bg-white overflow-hidden shadow-md rounded-lg transform hover:scale-105 transition-transform">
          <div className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 p-3 rounded-lg bg-blue-500">
                <DollarSign className="h-6 w-6 text-white" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Payments</dt>
                  <dd className="text-2xl font-semibold text-gray-900">
                    LKR {totalAmount.toLocaleString()}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow-md rounded-lg transform hover:scale-105 transition-transform">
          <div className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 p-3 rounded-lg bg-green-500">
                <CheckCircle className="h-6 w-6 text-white" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Completed</dt>
                  <dd className="text-2xl font-semibold text-gray-900">
                    LKR {completedAmount.toLocaleString()}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow-md rounded-lg transform hover:scale-105 transition-transform">
          <div className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 p-3 rounded-lg bg-yellow-500">
                <Clock className="h-6 w-6 text-white" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Pending</dt>
                  <dd className="text-2xl font-semibold text-gray-900">
                    LKR {pendingAmount.toLocaleString()}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search payments..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            >
              <option value="all">All Status</option>
              <option value="completed">Completed</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
              <option value="refunded">Refunded</option>
            </select>
            <select
              value={methodFilter}
              onChange={(e) => setMethodFilter(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            >
              <option value="all">All Methods</option>
              <option value="credit_card">Credit Card</option>
              <option value="bank_transfer">Bank Transfer</option>
              <option value="cash">Cash</option>
              <option value="check">Check</option>
            </select>
            {/* <button className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors">
              <Filter className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Filter</span>
            </button> */}
            <button
              onClick={exportToCsv}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors">
              <Download className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Export</span>
            </button>
          </div>
        </div>
      </div>

      {/* Payment Table */}
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        {loading && (
          <div className="p-4 text-center text-gray-500">
            Loading payments...
          </div>
        )}
        {error && (
          <div className="p-4 text-center text-red-500">
            Error: {error}
          </div>
        )}
        {!loading && !error && filteredPayments.length === 0 && (
          <div className="p-4 text-center text-gray-500">
            No payments found.
          </div>
        )}
        {!loading && !error && filteredPayments.length > 0 && (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Transaction ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Invoice
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Client
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Method
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredPayments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {payment.transactionId}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {payment.invoiceNumber}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {payment.clientName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      LKR {payment.amount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getMethodColor(payment.paymentMethod)}`}>
                        {payment.paymentMethod.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {getStatusIcon(payment.status)}
                        <span className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(payment.status)}`}>
                          {payment.status.toUpperCase()}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {payment.paidAt}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => { setSelectedPayment(payment); setShowViewModal(true); }}
                          className="text-blue-600 hover:text-blue-900 transition-colors"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => { setEditingPayment(payment); setShowUpdateModal(true); setSubmitError(null); }}
                          className="text-green-600 hover:text-green-900 transition-colors"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => { setSelectedPayment(payment); setShowDeleteModal(true); setSubmitError(null); }}
                          className="text-red-600 hover:text-red-900 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Record Payment Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50 p-4">
          <div className="relative p-5 border w-full max-w-sm shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Record New Payment</h3>
              {submitError && (
                <div className="p-3 mb-4 text-sm text-red-700 bg-red-100 rounded-lg" role="alert">
                  {submitError}
                </div>
              )}
              <div className="space-y-4">
                <div>
                  <label htmlFor="invoiceId" className="block text-sm font-medium text-gray-700">Invoice ID</label>
                  <input
                    type="text"
                    id="invoiceId"
                    name="invoiceId"
                    value={newPayment.invoiceId}
                    onChange={handleCreateInputChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="INV-2025-0007"
                  />
                </div>
                <div>
                  <label htmlFor="clientEmail" className="block text-sm font-medium text-gray-700">Client Email</label>
                  <input
                    type="email"
                    id="clientEmail"
                    name="clientEmail"
                    value={newPayment.clientEmail}
                    onChange={handleCreateInputChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="client@everpower.com"
                  />
                </div>
                <div>
                  <label htmlFor="amount" className="block text-sm font-medium text-gray-700">Amount</label>
                  <input
                    type="number"
                    id="amount"
                    name="amount"
                    value={newPayment.amount}
                    onChange={handleCreateInputChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label htmlFor="method" className="block text-sm font-medium text-gray-700">Payment Method</label>
                  <select
                    id="method"
                    name="method"
                    value={newPayment.method}
                    onChange={handleCreateInputChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="CARD">Card</option>
                    <option value="BANK_TRANSFER">Bank Transfer</option>
                    <option value="CASH">Cash</option>
                    <option value="CHEQUE">Cheque</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="status" className="block text-sm font-medium text-gray-700">Status</label>
                  <select
                    id="status"
                    name="status"
                    value={newPayment.status}
                    onChange={handleCreateInputChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="COMPLETED">Completed</option>
                    <option value="PENDING">Pending</option>
                    <option value="FAILED">Failed</option>
                    <option value="REFUNDED">Refunded</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="reference" className="block text-sm font-medium text-gray-700">Reference</label>
                  <input
                    type="text"
                    id="reference"
                    name="reference"
                    value={newPayment.reference}
                    onChange={handleCreateInputChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="HSBC transfer ref #987654"
                  />
                </div>
                <div>
                  <label htmlFor="date" className="block text-sm font-medium text-gray-700">Date</label>
                  <input
                    type="date"
                    id="date"
                    name="date"
                    value={newPayment.date}
                    onChange={handleCreateInputChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreatePayment}
                  disabled={isSubmitting}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${isSubmitting ? 'bg-blue-300 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
                >
                  {isSubmitting ? 'Recording...' : 'Record Payment'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Update Payment Modal */}
      {showUpdateModal && editingPayment && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50 p-4">
          <div className="relative p-5 border w-full max-w-sm shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Update Payment</h3>
              {submitError && (
                <div className="p-3 mb-4 text-sm text-red-700 bg-red-100 rounded-lg" role="alert">
                  {submitError}
                </div>
              )}
              <div className="space-y-4">
                <div>
                  <label htmlFor="invoiceId" className="block text-sm font-medium text-gray-700">Invoice ID</label>
                  <input
                    type="text"
                    id="invoiceId"
                    name="invoiceId"
                    value={editingPayment.invoiceNumber}
                    disabled
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 bg-gray-100 text-gray-500"
                  />
                </div>
                <div>
                  <label htmlFor="status" className="block text-sm font-medium text-gray-700">Status</label>
                  <select
                    id="status"
                    name="status"
                    value={editingPayment.status}
                    onChange={handleUpdateInputChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="completed">Completed</option>
                    <option value="pending">Pending</option>
                    <option value="failed">Failed</option>
                    <option value="refunded">Refunded</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="reference" className="block text-sm font-medium text-gray-700">Reference</label>
                  <input
                    type="text"
                    id="reference"
                    name="reference"
                    value={editingPayment.reference}
                    onChange={handleUpdateInputChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="HSBC transfer ref #987654"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowUpdateModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdatePayment}
                  disabled={isSubmitting}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${isSubmitting ? 'bg-green-300 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700 text-white'}`}
                >
                  {isSubmitting ? 'Updating...' : 'Update Payment'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedPayment && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50 p-4">
          <div className="relative p-5 border w-full max-w-sm shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
              <AlertTriangle className="mx-auto h-12 w-12 text-red-500" />
              <h3 className="text-lg font-medium text-gray-900 mt-2">Delete Payment</h3>
              <div className="mt-2 px-7 py-3">
                <p className="text-sm text-gray-500">
                  Are you sure you want to delete the payment for invoice **{selectedPayment.invoiceNumber}**? This action cannot be undone.
                </p>
              </div>
              {submitError && (
                <div className="p-3 mb-4 text-sm text-red-700 bg-red-100 rounded-lg" role="alert">
                  {submitError}
                </div>
              )}
              <div className="flex justify-center space-x-4 mt-4">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeletePayment}
                  disabled={isSubmitting}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${isSubmitting ? 'bg-red-300 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700 text-white'}`}
                >
                  {isSubmitting ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View Payment Modal */}
      {showViewModal && selectedPayment && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50 p-4">
          <div className="relative p-5 border w-full max-w-lg shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-6">Payment Details</h3>
              <div className="space-y-4 text-sm text-gray-800">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Transaction ID:</span>
                  <span>{selectedPayment.transactionId}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-medium">Invoice Number:</span>
                  <span>{selectedPayment.invoiceNumber}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-medium">Client Name:</span>
                  <span>{selectedPayment.clientName}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-medium">Amount:</span>
                  <span>LKR {selectedPayment.amount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-medium">Payment Method:</span>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getMethodColor(selectedPayment.paymentMethod)}`}>
                    {selectedPayment.paymentMethod.toUpperCase()}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-medium">Status:</span>
                  <div className="flex items-center">
                    {getStatusIcon(selectedPayment.status)}
                    <span className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedPayment.status)}`}>
                      {selectedPayment.status.toUpperCase()}
                    </span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-medium">Date:</span>
                  <span>{selectedPayment.paidAt}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-medium">Reference:</span>
                  <span>{selectedPayment.reference || 'N/A'}</span>
                </div>
              </div>
              <div className="flex justify-end mt-6">
                <button
                  onClick={() => { setShowViewModal(false); setSelectedPayment(null); }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
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

export default PaymentManagement;
