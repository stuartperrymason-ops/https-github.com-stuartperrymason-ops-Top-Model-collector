/**
 * @file index.tsx
 * @description The main entry point for the React application.
 * This file is responsible for finding the root HTML element and rendering the main App component into it.
 * This program was written by Stuart Mason October 2025.
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Find the root DOM element where the React app will be mounted.
// This element is defined in the public/index.html file and has the ID 'root'.
const rootElement = document.getElementById('root');

// Ensure the root element exists before trying to render the app.
// This is a crucial safeguard to prevent runtime errors if the HTML is misconfigured.
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

// Create a React root using the new ReactDOM.createRoot API.
// This enables Concurrent Mode, which allows for better performance and new features in React.
const root = ReactDOM.createRoot(rootElement);

// Render the main App component into the root element.
// React.StrictMode is a wrapper that helps identify potential problems in an application
// by activating additional checks and warnings for its descendants. It only runs in development mode.
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
