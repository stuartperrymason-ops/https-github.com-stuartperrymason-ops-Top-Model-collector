/**
 * @file Sidebar.tsx
 * @description A responsive sidebar component for application navigation.
 * It displays as a static sidebar on larger screens and a collapsible, slide-out menu on mobile.
 */

import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { HomeIcon, CollectionIcon, UploadIcon, CogIcon, MenuIcon, XIcon, DashboardIcon } from './icons/Icons';

const Sidebar: React.FC = () => {
  // State to manage the visibility of the mobile menu.
  const [isOpen, setIsOpen] = useState(false);

  // Configuration for navigation links to keep the code DRY.
  const navLinks = [
    { to: '/', text: 'Welcome', icon: <HomeIcon /> },
    { to: '/collection', text: 'Collection', icon: <CollectionIcon /> },
    { to: '/dashboard', text: 'Dashboard', icon: <DashboardIcon /> },
    { to: '/bulk', text: 'Bulk Data', icon: <UploadIcon /> },
    { to: '/settings', text: 'Settings', icon: <CogIcon /> },
  ];

  // Common Tailwind classes for navigation links.
  const linkClasses = "flex items-center px-4 py-3 text-gray-300 hover:bg-gray-700 hover:text-white rounded-md transition-colors duration-200";
  // Classes applied to the active link, provided by NavLink's `isActive` property.
  const activeLinkClasses = "bg-primary text-white";

  // The main content of the sidebar, extracted into a separate component for reuse.
  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-surface w-64 p-4">
      <div className="flex items-center mb-8">
        <svg className="w-8 h-8 mr-2 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v11.494m-9-5.747h18"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5.253 12h13.494"></path></svg>
        <h1 className="text-2xl font-bold text-white">ModelForge</h1>
      </div>
      <nav className="flex-1 space-y-2">
        {navLinks.map(link => (
          <NavLink
            key={link.to}
            to={link.to}
            // `NavLink` provides an `isActive` boolean to conditionally apply styling.
            className={({ isActive }) => `${linkClasses} ${isActive ? activeLinkClasses : ''}`}
            // Close the mobile menu when a link is clicked.
            onClick={() => setIsOpen(false)}
          >
            {link.icon}
            <span className="ml-3">{link.text}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar: Always visible on medium screens and up. */}
      <div className="hidden md:block">
        <SidebarContent />
      </div>

      {/* Mobile Menu Button: A hamburger/close icon shown only on small screens. */}
      <div className="md:hidden fixed top-4 left-4 z-20">
        <button onClick={() => setIsOpen(!isOpen)} className="p-2 bg-surface rounded-md text-white">
          {isOpen ? <XIcon /> : <MenuIcon />}
        </button>
      </div>
      
      {/* Mobile Sidebar: Slides in from the left, controlled by the `isOpen` state. */}
      <div className={`fixed inset-0 z-10 transform ${isOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 ease-in-out md:hidden`}>
         {/* Overlay to close the menu when clicking outside of it. */}
         <div className="absolute inset-0 bg-black opacity-50" onClick={() => setIsOpen(false)}></div>
         <div className="relative">
            <SidebarContent />
         </div>
      </div>
    </>
  );
};

export default Sidebar;