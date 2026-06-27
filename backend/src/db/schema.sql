-- =========================================
-- AMBULA '26 - Complete Schema (Run in Supabase SQL Editor)
-- =========================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- PATIENTS
CREATE TABLE IF NOT EXISTS patients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  age INTEGER NOT NULL CHECK (age > 0 AND age < 150),
  phone VARCHAR(15) NOT NULL UNIQUE,
  email VARCHAR(255),
  blood_group VARCHAR(5),
  known_conditions TEXT[],
  current_medications TEXT[],
  password_hash VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- DOCTORS
CREATE TABLE IF NOT EXISTS doctors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  specialization VARCHAR(255) NOT NULL,
  location VARCHAR(255) NOT NULL,
  consultation_fee INTEGER NOT NULL DEFAULT 500,
  bio TEXT,
  experience_years INTEGER DEFAULT 0,
  rating DECIMAL(3,2) DEFAULT 4.5,
  avatar_url TEXT,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- SLOTS
CREATE TABLE IF NOT EXISTS slots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  doctor_id UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
  slot_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'booked', 'blocked')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(doctor_id, slot_date, start_time)
);

-- BOOKINGS
CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_code VARCHAR(12) NOT NULL UNIQUE,
  slot_id UUID NOT NULL REFERENCES slots(id) ON DELETE RESTRICT,
  patient_id UUID REFERENCES patients(id) ON DELETE SET NULL,
  patient_name VARCHAR(255) NOT NULL,
  patient_age INTEGER NOT NULL,
  patient_phone VARCHAR(15) NOT NULL,
  blood_group VARCHAR(5),
  known_conditions TEXT[],
  current_medications TEXT[],
  status VARCHAR(20) NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- CONSULTATIONS
CREATE TABLE IF NOT EXISTS consultations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE UNIQUE,
  diagnosis_notes TEXT,
  prescription TEXT,
  follow_up_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- INDEXES
CREATE INDEX IF NOT EXISTS idx_slots_doctor_date ON slots(doctor_id, slot_date);
CREATE INDEX IF NOT EXISTS idx_slots_status ON slots(status);
CREATE INDEX IF NOT EXISTS idx_bookings_slot ON bookings(slot_id);
CREATE INDEX IF NOT EXISTS idx_bookings_code ON bookings(booking_code);
CREATE INDEX IF NOT EXISTS idx_doctors_specialization ON doctors(specialization);
CREATE INDEX IF NOT EXISTS idx_doctors_location ON doctors(location);

-- =========================================
-- SEED DOCTORS (password = "doctor123")
-- =========================================
INSERT INTO doctors (name, specialization, location, consultation_fee, bio, experience_years, rating, email, password_hash) VALUES
('Dr. Priya Sharma','Cardiologist','Mumbai',800,'Specialist in heart diseases with over 12 years of experience at AIIMS Mumbai.',12,4.8,'priya.sharma@ambula.in','$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'),
('Dr. Rajesh Kumar','Orthopedist','Delhi',700,'Leading orthopedic surgeon specializing in joint replacement and sports injuries.',15,4.7,'rajesh.kumar@ambula.in','$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'),
('Dr. Ananya Patel','Dermatologist','Bangalore',600,'Board-certified dermatologist with expertise in cosmetic and medical dermatology.',8,4.9,'ananya.patel@ambula.in','$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'),
('Dr. Suresh Menon','Neurologist','Chennai',900,'Neurologist specializing in stroke management, epilepsy, and movement disorders.',18,4.6,'suresh.menon@ambula.in','$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'),
('Dr. Fatima Siddiqui','Gynecologist','Hyderabad',650,'Specialist in high-risk pregnancies, minimally invasive surgery, and reproductive medicine.',10,4.9,'fatima.siddiqui@ambula.in','$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'),
('Dr. Arjun Nair','General Physician','Kurnool',400,'General practitioner with expertise in preventive medicine and diabetes management.',6,4.5,'arjun.nair@ambula.in','$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi')
ON CONFLICT (email) DO NOTHING;

