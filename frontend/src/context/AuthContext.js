import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import { getMyNotifications } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const navigate = useNavigate();

  const fetchUnreadCount = useCallback(async () => {
    if (!localStorage.getItem('token')) return; // Check storage directly
    try {
      const { data } = await getMyNotifications();
      setUnreadCount(data.unreadCount);
    } catch (error) {
      console.error('Failed to fetch unread count:', error);
      // Don't logout, just fail silently
    }
  }, []);

  const setAuthData = useCallback((decodedToken, authToken) => {
    // --- THIS IS THE FIX ---
    // We get the email from the token now
    setUser({ id: decodedToken.id, role: decodedToken.role, email: decodedToken.email });
    setToken(authToken);
    setIsAuthenticated(true);
    localStorage.setItem('token', authToken);
    fetchUnreadCount();
  }, [fetchUnreadCount]);

  useEffect(() => {
    const currentToken = localStorage.getItem('token');
    if (currentToken) {
      try {
        const decoded = jwtDecode(currentToken);
        const expiresAt = decoded.exp * 1000;

        if (expiresAt > Date.now()) {
          setAuthData(decoded, currentToken);
        } else {
          // Token expired
          logout();
        }
      } catch (error) {
        console.error('Invalid token:', error);
        logout();
      }
    }
    setLoading(false);
  }, [setAuthData]); // Removed `logout` dependency

  // login, register, submitOtp are now handled in their respective pages
  // to allow for more complex logic (like redirects)

  const logout = () => {
    setUser(null);
    setToken(null);
    setIsAuthenticated(false);
    localStorage.removeItem('token');
    navigate('/login');
  };

  const redirectToDashboard = (role) => {
    switch (role) {
      case 'student':
        navigate('/dashboard');
        break;
      case 'recruiter':
        navigate('/admin/dashboard');
        break;
      case 'placementcell':
        navigate('/tpo/dashboard');
        break;
      case 'verifier':
        navigate('/dashboard'); // Or a specific verifier page
        break;
      default:
        navigate('/');
    }
  };

  const value = {
    user,
    token,
    isAuthenticated,
    loading,
    setAuthData, // Expose this for login/register pages
    logout,
    redirectToDashboard,
    unreadCount,
    fetchUnreadCount
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};