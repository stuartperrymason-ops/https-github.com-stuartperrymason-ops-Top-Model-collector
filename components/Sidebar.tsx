/**
 * @file Sidebar.tsx
 * @description A responsive sidebar component for application navigation.
 * It displays as a static sidebar on larger screens and a collapsible, slide-out menu on mobile.
 * This program was written by Stuart Mason October 2025.
 */

import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { HomeIcon, CollectionIcon, UploadIcon, CogIcon, MenuIcon, XIcon, DashboardIcon, CalendarIcon, PaintBrushIcon } from './icons/Icons';

const Sidebar: React.FC = () => {
  // State to manage the visibility of the mobile menu. `isOpen` is a boolean that
  // determines whether the mobile sidebar is shown or hidden.
  const [isOpen, setIsOpen] = useState(false);

  // Configuration for navigation links. Storing them in an array keeps the JSX clean,
  // makes it easy to add or remove links, and ensures consistency.
  const navLinks = [
    { to: '/', text: 'Welcome', icon: <HomeIcon /> },
    { to: '/collection', text: 'Collection', icon: <CollectionIcon /> },
    { to: '/dashboard', text: 'Dashboard', icon: <DashboardIcon /> },
    { to: '/calendar', text: 'Calendar', icon: <CalendarIcon /> },
    { to: '/paints', text: 'Paints', icon: <PaintBrushIcon /> },
    { to: '/bulk', text: 'Bulk Data', icon: <UploadIcon /> },
    { to: '/settings', text: 'Settings', icon: <CogIcon /> },
  ];

  // Common Tailwind CSS classes for navigation links to maintain a consistent style.
  const linkClasses = "flex items-center px-4 py-3 text-gray-300 hover:bg-gray-700 hover:text-white rounded-md transition-colors duration-200";
  // Classes applied only to the active link. This is determined by NavLink's `isActive` property.
  const activeLinkClasses = "bg-primary text-white";

  // The main content of the sidebar is extracted into a separate component. This promotes reusability
  // and keeps the main component's return statement cleaner. It's used for both desktop and mobile views.
  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-surface w-64 p-4">
      <div className="flex items-center mb-8">
        {/* Simple SVG logo */}
        <svg className="w-8 h-8 mr-2 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v11.494m-9-5.747h18"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5.253 12h13.494"></path></svg>
        <h1 className="text-2xl font-bold text-white">ModelForge</h1>
      </div>
      <nav className="flex-1 space-y-2">
        {/* Iterate over the navLinks array to render each navigation item. */}
        {navLinks.map(link => (
          <NavLink
            key={link.to}
            to={link.to}
            // `NavLink` provides an `isActive` boolean via a render prop in `className`.
            // This allows us to conditionally apply the `activeLinkClasses` when the link's path matches the current URL.
            className={({ isActive }) => `${linkClasses} ${isActive ? activeLinkClasses : ''}`}
            // When a link is clicked on mobile, we close the sidebar for a better user experience.
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
      {/* Desktop Sidebar: Always visible on medium screens and up (`md:block`).
          It's hidden on smaller screens (`hidden`). */}
      <div className="hidden md:block">
        <SidebarContent />
      </div>

      {/* Mobile Menu Button: A hamburger/close icon shown only on small screens (`md:hidden`).
          It's fixed to the top-left corner and sits above other content (`z-20`).
          Clicking it toggles the `isOpen` state. */}
      <div className="md:hidden fixed top-4 left-4 z-20">
        <button onClick={() => setIsOpen(!isOpen)} className="p-2 bg-surface rounded-md text-white">
          {isOpen ? <XIcon /> : <MenuIcon />}
        </button>
      </div>
      
      {/* Mobile Sidebar: Slides in from the left. Its position is controlled by the `isOpen` state.
          The `transform` and `transition-transform` classes create the slide-in/out animation.
          `translate-x-0` means it's visible, `-translate-x-full` means it's off-screen to the left. */}
      <div className={`fixed inset-0 z-10 transform ${isOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 ease-in-out md:hidden`}>
         {/* Overlay: This dark, semi-transparent layer covers the main content when the mobile menu is open.
             Clicking it closes the menu, providing an intuitive way for users to exit the navigation. */}
         <div className="absolute inset-0 bg-black opacity-50" onClick={() => setIsOpen(false)}></div>
         <div className="relative">
            <SidebarContent />
         </div>
      </div>
    </>
  );
};

export default Sidebar;