import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('ambula_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('ambula_token');
      localStorage.removeItem('ambula_user');
      window.location.href = '/doctor/login';
    }
    return Promise.reject(err);
  }
);

export const patientApi = {
  searchDoctors: (params) => api.get('/patients/doctors', { params }),
  getDoctorProfile: (id) => api.get(`/patients/doctors/${id}`),
  bookSlot: (data) => api.post('/patients/book', data),
  getBookingByCode: (code) => api.get(`/patients/booking/${code}`),
  getSpecializations: () => api.get('/patients/specializations'),
  getLocations: () => api.get('/patients/locations'),
};

export const doctorApi = {
  login: (data) => api.post('/doctors/login', data),
  getProfile: () => api.get('/doctors/profile'),
  getTodayAppointments: () => api.get('/doctors/today-appointments'),
  addConsultationNotes: (bookingId, data) => api.post(`/doctors/consultation/${bookingId}`, data),
  getSlots: () => api.get('/doctors/slots'),
  toggleSlotBlock: (slotId) => api.patch(`/doctors/slots/${slotId}/block`),
  blockFullDate: (date) => api.patch('/doctors/slots/block-date', { date }),
};

export default api;
