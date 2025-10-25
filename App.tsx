/**
 * @file App.tsx
 * @description The root component of the application.
 * It sets up the main layout, routing, and global state management.
 * This program was written by Stuart Mason October 2025.
 */

import React from 'react';
import { HashRouter, Route, Routes } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import WelcomePage from './pages/WelcomePage';
import CollectionPage from './pages/CollectionPage';
import DashboardPage from './pages/DashboardPage';
import BulkDataPage from './pages/BulkDataPage';
import SettingsPage from './pages/SettingsPage';
import CalendarPage from './pages/CalendarPage'; // Import the new CalendarPage
import { DataProvider } from './context/DataContext';
import ToastContainer from './components/ToastContainer';

const App: React.FC = () => {
  return (
    // DataProvider wraps the entire application. This is a React Context Provider that holds
    // the global state (like models, armies, game systems) and makes it accessible to any
    // component nested within it, avoiding the need for "prop drilling".
    <DataProvider>
      {/* HashRouter is used for client-side routing. It uses the URL hash (#) to keep the UI
          in sync with the URL. This is a good choice for single-page applications that
          may be hosted on static file servers without server-side routing configuration. */}
      <HashRouter>
        <div className="flex h-screen bg-background text-text-primary">
          {/* The Sidebar component is rendered here, outside the Routes, so that it appears
              on all pages, providing consistent navigation throughout the application. */}
          <Sidebar />
          <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
            {/* The Routes component from react-router-dom defines the different pages of the application.
                When the URL hash changes, it renders the component associated with the matching path. */}
            <Routes>
              {/* Each Route defines a mapping between a URL path and a React component. */}
              <Route path="/" element={<WelcomePage />} />
              <Route path="/collection" element={<CollectionPage />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/calendar" element={<CalendarPage />} /> {/* Add the new calendar route */}
              <Route path="/bulk" element={<BulkDataPage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Routes>
          </main>
          {/* The ToastContainer is rendered here to display global notifications. */}
          <ToastContainer />
        </div>
      </HashRouter>
    </DataProvider>
  );
};

export default App;