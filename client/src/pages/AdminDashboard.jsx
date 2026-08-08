import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Shield, Search, Filter, LayoutDashboard, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

import useAutoLogout from '../hooks/useAutoLogout';

export default function AdminDashboard() {
  useAutoLogout(); // 15-minute inactivity auto-logout
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    try {
      const res = await api.get('/tickets/admin/all');
      setTickets(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const updateTicket = async (id, field, value) => {
    try {
      // Optimistic update
      setTickets(tickets.map(t => t._id === id ? { ...t, [field]: value } : t));
      
      const payload = {};
      payload[field] = value;
      await api.patch(`/tickets/${id}`, payload);
      
    } catch (err) {
      console.error("Failed to update ticket", err);
      // Revert on failure
      fetchTickets();
    }
  };

  const getMetrics = () => {
    const total = tickets.length;
    const pending = tickets.filter(t => t.status === 'Open' || t.status === 'Pending').length;
    const inProgress = tickets.filter(t => t.status === 'In Progress' || t.status === 'Assigned').length;
    const resolved = tickets.filter(t => t.status === 'Resolved').length;
    return { total, pending, inProgress, resolved };
  };

  const metrics = getMetrics();

  return (
    <div className="min-h-screen bg-slate-100 flex">
      <aside className="w-64 bg-slate-900 text-white flex flex-col">
        <div className="h-16 flex items-center px-6 gap-2 border-b border-slate-800">
          <Shield className="text-emerald-500" /> <span className="font-bold text-xl">Admin Portal</span>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <a href="#" className="flex items-center gap-3 bg-emerald-600/20 text-emerald-400 px-4 py-3 rounded-lg"><LayoutDashboard size={20} /> Dashboard</a>
          <a href="#" className="flex items-center gap-3 text-slate-400 hover:text-white px-4 py-3 rounded-lg"><Settings size={20} /> Settings</a>
        </nav>
        <div className="p-4 border-t border-slate-800">
          <button onClick={() => { logout(); navigate('/login'); }} className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 py-2 rounded">Logout</button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="h-16 bg-white shadow-sm flex items-center px-8 justify-between flex-shrink-0">
          <h1 className="font-semibold text-slate-800 text-lg">Command Center</h1>
          <div className="text-sm font-medium text-slate-600 flex items-center gap-2">
            <div className="w-8 h-8 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center font-bold">A</div>
            {user?.name || 'Admin'}
          </div>
        </header>

        <div className="p-8 overflow-y-auto flex-1">
          <div className="grid grid-cols-4 gap-6 mb-8">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 border-l-4 border-l-emerald-500">
              <p className="text-sm text-slate-500 font-medium">Total Grievances</p>
              <p className="text-3xl font-bold text-slate-800 mt-2">{loading ? '-' : metrics.total}</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 border-l-4 border-l-amber-500">
              <p className="text-sm text-slate-500 font-medium">Pending Action</p>
              <p className="text-3xl font-bold text-slate-800 mt-2">{loading ? '-' : metrics.pending}</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 border-l-4 border-l-blue-500">
              <p className="text-sm text-slate-500 font-medium">In Progress</p>
              <p className="text-3xl font-bold text-slate-800 mt-2">{loading ? '-' : metrics.inProgress}</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 border-l-4 border-l-indigo-500">
              <p className="text-sm text-slate-500 font-medium">Resolved</p>
              <p className="text-3xl font-bold text-slate-800 mt-2">{loading ? '-' : metrics.resolved}</p>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-5 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <h2 className="font-semibold text-slate-800">Master Ticket List</h2>
              <div className="flex gap-3">
                <div className="relative">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input type="text" placeholder="Search..." className="pl-9 pr-4 py-2 text-sm border border-slate-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500" />
                </div>
                <button className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-300 rounded-md text-sm font-medium text-slate-700 hover:bg-slate-50">
                  <Filter size={16} /> Filter
                </button>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider border-b border-slate-200">
                    <th className="px-6 py-4 font-medium">ID</th>
                    <th className="px-6 py-4 font-medium">Citizen</th>
                    <th className="px-6 py-4 font-medium">AI Analysis</th>
                    <th className="px-6 py-4 font-medium">Priority</th>
                    <th className="px-6 py-4 font-medium">Department</th>
                    <th className="px-6 py-4 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {loading && <tr><td colSpan="6" className="text-center py-8 text-slate-500">Loading...</td></tr>}
                  {!loading && tickets.length === 0 && <tr><td colSpan="6" className="text-center py-8 text-slate-500">No tickets found.</td></tr>}
                  {tickets.map(t => (
                    <tr key={t._id} className="hover:bg-slate-50">
                      <td className="px-6 py-4 text-sm font-medium text-emerald-600">{t._id.substring(0,8).toUpperCase()}</td>
                      <td className="px-6 py-4 text-sm text-slate-800">{t.reportedBy?.name || 'Unknown'}</td>
                      <td className="px-6 py-4 text-sm text-slate-600 max-w-xs truncate" title={t.aiAnalysis?.description}>{t.aiAnalysis?.title || 'Unknown'}</td>
                      <td className="px-6 py-4">
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${t.aiAnalysis?.severity==='High'?'bg-red-100 text-red-700':t.aiAnalysis?.severity==='Medium'?'bg-amber-100 text-amber-700':'bg-slate-100 text-slate-700'}`}>
                          {t.aiAnalysis?.severity || 'Low'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                         <select 
                          value={t.assignedDepartment || 'Unassigned'}
                          onChange={(e) => updateTicket(t._id, 'assignedDepartment', e.target.value)}
                          className="text-xs font-semibold px-2 py-1 rounded border border-slate-300 cursor-pointer bg-white"
                        >
                          <option value="Unassigned">Unassigned</option>
                          <option value="Sanitation">Sanitation</option>
                          <option value="Public Works">Public Works</option>
                          <option value="Water">Water</option>
                          <option value="Electricity">Electricity</option>
                          <option value="Traffic">Traffic</option>
                        </select>
                      </td>
                      <td className="px-6 py-4">
                        <select 
                          value={t.status}
                          onChange={(e) => updateTicket(t._id, 'status', e.target.value)}
                          className={`text-xs font-semibold px-2 py-1 rounded-full border border-transparent cursor-pointer ${
                            t.status === 'Open' || t.status === 'Pending' ? 'bg-amber-100 text-amber-800' : 
                            t.status === 'In Progress' || t.status === 'Assigned' ? 'bg-blue-100 text-blue-800' : 
                            t.status === 'Rejected' ? 'bg-red-100 text-red-800' :
                            'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          <option value="Open">Open</option>
                          <option value="Assigned">Assigned</option>
                          <option value="In Progress">In Progress</option>
                          <option value="Resolved">Resolved</option>
                          <option value="Rejected">Rejected</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
