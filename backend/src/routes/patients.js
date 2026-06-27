const router = require('express').Router();
const {
  searchDoctors, getDoctorProfile, bookSlot,
  getBookingByCode, getSpecializations, getLocations,
} = require('../controllers/patientController');

router.get('/doctors', searchDoctors);
router.get('/doctors/:doctorId', getDoctorProfile);
router.post('/book', bookSlot);
router.get('/booking/:bookingCode', getBookingByCode);
router.get('/specializations', getSpecializations);
router.get('/locations', getLocations);

module.exports = router;
