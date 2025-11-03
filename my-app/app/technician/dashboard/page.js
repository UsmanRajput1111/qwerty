"use client";
import { useEffect, useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { Briefcase, MapPin, Star } from 'lucide-react'; // Star icon import karein

// Star rating dikhane ke liye component
const StarRatingDisplay = ({ rating }) => {
    if (!rating) return null; // Agar rating nahi hai to kuch na dikhayein
    return (
        <div className="flex items-center gap-1">
            <span className="text-sm font-bold text-slate-600">{rating}.0</span>
            <Star size={16} className="text-amber-400" fill="currentColor"/>
        </div>
    );
};

export default function TechnicianDashboard() {
    const [user, setUser] = useState(null);
    const [jobs, setJobs] = useState([]);
    const [selectedJob, setSelectedJob] = useState(null);
    const router = useRouter();

    useEffect(() => {
        const userDataString = localStorage.getItem('user');
        if(userDataString){
            const userData = JSON.parse(userDataString);
            setUser(userData);
        }

        const token = localStorage.getItem('token');
        const fetchJobs = async () => {
            try {
                const { data } = await axios.get('/api/bookings', { headers: { Authorization: `Bearer ${token}` }});
                setJobs(data.data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
            } catch (error) {
                toast.error("Could not fetch assigned jobs.");
            }
        };
        if (token) fetchJobs();
        else router.push('/login');
    }, [router]);

    const handleUpdateStatus = async (jobId, status) => {
        const token = localStorage.getItem('token');
        const loadingToast = toast.loading('Updating status...');
        try {
            await axios.put(`/api/bookings/${jobId}`, { status }, { headers: { Authorization: `Bearer ${token}` }});
            setJobs(jobs.map(j => j._id === jobId ? {...j, status} : j));
            if (selectedJob?._id === jobId) {
                setSelectedJob({...selectedJob, status});
            }
            toast.success('Status updated!', { id: loadingToast });
        } catch (error) {
            toast.error('Update failed.', { id: loadingToast });
        }
    };

    const getStatusChip = (status) => {
        switch (status) {
            case 'Completed': return 'bg-green-100 text-green-800';
            case 'In Progress': return 'bg-blue-100 text-blue-800';
            case 'Pending': case 'Assigned': return 'bg-yellow-100 text-yellow-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <div className="max-w-7xl mx-auto">
            <div className="mb-8">
                <h2 className="text-3xl font-bold text-slate-800">Welcome, {user?.name}!</h2>
                <p className="text-slate-500 mt-1">Here are the jobs assigned to you.</p>
            </div>

            <div className="bg-white p-6 sm:p-8 rounded-xl shadow-lg">
                <h3 className="text-2xl font-bold text-slate-800 mb-6">My Assigned Jobs</h3>
                <div className="space-y-4">
                    {jobs.length > 0 ? jobs.map(job => (
                        <div key={job._id} className="p-4 border border-slate-200 rounded-lg flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:bg-slate-50 transition-colors">
                            <div className="flex-grow">
                                <p className="font-bold text-slate-700 text-lg">{job.serviceType}</p>
                                <p className="text-sm text-slate-500 mt-1">Customer: <span className="font-medium">{job.customer?.name || 'N/A'}</span></p>
                                <p className="text-sm text-slate-500">Date: {new Date(job.bookingDate).toLocaleString()}</p>
                            </div>
                            <div className="flex items-center gap-4 w-full sm:w-auto">
                                {/* Rating yahan dikhayein */}
                                {job.status === 'Completed' && <StarRatingDisplay rating={job.rating} />}
                                <span className={`px-4 py-1 text-sm font-semibold rounded-full ${getStatusChip(job.status)}`}>{job.status}</span>
                                <button onClick={() => setSelectedJob(job)} className="text-indigo-600 hover:text-indigo-800 font-semibold flex items-center">
                                    View Details <MapPin className="ml-2 h-4 w-4"/>
                                </button>
                            </div>
                        </div>
                    )) : 
                    <div className="text-center py-10"><Briefcase className="mx-auto h-12 w-12 text-slate-300" /><p className="mt-4 text-slate-500">You have no jobs assigned yet.</p></div>
                    }
                </div>
            </div>

            {selectedJob && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white p-8 rounded-lg shadow-2xl max-w-2xl w-full">
                        <h3 className="text-2xl font-bold mb-4">Job Details ({selectedJob.status})</h3>
                        <div className="mb-4 space-y-1 text-slate-600">
                            <p><strong>Customer:</strong> {selectedJob.customer?.name || 'N/A'}</p>
                            <p><strong>Phone:</strong> {selectedJob.customer?.profile?.phone || 'N/A'}</p>
                            <p><strong>Email:</strong> {selectedJob.customer?.email || 'N/A'}</p>
                            <p><strong>Address:</strong> {selectedJob.address}</p>
                        </div>
                        <div className="h-64 bg-slate-200 rounded-lg flex items-center justify-center mb-4">
                            <MapPin className="h-16 w-16 text-slate-400"/>
                            <p className="ml-4 text-slate-500">Google Map would be here.</p>
                        </div>
                        <div className="flex items-center gap-4">
                            {selectedJob.status === 'Assigned' && <button onClick={() => handleUpdateStatus(selectedJob._id, 'In Progress')} className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 font-semibold">Start Job</button>}
                            {selectedJob.status === 'In Progress' && <button onClick={() => handleUpdateStatus(selectedJob._id, 'Completed')} className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 font-semibold">Mark as Completed</button>}
                        </div>
                        <button onClick={() => setSelectedJob(null)} className="mt-6 w-full bg-slate-100 text-slate-700 py-2 rounded-lg hover:bg-slate-200 font-semibold">Close</button>
                    </div>
                </div>
            )}
        </div>
    );
}