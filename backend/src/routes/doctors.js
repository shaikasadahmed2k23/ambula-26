const router = require('express').Router();
const auth = require('../middleware/auth');
const {
  login, getProfile, getTodayAppointments,
  addConsultationNotes, getDoctorSlots, toggleSlotBlock, blockFullDate,
} = require('../controllers/doctorController');

router.post('/login', login);
router.get('/profile', auth('doctor'), getProfile);
router.get('/today-appointments', auth('doctor'), getTodayAppointments);
router.post('/consultation/:bookingId', auth('doctor'), addConsultationNotes);
router.get('/slots', auth('doctor'), getDoctorSlots);
router.patch('/slots/block-date', auth('doctor'), blockFullDate);
router.patch('/slots/:slotId/block', auth('doctor'), toggleSlotBlock);

module.exports = router;
