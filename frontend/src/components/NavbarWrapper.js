import React from 'react';
import { useLocation, Outlet } from 'react-router-dom';
import Navbar from './Navbar';

const authRoutes = [
  '/login',
  '/register',
  '/verify-otp',
  '/forgot-password',
  '/verify-reset-otp',
  '/reset-password',
];

const NavbarWrapper = () => {
  const location = useLocation();
  const showNavbar = !authRoutes.includes(location.pathname);

  return (
    <>
      {showNavbar && <Navbar />}
      <div style={{ minHeight: '500px', backgroundColor: '#f5f5f5' }}>
        <Outlet />
      </div>
    </>
  );
};

export default NavbarWrapper;