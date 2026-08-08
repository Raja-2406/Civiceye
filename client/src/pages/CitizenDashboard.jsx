import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { Bell, MapPin, Camera, UploadCloud, Clock, AlertTriangle, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

export default function CitizenDashboard() {
  const { user, logout } = useAuth();
  const { notifications, unreadCount } = useNotification();
  const navigate = useNavigate();
  const [showDrawer, setShowDrawer] = useState(false);
  const [view, setView] = useState('list');
  const [tickets, setTickets] = useState([]);
  
  // Form State
  const [imageFile, setImageFile] = useState(null);
  const [city, setCity] = useState('New York');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  // Geolocation State
  const [location, setLocation] = useState({ lat: null, lng: null });
  const [locationError, setLocationError] = useState('');
  const [loadingLocation, setLoadingLocation] = useState(false);
  
  // Camera Ref
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [showCamera, setShowCamera] = useState(false);

  useEffect(() => {
    if (view === 'list') {
      fetchTickets();
    }
  }, [view]);

  const fetchTickets = async () => {
    try {
      const res = await api.get('/tickets/my-tickets');
      setTickets(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setImageFile(e.target.files[0]);
    }
  };

  const startCamera = async () => {
    setShowCamera(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch (err) {
      alert("Camera access denied or unavailable.");
      setShowCamera(false);
    }
  };

  const captureLocation = () => {
    setLoadingLocation(true);
    setLocationError('');
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser.');
      setLoadingLocation(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({ lat: position.coords.latitude, lng: position.coords.longitude });
        setLoadingLocation(false);
      },
      (error) => {
        console.error("Error getting location:", error);
        setLocationError('Permission denied or unable to retrieve location.');
        setLoadingLocation(false);
      },
      { enableHighAccuracy: true }
    );
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      canvasRef.current.width = videoRef.current.videoWidth;
      canvasRef.current.height = videoRef.current.videoHeight;
      context.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height);
      
      canvasRef.current.toBlob((blob) => {
        const file = new File([blob], "camera-capture.jpg", { type: "image/jpeg" });
        setImageFile(file);
        stopCamera();
        captureLocation(); // automatically capture location
      }, 'image/jpeg');
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(track => track.stop());
    }
    setShowCamera(false);
  };

  const submitGrievance = async (e) => {
    e.preventDefault();
    if (!imageFile) {
      alert("Please upload or capture an image.");
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append('image', imageFile);
    formData.append('city', city);
    formData.append('originalUserDescription', description);
    
    if (location.lat && location.lng) {
      formData.append('lat', location.lat);
      formData.append('lng', location.lng);
    }
    
    try {
      const res = await api.post('/tickets/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      alert('Ticket submitted successfully!');
      setImageFile(null);
      setDescription('');
      setLocation({ lat: null, lng: null });
      setLocationError('');
      setView('list');
    } catch (err) {
      console.error(err);
      alert('Failed to submit ticket.');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-indigo-600 shadow sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex justify-between items-center">
          <div className="flex items-center gap-2 text-white font-bold text-xl cursor-pointer" onClick={() => setView('list')}>
            <MapPin /> CivicEye
          </div>
          <div className="flex items-center gap-4">
            <button className="relative text-indigo-100 hover:text-white" onClick={() => setShowDrawer(!showDrawer)}>
              <Bell size={24} />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                  {unreadCount}
                </span>
              )}
            </button>
            <div className="text-white text-sm font-medium">{user?.name}</div>
            <button onClick={() => { logout(); navigate('/login'); }} className="text-xs bg-indigo-700 hover:bg-indigo-800 text-white px-3 py-1 rounded">Logout</button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {view === 'list' ? (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-bold text-slate-800">My Grievances</h1>
              <button onClick={() => setView('new')} className="bg-indigo-600 text-white px-4 py-2 rounded-md font-medium hover:bg-indigo-700 flex items-center gap-2">
                <UploadCloud size={18} /> File New Issue
              </button>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {tickets.length === 0 && <p className="text-slate-500">No grievances reported yet.</p>}
              {tickets.map(t => (
                <div key={t._id} className="bg-white rounded-lg shadow p-5 border border-slate-100">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-xs font-bold text-slate-400">{t._id.substring(0,8).toUpperCase()}</span>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${t.status === 'Resolved' ? 'bg-emerald-100 text-emerald-800' : 'bg-indigo-100 text-indigo-800'}`}>
                      {t.status}
                    </span>
                  </div>
                  <h3 className="font-semibold text-slate-800 mb-2 truncate">{t.aiAnalysis?.title || 'Unknown Issue'}</h3>
                  <img src={t.imageUrl} alt="Issue" className="w-full h-32 object-cover rounded mb-2" />
                  <div className="text-xs text-slate-500 flex items-center gap-1"><Clock size={12}/> {new Date(t.createdAt).toLocaleDateString()}</div>
                  
                  <div className="mt-4 flex items-center gap-1 w-full">
                    <div className="h-1 flex-1 bg-emerald-500 rounded-full"></div>
                    <div className={`h-1 flex-1 rounded-full ${['Assigned', 'In Progress', 'Resolved'].includes(t.status) ? 'bg-emerald-500' : 'bg-slate-200'}`}></div>
                    <div className={`h-1 flex-1 rounded-full ${t.status === 'Resolved' ? 'bg-emerald-500' : 'bg-slate-200'}`}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="max-w-2xl mx-auto bg-white rounded-xl shadow p-6 md:p-8">
            <h2 className="text-2xl font-bold text-slate-800 mb-6">Report a New Issue</h2>
            <form className="space-y-6" onSubmit={submitGrievance}>
              
              {showCamera ? (
                <div className="relative rounded-lg overflow-hidden bg-black flex justify-center">
                   <video ref={videoRef} autoPlay playsInline className="max-h-64"></video>
                   <button type="button" onClick={capturePhoto} className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-white text-indigo-600 px-4 py-2 rounded-full font-bold shadow-lg">Capture</button>
                   <button type="button" onClick={stopCamera} className="absolute top-4 right-4 bg-red-500 text-white p-1 rounded-full"><X size={20}/></button>
                   <canvas ref={canvasRef} className="hidden"></canvas>
                </div>
              ) : imageFile ? (
                <div className="relative rounded-lg overflow-hidden">
                  <img src={URL.createObjectURL(imageFile)} alt="Preview" className="w-full h-48 object-cover" />
                  <button type="button" onClick={()=>setImageFile(null)} className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded"><X size={16}/></button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-300 rounded-lg text-slate-600 hover:border-indigo-500 hover:text-indigo-600 bg-slate-50 cursor-pointer">
                    <UploadCloud size={32} className="mb-2" />
                    <span className="text-sm font-medium">Upload Image</span>
                    <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                  </label>
                  <button type="button" onClick={startCamera} className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-300 rounded-lg text-slate-600 hover:border-indigo-500 hover:text-indigo-600 bg-slate-50 cursor-pointer">
                    <Camera size={32} className="mb-2" />
                    <span className="text-sm font-medium">Use Camera</span>
                  </button>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700">City</label>
                <input type="text" value={city} onChange={e=>setCity(e.target.value)} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border border-slate-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md" />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700">Description (Optional)</label>
                <textarea rows={3} value={description} onChange={e=>setDescription(e.target.value)} className="mt-1 block w-full border border-slate-300 rounded-md p-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" placeholder="Provide extra details..."></textarea>
              </div>

              {/* Hybrid Geolocation Dynamic Indicator */}
              <div className={`p-4 rounded-lg border flex gap-3 items-start ${
                location.lat 
                  ? 'bg-emerald-50 border-emerald-200' 
                  : locationError 
                    ? 'bg-red-50 border-red-200' 
                    : 'bg-amber-50 border-amber-200'
              }`}>
                <MapPin className={`flex-shrink-0 ${
                  location.lat ? 'text-emerald-500' : locationError ? 'text-red-500' : 'text-amber-500'
                }`} size={20} />
                <div className="text-sm">
                  {loadingLocation ? (
                    <div className="flex items-center gap-2 text-amber-800">
                      <div className="animate-spin w-4 h-4 border-2 border-amber-500 border-t-transparent rounded-full"></div>
                      <p className="font-semibold">Detecting your location...</p>
                    </div>
                  ) : location.lat && location.lng ? (
                    <div className="text-emerald-800">
                      <p className="font-semibold">Location Detected</p>
                      <p>Lat: {location.lat.toFixed(4)}, Lng: {location.lng.toFixed(4)}</p>
                    </div>
                  ) : locationError ? (
                    <div className="text-red-800">
                      <p className="font-semibold">Location Error</p>
                      <p>{locationError}</p>
                      <button type="button" onClick={captureLocation} className="mt-2 text-red-600 underline text-xs font-semibold">Try Again</button>
                    </div>
                  ) : (
                    <div className="text-amber-800">
                      <p className="font-semibold">GPS Location Required</p>
                      <p>We'll extract it from your photo EXIF data or you can explicitly detect it.</p>
                      <button type="button" onClick={captureLocation} className="mt-2 bg-amber-500 text-white px-3 py-1 rounded text-xs font-semibold hover:bg-amber-600">Detect My Location</button>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setView('list')} className="px-4 py-2 border border-slate-300 rounded-md text-sm font-medium text-slate-700 hover:bg-slate-50">Cancel</button>
                <button type="submit" disabled={loading} className="px-4 py-2 bg-indigo-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2">
                  {loading && <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>}
                  {loading ? 'Analyzing with Gemini AI...' : 'Submit Grievance'}
                </button>
              </div>
            </form>
          </div>
        )}
      </main>

      {showDrawer && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg overflow-hidden z-20 top-14 mr-4 border border-slate-200">
          <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex justify-between">
            <h3 className="text-sm font-semibold text-slate-800">Notifications</h3>
            <button onClick={()=>setShowDrawer(false)} className="text-slate-400 hover:text-slate-600"><X size={16}/></button>
          </div>
          <div className="max-h-64 overflow-y-auto">
            {notifications.length === 0 && <p className="p-4 text-sm text-slate-500 text-center">No notifications.</p>}
            {notifications.map(n => (
              <div key={n._id || n.id} className={`p-4 border-b border-slate-100 ${n.read ? 'opacity-50' : 'bg-indigo-50/30'}`}>
                <p className="text-sm text-slate-800">{n.message}</p>
                <p className="text-xs text-slate-500 mt-1">{new Date(n.createdAt || n.date).toLocaleString()}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