-- =========================================
-- SLOT GENERATION FUNCTION (fixed for Supabase)
-- =========================================
CREATE OR REPLACE FUNCTION generate_slots_for_doctor(p_doctor_id UUID)
RETURNS void AS $$
DECLARE
  d DATE;
  hour_val INTEGER;
  minute_val INTEGER;
  t TIME;
  end_t TIME;
BEGIN
  FOR d IN
    SELECT (CURRENT_DATE + s)::DATE FROM generate_series(0, 7) AS s
  LOOP
    FOR hour_val IN SELECT unnest(ARRAY[9,10,11,12,13,14,15,16])
    LOOP
      FOR minute_val IN SELECT unnest(ARRAY[0,30])
      LOOP
        CONTINUE WHEN hour_val = 16 AND minute_val = 30;
        t := make_time(hour_val, minute_val, 0);
        IF minute_val = 30 THEN
          end_t := make_time(hour_val + 1, 0, 0);
        ELSE
          end_t := make_time(hour_val, 30, 0);
        END IF;
        INSERT INTO slots (doctor_id, slot_date, start_time, end_time, status)
        VALUES (p_doctor_id, d, t, end_t, 'available')
        ON CONFLICT (doctor_id, slot_date, start_time) DO NOTHING;
      END LOOP;
    END LOOP;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Generate slots for all doctors
DO $$
DECLARE
  doc RECORD;
BEGIN
  FOR doc IN SELECT id FROM doctors LOOP
    PERFORM generate_slots_for_doctor(doc.id);
  END LOOP;
END;
$$;

-- =========================================
-- BOOK SLOT FUNCTION (atomic, prevents double booking)
-- Called via supabase.rpc('book_slot', {...})
-- =========================================
CREATE OR REPLACE FUNCTION book_slot(
  p_slot_id UUID,
  p_booking_code TEXT,
  p_patient_name TEXT,
  p_patient_age INTEGER,
  p_patient_phone TEXT,
  p_blood_group TEXT DEFAULT NULL,
  p_known_conditions TEXT[] DEFAULT ARRAY[]::TEXT[],
  p_current_medications TEXT[] DEFAULT ARRAY[]::TEXT[]
)
RETURNS JSON AS $$
DECLARE
  v_slot RECORD;
  v_booking RECORD;
  v_next_slots JSON;
BEGIN
  -- Lock the slot row to prevent concurrent bookings
  SELECT * INTO v_slot FROM slots WHERE id = p_slot_id FOR UPDATE;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Slot not found');
  END IF;

  IF v_slot.status != 'available' THEN
    -- Return next 3 available slots for same doctor same day
    SELECT json_agg(row_to_json(ns)) INTO v_next_slots
    FROM (
      SELECT id, slot_date, start_time, end_time
      FROM slots
      WHERE doctor_id = v_slot.doctor_id
        AND slot_date = v_slot.slot_date
        AND start_time > v_slot.start_time
        AND status = 'available'
      ORDER BY start_time
      LIMIT 3
    ) ns;

    RETURN json_build_object(
      'success', false,
      'error', 'Slot already booked',
      'nextAvailableSlots', COALESCE(v_next_slots, '[]'::JSON)
    );
  END IF;

  -- Create booking
  INSERT INTO bookings (
    booking_code, slot_id, patient_name, patient_age,
    patient_phone, blood_group, known_conditions, current_medications
  )
  VALUES (
    p_booking_code, p_slot_id, p_patient_name, p_patient_age,
    p_patient_phone, p_blood_group, p_known_conditions, p_current_medications
  )
  RETURNING * INTO v_booking;

  -- Mark slot as booked
  UPDATE slots SET status = 'booked' WHERE id = p_slot_id;

  RETURN json_build_object(
    'success', true,
    'booking', row_to_json(v_booking)
  );
END;
$$ LANGUAGE plpgsql;
