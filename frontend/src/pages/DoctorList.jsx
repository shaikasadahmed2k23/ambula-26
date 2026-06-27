import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { patientApi } from '../api';
import Navbar from '../components/Navbar';
import { Search, MapPin, Star, Clock, IndianRupee, ChevronRight, SlidersHorizontal, X } from 'lucide-react';
import toast from 'react-hot-toast';
import './DoctorList.css';

const SPEC_OPTIONS = ['Cardiologist','Neurologist','Orthopedist','General Physician','Gynecologist','Dermatologist','Pediatrician','Psychiatrist'];

export default function DoctorList() {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [search, setSearch] = useState(searchParams.get('search')||'');
  const [specialization, setSpecialization] = useState(searchParams.get('specialization')||'');
  const [location, setLocation] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const fetchDoctors = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (specialization) params.specialization = specialization;
      if (location) params.location = location;
      const res = await patientApi.searchDoctors(params);
      setDoctors(res.data);
    } catch { toast.error('Failed to load doctors'); }
    finally { setLoading(false); }
  }, [search, specialization, location]);

  useEffect(() => { fetchDoctors(); }, [fetchDoctors]);

  const clearFilters = () => { setSearch(''); setSpecialization(''); setLocation(''); };
  const activeCount = [search, specialization, location].filter(Boolean).length;

  return (
    <div><Navbar />
      <div className="doclist-page">
        <div className="container">
          <div className="doclist-header">
            <div><h1>Find Doctors</h1><p>{loading?'Loading...':`${doctors.length} doctor${doctors.length!==1?'s':''} available`}</p></div>
            <div className="doclist-search-row">
              <div className="search-field">
                <Search size={16} className="sf-icon" />
                <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Name, specialization, city..." className="sf-input" />
              </div>
              <button className="filter-toggle" onClick={()=>setShowFilters(!showFilters)}>
                <SlidersHorizontal size={16} /> Filters {activeCount>0&&<span className="filter-count">{activeCount}</span>}
              </button>
            </div>
            {showFilters && (
              <div className="filter-row">
                <select value={specialization} onChange={e=>setSpecialization(e.target.value)} className="filter-select">
                  <option value="">All Specializations</option>
                  {SPEC_OPTIONS.map(s=><option key={s} value={s}>{s}</option>)}
                </select>
                <div className="search-field">
                  <MapPin size={14} className="sf-icon" />
                  <input value={location} onChange={e=>setLocation(e.target.value)} placeholder="Filter by city..." className="sf-input" />
                </div>
              </div>
            )}
            {activeCount>0 && <div className="active-filters"><span className="filter-chip">{activeCount} filter{activeCount>1?'s':''} active</span><button className="clear-filters" onClick={clearFilters}>Clear all</button></div>}
          </div>
          {loading ? (
            <div className="loading-grid">{[1,2,3,4,5,6].map(i=><div key={i} className="doc-skeleton"/>)}</div>
          ) : doctors.length===0 ? (
            <div className="empty-state"><Search size={48}/><h3>No doctors found</h3><p>Try different search terms or clear filters</p><button onClick={clearFilters} className="btn-primary">Clear Filters</button></div>
          ) : (
            <div className="doctors-grid">
              {doctors.map(doc=>(
                <div key={doc.id} className="doc-card" onClick={()=>navigate(`/doctors/${doc.id}`)}>
                  <div className="doc-avatar">{doc.avatar_url?<img src={doc.avatar_url} alt={doc.name}/>:<div className="avatar-initials">{doc.name.split(' ').map(n=>n[0]).join('').slice(0,2)}</div>}</div>
                  <div className="doc-info">
                    <h3 className="doc-name">{doc.name}</h3>
                    <span className="doc-spec">{doc.specialization}</span>
                    <div className="doc-meta"><span><MapPin size={13}/> {doc.location}</span><span><Clock size={13}/> {doc.experience_years} yrs exp</span></div>
                    <div className="doc-footer">
                      <div className="doc-rating"><Star size={14} fill="#F59E0B" stroke="none"/><span>{doc.rating}</span></div>
                      <div className="doc-fee"><IndianRupee size={13}/><span>{doc.consultation_fee}</span></div>
                      <ChevronRight size={16} className="doc-arrow"/>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
