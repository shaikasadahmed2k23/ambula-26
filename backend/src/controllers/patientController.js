const supabase = require('../db/supabase');
const { v4: uuidv4 } = require('uuid');

// GET /api/patients/doctors
const searchDoctors = async (req, res) => {
  const { specialization, location, search } = req.query;
  try {
    let query = supabase
      .from('doctors')
      .select('id,name,specialization,location,consultation_fee,bio,experience_years,rating,avatar_url')
      .order('rating', { ascending: false });

    if (specialization) query = query.ilike('specialization', `%${specialization}%`);
    if (location) query = query.ilike('location', `%${location}%`);
    if (search) query = query.or(`name.ilike.%${search}%,specialization.ilike.%${search}%,location.ilike.%${search}%`);

    const { data, error } = await query;
    if (error) throw error;
    res.json(data || []);
  } catch (err) {
    console.error('Search doctors error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
};

// GET /api/patients/doctors/:doctorId
const getDoctorProfile = async (req, res) => {
  const { doctorId } = req.params;
  try {
    const { data: doctor, error: dErr } = await supabase
      .from('doctors')
      .select('id,name,specialization,location,consultation_fee,bio,experience_years,rating,avatar_url')
      .eq('id', doctorId)
      .single();
    if (dErr || !doctor) return res.status(404).json({ error: 'Doctor not found' });

    const today = new Date().toISOString().split('T')[0];
    const nextWeek = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];

    const { data: slots, error: sErr } = await supabase
      .from('slots')
      .select('id,slot_date,start_time,end_time,status')
      .eq('doctor_id', doctorId)
      .eq('status', 'available')
      .gte('slot_date', today)
      .lte('slot_date', nextWeek)
      .order('slot_date')
      .order('start_time');
    if (sErr) throw sErr;

    // Group by date
    const slotsByDate = (slots || []).reduce((acc, slot) => {
      const key = slot.slot_date;
      if (!acc[key]) acc[key] = [];
      acc[key].push(slot);
      return acc;
    }, {});

    res.json({ doctor, slotsByDate });
  } catch (err) {
    console.error('Get doctor profile error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
};

// POST /api/patients/book
// Uses Supabase RPC (book_slot function) for atomic double-booking prevention
const bookSlot = async (req, res) => {
  const { slot_id, patient_name, patient_age, patient_phone, blood_group, known_conditions, current_medications } = req.body;
  if (!slot_id || !patient_name || !patient_age || !patient_phone)
    return res.status(400).json({ error: 'slot_id, patient_name, patient_age, patient_phone are required' });

  try {
    const booking_code = 'AMB' + uuidv4().replace(/-/g, '').substring(0, 8).toUpperCase();

    const { data, error } = await supabase.rpc('book_slot', {
      p_slot_id: slot_id,
      p_booking_code: booking_code,
      p_patient_name: patient_name,
      p_patient_age: parseInt(patient_age),
      p_patient_phone: patient_phone,
      p_blood_group: blood_group || null,
      p_known_conditions: known_conditions || [],
      p_current_medications: current_medications || [],
    });

    if (error) throw error;

    if (!data.success) {
      return res.status(409).json({
        error: data.error || 'Slot unavailable',
        nextAvailableSlots: data.nextAvailableSlots || [],
      });
    }

    // Fetch slot + doctor info for confirmation
    const { data: slot } = await supabase
      .from('slots')
      .select('slot_date, start_time, end_time, doctor_id')
      .eq('id', slot_id)
      .single();

    const { data: doctor } = await supabase
      .from('doctors')
      .select('name, specialization, location')
      .eq('id', slot.doctor_id)
      .single();

    res.status(201).json({
      message: 'Appointment booked successfully',
      booking: data.booking,
      slot: { date: slot.slot_date, start_time: slot.start_time, end_time: slot.end_time },
      doctor,
    });
  } catch (err) {
    console.error('Book slot error:', err.message);
    res.status(500).json({ error: 'Booking failed, please try again' });
  }
};

// GET /api/patients/booking/:bookingCode
const getBookingByCode = async (req, res) => {
  const { bookingCode } = req.params;
  try {
    const { data: booking, error: bErr } = await supabase
      .from('bookings')
      .select('*')
      .eq('booking_code', bookingCode.toUpperCase())
      .single();
    if (bErr || !booking) return res.status(404).json({ error: 'Booking not found' });

    const { data: slot } = await supabase
      .from('slots')
      .select('slot_date, start_time, end_time, doctor_id')
      .eq('id', booking.slot_id)
      .single();

    const { data: doctor } = await supabase
      .from('doctors')
      .select('name, specialization, location')
      .eq('id', slot.doctor_id)
      .single();

    res.json({
      ...booking,
      slot_date: slot.slot_date,
      start_time: slot.start_time,
      end_time: slot.end_time,
      doctor_name: doctor.name,
      specialization: doctor.specialization,
      location: doctor.location,
    });
  } catch (err) {
    console.error('Get booking error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
};

// GET /api/patients/specializations
const getSpecializations = async (req, res) => {
  try {
    const { data, error } = await supabase.from('doctors').select('specialization');
    if (error) throw error;
    const unique = [...new Set((data || []).map(d => d.specialization))].sort();
    res.json(unique);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

// GET /api/patients/locations
const getLocations = async (req, res) => {
  try {
    const { data, error } = await supabase.from('doctors').select('location');
    if (error) throw error;
    const unique = [...new Set((data || []).map(d => d.location))].sort();
    res.json(unique);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = { searchDoctors, getDoctorProfile, bookSlot, getBookingByCode, getSpecializations, getLocations };
