import React, { useState, useEffect, useMemo } from 'react';
import InvoiceManagement from './InvoiceManagement';
import UserManagement from './UserManagement';
import PaymentManagement from './PaymentManagement';
import { useAuth } from '../contexts/AuthContext';
import { DashboardStats } from '../types';
import { 
  BarChart3, 
  Users, 
  FileText, 
  CreditCard, 
  TrendingUp, 
  LogOut, 
  Bell, 
  Search, 
  Menu,
  Home,
  Settings,
  PieChart,
  DollarSign,
  AlertTriangle,
  Download,
  Filter,
  Calendar
} from 'lucide-react';
import {
  PieChart as RePieChart,
  Pie,
  Cell,
  Legend,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

const API_URL = import.meta.env.VITE_API_BASE_URL;

// Function to get a human-readable name from an email
const nameFromEmail = (email: string): string => {
  const base = email.split('@')[0] || '';
  return base
    .split(/[._-]+/)
    .map((p) => (p ? p[0].toUpperCase() + p.slice(1) : ''))
    .join(' ')
    .trim();
};

const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [dateFilter, setDateFilter] = useState('monthly');

  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  type Transaction = {
    id: string;
    client_email: string;
    amount: number;
    method: string;
    status: string;
    date: string;
  };
  
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  const PIE_COLORS = ['#60a5fa','#34d399','#fbbf24','#f87171','#a78bfa','#f472b6','#22d3ee','#c084fc'];

  // Payments by Method (from recent transactions)
  const methodData = useMemo(() => {
    const counts: Record<string, number> = {};
    (recentTransactions ?? []).forEach(tx => {
      const key = (tx.method || 'UNKNOWN').replace('_', ' ').toUpperCase();
      counts[key] = (counts[key] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [recentTransactions]);

  // Outstanding (top N debtors + Balance Outstanding as Others)
  const outstandingData = useMemo(() => {
    if (!dashboardStats?.topDebtors?.length) return [];
    const topN = 4;
    const sorted = [...dashboardStats.topDebtors].sort((a,b) => b.outstanding - a.outstanding);
    const top = sorted.slice(0, topN).map(d => ({
      name: d.clientEmail.split('@')[0],
      value: d.outstanding,
    }));

    const totalOutstanding = dashboardStats.totalOutstanding || 0;
    const topSum = top.reduce((acc, cur) => acc + cur.value, 0);
    const balanceOutstanding = totalOutstanding - topSum;

    return balanceOutstanding > 0 ? [...top, { name: 'Others', value: balanceOutstanding }] : top;
  }, [dashboardStats]);

  // Total Debtors (by overdue invoice count bins, from topDebtors list)
  const financeOverview = useMemo(() => {
    if (!dashboardStats) return [];

    return [
      { name: 'Outstanding', value: dashboardStats.totalOutstanding - dashboardStats.totalCompletedPayments - dashboardStats.totalPendingPayments },
      { name: 'Completed Payments', value: dashboardStats.totalCompletedPayments },
      { name: 'Pending Payments', value: dashboardStats.totalPendingPayments },
    ].filter(d => d.value > 0);
  }, [dashboardStats]);


  // New useEffect hook to fetch dashboard stats from the API
  useEffect(() => {
    const fetchDashboardStats = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error("No authorization token found.");
        setStatsLoading(false);
        return;
      }
      try {
        const response = await fetch(`${API_URL}/reports/overview`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setDashboardStats(data);
      } catch (error) {
        console.error("Failed to fetch dashboard stats:", error);
      } finally {
        setStatsLoading(false);
      }
    };
    fetchDashboardStats();
  }, []);

  // Fetch recent transactions on component mount
  useEffect(() => {
    const fetchRecentTransactions = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error("No authorization token found.");
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`${API_URL}/payments`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        // Assuming the data is an array of transactions under a 'data' key
        setRecentTransactions(data.data);
      } catch (error) {
        console.error("Failed to fetch recent transactions:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRecentTransactions();
  }, []); // Empty dependency array means this effect runs once when the component mounts
  
  const getPaymentValue = (dateFilter: string) => {
    if (!dashboardStats) return 0;
    switch (dateFilter) {
      case 'daily':
        return dashboardStats.paymentReceived.today;
      case 'weekly':
        return dashboardStats.paymentReceived.thisWeek;
      case 'monthly':
        return dashboardStats.paymentReceived.thisMonth;
      default:
        return dashboardStats.paymentReceived.thisMonth;
    }
  };


  // Conditionally render stats once data is available
  const stats = dashboardStats ? [
    {
      name: 'Total Outstanding',
      value: `LKR${dashboardStats.totalOutstanding.toLocaleString()}`,
      change: '', // API doesn't provide change, so we'll leave it empty
      changeType: 'increase',
      icon: AlertTriangle,
      color: 'bg-red-500'
    },
    {
      name: 'Monthly Payments',
      value: `LKR${dashboardStats.paymentsThisMonth.toLocaleString()}`,
      change: '',
      changeType: 'increase',
      icon: DollarSign,
      color: 'bg-green-500'
    },
    {
      name: 'Active Invoices',
      value: dashboardStats.totalActiveInvoices.toLocaleString(),
      change: '',
      changeType: 'increase',
      icon: FileText,
      color: 'bg-blue-500'
    },
    {
      name: 'Payment Success Rate',
      value: `${dashboardStats.paymentSuccessRate.toFixed(2)}%`,
      change: '',
      changeType: 'increase',
      icon: TrendingUp,
      color: 'bg-purple-500'
    }
  ] : [];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg">
        <div className="flex items-center h-16 px-6 border-b border-gray-200">
          <div className="flex items-center">
            <div className=" h-8 rounded-lg flex items-center justify-center">
              {/* <BarChart3 className="h-5 w-5 text-white" /> */}
              <img src="src/data/everpower_logo.png" alt="Logo" className="h-14 text-white" />
            </div>
            {/* <span className="ml-2 text-xl font-semibold text-gray-800">Everpower</span> */}
          </div>
        </div>

        <nav className="mt-6">
          <div className="px-3">
            <div className="space-y-1">
              <button
                onClick={() => setActiveTab('overview')}
                className={`w-full text-left ${
                  activeTab === 'overview'
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
                } group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors`}
              >
                <Home className="mr-3 h-5 w-5" />
                Overview
              </button>
              <button
                onClick={() => setActiveTab('invoices')}
                className={`w-full text-left ${
                  activeTab === 'invoices'
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
                } group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors`}
              >
                <FileText className="mr-3 h-5 w-5" />
                Invoice Management
              </button>
              {user?.role === 'admin' && (
              <button
                onClick={() => setActiveTab('users')}
                className={`w-full text-left ${
                  activeTab === 'users'
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
                } group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors`}
              >
                <Users className="mr-3 h-5 w-5" />
                User Management 
              </button>)}
              <button
                onClick={() => setActiveTab('payments')}
                className={`w-full text-left ${
                  activeTab === 'payments'
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
                } group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors`}
              >
                <CreditCard className="mr-3 h-5 w-5" />
                Payment Management
              </button>
              <button
                onClick={() => setActiveTab('analytics')}
                className={`w-full text-left ${
                  activeTab === 'analytics'
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
                } group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors`}
              >
                <PieChart className="mr-3 h-5 w-5" />
                Analytics
              </button>
              <button
                onClick={() => setActiveTab('settings')}
                className={`w-full text-left ${
                  activeTab === 'settings'
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
                } group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors`}
              >
                <Settings className="mr-3 h-5 w-5" />
                Settings
              </button>
            </div>
          </div>
        </nav>
      </div>

      {/* Main Content */}
      <div className="ml-64">
        {/* Top Navigation */}
        <div className="bg-white shadow-sm border-b border-gray-200">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <button className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 md:hidden">
                  <Menu className="h-6 w-6" /> 
                </button>
                Group B6
                
              </div>

              <div className="flex items-center space-x-4">
                

                
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-medium">
                        {user?.name?.charAt(0).toUpperCase()}{user?.name?.split(' ')[1]?.charAt(0).toUpperCase() || ''}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                    <div className="text-gray-700 text-sm font-medium truncate">
                      {user?.name}
                    </div>
                    <div className="text-gray-500 text-xs truncate">
                      {user?.role}
                    </div>
                  </div>
                </div>
                  
                  <button
                    onClick={logout}
                    className="p-2 rounded-full text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                    title="Logout"
                  >
                    <LogOut className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Dashboard Content */}
        <div className="p-6">
          {activeTab === 'overview' && (
            <>
              <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900">Financial Overview</h1>
                <p className="text-gray-600">Monitor your business performance and financial health.</p>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 mb-8">
                {statsLoading ? (
                    <div className="lg:col-span-4 text-center text-gray-500">Loading stats...</div>
                ) : (
                    stats.map((stat, index) => (
                      <div key={index} className="bg-white overflow-hidden shadow-sm rounded-lg hover:shadow-md transition-shadow duration-200">
                        <div className="p-3">
                          <div className="flex items-center">
                            <div className={`flex-shrink-0 p-3 rounded-lg ${stat.color}`}>
                              <stat.icon className="h-6 w-6 text-white" />
                            </div>
                            <div className="ml-5 w-0 flex-1">
                              <dl>
                                <dt className="text-sm font-medium text-gray-500 truncate">
                                  {stat.name}
                                </dt>
                                <dd className="flex items-baseline">
                                  <div className="text-2xl font-semibold text-gray-900">
                                    {stat.value}
                                  </div>
                                  <div className="ml-2 flex items-baseline text-sm font-semibold text-green-600">
                                    {stat.change}
                                  </div>
                                </dd>
                              </dl>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                )}
              </div>

              {/* Payment Tracking */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                <div className="bg-white p-6 rounded-lg shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-gray-900">Payments Received</h3>
                    <select
                      value={dateFilter}
                      onChange={(e) => setDateFilter(e.target.value)}
                      className="text-sm border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                    </select>
                  </div>
                  <div className="text-3xl font-bold text-green-600 mb-2">
                    LKR{getPaymentValue(dateFilter).toLocaleString()}
                  </div>
                  <p className="text-sm text-gray-500">
                    {dateFilter.charAt(0).toUpperCase() + dateFilter.slice(1)} payments received
                  </p>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Top Debtors</h3>
                  <div className="space-y-3">
                    {dashboardStats?.topDebtors.slice(0, 3).map((debtor, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{nameFromEmail(debtor.clientEmail)}</p>
                          <p className="text-xs text-gray-500">{debtor.overdueInvoiceCount} overdue</p>
                        </div>
                        <span className="text-sm font-semibold text-red-600">
                          LKR{debtor.outstanding.toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
                  <div className="space-y-2">
                    <button
                      onClick={() => setActiveTab('invoices')}
                      className="w-full text-left px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                    >
                      Create New Invoice
                    </button>
                    <button
                      onClick={() => setActiveTab('payments')}
                      className="w-full text-left px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                    >
                      Record Payment
                    </button>
                    <button
                      onClick={() => setActiveTab('users')}
                      className="w-full text-left px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                    >
                      Add New Client
                    </button>
                  </div>
                </div>
              </div>

              {/* Three Pie Charts: Outstanding / Total Debtors / Payment Method */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">

                {/* Finance Overview */}
                <div className="bg-white p-6 rounded-lg shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-gray-900">Amounts (Outstanding / Completed / Pending)</h3>
                    <span className="text-xs text-gray-500">
                      {(() => {
                        const total = (financeOverview ?? []).reduce((a, b) => a + Number(b.value || 0), 0);
                        return total > 0 ? `Total: LKR ${total.toLocaleString()}` : '';
                      })()}
                    </span>
                  </div>

                  {(!financeOverview || financeOverview.length === 0) ? (
                    <div className="text-sm text-gray-500">No amounts to display.</div>
                  ) : (
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <RePieChart>
                          <Pie
                            data={financeOverview}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            outerRadius={88}
                            paddingAngle={2}
                          >
                            {financeOverview.map((_, idx) => (
                              <Cell key={`amt-${idx}`} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip
                            formatter={(val: number, name: string) => [`LKR ${Number(val).toLocaleString()}`, name]}
                          />
                          <Legend verticalAlign="bottom" height={24} />
                        </RePieChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>

                {/* Outstanding */}
                <div className="bg-white p-6 rounded-lg shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-gray-900">Debtors</h3>
                    <span className="text-xs text-gray-500">
                      {dashboardStats?.totalOutstanding ? `LKR${dashboardStats.totalOutstanding.toLocaleString()}` : ''}
                    </span>
                  </div>
                  {(!outstandingData || outstandingData.length === 0) ? (
                    <div className="text-sm text-gray-500">No outstanding data.</div>
                  ) : (
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <RePieChart>
                          <Pie
                            data={outstandingData}
                            dataKey="value"
                            nameKey="name"
                            cx="50%" cy="50%"
                            innerRadius={48}
                            outerRadius={88}
                            paddingAngle={2}
                          >
                            {outstandingData.map((_, idx) => (
                              <Cell key={`o-${idx}`} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(val:number) => `LKR ${Number(val).toLocaleString()}`} />
                          <Legend verticalAlign="bottom" height={24} />
                        </RePieChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>

                
                {/* Payment Method */}
                <div className="bg-white p-6 rounded-lg shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-gray-900">Payment Method</h3>
                    <span className="text-xs text-gray-500">
                      {methodData.reduce((a,b)=>a+b.value,0)} total
                    </span>
                  </div>
                  {(methodData.length === 0) ? (
                    <div className="text-sm text-gray-500">No payment data yet.</div>
                  ) : (
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <RePieChart>
                          <Pie
                            data={methodData}
                            dataKey="value"
                            nameKey="name"
                            cx="50%" cy="50%"
                            innerRadius={48}
                            outerRadius={88}
                            paddingAngle={2}
                          >
                            {methodData.map((_, idx) => (
                              <Cell key={`m-${idx}`} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                          <Legend verticalAlign="bottom" height={24} />
                        </RePieChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>
              </div>


              {/* Recent Transactions */}
              <div className="bg-white rounded-lg shadow-sm">
                <div className="px-6 py-4 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium text-gray-900">Recent Transactions</h3>
                    <button onClick={()=>setActiveTab("payments")} className="text-sm text-blue-600 hover:text-blue-800">View all</button>
                  </div>
                </div>
                <div className="overflow-x-auto">
                {loading ? (
                    <div className="p-6 text-center text-gray-500">Loading recent transactions...</div>
                ) : (
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Transaction ID
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
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {(recentTransactions ?? []).slice(0, 5).map((transaction) => (
                        <tr key={transaction.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {transaction.id}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {transaction.client_email}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            LKR {Number(transaction.amount).toLocaleString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {transaction.method.replace('_', ' ').toUpperCase()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              transaction.status.toLowerCase() === 'completed'
                                ? 'bg-green-100 text-green-800'
                                : transaction.status.toLowerCase() === 'pending'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {transaction.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(transaction.date).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
                </div>
              </div>
            </>
          )}

          {activeTab == 'invoices' && (
            <InvoiceManagement />
          )}

          {activeTab == 'users' && (
            <UserManagement />
          )}

          {activeTab == 'payments' && (
            <PaymentManagement />
          )}


          {(activeTab == 'settings' || activeTab == 'analytics') && (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                {/* {activeTab === 'invoices' && <FileText className="h-8 w-8 text-blue-600" />}
                {activeTab === 'users' && <Users className="h-8 w-8 text-blue-600" />}
                {activeTab === 'payments' && <CreditCard className="h-8 w-8 text-blue-600" />} */}
                {activeTab === 'analytics' && <PieChart className="h-8 w-8 text-blue-600" />}
                {activeTab === 'settings' && <Settings className="h-8 w-8 text-blue-600" />}
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Management
              </h3>
              <p className="text-gray-500 mb-4">
                This section is under development. Full functionality coming soon.
              </p>
              <button
                onClick={() => setActiveTab('overview')}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Back to Overview
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;