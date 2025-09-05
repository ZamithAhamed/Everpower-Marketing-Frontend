import React, { useState, useEffect, useRef } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  Download, 
  Edit, 
  Trash2, 
  Eye, 
  Send,
  DollarSign,
  LucideProps,
  X,
  Check
} from 'lucide-react';

// Define the type for the invoice data based on your API response
interface Invoice {
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
  stripe_pdf_url: string;
  stripe_hosted_url: string | null; // Added new field for the hosted payment link
  over_due: string;
  customer_id: number | null;
  created_at: string;
  updated_at: string;
}

// Function to get a human-readable name from an email
const nameFromEmail = (email: string): string => {
  const base = email.split('@')[0] || '';
  return base
    .split(/[._-]+/)
    .map((p) => (p ? p[0].toUpperCase() + p.slice(1) : ''))
    .join(' ')
    .trim();
};

interface InvoiceModalProps {
  setShowModal: (show: boolean) => void;
  onInvoiceSaved: (message: string) => void;
  initialInvoice?: Invoice | null;
}

const API_URL = import.meta.env.VITE_API_BASE_URL;

// Separate component for the Create/Edit Invoice modal
const InvoiceModal: React.FC<InvoiceModalProps> = ({ setShowModal, onInvoiceSaved, initialInvoice = null }) => {
  const [clientEmail, setClientEmail] = useState(initialInvoice?.client_email || '');
  const [clientPhone, setClientPhone] = useState(initialInvoice?.client_phone || '');
  const [amount, setAmount] = useState<string>(initialInvoice?.amount || '');
  const [dueDate, setDueDate] = useState(initialInvoice ? initialInvoice.due_date.split('T')[0] : '');
  const [description, setDescription] = useState(initialInvoice?.description || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get today's date in YYYY-MM-DD format for the date input's min attribute
  const getTodayDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = (today.getMonth() + 1).toString().padStart(2, '0');
    const day = today.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const today = getTodayDate();

  const handleSaveInvoice = async () => {
    setLoading(true);
    setError(null);

    // Basic validation to prevent sending empty data
    if (!clientEmail.trim()) {
      setError('Client email is required.');
      setLoading(false);
      return;
    }

    if (amount.trim() === '' || isNaN(parseFloat(amount))) {
      setError('A valid amount is required.');
      setLoading(false);
      return;
    }

    if (!dueDate.trim()) {
      setError('Due date is required.');
      setLoading(false);
      return;
    }

    const token = localStorage.getItem('token'); 

    if (!token) {
      setError('Authentication token not found.');
      setLoading(false);
      return;
    }

    // Convert the 'YYYY-MM-DD' due date string to a full ISO 8601 string
    const formattedDueDate = new Date(dueDate).toISOString();

    const invoiceData = {
      clientEmail,
      clientPhone,
      amount: parseFloat(amount), 
      status: initialInvoice ? initialInvoice.status : 'PENDING',
      description,
      date: new Date().toISOString(),
      dueDate: formattedDueDate,
    };

    try {
      const isEditing = !!initialInvoice;
      // Changed the method from 'PUT' to 'PATCH' as requested
      const method = isEditing ? 'PATCH' : 'POST';
      const url = isEditing ? `${API_URL}/invoices/${initialInvoice.id}` : `${API_URL}/invoices`;

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(invoiceData),
      });

      if (!response.ok) {
        let errorMessage = `Failed to ${isEditing ? 'update' : 'create'} invoice.`;
        try {
          const errorData = await response.json();
          if (errorData.message) {
            errorMessage = errorData.message;
          }
        } catch (jsonError) {
          errorMessage = `Failed to ${isEditing ? 'update' : 'create'} invoice: ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      const message = `Invoice ${isEditing ? 'updated' : 'created'} successfully!`;
      onInvoiceSaved(message); // Trigger data refresh and toast message in parent component
      setShowModal(false);

    } catch (err: any) {
      console.error('API Error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <h3 className="text-lg font-medium text-gray-900 mb-4">{initialInvoice ? 'Edit Invoice' : 'Create New Invoice'}</h3>
          {error && <div className="text-red-500 text-sm mb-4">{error}</div>}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Client Email</label>
              <input
                type="text"
                value={clientEmail}
                onChange={(e) => setClientEmail(e.target.value)}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter client email"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Client Mobile</label>
              <input
                type="text"
                value={clientPhone}
                onChange={(e) => setClientPhone(e.target.value)}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter client mobile"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Amount</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Due Date</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                min={today}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Description</label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Invoice description"
              />
            </div>
          </div>
          <div className="flex justify-end space-x-3 mt-6">
            <button
              onClick={() => setShowModal(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              onClick={handleSaveInvoice}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md"
              disabled={loading}
            >
              {loading ? 'Saving...' : initialInvoice ? 'Save Changes' : 'Create Invoice'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

interface ConfirmationModalProps {
  show: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

// Reusable modal for confirming an action (like deletion)
const ConfirmationModal: React.FC<ConfirmationModalProps> = ({ show, title, message, onConfirm, onCancel }) => {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
      <div className="relative p-5 border w-96 shadow-lg rounded-md bg-white">
        <h3 className="text-lg font-medium text-gray-900 mb-4">{title}</h3>
        <p className="text-sm text-gray-600 mb-6">{message}</p>
        <div className="flex justify-end space-x-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

interface ViewInvoiceModalProps {
  show: boolean;
  onClose: () => void;
  invoice: Invoice;
}

// Declare the QRCode library from the global scope for TypeScript
declare global {
  interface Window {
    QRCode: any;
  }
}

// Modal for viewing invoice details
const ViewInvoiceModal: React.FC<ViewInvoiceModalProps> = ({ show, onClose, invoice }) => {
  if (!show) return null;

  const qrCodeCanvasRef = useRef<HTMLCanvasElement>(null);
  const printableRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (window.QRCode && invoice.stripe_hosted_url) {
      const canvas = qrCodeCanvasRef.current;
      if (canvas) {
        window.QRCode.toCanvas(canvas, invoice.stripe_hosted_url, (error: any) => {
          if (error) console.error('Failed to generate QR code', error);
        });
      }
    }
  }, [invoice]);

  const getStatusColor = (status: Invoice['status']) => {
    switch (status.toLowerCase()) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'sent':
        return 'bg-blue-100 text-blue-800';
      case 'overdue':
        return 'bg-red-100 text-red-800';
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handlePrint = () => {
    const node = printableRef.current;
    if (!node) return;

    const printWindow = window.open('', '', 'width=380,height=1000');
    if (!printWindow) return;

    // Capture canvas as image to ensure it prints reliably
    let qrImgHTML = '';
    if (qrCodeCanvasRef.current) {
      try {
        const dataUrl = qrCodeCanvasRef.current.toDataURL('image/png');
        qrImgHTML = `<img src="${dataUrl}" alt="QR Code" style="width:140px;height:140px;border-radius:0.5rem;border:1px solid #e5e7eb"/>`;
      } catch (e) {
        qrImgHTML = qrCodeCanvasRef.current.outerHTML;
      }
    }

    // Clone printable content and swap canvas with img if available
    const clone = node.cloneNode(true) as HTMLElement;
    const canvasInClone = clone.querySelector('canvas');
    if (canvasInClone && qrImgHTML) {
      const wrapper = document.createElement('div');
      wrapper.innerHTML = qrImgHTML;
      canvasInClone.replaceWith(wrapper.firstElementChild as HTMLElement);
    }

    printWindow.document.write(`
      <html>
        <head>
          <title>Invoice ${invoice.id}</title>
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" />
          <style>
            @media print {
              .no-print { display: none !important; }
              body { margin: 0; padding: 0; width: 80mm; }
            }
            body { font-size: 12px; line-height: 1.4; max-width: 80mm; margin: auto; }
          </style>
        </head>
        <body>
          ${clone.outerHTML}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => printWindow.print(), 300);
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
      <div className="relative p-6 sm:p-8 border w-full max-w-lg mx-auto shadow-lg rounded-md bg-white">
        {/* Header */}
        <div className="flex justify-between items-center pb-3 border-b border-gray-100">
          <h3 className="text-2xl font-bold text-gray-900">Invoice Details</h3>
          <div className="flex items-center gap-2">
            <button onClick={handlePrint} className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-gray-900 text-white text-sm font-medium hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 9V2h12v7M6 18h12v4H6v-4zM6 14h12a2 2 0 002-2v-1a2 2 0 00-2-2H6a2 2 0 00-2 2v1a2 2 0 002 2z" />
              </svg>
              Print / Save PDF
            </button>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600" aria-label="Close">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Printable Body */}
        <div ref={printableRef} className="mt-4 space-y-4 text-sm">
          <div className="flex justify-between items-center">
            <span className="font-medium text-gray-700">Invoice #</span>
            <span className="text-gray-900">{invoice.id}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="font-medium text-gray-700">Client</span>
            <div>
              <div className="text-right text-gray-900">{nameFromEmail(invoice.client_email)}</div>
              <div className="text-right text-gray-500 break-words">{invoice.client_email}</div>
            </div>
          </div>
          <div className="flex justify-between items-center">
            <span className="font-medium text-gray-700">Amount</span>
            <span className="text-right font-semibold text-gray-900">LKR {parseFloat(String(invoice.amount)).toLocaleString()}</span>
          </div>
          {invoice.over_due && parseFloat(String(invoice.over_due)) > 0 && (
            <div className="flex justify-between items-center">
              <span className="font-medium text-gray-700">Due Amount</span>
              <span className="text-lg font-semibold text-red-900">LKR {parseFloat(String(invoice.over_due)).toLocaleString()}</span>
            </div>
          )}
          <div className="flex justify-between items-center">
            <span className="font-medium text-gray-700">Status</span>
            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(invoice.status)}`}>
              {invoice.status}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="font-medium text-gray-700">Due Date</span>
            <span className="text-gray-900">{new Date(invoice.due_date).toLocaleDateString()}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="font-medium text-gray-700">Created</span>
            <span className="text-gray-900">{new Date(invoice.created_at).toLocaleString()}</span>
          </div>

          {invoice.description && (
            <div>
              <p className="font-medium text-gray-700 mb-1">Description</p>
              <p className="text-gray-900 bg-gray-50 p-3 rounded-md break-words whitespace-pre-wrap max-h-40 overflow-auto border border-gray-100">
                {invoice.description}
              </p>
            </div>
          )}

          {invoice.stripe_hosted_url && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h4 className="text-lg font-medium text-center text-gray-900 mb-4">Pay Online</h4>
              <div className="flex justify-center">
                {invoice.stripe_hosted_url && String(invoice.stripe_hosted_url).startsWith('http') ? (
                  <canvas ref={qrCodeCanvasRef} className="w-40 h-40 border rounded-md"></canvas>
                ) : (
                  <div className="text-sm text-center text-gray-500">Online payment link not available.</div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};


// Toast notification component
const Toast = ({ message, type, onClose }: { message: string, type: 'success' | 'error' | 'deletion', onClose: () => void }) => {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      onClose();
    }, 3000); // Toast disappears after 3 seconds

    return () => clearTimeout(timer);
  }, [onClose]);

  if (!visible) return null;

  // Use a switch case to determine the background color and icon based on the toast type
  let bgColor = '';
  let icon = null;

  switch (type) {
    case 'success':
      bgColor = 'bg-green-500';
      icon = <Check className="h-5 w-5" />;
      break;
    case 'deletion':
      bgColor = 'bg-red-200';
      icon = <Check className="h-5 w-5" />;
      break;
    case 'error':
      bgColor = 'bg-red-500';
      icon = <X className="h-5 w-5" />;
      break;
  }
  
  const textColor = type === 'deletion' ? 'text-red-800' : 'text-white';

  // Changed the positioning to top-right
  return (
    <div className={`fixed top-5 right-5 z-50 flex items-center p-4 rounded-md shadow-lg ${bgColor} ${textColor} transition-transform duration-300 transform-gpu`}>
      {icon}
      <span className="ml-3 text-sm font-medium">{message}</span>
      <button onClick={onClose} className="ml-auto -mr-1.5 p-1 rounded-full hover:bg-white hover:bg-opacity-20 transition-colors duration-200">
        <X className="h-4 w-4" />
      </button>
    </div>
  );
};


// Main component
const InvoiceManagement: React.FC = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [viewingInvoice, setViewingInvoice] = useState<Invoice | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState(() => () => {});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'success' | 'error' | 'deletion'>('success');
  
  // New useEffect to load the QR code library once
  useEffect(() => {
    const script = document.createElement('script');
    script.src = "https://cdn.jsdelivr.net/npm/qrcode@1.4.4/build/qrcode.min.js";
    script.async = true;
    document.body.appendChild(script);

    // Clean up the script tag when the component unmounts
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const showToast = (message: string, type: 'success' | 'error' | 'deletion') => {
    setToastMessage(message);
    setToastType(type);
  };
  
  const clearToast = () => {
    setToastMessage(null);
  };

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('token'); 
      if (!token) {
        throw new Error('No authentication token found.');
      }

      const response = await fetch(`${API_URL}/invoices`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      // Handle the 304 Not Modified status code specifically
      if (response.status === 304) {
        console.log("Data not modified, using cached version.");
        return; // Exit the function, no need to parse a response body
      }

      if (!response.ok) {
        throw new Error('Failed to fetch invoices.');
      }

      const result = await response.json();
      setInvoices(result.data);
    } catch (err: any) {
      setError(err.message);
      showToast('Failed to fetch invoices.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  const handleCreateClick = () => {
    setEditingInvoice(null);
    setShowModal(true);
  };

  const handleEditClick = (invoice: Invoice) => {
    setEditingInvoice(invoice);
    setShowModal(true);
  };

  // New function to handle viewing an invoice
  const handleViewClick = (invoice: Invoice) => {
    setViewingInvoice(invoice);
  };

  // New function to handle deleting an invoice
  const handleDeleteClick = (invoice: Invoice) => {
    setShowConfirmModal(true);
    setConfirmAction(() => async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('Authentication token not found.');
        }

        const response = await fetch(`${API_URL}/invoices/${invoice.id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to delete invoice.');
        }

        console.log('Invoice deleted successfully.');
        fetchInvoices(); // Refresh the list
        setShowConfirmModal(false);
        // Changed toast type to 'deletion' for a specific style
        showToast('Invoice deleted successfully!', 'deletion');
      } catch (err: any) {
        console.error('Delete API Error:', err);
        setError(err.message);
        setShowConfirmModal(false);
        showToast('Failed to delete invoice.', 'error');
      }
    });
  };

  const handleExport = () => {
    // Check if there are any invoices to export
    if (filteredInvoices.length === 0) {
      showToast("No invoices to export.", 'error');
      return;
    }
    
    // Create a CSV header row from the invoice keys. We'll manually specify an order for clarity.
    const headers = ["Invoice #", "Client Email", "Client Phone", "Amount", "Status", "Date", "Due Date", "Description"];
    
    // Map the invoice objects to CSV-friendly rows
    const csvRows = filteredInvoices.map(invoice => [
        invoice.id,
        `"${invoice.client_email}"`, // Enclose email in quotes to handle commas
        `"${invoice.client_phone}"`,
        invoice.amount,
        invoice.status,
        new Date(invoice.date).toLocaleDateString(),
        new Date(invoice.due_date).toLocaleDateString(),
        `"${invoice.description ? invoice.description.replace(/"/g, '""') : ''}"` // Handle quotes in description
    ]);
    
    // Combine the headers and the rows
    const csvContent = [
        headers.join(','),
        ...csvRows.map(row => row.join(','))
    ].join('\n');

    // Create a blob from the CSV content
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    // Create a temporary link and trigger the download
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'invoices_export.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showToast("Invoices exported successfully!", 'success');
  };

  const handleModalClose = () => {
    setShowModal(false);
    setEditingInvoice(null);
  }
  
  const handleViewModalClose = () => {
    setViewingInvoice(null);
  };

  const handleConfirmCancel = () => {
    setShowConfirmModal(false);
  };
  
  const handleInvoiceSaved = (message: string) => {
    fetchInvoices();
    showToast(message, 'success');
  };

  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = nameFromEmail(invoice.client_email).toLowerCase().includes(searchTerm.toLowerCase()) ||
                         invoice.id.toLowerCase().includes(searchTerm.toLowerCase()) || invoice.client_email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || invoice.status.toLowerCase() === statusFilter.toLowerCase();
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: Invoice['status']) => {
    switch (status.toLowerCase()) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'sent':
        return 'bg-blue-100 text-blue-800';
      case 'overdue':
        return 'bg-red-100 text-red-800';
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const totalAmount = filteredInvoices.reduce((sum, invoice) => sum + parseFloat(invoice.amount), 0);
  const pendingAmount = filteredInvoices.reduce((sum, invoice) => sum + parseFloat(invoice.over_due), 0);
  // const paidAmount = filteredInvoices
  //   .filter(invoice => invoice.status.toLowerCase() === 'paid')
  //   .reduce((sum, invoice) => sum + parseFloat(invoice.amount), 0);
  const paidAmount = totalAmount - pendingAmount; // Assuming paid amount is total minus pending
  const overdueAmount = filteredInvoices
    .filter(invoice => invoice.status.toLowerCase() === 'overdue')
    .reduce((sum, invoice) => sum + parseFloat(invoice.amount), 0);

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Invoice Management</h1>
            <p className="text-gray-600">Create, manage, and track your invoices</p>
          </div>
          <button
            onClick={handleCreateClick}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Invoice
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
          <div className="bg-white overflow-hidden shadow-sm rounded-lg">
            <div className="p-3">
              <div className="flex items-center">
                <div className="flex-shrink-0 p-3 rounded-lg bg-blue-500">
                  <DollarSign className="h-6 w-6 text-white" />
                </div>
                <div className="ml-2 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Amount</dt>
                    <dd className="text-xl font-semibold text-gray-900">
                      LKR {totalAmount.toLocaleString()}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow-sm rounded-lg">
            <div className="p-3">
              <div className="flex items-center">
                <div className="flex-shrink-0 p-3 rounded-lg bg-green-500">
                  <DollarSign className="h-6 w-6 text-white" />
                </div>
                <div className="ml-2 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Paid Amount</dt>
                    <dd className="text-xl font-semibold text-gray-900">
                      LKR {paidAmount.toLocaleString()}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow-sm rounded-lg">
            <div className="p-3">
              <div className="flex items-center">
                <div className="flex-shrink-0 p-3 rounded-lg bg-red-500">
                  <DollarSign className="h-6 w-6 text-white" />
                </div>
                <div className="ml-2 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Overdue Amount</dt>
                    <dd className="text-xl font-semibold text-gray-900">
                      LKR {overdueAmount.toLocaleString()}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-white overflow-hidden shadow-sm rounded-lg">
            <div className="p-3">
              <div className="flex items-center">
                <div className="flex-shrink-0 p-3 rounded-lg bg-gray-500">
                  <DollarSign className="h-6 w-6 text-white" />
                </div>
                <div className="ml-2 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Pending Amount</dt>
                    <dd className="text-xl font-semibold text-gray-900">
                      LKR {pendingAmount.toLocaleString()}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search invoices..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Status</option>
                <option value="draft">Draft</option>
                <option value="sent">Sent</option>
                <option value="paid">Paid</option>
                <option value="overdue">Overdue</option>
                <option value="cancelled">Cancelled</option>
              </select>
              {/* <button className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                <Filter className="h-4 w-4 mr-2" />
                Filter
              </button> */}
              <button onClick={handleExport} className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                <Download className="h-4 w-4 mr-2" />
                Export
              </button>
            </div>
          </div>
        </div>

        {/* Invoice Table */}
        {loading ? (
          <div className="text-center py-10 text-gray-500">Loading invoices...</div>
        ) : error ? (
          <div className="text-center py-10 text-red-500">Error: {error}</div>
        ) : (
          <div className="bg-white shadow-sm rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Invoice #
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Client
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Due Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredInvoices.map((invoice) => (
                    <tr key={invoice.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {invoice.id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{nameFromEmail(invoice.client_email)}</div>
                          <div className="text-sm text-gray-500">{invoice.client_email}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        LKR {parseFloat(invoice.amount).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(invoice.status)}`}>
                          {invoice.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(invoice.due_date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          {/* Updated to open the view modal */}
                          <button onClick={() => handleViewClick(invoice)} className="text-blue-600 hover:text-blue-900">
                            <Eye className="h-4 w-4" />
                          </button>
                          <button onClick={() => handleEditClick(invoice)} className="text-green-600 hover:text-green-900">
                            <Edit className="h-4 w-4" />
                          </button>
                          <button onClick={() => window.open(
                                invoice.stripe_pdf_url,
                                '_blank',
                                'noopener,noreferrer'
                              ) }className="text-purple-600 hover:text-purple-900">
                            <Download className="h-4 w-4" />
                          </button>
                          {/* Updated to open the confirmation modal */}
                          <button onClick={() => handleDeleteClick(invoice)} className="text-red-600 hover:text-red-900">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Create/Edit Invoice Modal */}
        {showModal && <InvoiceModal setShowModal={handleModalClose} onInvoiceSaved={handleInvoiceSaved} initialInvoice={editingInvoice} />}

        {/* View Invoice Modal */}
        {viewingInvoice && <ViewInvoiceModal show={!!viewingInvoice} onClose={handleViewModalClose} invoice={viewingInvoice} />}

        {/* Confirmation Modal for deletion */}
        {showConfirmModal && (
          <ConfirmationModal
            show={showConfirmModal}
            title="Confirm Deletion"
            message="Are you sure you want to delete this invoice? This action cannot be undone."
            onConfirm={confirmAction}
            onCancel={handleConfirmCancel}
          />
        )}

        {/* Toast Notification */}
        {toastMessage && <Toast message={toastMessage} type={toastType} onClose={clearToast} />}
      </div>
    </>
  );
};

export default InvoiceManagement;
