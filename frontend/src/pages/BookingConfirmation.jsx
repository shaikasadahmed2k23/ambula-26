import React from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { CheckCircle, Calendar, Clock, MapPin, User, Copy, Home } from 'lucide-react';
import toast from 'react-hot-toast';
import './BookingConfirmation.css';

function formatDate(d) { const date=new Date(d); return date.toLocaleDateString('en-IN',{weekday:'long',year:'numeric',month:'long',day:'numeric'}); }
function formatTime(t) { if(!t)return ''; const [h,m]=t.split(':'); const hour=parseInt(h); return `${hour%12||12}:${m} ${hour>=12?'PM':'AM'}`; }

export default function BookingConfirmation() {
  const { state } = useLocation();
  const navigate = useNavigate();
  if (!state?.booking) return <div><Navbar/><div className="confirm-page"><div className="container" style={{textAlign:'center',padding:'4rem 0'}}><p>No booking data found.</p><Link to="/">Go Home</Link></div></div></div>;
  const { booking, slot, doctor } = state.booking;
  const copyCode = () => { navigator.clipboard.writeText(booking.booking_code); toast.success('Booking ID copied!'); };

  return (
    <div><Navbar/>
      <div className="confirm-page">
        <div className="container confirm-inner">
          <div className="confirm-card">
            <div className="confirm-icon"><CheckCircle size={52}/></div>
            <h1>Appointment Confirmed!</h1>
            <p className="confirm-sub">Your slot has been reserved. Please save your Booking ID.</p>
            <div className="booking-id-box">
              <span className="bid-label">Booking ID</span>
              <div className="bid-row">
                <span className="bid-code">{booking.booking_code}</span>
                <button className="bid-copy" onClick={copyCode}><Copy size={16}/> Copy</button>
              </div>
            </div>
            <div className="confirm-details">
              <div className="cd-item"><User size={16}/><div><span className="cd-label">Doctor</span><span className="cd-value">{doctor.name} - {doctor.specialization}</span></div></div>
              <div className="cd-item"><MapPin size={16}/><div><span className="cd-label">Location</span><span className="cd-value">{doctor.location}</span></div></div>
              <div className="cd-item"><Calendar size={16}/><div><span className="cd-label">Date</span><span className="cd-value">{formatDate(slot.date)}</span></div></div>
              <div className="cd-item"><Clock size={16}/><div><span className="cd-label">Time</span><span className="cd-value">{formatTime(slot.start_time)} - {formatTime(slot.end_time)}</span></div></div>
            </div>
            <div className="confirm-patient"><span className="cp-label">Patient</span><span className="cp-value">{booking.patient_name}, {booking.patient_age} yrs - {booking.patient_phone}</span></div>
            <div className="confirm-actions">
              <button className="btn-ghost" onClick={()=>navigate('/doctors')}>Book Another</button>
              <button className="btn-primary-lg" onClick={()=>navigate('/')}><Home size={16}/> Back to Home</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
