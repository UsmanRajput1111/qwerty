"use client";
import { useEffect, useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

export default function ApprovePaymentsPage() {
    const [pendingPayments, setPendingPayments] = useState([]);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        const token = localStorage.getItem('token');
        try {
            const bookingsRes = await axios.get('/api/bookings', { headers: { Authorization: `Bearer ${token}` } });
            
            // ✅ Show both Easypaisa/Jazzcash and Cash on Delivery if status = Pending
            const filteredPayments = bookingsRes.data.data.filter(b => 
                b.payment &&
                (b.payment.method === 'Easypaisa/Jazzcash' || b.payment.method === 'Cash on Delivery') &&
                b.payment.status === 'Pending'
            );

            setPendingPayments(filteredPayments);
        } catch (error) {
            toast.error("Could not fetch payment data.");
        }
    };

    const handleApprovePayment = async (bookingId) => {
        const token = localStorage.getItem('token');
        const loadingToast = toast.loading("Approving payment...");
        try {
            await axios.put(
                `/api/bookings/${bookingId}`,
                { payment: { status: 'Paid' } },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            toast.success("Payment approved!", { id: loadingToast });
            fetchData(); // Refresh list
        } catch (error) {
            toast.error("Approval failed.", { id: loadingToast });
        }
    };

    return (
        <div className="p-6">
            <h2 className="text-3xl font-bold mb-6">Approve Payments</h2>
            <div className="bg-white p-6 rounded-lg shadow">
                {pendingPayments.length > 0 ? (
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50 border-b">
                                <th className="p-3">Customer</th>
                                <th className="p-3">Payment Method</th>
                                <th className="p-3">Transaction ID</th>
                                <th className="p-3">Booking Date</th>
                                <th className="p-3">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {pendingPayments.map(booking => (
                                <tr key={booking._id} className="border-b hover:bg-gray-50">
                                    <td className="p-3">{booking.customer?.name || "N/A"}</td>
                                    <td className="p-3">{booking.payment?.method || "N/A"}</td>
                                    <td className="p-3">{booking.payment?.paymentId || "-"}</td>
                                    <td className="p-3">{new Date(booking.bookingDate).toLocaleDateString()}</td>
                                    <td className="p-3">
                                        <button
                                            onClick={() => handleApprovePayment(booking._id)}
                                            className="bg-green-500 text-white px-3 py-1 rounded-lg text-sm hover:bg-green-600"
                                        >
                                            Approve
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <p className="text-gray-600 text-center">No pending payments to approve.</p>
                )}
            </div>
        </div>
    );
}
