/**
 * @file apiService.ts
 * @description This service provides functions for interacting with the backend API.
 * It encapsulates all HTTP requests (using `fetch`) for CRUD operations on game systems, armies, and models.
 * Centralizing API calls here makes the components cleaner and the codebase easier to maintain.
 * This program was written by Stuart Mason October 2025.
 */

import { GameSystem, Army, Model } from '../types';

// The base URL for the backend API. In a real application, this would come from an environment variable.
const API_BASE_URL = 'http://localhost:3001/api';

// A helper function to handle fetch responses consistently.
// It checks if the response was successful (status 200-299). If not, it throws an error.
// If successful, it parses the JSON body of the response.
const handleResponse = async <T>(response: Response): Promise<T> => {
  if (!response.ok) {
    // Try to parse error details from the response body, otherwise provide a generic message.
    const errorData = await response.json().catch(() => ({ message: 'An unknown error occurred' }));
    throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
  }
  return response.json();
};

// --- Game System API calls ---

/** Fetches all game systems from the server. */
export const getGameSystems = async (): Promise<GameSystem[]> => {
  const response = await fetch(`${API_BASE_URL}/game-systems`);
  return handleResponse<GameSystem[]>(response);
};

/** Adds a new game system to the database. */
export const addGameSystem = async (system: Omit<GameSystem, 'id'>): Promise<GameSystem> => {
  const response = await fetch(`${API_BASE_URL}/game-systems`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(system),
  });
  return handleResponse<GameSystem>(response);
};

/** Updates an existing game system. */
export const updateGameSystem = async (id: string, system: Partial<Omit<GameSystem, 'id'>>): Promise<GameSystem> => {
    const response = await fetch(`${API_BASE_URL}/game-systems/${id}`, {
      method: 'PUT', // or 'PATCH' depending on the API design
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(system),
    });
    return handleResponse<GameSystem>(response);
  };
  
/** Deletes a game system by its ID. */
export const deleteGameSystem = async (id: string): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/game-systems/${id}`, {
    method: 'DELETE',
  });
  // DELETE requests often don't return a body, so we just check for success.
  if (!response.ok) {
    throw new Error('Failed to delete game system');
  }
};


// --- Army API calls ---

/** Fetches all armies. */
export const getArmies = async (): Promise<Army[]> => {
  const response = await fetch(`${API_BASE_URL}/armies`);
  return handleResponse<Army[]>(response);
};

/** Adds a new army. */
export const addArmy = async (army: Omit<Army, 'id'>): Promise<Army> => {
    const response = await fetch(`${API_BASE_URL}/armies`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(army),
    });
    return handleResponse<Army>(response);
};
  
/** Updates an existing army. */
export const updateArmy = async (id: string, army: Partial<Omit<Army, 'id'>>): Promise<Army> => {
    const response = await fetch(`${API_BASE_URL}/armies/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(army),
    });
    return handleResponse<Army>(response);
};

/** Deletes an army by its ID. */
export const deleteArmy = async (id: string): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/armies/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    throw new Error('Failed to delete army');
  }
};


// --- Model API calls ---

/** Fetches all models. */
export const getModels = async (): Promise<Model[]> => {
  const response = await fetch(`${API_BASE_URL}/models`);
  return handleResponse<Model[]>(response);
};

/** Adds a new model. */
export const addModel = async (model: Omit<Model, 'id'>): Promise<Model> => {
    const response = await fetch(`${API_BASE_URL}/models`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(model),
    });
    return handleResponse<Model>(response);
};

/** Updates an existing model. */
export const updateModel = async (id: string, model: Partial<Omit<Model, 'id'>>): Promise<Model> => {
    const response = await fetch(`${API_BASE_URL}/models/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(model),
    });
    return handleResponse<Model>(response);
};

/** Deletes a model by its ID. */
export const deleteModel = async (id: string): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/models/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    throw new Error('Failed to delete model');
  }
};
