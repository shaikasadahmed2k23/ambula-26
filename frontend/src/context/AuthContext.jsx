import React, { createContext, useContext, useState, useEffect } from 'react';
import { doctorApi } from '../api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [doctor, setDoctor] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('ambula_token');
    const user = localStorage.getItem('ambula_user');
    if (token && user) setDoctor(JSON.parse(user));
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const res = await doctorApi.login({ email, password });
    const { token, doctor: doc } = res.data;
    localStorage.setItem('ambula_token', token);
    localStorage.setItem('ambula_user', JSON.stringify(doc));
    setDoctor(doc);
    return doc;
  };

  const logout = () => {
    localStorage.removeItem('ambula_token');
    localStorage.removeItem('ambula_user');
    setDoctor(null);
  };

  return (
    <AuthContext.Provider value={{ doctor, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
