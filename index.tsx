/**
 * @file index.tsx
 * @description The main entry point for the React application.
 * This file is responsible for finding the root HTML element and rendering the main App component into it.
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Find the root DOM element where the React app will be mounted.
// This element is defined in index.html.
const rootElement = document.getElementById('root');

// Ensure the root element exists before trying to render the app.
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

// Create a React root, which is the modern way to render a React app (Concurrent Mode).
const root = ReactDOM.createRoot(rootElement);

// Render the main App component within React's StrictMode.
// StrictMode helps identify potential problems in an application by activating additional checks and warnings.
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
