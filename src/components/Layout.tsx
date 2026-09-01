import React from 'react';
import { useLocation } from 'react-router-dom';
import { Navbar } from './Navbar';

const HIDE_NAVBAR_ROUTES = ['/login', '/register', '/register-entity', '/organizaciones'];

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { pathname } = useLocation();
  const hideNavbar = HIDE_NAVBAR_ROUTES.includes(pathname);

  return (
    <div className="min-h-screen bg-gray-50">
      {!hideNavbar && <Navbar />}
      <main>{children}</main>
    </div>
  );
};
