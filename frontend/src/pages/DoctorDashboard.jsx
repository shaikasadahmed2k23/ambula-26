import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { doctorApi } from '../api';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import { Clock, Phone, Droplets, FileText, Pill, Save, Calendar, CheckCircle, ChevronDown, ChevronUp } from 'lucide-react';
import toast from 'react-hot-toast';
import './DoctorDashboard.css';

function formatTime(t) { if(!t)return ''; const [h,m]=t.split(':'); const hour=parseInt(h); return `${hour%12||12}:${m} ${hour>=12?'PM':'AM'}`; }

function AppointmentCard({ appt, onSaved }) {
  const [expanded, setExpanded] = useState(false);
  const [notes, setNotes] = useState(appt.diagnosis_notes||'');
  const [prescription, setPrescription] = useState(appt.prescription||'');
  const [followUp, setFollowUp] = useState(appt.follow_up_date?.split('T')[0]||'');
  const [saving, setSaving] = useState(false);
  const isCompleted = appt.booking_status==='completed';

  const handleSave = async () => {
    setSaving(true);
    try {
      await doctorApi.addConsultationNotes(appt.booking_id, { diagnosis_notes:notes, prescription, follow_up_date:followUp||null });
      toast.success('Notes saved');
      onSaved();
    } catch { toast.error('Failed to save notes'); }
    finally { setSaving(false); }
  };

  return (
    <div className={`appt-card ${isCompleted?'completed':''}`}>
      <div className="appt-header" onClick={()=>setExpanded(!expanded)}>
        <div className="appt-time"><Clock size={14}/><span>{formatTime(appt.start_time)} - {formatTime(appt.end_time)}</span></div>
        <div className="appt-patient">
          <div className="ap-name">{appt.patient_name}</div>
          <div className="ap-meta">{appt.patient_age} yrs <Phone size={12}/> {appt.patient_phone}</div>
        </div>
        <div className="appt-right">
          {isCompleted && <span className="done-badge"><CheckCircle size={13}/> Done</span>}
          <span className="appt-code">{appt.booking_code}</span>
          {expanded?<ChevronUp size={18}/>:<ChevronDown size={18}/>}
        </div>
      </div>
      {expanded && (
        <div className="appt-body">
          <div className="health-summary">
            <h4><FileText size={14}/> Patient Health Summary</h4>
            <div className="hs-grid">
              <div className="hs-item"><span className="hs-label"><Droplets size={12}/> Blood Group</span><span className="hs-val">{appt.blood_group||'Not provided'}</span></div>
              <div className="hs-item"><span className="hs-label">Known Conditions</span><span className="hs-val">{appt.known_conditions?.length>0?appt.known_conditions.join(', '):'None listed'}</span></div>
              <div className="hs-item"><span className="hs-label"><Pill size={12}/> Medications</span><span className="hs-val">{appt.current_medications?.length>0?appt.current_medications.join(', '):'None listed'}</span></div>
            </div>
          </div>
          <div className="consult-form">
            <h4><FileText size={14}/> Consultation Notes</h4>
            <div className="cf-group"><label>Diagnosis Notes</label><textarea value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Describe findings, diagnosis..." rows={3}/></div>
            <div className="cf-group"><label>Prescription</label><textarea value={prescription} onChange={e=>setPrescription(e.target.value)} placeholder="Medicines, dosage, instructions..." rows={3}/></div>
            <div className="cf-group"><label>Follow-up Date (optional)</label><input type="date" value={followUp} onChange={e=>setFollowUp(e.target.value)} min={new Date().toISOString().split('T')[0]}/></div>
            <button className="save-notes-btn" onClick={handleSave} disabled={saving}><Save size={15}/>{saving?'Saving...':isCompleted?'Update Notes':'Save & Mark Complete'}</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function DoctorDashboard() {
  const { doctor } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const hour = new Date().getHours();
  const greeting = hour<12?'Morning':hour<17?'Afternoon':'Evening';
  const today = new Date().toLocaleDateString('en-IN',{weekday:'long',day:'numeric',month:'long',year:'numeric'});

  const loadAppointments = async () => {
    try {
      const res = await doctorApi.getTodayAppointments();
      setAppointments(res.data);
    } catch { toast.error('Failed to load appointments'); }
    finally { setLoading(false); }
  };

  useEffect(()=>{ loadAppointments(); },[]);

  const confirmed = appointments.filter(a=>a.booking_status==='confirmed');
  const completed = appointments.filter(a=>a.booking_status==='completed');

  return (
    <div><Navbar/>
      <div className="dash-page">
        <div className="container">
          <div className="dash-header">
            <div>
              <h1>Good {greeting}, {doctor?.name?.split(' ')[1]||'Doctor'}</h1>
              <p className="dash-date"><Calendar size={14}/> {today}</p>
            </div>
            <button className="slots-btn" onClick={()=>navigate('/doctor/slots')}>Manage Slots</button>
          </div>
          <div className="dash-stats">
            <div className="ds-card"><div className="ds-num">{appointments.length}</div><div className="ds-label">Total Today</div></div>
            <div className="ds-card"><div className="ds-num pending">{confirmed.length}</div><div className="ds-label">Pending</div></div>
            <div className="ds-card"><div className="ds-num done">{completed.length}</div><div className="ds-label">Completed</div></div>
          </div>
          <div className="appts-section">
            <h2>Today's Appointments</h2>
            {loading ? (
              <div className="loading-block">{[1,2,3].map(i=><div key={i} className="appt-skeleton"/>)}</div>
            ) : appointments.length===0 ? (
              <div className="empty-appts"><Calendar size={40}/><h3>No appointments today</h3><p>Your schedule is clear for today.</p></div>
            ) : (
              <div className="appts-list">{appointments.map(appt=><AppointmentCard key={appt.booking_id} appt={appt} onSaved={loadAppointments}/>)}</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
