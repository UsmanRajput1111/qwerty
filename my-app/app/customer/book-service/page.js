"use client";
import { useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import toast, { Toaster } from 'react-hot-toast';

export default function BookServicePage() {
    const [serviceType, setServiceType] = useState('Solar Panel Cleaning');
    const [address, setAddress] = useState('');
    const [bookingDate, setBookingDate] = useState('');
    const [wantsSubscription, setWantsSubscription] = useState(false);

    // States for payment modal
    const [modalState, setModalState] = useState({ type: null, bookingId: null });
    const [transactionId, setTransactionId] = useState('');

    const router = useRouter();

    const handleBookingSubmit = async (e) => {
        e.preventDefault();
        const loadingToast = toast.loading('Creating booking...');
        const token = localStorage.getItem('token');
        try {
            const { data } = await axios.post('/api/bookings',
                {
                    serviceType,
                    address,
                    bookingDate,
                    wantsSubscription
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            toast.success('Booking created! Please select a payment method.', { id: loadingToast });
            // Open the payment method selection modal
            setModalState({ type: 'select_method', bookingId: data.data._id });
        } catch (error) {
            toast.error(error.response?.data?.message || 'Booking failed', { id: loadingToast });
        }
    };

    const openTransactionModal = () => {
        setModalState({ ...modalState, type: 'enter_tid' });
    };

    const handleTidSubmit = async (e) => {
        e.preventDefault();
        if (!transactionId.trim()) {
            toast.error("Please enter a valid Transaction ID.");
            return;
        }
        const loadingToast = toast.loading('Submitting for verification...');
        const token = localStorage.getItem('token');
        try {
            await axios.put(`/api/bookings/${modalState.bookingId}`,
                {
                    payment: {
                        method: 'Easypaisa/Jazzcash',
                        status: 'Pending',
                        paymentId: transactionId
                    }
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            toast.success('TID submitted! Admin will approve the payment shortly.', { id: loadingToast });
            setModalState({ type: null, bookingId: null });
            router.push('/customer/dashboard');
        } catch (error) {
            toast.error('Submission failed. Please try again.', { id: loadingToast });
        }
    };

    const handleCodSubmit = async () => {
        const loadingToast = toast.loading('Setting payment method...');
        const token = localStorage.getItem('token');
        try {
            await axios.put(`/api/bookings/${modalState.bookingId}`,
                { payment: { method: 'Cash on Delivery', status: 'Pending' } },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            toast.success('Cash on Delivery selected.', { id: loadingToast });
            setModalState({ type: null, bookingId: null });
            router.push('/customer/dashboard');
        } catch (error) {
            toast.error('Failed to set payment method.', { id: loadingToast });
        }
    };

    return (
        <>
            <div className="min-h-screen bg-gray-100 flex items-center justify-center">
                <Toaster />
                <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-lg">
                    <h2 className="text-2xl font-bold text-center mb-6">Schedule Your Service</h2>
                    <form onSubmit={handleBookingSubmit} className="space-y-4">
                        <div>
                            <label className="block text-gray-700">Service Type</label>
                            <select value={serviceType} onChange={(e) => setServiceType(e.target.value)} className="w-full px-3 py-2 border rounded-lg">
                                <option>Solar Panel Cleaning</option>
                                <option>Solar Panel Installation</option>
                                <option>Solar Foundation</option>
                            </select>
                        </div>
                        <div className="mb-4 p-4 bg-slate-50 rounded-lg text-slate-600">
                            <h4 className="font-semibold text-slate-800">Transparent Pricing</h4>
                            <ul className="list-disc list-inside mt-2 text-sm">
                                <li>Standard Cleaning: 1500</li>
                                <li>Solar Installation: 2500</li>
                                <li>Solar Foundation: 2000</li>

                                <li>Annual Subscription: 12000</li>
                            </ul>
                        </div>
                        <div>
                            <label className="block text-gray-700">Full Address</label>
                            <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} className="w-full px-3 py-2 border rounded-lg" required />
                        </div>
                        <div>
                            <label className="block text-gray-700">Date & Time</label>
                            <input
                                type="datetime-local"
                                value={bookingDate}
                                onChange={(e) => setBookingDate(e.target.value)}
                                className="w-full px-3 py-2 border rounded-lg"
                                required
                                min={new Date().toISOString().slice(0, 16)}
                            />
                        </div>

                        <div className="flex items-center p-4 bg-slate-50 rounded-lg">
                            <input
                                type="checkbox"
                                id="subscription"
                                checked={wantsSubscription}
                                onChange={(e) => setWantsSubscription(e.target.checked)}
                                className="h-5 w-5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                            />
                            <label htmlFor="subscription" className="ml-3 block text-sm text-gray-900">
                                <span className="font-semibold">Sign up for Annual Subscription (1200 RS/year)</span>
                                <span className="block text-xs text-gray-500">Get priority service and exclusive discounts!</span>
                            </label>
                        </div>
                        <button type="submit" className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600">
                            Proceed to Payment
                        </button>
                    </form>
                </div>
            </div>

            {/* Payment Modals */}
            {modalState.type && (
                <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
                    <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md">
                        {modalState.type === 'select_method' && (
                            <>
                                <h3 className="text-2xl font-bold mb-6 text-center">Select Payment Method</h3>
                                <div className="space-y-4">
                                    <button onClick={openTransactionModal} className="w-full bg-green-500 text-white py-3 rounded-lg hover:bg-green-600 font-semibold">
                                        Pay with Easypaisa / Jazzcash
                                    </button>
                                    <button onClick={handleCodSubmit} className="w-full bg-orange-500 text-white py-3 rounded-lg hover:bg-orange-600 font-semibold">
                                        Cash on Delivery
                                    </button>
                                </div>
                            </>
                        )}
                        {modalState.type === 'enter_tid' && (
                            <>
                                <h3 className="text-2xl font-bold mb-4 text-center">Confirm Your Payment</h3>
                                <p className="text-center text-gray-600 mb-4">
                                    Please send the payment to <strong className="text-black">0313-4190776</strong> and enter the Transaction ID (TID/TRX ID) you receive via SMS.
                                </p>
                                <form onSubmit={handleTidSubmit}>
                                    <div className="mb-4">
                                        <label className="block text-gray-700">Transaction ID (TID)</label>
                                        <input
                                            type="text"
                                            value={transactionId}
                                            onChange={(e) => setTransactionId(e.target.value)}
                                            className="w-full px-3 py-2 border rounded-lg"
                                            placeholder="e.g., 1234567890"
                                            required
                                        />
                                    </div>
                                    <button type="submit" className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600">
                                        Submit for Verification
                                    </button>
                                </form>
                            </>
                        )}
                        <button onClick={() => setModalState({ type: null, bookingId: null })} className="mt-6 w-full text-center text-gray-600 hover:underline">Cancel</button>
                    </div>
                </div>
            )}
        </>
    );
}
