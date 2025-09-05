export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'user' | 'manager';
  status: 'active' | 'inactive';
  createdAt: string;
  lastLogin?: string;
}

export interface Invoice {
  id: string;
  year: number;
  series: number;
  client_email: string;
  client_phone: string;
  amount: string;
  status: string;
  date: string;
  due_date: string;
  description: string | null;
  customer_id: number | null;
  created_at: string;
  updated_at: string;
}

// Define the type for the data received from the API
export interface ApiPayment {
  id: string;
  year: number;
  series: number;
  invoice_id: string;
  client_email: string;
  amount: string; // Amount is a string in the API response
  method: string;
  status: string;
  date: string;
  created_at: string;
  updated_at: string;
}

// Define the type that our component will use internally
export interface Payment {
  id: string;
  transactionId: string;
  invoiceNumber: string;
  clientName: string;
  amount: number;
  paymentMethod: string;
  status: 'completed' | 'pending' | 'failed' | 'refunded';
  paidAt: string;
  reference: string;
}

export type TopDebtor = {
    clientEmail: string;
    overdueInvoiceCount: number;
    outstanding: number;
  };

export type DashboardStats = {
    totalPendingPayments: number;
    totalCompletedPayments: number;
    totalOutstanding: number;
    paymentsThisMonth: number;
    totalActiveInvoices: number;
    paymentSuccessRate: number;
    paymentReceived: {
      today: number;
      thisWeek: number;
      thisMonth: number;
    };
    topDebtors: TopDebtor[];
  };

export interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
}