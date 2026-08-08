import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import Login from './pages/Login';
import CitizenDashboard from './pages/CitizenDashboard';
import AdminDashboard from './pages/AdminDashboard';
import ProtectedRoute from './components/auth/ProtectedRoute';

function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <Router>
          <Routes>
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<Login />} />
            
            <Route path="/citizen/*" element={
              <ProtectedRoute role="citizen">
                <Routes>
                  <Route path="dashboard" element={<CitizenDashboard />} />
                </Routes>
              </ProtectedRoute>
            } />
            
            <Route path="/admin/*" element={
              <ProtectedRoute role="admin">
                <Routes>
                  <Route path="dashboard" element={<AdminDashboard />} />
                </Routes>
              </ProtectedRoute>
            } />
          </Routes>
        </Router>
      </NotificationProvider>
    </AuthProvider>
  );
}

export default App;
