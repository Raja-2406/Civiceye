import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Shield, User } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';
import api from '../services/api';

export default function Login() {
  const [isCitizen, setIsCitizen] = useState(true);
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      setLoading(true);
      setError('');
      const res = await api.post('/auth/google', {
        credential: credentialResponse.credential,
      });

      const { token, user } = res.data;
      
      login(user, token);

      if (user.role === 'admin') {
        navigate('/admin/dashboard');
      } else {
        navigate('/citizen/dashboard');
      }
    } catch (err) {
      console.error('Google login failed on backend:', err);
      setError('Google authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleError = () => {
    console.error('Google Login Failed (Client Side)');
    setError('Google login widget failed to load.');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    let success = false;
    
    const activeTab = isCitizen ? 'citizen' : 'admin';
    const formattedEmail = email.trim();

    if (isRegister) {
      success = await register(name, formattedEmail, password, activeTab);
      if (!success) setError('Registration failed. Check if email is a valid @gov.in domain (for admins) or already exists.');
    } else {
      success = await login(activeTab, { email: formattedEmail, password });
      if (!success) setError('Login failed. Check credentials and role privileges.');
    }

    setLoading(false);
    if (success) {
      navigate(activeTab === 'citizen' ? '/citizen/dashboard' : '/admin/dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-slate-900">
          Smart Grievance Portal
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          
          <div className="flex justify-center mb-6 border-b border-slate-200">
            <button 
              type="button"
              className={`flex-1 py-2 text-center flex justify-center items-center gap-2 font-medium border-b-2 ${isCitizen ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
              onClick={() => setIsCitizen(true)}
            >
              <User size={18} /> Citizen
            </button>
            <button 
              type="button"
              className={`flex-1 py-2 text-center flex justify-center items-center gap-2 font-medium border-b-2 ${!isCitizen ? 'border-emerald-500 text-emerald-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
              onClick={() => setIsCitizen(false)}
            >
              <Shield size={18} /> Admin
            </button>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && <div className="text-red-500 text-sm">{error}</div>}
            
            {isRegister && (
               <div>
                 <label className="block text-sm font-medium text-slate-700">Full Name</label>
                 <div className="mt-1">
                   <input type="text" required value={name} onChange={e=>setName(e.target.value)} className="appearance-none block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                 </div>
               </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-700">Email address {(!isCitizen && isRegister) && '(Must end in @gov.in)'}</label>
              <div className="mt-1">
                <input type="email" required value={email} onChange={e=>setEmail(e.target.value)} className={`appearance-none block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`} />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700">Password</label>
              <div className="mt-1">
                <input type="password" required value={password} onChange={e=>setPassword(e.target.value)} className="appearance-none block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
              </div>
            </div>

            <div>
              <button type="submit" disabled={loading} className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${isCitizen ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-emerald-600 hover:bg-emerald-700'} disabled:opacity-50`}>
                {loading ? 'Processing...' : isRegister ? 'Register' : 'Sign in'}
              </button>
            </div>
          </form>

          <div className="mt-4 text-center text-sm">
            <button onClick={() => setIsRegister(!isRegister)} className="text-indigo-600 hover:text-indigo-500">
              {isRegister ? 'Already have an account? Sign in' : 'Need an account? Register'}
            </button>
          </div>
          
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-slate-500">Or continue with</span>
              </div>
            </div>

            <div className="mt-6 flex justify-center">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={handleGoogleError}
                useOneTap
                use_fedcm_for_prompt={false}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
