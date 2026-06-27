import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Menu, X, Stethoscope, LogOut, Calendar, LayoutDashboard } from 'lucide-react';
import './Navbar.css';

export default function Navbar() {
  const { doctor, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const isDoctorRoute = location.pathname.startsWith('/doctor');
  const handleLogout = () => { logout(); navigate('/'); setOpen(false); };

  return (
    <nav className="navbar">
      <div className="container navbar-inner">
        <Link to="/" className="navbar-brand" onClick={() => setOpen(false)}>
          <div className="brand-icon"><Stethoscope size={20} /></div>
          <span className="brand-text">Ambula</span>
        </Link>
        <div className="navbar-links">
          {!isDoctorRoute || !doctor ? (
            <>
              <Link to="/doctors" className={`nav-link ${location.pathname==='/doctors'?'active':''}`}>Find Doctors</Link>
              <Link to="/booking/lookup" className={`nav-link ${location.pathname==='/booking/lookup'?'active':''}`}>My Booking</Link>
              {!doctor && <Link to="/doctor/login" className="btn-outline-sm">Doctor Login</Link>}
            </>
          ) : (
            <>
              <Link to="/doctor/dashboard" className={`nav-link ${location.pathname==='/doctor/dashboard'?'active':''}`}><LayoutDashboard size={16} /> Dashboard</Link>
              <Link to="/doctor/slots" className={`nav-link ${location.pathname==='/doctor/slots'?'active':''}`}><Calendar size={16} /> Manage Slots</Link>
              <div className="doctor-badge"><span className="doctor-badge-name">Dr. {doctor.name?.split(' ').slice(-1)[0]}</span></div>
              <button className="btn-outline-sm danger" onClick={handleLogout}><LogOut size={14} /> Logout</button>
            </>
          )}
        </div>
        <button className="hamburger" onClick={() => setOpen(!open)}>{open ? <X size={22}/> : <Menu size={22}/>}</button>
      </div>
      {open && (
        <div className="mobile-menu">
          {!isDoctorRoute || !doctor ? (
            <>
              <Link to="/doctors" className="mobile-link" onClick={()=>setOpen(false)}>Find Doctors</Link>
              <Link to="/booking/lookup" className="mobile-link" onClick={()=>setOpen(false)}>My Booking</Link>
              {!doctor && <Link to="/doctor/login" className="mobile-link accent" onClick={()=>setOpen(false)}>Doctor Login</Link>}
            </>
          ) : (
            <>
              <Link to="/doctor/dashboard" className="mobile-link" onClick={()=>setOpen(false)}>Dashboard</Link>
              <Link to="/doctor/slots" className="mobile-link" onClick={()=>setOpen(false)}>Manage Slots</Link>
              <button className="mobile-link danger" onClick={handleLogout}>Logout</button>
            </>
          )}
        </div>
      )}
    </nav>
  );
}
