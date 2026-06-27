import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Shield, Clock, Star, ChevronRight, Stethoscope, Heart, Brain, Bone, Eye, Baby } from 'lucide-react';
import Navbar from '../components/Navbar';
import './Home.css';

const SPECS = [
  {name:'Cardiologist',icon:Heart,color:'#EF4444'},{name:'Neurologist',icon:Brain,color:'#8B5CF6'},
  {name:'Orthopedist',icon:Bone,color:'#F59E0B'},{name:'General Physician',icon:Stethoscope,color:'#0D9488'},
  {name:'Gynecologist',icon:Baby,color:'#EC4899'},{name:'Dermatologist',icon:Eye,color:'#3B82F6'},
];

export default function Home() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const handleSearch = (e) => { e.preventDefault(); navigate(`/doctors${search?`?search=${encodeURIComponent(search)}`:''}`); };
  return (
    <div className="home">
      <Navbar />
      <section className="hero">
        <div className="container hero-inner">
          <div className="hero-content">
            <div className="hero-badge"><span className="badge-dot" />Trusted by thousands across India</div>
            <h1 className="hero-title">Find the right doctor,<br /><span className="hero-accent">book in 2 minutes</span></h1>
            <p className="hero-sub">Search verified doctors by specialization and city. View real-time availability and confirm your appointment instantly.</p>
            <form className="search-bar" onSubmit={handleSearch}>
              <Search size={18} className="search-icon" />
              <input type="text" placeholder="Search by doctor name, specialization, or city..." value={search} onChange={e=>setSearch(e.target.value)} className="search-input" />
              <button type="submit" className="search-btn">Search</button>
            </form>
            <div className="hero-stats">
              <div className="stat"><strong>50+</strong><span>Verified Doctors</span></div>
              <div className="stat-divider" />
              <div className="stat"><strong>10k+</strong><span>Appointments</span></div>
              <div className="stat-divider" />
              <div className="stat"><strong>4.8★</strong><span>Avg. Rating</span></div>
            </div>
          </div>
          <div className="hero-visual">
            <div className="card-float card-top"><div className="cf-icon" style={{background:'#D1FAE5'}}><Shield size={18} style={{color:'#10B981'}} /></div><div><div className="cf-title">Verified Doctors</div><div className="cf-sub">All credentials checked</div></div></div>
            <div className="hero-visual-main"><div className="visual-circle"><Stethoscope size={64} style={{color:'white',opacity:0.9}} /></div></div>
            <div className="card-float card-bottom"><div className="cf-icon" style={{background:'#CCFBF1'}}><Clock size={18} style={{color:'#0D9488'}} /></div><div><div className="cf-title">Instant Booking</div><div className="cf-sub">Get confirmed in seconds</div></div></div>
          </div>
        </div>
      </section>
      <section className="section">
        <div className="container">
          <div className="section-header"><h2>Browse by Specialization</h2><p>Find the right expert for your health concern</p></div>
          <div className="spec-grid">
            {SPECS.map(({name,icon:Icon,color})=>(
              <button key={name} className="spec-card" onClick={()=>navigate(`/doctors?specialization=${encodeURIComponent(name)}`)}>
                <div className="spec-icon" style={{background:color+'18',color}}><Icon size={28} /></div>
                <span className="spec-name">{name}</span>
                <ChevronRight size={16} className="spec-arrow" />
              </button>
            ))}
          </div>
        </div>
      </section>
      <section className="section trust-section">
        <div className="container">
          <div className="trust-grid">
            <div className="trust-card"><div className="trust-icon"><Shield size={24} /></div><h3>No Double Bookings</h3><p>Our system prevents two patients from booking the same slot simultaneously — guaranteed at the database level.</p></div>
            <div className="trust-card"><div className="trust-icon"><Clock size={24} /></div><h3>Real-time Slots</h3><p>See live availability for the next 7 days. Slots update instantly as bookings happen across all devices.</p></div>
            <div className="trust-card"><div className="trust-icon"><Star size={24} /></div><h3>Your Records Safe</h3><p>Your health summary is shared only with your consulting doctor, never with third parties.</p></div>
          </div>
        </div>
      </section>
      <section className="section cta-section">
        <div className="container">
          <div className="cta-box">
            <h2>Are you a doctor?</h2>
            <p>Join Ambula to manage your appointments digitally, add consultation notes, and take full control of your schedule.</p>
            <button className="cta-btn" onClick={()=>navigate('/doctor/login')}>Access Doctor Dashboard</button>
          </div>
        </div>
      </section>
      <footer className="footer"><div className="container"><p>© 2026 Ambula Technologies. Built for India's healthcare future.</p></div></footer>
    </div>
  );
}