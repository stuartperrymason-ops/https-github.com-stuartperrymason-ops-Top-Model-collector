/**
 * This program was written by Stuart Mason October 2025.
 */
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
// This is the main configuration file for Vite, the build tool used for this project.
export default defineConfig({
  // The `plugins` array is where we add Vite plugins.
  // `@vitejs/plugin-react` provides React-specific features like Fast Refresh (HMR) and JSX transformation.
  plugins: [react()],
})
