const supabase = require('../db/supabase');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// POST /api/doctors/login
const login = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ error: 'Email and password required' });
  try {
    const { data, error } = await supabase
      .from('doctors')
      .select('*')
      .eq('email', email)
      .single();
    if (error || !data) return res.status(401).json({ error: 'Invalid credentials' });
    const valid = await bcrypt.compare(password, data.password_hash);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });
    const token = jwt.sign(
      { id: data.id, role: 'doctor', name: data.name },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );
    const { password_hash, ...doctorData } = data;
    res.json({ token, doctor: doctorData });
  } catch (err) {
    console.error('Doctor login error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
};

// GET /api/doctors/profile
const getProfile = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('doctors')
      .select('id,name,specialization,location,consultation_fee,bio,experience_years,rating,email,avatar_url')
      .eq('id', req.user.id)
      .single();
    if (error || !data) return res.status(404).json({ error: 'Doctor not found' });
    res.json(data);
  } catch (err) {
    console.error('Get profile error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
};

// GET /api/doctors/today-appointments
const getTodayAppointments = async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const { data: slots, error: slotsErr } = await supabase
      .from('slots')
      .select('id, start_time, end_time, slot_date')
      .eq('doctor_id', req.user.id)
      .eq('slot_date', today)
      .order('start_time');
    if (slotsErr) throw slotsErr;
    if (!slots || slots.length === 0) return res.json([]);

    const slotIds = slots.map(s => s.id);

    const { data: bookings, error: bookErr } = await supabase
      .from('bookings')
      .select('*')
      .in('slot_id', slotIds);
    if (bookErr) throw bookErr;
    if (!bookings || bookings.length === 0) return res.json([]);

    const bookingIds = bookings.map(b => b.id);
    const { data: consultations } = await supabase
      .from('consultations')
      .select('*')
      .in('booking_id', bookingIds);

    const slotMap = {};
    slots.forEach(s => { slotMap[s.id] = s; });
    const consultMap = {};
    (consultations || []).forEach(c => { consultMap[c.booking_id] = c; });

    const result = bookings.map(b => ({
      booking_id: b.id,
      booking_code: b.booking_code,
      patient_name: b.patient_name,
      patient_age: b.patient_age,
      patient_phone: b.patient_phone,
      blood_group: b.blood_group,
      known_conditions: b.known_conditions,
      current_medications: b.current_medications,
      booking_status: b.status,
      start_time: slotMap[b.slot_id]?.start_time,
      end_time: slotMap[b.slot_id]?.end_time,
      slot_date: slotMap[b.slot_id]?.slot_date,
      diagnosis_notes: consultMap[b.id]?.diagnosis_notes || null,
      prescription: consultMap[b.id]?.prescription || null,
      follow_up_date: consultMap[b.id]?.follow_up_date || null,
    }));

    result.sort((a, b) => (a.start_time > b.start_time ? 1 : -1));
    res.json(result);
  } catch (err) {
    console.error('Get today appointments error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
};

// POST /api/doctors/consultation/:bookingId
const addConsultationNotes = async (req, res) => {
  const { bookingId } = req.params;
  const { diagnosis_notes, prescription, follow_up_date } = req.body;
  try {
    // Verify booking belongs to this doctor
    const { data: booking, error: bErr } = await supabase
      .from('bookings')
      .select('id, slot_id')
      .eq('id', bookingId)
      .single();
    if (bErr || !booking) return res.status(404).json({ error: 'Booking not found' });

    const { data: slot, error: sErr } = await supabase
      .from('slots')
      .select('doctor_id')
      .eq('id', booking.slot_id)
      .single();
    if (sErr || slot.doctor_id !== req.user.id)
      return res.status(403).json({ error: 'Unauthorized' });

    // Upsert consultation
    const { data, error } = await supabase
      .from('consultations')
      .upsert({
        booking_id: bookingId,
        diagnosis_notes,
        prescription,
        follow_up_date: follow_up_date || null,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'booking_id' })
      .select()
      .single();
    if (error) throw error;

    // Mark booking completed
    await supabase.from('bookings').update({ status: 'completed' }).eq('id', bookingId);

    res.json({ message: 'Consultation notes saved', consultation: data });
  } catch (err) {
    console.error('Add consultation notes error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
};

// GET /api/doctors/slots
const getDoctorSlots = async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const { data, error } = await supabase
      .from('slots')
      .select('id, slot_date, start_time, end_time, status')
      .eq('doctor_id', req.user.id)
      .gte('slot_date', today)
      .order('slot_date')
      .order('start_time');
    if (error) throw error;
    res.json(data || []);
  } catch (err) {
    console.error('Get doctor slots error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
};

// PATCH /api/doctors/slots/:slotId/block
const toggleSlotBlock = async (req, res) => {
  const { slotId } = req.params;
  try {
    const { data: slot, error } = await supabase
      .from('slots')
      .select('*')
      .eq('id', slotId)
      .eq('doctor_id', req.user.id)
      .single();
    if (error || !slot) return res.status(404).json({ error: 'Slot not found' });
    if (slot.status === 'booked')
      return res.status(400).json({ error: 'Cannot block a booked slot' });
    const newStatus = slot.status === 'blocked' ? 'available' : 'blocked';
    await supabase.from('slots').update({ status: newStatus }).eq('id', slotId);
    res.json({ message: `Slot ${newStatus}`, status: newStatus });
  } catch (err) {
    console.error('Toggle block error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
};

// PATCH /api/doctors/slots/block-date
const blockFullDate = async (req, res) => {
  const { date } = req.body;
  if (!date) return res.status(400).json({ error: 'Date required' });
  try {
    const { error } = await supabase
      .from('slots')
      .update({ status: 'blocked' })
      .eq('doctor_id', req.user.id)
      .eq('slot_date', date)
      .eq('status', 'available');
    if (error) throw error;
    res.json({ message: `All available slots on ${date} blocked` });
  } catch (err) {
    console.error('Block date error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = { login, getProfile, getTodayAppointments, addConsultationNotes, getDoctorSlots, toggleSlotBlock, blockFullDate };
