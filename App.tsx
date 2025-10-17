/**
 * @file App.tsx
 * @description The root component of the application.
 * It sets up the main layout, routing, and global state management.
 */

import React from 'react';
import { HashRouter, Route, Routes } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import WelcomePage from './pages/WelcomePage';
import CollectionPage from './pages/CollectionPage';
import BulkDataPage from './pages/BulkDataPage';
import SettingsPage from './pages/SettingsPage';
import { DataProvider } from './context/DataContext';

const App: React.FC = () => {
  return (
    // DataProvider wraps the entire application, making the global state (models, armies, etc.)
    // available to all components via the `useData` hook.
    <DataProvider>
      {/* HashRouter is used for client-side routing. It uses the URL hash to keep the UI in sync with the URL. */}
      <HashRouter>
        <div className="flex h-screen bg-background text-text-primary">
          {/* The Sidebar component is rendered on all pages for consistent navigation. */}
          <Sidebar />
          <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
            {/* The Routes component defines the different pages of the application. */}
            <Routes>
              <Route path="/" element={<WelcomePage />} />
              <Route path="/collection" element={<CollectionPage />} />
              <Route path="/bulk" element={<BulkDataPage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Routes>
          </main>
        </div>
      </HashRouter>
    </DataProvider>
  );
};

export default App;
