import React, { useState } from 'react';
import Navbar from '../components/Navbar';
import { patientApi } from '../api';
import { Search, Calendar, Clock, MapPin, User, Stethoscope } from 'lucide-react';
import toast from 'react-hot-toast';
import './BookingLookup.css';

function formatDate(d) { const date=new Date(d); return date.toLocaleDateString('en-IN',{weekday:'long',year:'numeric',month:'long',day:'numeric'}); }
function formatTime(t) { if(!t)return ''; const [h,m]=t.split(':'); const hour=parseInt(h); return `${hour%12||12}:${m} ${hour>=12?'PM':'AM'}`; }
const STATUS_MAP = { confirmed:{label:'Confirmed',color:'#0D9488',bg:'#CCFBF1'}, completed:{label:'Completed',color:'#10B981',bg:'#D1FAE5'}, cancelled:{label:'Cancelled',color:'#EF4444',bg:'#FEE2E2'} };

export default function BookingLookup() {
  const [code, setCode] = useState('');
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleLookup = async (e) => {
    e.preventDefault();
    if (!code.trim()) return;
    setLoading(true); setBooking(null);
    try {
      const res = await patientApi.getBookingByCode(code.trim());
      setBooking(res.data);
    } catch (err) {
      toast.error(err.response?.status===404 ? 'Booking not found. Check your ID.' : 'Lookup failed');
    } finally { setLoading(false); }
  };

  const status = booking ? STATUS_MAP[booking.status] : null;

  return (
    <div><Navbar/>
      <div className="lookup-page">
        <div className="container lookup-inner">
          <div className="lookup-card">
            <h1>Find Your Appointment</h1>
            <p>Enter your Booking ID to view appointment details</p>
            <form className="lookup-form" onSubmit={handleLookup}>
              <div className="lookup-input-row">
                <input type="text" placeholder="e.g. AMB3F9A2C1D" value={code} onChange={e=>setCode(e.target.value.toUpperCase())} className="lookup-input" maxLength={14}/>
                <button type="submit" className="lookup-btn" disabled={loading}>{loading?'...': <Search size={18}/>}</button>
              </div>
            </form>
            {booking && (
              <div className="lookup-result">
                <div className="lr-status" style={{color:status.color,background:status.bg}}>{status.label}</div>
                <div className="lr-code">{booking.booking_code}</div>
                <div className="lr-details">
                  <div className="lrd-item"><Stethoscope size={16}/><div><span className="lrd-label">Doctor</span><span className="lrd-val">{booking.doctor_name} - {booking.specialization}</span></div></div>
                  <div className="lrd-item"><MapPin size={16}/><div><span className="lrd-label">Location</span><span className="lrd-val">{booking.location}</span></div></div>
                  <div className="lrd-item"><Calendar size={16}/><div><span className="lrd-label">Date</span><span className="lrd-val">{formatDate(booking.slot_date)}</span></div></div>
                  <div className="lrd-item"><Clock size={16}/><div><span className="lrd-label">Time</span><span className="lrd-val">{formatTime(booking.start_time)} - {formatTime(booking.end_time)}</span></div></div>
                  <div className="lrd-item"><User size={16}/><div><span className="lrd-label">Patient</span><span className="lrd-val">{booking.patient_name}, {booking.patient_age} yrs - {booking.patient_phone}</span></div></div>
                </div>
                {booking.blood_group && (
                  <div className="lr-health">
                    <span className="health-chip">Blood: {booking.blood_group}</span>
                    {booking.known_conditions?.length>0 && <span className="health-chip">{booking.known_conditions.join(', ')}</span>}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
