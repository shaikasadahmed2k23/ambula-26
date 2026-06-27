import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { patientApi } from '../api';
import Navbar from '../components/Navbar';
import { MapPin, Star, Clock, IndianRupee, ArrowLeft, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import './DoctorProfile.css';

const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function formatDate(dateStr) {
  const d = new Date(dateStr);
  return `${DAYS[d.getDay()]}, ${d.getDate()} ${MONTHS[d.getMonth()]}`;
}
function formatTime(t) {
  if (!t) return '';
  const [h,m] = t.split(':');
  const hour = parseInt(h);
  return `${hour%12||12}:${m} ${hour>=12?'PM':'AM'}`;
}

export default function DoctorProfile() {
  const { doctorId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [booking, setBooking] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [nextSlots, setNextSlots] = useState([]);
  const [form, setForm] = useState({ patient_name:'', patient_age:'', patient_phone:'', blood_group:'', known_conditions:'', current_medications:'' });

  useEffect(() => {
    (async () => {
      try {
        const res = await patientApi.getDoctorProfile(doctorId);
        setData(res.data);
        const dates = Object.keys(res.data.slotsByDate).sort();
        if (dates.length > 0) setSelectedDate(dates[0]);
      } catch { toast.error('Failed to load doctor profile'); navigate('/doctors'); }
      finally { setLoading(false); }
    })();
  }, [doctorId]);

  const handleBook = async (e) => {
    e.preventDefault();
    if (!selectedSlot) return toast.error('Please select a time slot');
    if (!form.patient_name || !form.patient_age || !form.patient_phone) return toast.error('Name, age and phone are required');
    setBooking(true); setNextSlots([]);
    try {
      const payload = { slot_id: selectedSlot, ...form, patient_age: parseInt(form.patient_age), known_conditions: form.known_conditions ? form.known_conditions.split(',').map(s=>s.trim()) : [], current_medications: form.current_medications ? form.current_medications.split(',').map(s=>s.trim()) : [] };
      const res = await patientApi.bookSlot(payload);
      toast.success('Appointment booked!');
      navigate('/booking/confirmation', { state: { booking: res.data } });
    } catch (err) {
      if (err.response?.status === 409) {
        toast.error('That slot was just booked! Showing next available slots.');
        setNextSlots(err.response?.data?.nextAvailableSlots || []);
        setSelectedSlot(null);
      } else { toast.error(err.response?.data?.error || 'Booking failed'); }
    } finally { setBooking(false); }
  };

  if (loading) return <div><Navbar /><div style={{display:'flex',justifyContent:'center',padding:'4rem'}}><div className="spinner-lg"/></div></div>;
  if (!data) return null;

  const { doctor, slotsByDate } = data;
  const dates = Object.keys(slotsByDate).sort();
  const slotsForDate = selectedDate ? (slotsByDate[selectedDate] || []) : [];

  return (
    <div><Navbar />
      <div className="profile-page">
        <div className="container">
          <button className="back-btn" onClick={()=>navigate('/doctors')}><ArrowLeft size={16}/> Back to Doctors</button>
          <div className="profile-layout">
            <div className="profile-left">
              <div className="profile-card">
                <div className="profile-avatar">{doctor.avatar_url?<img src={doctor.avatar_url} alt={doctor.name}/>:<div className="avatar-big">{doctor.name.split(' ').map(n=>n[0]).join('').slice(0,2)}</div>}</div>
                <h1 className="profile-name">{doctor.name}</h1>
                <span className="profile-spec">{doctor.specialization}</span>
                <div className="profile-meta">
                  <div className="pm-item"><MapPin size={15}/> {doctor.location}</div>
                  <div className="pm-item"><Clock size={15}/> {doctor.experience_years} years experience</div>
                  <div className="pm-item"><Star size={15} fill="#F59E0B" stroke="none"/> {doctor.rating} rating</div>
                  <div className="pm-item fee"><IndianRupee size={15}/> Rs.{doctor.consultation_fee} consultation fee</div>
                </div>
                {doctor.bio && <div className="profile-bio"><h3>About</h3><p>{doctor.bio}</p></div>}
              </div>
            </div>
            <div className="profile-right">
              <div className="booking-card">
                <h2>Book an Appointment</h2>
                <div className="date-section">
                  <h3>Select Date</h3>
                  {dates.length===0 ? <div className="no-slots">No available slots in the next 7 days.</div> : (
                    <div className="date-tabs">
                      {dates.map(d=>(
                        <button key={d} className={`date-tab ${selectedDate===d?'active':''}`} onClick={()=>{setSelectedDate(d);setSelectedSlot(null);}}>
                          <span className="dt-day">{formatDate(d).split(',')[0]}</span>
                          <span className="dt-date">{formatDate(d).split(', ')[1]}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                {selectedDate && (
                  <div className="slots-section">
                    <h3>Select Time <span className="slots-count">({slotsForDate.length} available)</span></h3>
                    {slotsForDate.length===0 ? <div className="no-slots">No available slots on this day.</div> : (
                      <div className="slots-grid">
                        {slotsForDate.map(slot=>(
                          <button key={slot.id} className={`slot-btn ${selectedSlot===slot.id?'active':''}`} onClick={()=>{setSelectedSlot(slot.id);setShowForm(true);setNextSlots([]);}}>
                            {formatTime(slot.start_time)}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                {nextSlots.length>0 && (
                  <div className="conflict-notice">
                    <AlertCircle size={16}/>
                    <div><strong>Slot taken.</strong> Next available:<div className="slots-grid" style={{marginTop:8}}>{nextSlots.map(slot=><button key={slot.id} className="slot-btn" onClick={()=>{setSelectedSlot(slot.id);setNextSlots([]);}}>{formatTime(slot.start_time)}</button>)}</div></div>
                  </div>
                )}
                {showForm && selectedSlot && (
                  <form className="booking-form" onSubmit={handleBook}>
                    <h3>Your Details</h3>
                    <div className="form-row">
                      <div className="form-group"><label>Full Name *</label><input required placeholder="Enter your name" value={form.patient_name} onChange={e=>setForm({...form,patient_name:e.target.value})}/></div>
                      <div className="form-group"><label>Age *</label><input required type="number" min="1" max="120" placeholder="Your age" value={form.patient_age} onChange={e=>setForm({...form,patient_age:e.target.value})}/></div>
                    </div>
                    <div className="form-group"><label>Phone Number *</label><input required type="tel" placeholder="10-digit mobile number" value={form.patient_phone} onChange={e=>setForm({...form,patient_phone:e.target.value})}/></div>
                    <div className="form-divider"><span>Health Summary (optional - shared with doctor)</span></div>
                    <div className="form-group"><label>Blood Group</label><select value={form.blood_group} onChange={e=>setForm({...form,blood_group:e.target.value})}><option value="">Select blood group</option>{['A+','A-','B+','B-','AB+','AB-','O+','O-'].map(bg=><option key={bg} value={bg}>{bg}</option>)}</select></div>
                    <div className="form-group"><label>Known Medical Conditions</label><input placeholder="e.g. Diabetes, Hypertension (comma separated)" value={form.known_conditions} onChange={e=>setForm({...form,known_conditions:e.target.value})}/></div>
                    <div className="form-group"><label>Current Medications</label><input placeholder="e.g. Metformin, Lisinopril (comma separated)" value={form.current_medications} onChange={e=>setForm({...form,current_medications:e.target.value})}/></div>
                    <button type="submit" className="book-btn" disabled={booking}>{booking?'Confirming...':'Confirm Appointment - Rs.'+doctor.consultation_fee}</button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
