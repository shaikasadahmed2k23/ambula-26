import React, { useState, useEffect } from 'react';
import { doctorApi } from '../api';
import Navbar from '../components/Navbar';
import { Calendar, Lock, Unlock, Ban, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import './DoctorSlots.css';

function formatTime(t) { if(!t)return ''; const [h,m]=t.split(':'); const hour=parseInt(h); return `${hour%12||12}:${m} ${hour>=12?'PM':'AM'}`; }
function formatDateLabel(dateStr) {
  const d = new Date(dateStr);
  const today = new Date(); today.setHours(0,0,0,0);
  const diff = Math.round((d-today)/86400000);
  const badge = diff===0?'Today':diff===1?'Tomorrow':'';
  return { full:d.toLocaleDateString('en-IN',{weekday:'long',day:'numeric',month:'short'}), badge };
}

export default function DoctorSlots() {
  const [slotsByDate, setSlotsByDate] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(null);
  const [blockingDate, setBlockingDate] = useState(false);

  const loadSlots = async () => {
    try {
      const res = await doctorApi.getSlots();
      const grouped = res.data.reduce((acc, slot) => {
        const key = typeof slot.slot_date==='string' ? slot.slot_date.split('T')[0] : new Date(slot.slot_date).toISOString().split('T')[0];
        if (!acc[key]) acc[key]=[];
        acc[key].push(slot);
        return acc;
      }, {});
      setSlotsByDate(grouped);
      const dates = Object.keys(grouped).sort();
      if (dates.length && !selectedDate) setSelectedDate(dates[0]);
    } catch { toast.error('Failed to load slots'); }
    finally { setLoading(false); }
  };

  useEffect(()=>{ loadSlots(); },[]);

  const handleToggle = async (slotId) => {
    try {
      const res = await doctorApi.toggleSlotBlock(slotId);
      toast.success(`Slot ${res.data.status}`);
      loadSlots();
    } catch (err) { toast.error(err.response?.data?.error||'Failed to update slot'); }
  };

  const handleBlockDate = async () => {
    if (!selectedDate) return;
    setBlockingDate(true);
    try {
      await doctorApi.blockFullDate(selectedDate);
      toast.success('All available slots blocked');
      loadSlots();
    } catch { toast.error('Failed to block date'); }
    finally { setBlockingDate(false); }
  };

  const dates = Object.keys(slotsByDate).sort();
  const currentSlots = selectedDate ? (slotsByDate[selectedDate]||[]) : [];
  const availableCount = currentSlots.filter(s=>s.status==='available').length;
  const bookedCount = currentSlots.filter(s=>s.status==='booked').length;
  const blockedCount = currentSlots.filter(s=>s.status==='blocked').length;

  return (
    <div><Navbar/>
      <div className="slots-page">
        <div className="container">
          <div className="slots-header"><div><h1>Manage Slots</h1><p>Block or unblock time slots for the next 7 days</p></div></div>
          {loading ? <div className="slots-loading">Loading slots...</div> : (
            <div className="slots-layout">
              <div className="date-sidebar">
                {dates.map(d=>{
                  const {full,badge} = formatDateLabel(d);
                  const avail = (slotsByDate[d]||[]).filter(s=>s.status==='available').length;
                  return (
                    <button key={d} className={`sidebar-date ${selectedDate===d?'active':''}`} onClick={()=>setSelectedDate(d)}>
                      <div className="sd-top"><span className="sd-label">{full}</span>{badge&&<span className="sd-badge">{badge}</span>}</div>
                      <span className="sd-avail">{avail} available</span>
                    </button>
                  );
                })}
              </div>
              <div className="slots-panel">
                {selectedDate && (
                  <>
                    <div className="sp-header">
                      <div className="sp-stats">
                        <span className="sps available">{availableCount} Available</span>
                        <span className="sps booked">{bookedCount} Booked</span>
                        <span className="sps blocked">{blockedCount} Blocked</span>
                      </div>
                      <button className="block-day-btn" onClick={handleBlockDate} disabled={blockingDate||availableCount===0}>
                        <Ban size={14}/>{blockingDate?'Blocking...':'Block Entire Day'}
                      </button>
                    </div>
                    <div className="sp-grid">
                      {currentSlots.map(slot=>(
                        <div key={slot.id} className={`slot-item ${slot.status}`}>
                          <span className="si-time">{formatTime(slot.start_time)}</span>
                          <span className={`si-status ${slot.status}`}>
                            {slot.status==='available'&&<CheckCircle size={12}/>}
                            {slot.status==='booked'&&<Calendar size={12}/>}
                            {slot.status==='blocked'&&<Ban size={12}/>}
                            {slot.status}
                          </span>
                          {slot.status!=='booked' && (
                            <button className={`si-toggle ${slot.status==='blocked'?'unblock':'block'}`} onClick={()=>handleToggle(slot.id)}>
                              {slot.status==='blocked'?<><Unlock size={12}/> Unblock</>:<><Lock size={12}/> Block</>}
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
