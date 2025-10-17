
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
    <DataProvider>
      <HashRouter>
        <div className="flex h-screen bg-background text-text-primary">
          <Sidebar />
          <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
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
