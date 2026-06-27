import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import Home from './pages/Home';
import DoctorList from './pages/DoctorList';
import DoctorProfile from './pages/DoctorProfile';
import BookingConfirmation from './pages/BookingConfirmation';
import BookingLookup from './pages/BookingLookup';
import DoctorLogin from './pages/DoctorLogin';
import DoctorDashboard from './pages/DoctorDashboard';
import DoctorSlots from './pages/DoctorSlots';

const ProtectedRoute = ({ children }) => {
  const { doctor, loading } = useAuth();
  if (loading) return <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100vh'}}><div style={{width:40,height:40,border:'3px solid #E2E8F0',borderTopColor:'#0D9488',borderRadius:'50%',animation:'spin 0.8s linear infinite'}} /></div>;
  return doctor ? children : <Navigate to="/doctor/login" replace />;
};

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster position="top-right" toastOptions={{ style: { fontFamily: 'Inter, sans-serif', fontSize: '14px', borderRadius: '10px' }, success: { iconTheme: { primary: '#0D9488', secondary: '#fff' } } }} />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/doctors" element={<DoctorList />} />
          <Route path="/doctors/:doctorId" element={<DoctorProfile />} />
          <Route path="/booking/confirmation" element={<BookingConfirmation />} />
          <Route path="/booking/lookup" element={<BookingLookup />} />
          <Route path="/doctor/login" element={<DoctorLogin />} />
          <Route path="/doctor/dashboard" element={<ProtectedRoute><DoctorDashboard /></ProtectedRoute>} />
          <Route path="/doctor/slots" element={<ProtectedRoute><DoctorSlots /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
