/**
 * @file apiService.ts
 * @description This service centralizes all communication with the backend API.
 * It provides functions for CRUD (Create, Read, Update, Delete) operations on all data models.
 * This abstracts away the fetch logic from the components and context.
 */

import { Model, Army, GameSystem } from '../types';

// The base URL for our API. In a real app, this would come from an environment variable.
const API_BASE_URL = '/api';

/**
 * A helper function to handle fetch responses.
 * It checks for HTTP errors and parses the JSON response.
 * @param response - The Response object from a fetch call.
 * @returns A promise that resolves with the JSON data.
 */
async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API Error: ${response.statusText} - ${errorText}`);
  }
  return response.json() as Promise<T>;
}

// --- Game System API ---
// FIX: Explicitly provide the generic type to handleResponse to fix promise type mismatch error.
export const getGameSystems = (): Promise<GameSystem[]> => fetch(`${API_BASE_URL}/gamesystems`).then(res => handleResponse<GameSystem[]>(res));
// FIX: Explicitly provide the generic type to handleResponse to fix promise type mismatch error.
export const addGameSystem = (data: Omit<GameSystem, 'id'>): Promise<GameSystem> => fetch(`${API_BASE_URL}/gamesystems`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(data),
}).then(res => handleResponse<GameSystem>(res));
export const deleteGameSystem = (id: string): Promise<void> => fetch(`${API_BASE_URL}/gamesystems/${id}`, { method: 'DELETE' }).then(res => { if(!res.ok) throw new Error('Failed to delete')});

// --- Army API ---
// FIX: Explicitly provide the generic type to handleResponse to fix promise type mismatch error.
export const getArmies = (): Promise<Army[]> => fetch(`${API_BASE_URL}/armies`).then(res => handleResponse<Army[]>(res));
// FIX: Explicitly provide the generic type to handleResponse to fix promise type mismatch error.
export const addArmy = (data: Omit<Army, 'id'>): Promise<Army> => fetch(`${API_BASE_URL}/armies`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(data),
}).then(res => handleResponse<Army>(res));
export const deleteArmy = (id: string): Promise<void> => fetch(`${API_BASE_URL}/armies/${id}`, { method: 'DELETE' }).then(res => { if(!res.ok) throw new Error('Failed to delete')});

// --- Model API ---
// FIX: Explicitly provide the generic type to handleResponse to fix promise type mismatch error.
export const getModels = (): Promise<Model[]> => fetch(`${API_BASE_URL}/models`).then(res => handleResponse<Model[]>(res));
// FIX: Explicitly provide the generic type to handleResponse to fix promise type mismatch error.
export const addModel = (data: Omit<Model, 'id'>): Promise<Model> => fetch(`${API_BASE_URL}/models`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(data),
}).then(res => handleResponse<Model>(res));
// FIX: Explicitly provide the generic type to handleResponse to fix promise type mismatch error.
export const updateModel = (id: string, data: Model): Promise<Model> => fetch(`${API_BASE_URL}/models/${id}`, {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(data),
}).then(res => handleResponse<Model>(res));
export const deleteModel = (id: string): Promise<void> => fetch(`${API_BASE_URL}/models/${id}`, { method: 'DELETE' }).then(res => { if(!res.ok) throw new Error('Failed to delete')});

// --- Bulk Import API ---
export const bulkImport = (data: { models: Model[]; armies: Army[]; gameSystems: GameSystem[] }): Promise<void> => fetch(`${API_BASE_URL}/bulk-import`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
}).then(res => { if(!res.ok) throw new Error('Failed to import')});


/**
 * Fetches all initial data required for the application to start.
 * @returns A promise that resolves with the complete application state.
 */
export const getInitialData = async () => {
    // Using Promise.all to fetch all data in parallel for faster loading.
    const [gameSystems, armies, models] = await Promise.all([
        getGameSystems(),
        getArmies(),
        getModels(),
    ]);
    return { gameSystems, armies, models };
};
