import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Stethoscope, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import './DoctorLogin.css';

export default function DoctorLogin() {
  const { login, doctor } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => { if (doctor) navigate('/doctor/dashboard'); }, [doctor]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      toast.success('Welcome back, Doctor!');
      navigate('/doctor/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Login failed');
    } finally { setLoading(false); }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">
          <div className="login-icon"><Stethoscope size={28} /></div>
          <div><h1>Ambula</h1><span>Doctor Portal</span></div>
        </div>
        <h2>Sign in to your dashboard</h2>
        <p className="login-sub">Manage appointments and patient consultations</p>
        <form onSubmit={handleSubmit} className="login-form">
          <div className="lf-group">
            <label>Email address</label>
            <input type="email" required placeholder="doctor@ambula.in" value={email} onChange={e=>setEmail(e.target.value)} />
          </div>
          <div className="lf-group">
            <label>Password</label>
            <div className="pw-wrap">
              <input type={showPwd?'text':'password'} required placeholder="Enter your password" value={password} onChange={e=>setPassword(e.target.value)} />
              <button type="button" className="pw-toggle" onClick={()=>setShowPwd(!showPwd)}>{showPwd?<EyeOff size={16}/>:<Eye size={16}/>}</button>
            </div>
          </div>
          <button type="submit" className="login-btn" disabled={loading}>{loading?'Signing in...':'Sign In'}</button>
        </form>
        <div className="login-hint">
          <strong>Test credentials</strong> (password: <code>doctor123</code>)<br />
          <span>priya.sharma@ambula.in &bull; rajesh.kumar@ambula.in &bull; arjun.nair@ambula.in</span>
        </div>
      </div>
    </div>
  );
}
