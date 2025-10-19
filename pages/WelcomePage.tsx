/**
 * @file WelcomePage.tsx
 * @description The landing page for the application.
 * It provides a brief introduction and navigation links to the main sections.
 * This program was written by Stuart Mason October 2025.
 */

import React from 'react';
import { Link } from 'react-router-dom';

const WelcomePage: React.FC = () => {
  return (
    // The main container uses flexbox to center its content both vertically and horizontally within the available space.
    <div className="flex flex-col items-center justify-center h-full text-center p-4">
      {/* A styled card element to contain the main welcome message. */}
      <div className="bg-surface rounded-lg shadow-xl p-8 max-w-2xl w-full border border-border">
        {/* The main heading with a gradient text effect for visual appeal. */}
        <h1 className="text-4xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary mb-4">
          Welcome to ModelForge
        </h1>
        <p className="text-lg text-text-secondary mb-8">
          Your digital armory for managing tabletop miniatures. Catalog your collections, track your painting progress, and organize your forces across all your favorite game systems.
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          {/* Link components from react-router-dom are used for client-side navigation.
              Using <Link> instead of <a> prevents a full page reload, providing a smoother
              single-page application experience. */}
          <Link
            to="/collection"
            className="px-8 py-3 bg-primary text-white font-semibold rounded-lg shadow-md hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-400 focus:ring-offset-background transition duration-300"
          >
            View My Collection
          </Link>
          <Link
            to="/settings"
            className="px-8 py-3 bg-surface text-text-primary border border-border font-semibold rounded-lg shadow-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 focus:ring-offset-background transition duration-300"
          >
            Go to Settings
          </Link>
        </div>
      </div>
      {/* A simple footer element. */}
      <footer className="mt-12 text-sm text-gray-500">
        <p>Built for hobbyists, by a hobbyist.</p>
      </footer>
    </div>
  );
};

export default WelcomePage;
