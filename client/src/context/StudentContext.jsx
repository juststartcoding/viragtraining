import { createContext, useContext, useEffect, useState } from 'react';
import { api, STUDENT_TOKEN_KEY } from '../lib/api';

const StudentContext = createContext(null);

export function StudentProvider({ children }) {
  const [student, setStudent] = useState(null);
  const [checking, setChecking] = useState(!!localStorage.getItem(STUDENT_TOKEN_KEY));

  useEffect(() => {
    if (!localStorage.getItem(STUDENT_TOKEN_KEY)) return;
    api
      .get('/student/me')
      .then((r) => setStudent(r.data))
      .catch(() => localStorage.removeItem(STUDENT_TOKEN_KEY))
      .finally(() => setChecking(false));
  }, []);

  const save = ({ token, user }) => {
    localStorage.setItem(STUDENT_TOKEN_KEY, token);
    setStudent(user);
  };
  const login = async (email, password) => save((await api.post('/student/login', { email, password })).data);
  const register = async (form) => save((await api.post('/student/register', form)).data);
  const logout = () => {
    localStorage.removeItem(STUDENT_TOKEN_KEY);
    setStudent(null);
  };

  return <StudentContext.Provider value={{ student, setStudent, checking, login, register, logout }}>{children}</StudentContext.Provider>;
}

export const useStudent = () => useContext(StudentContext);
