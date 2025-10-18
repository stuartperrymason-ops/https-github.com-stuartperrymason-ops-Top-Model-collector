/**
 * @file apiService.ts
 * @description This service provides functions for interacting with the backend API.
 * It encapsulates all HTTP requests for CRUD operations on game systems, armies, and models.
 */

import { GameSystem, Army, Model } from '../types';

const API_BASE_URL = 'http://localhost:3001/api';

// Helper function to handle fetch responses.
const handleResponse = async <T>(response: Response): Promise<T> => {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'An unknown error occurred' }));
    throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
  }
  return response.json();
};

// --- Game System API calls ---

export const getGameSystems = async (): Promise<GameSystem[]> => {
  const response = await fetch(`${API_BASE_URL}/game-systems`);
  return handleResponse<GameSystem[]>(response);
};

export const addGameSystem = async (system: Omit<GameSystem, 'id'>): Promise<GameSystem> => {
  const response = await fetch(`${API_BASE_URL}/game-systems`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(system),
  });
  return handleResponse<GameSystem>(response);
};

export const updateGameSystem = async (id: string, system: Partial<Omit<GameSystem, 'id'>>): Promise<GameSystem> => {
    const response = await fetch(`${API_BASE_URL}/game-systems/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(system),
    });
    return handleResponse<GameSystem>(response);
  };
  
export const deleteGameSystem = async (id: string): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/game-systems/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    throw new Error('Failed to delete game system');
  }
};


// --- Army API calls ---

export const getArmies = async (): Promise<Army[]> => {
  const response = await fetch(`${API_BASE_URL}/armies`);
  return handleResponse<Army[]>(response);
};

export const addArmy = async (army: Omit<Army, 'id'>): Promise<Army> => {
    const response = await fetch(`${API_BASE_URL}/armies`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(army),
    });
    return handleResponse<Army>(response);
};
  
export const updateArmy = async (id: string, army: Partial<Omit<Army, 'id'>>): Promise<Army> => {
    const response = await fetch(`${API_BASE_URL}/armies/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(army),
    });
    return handleResponse<Army>(response);
};

export const deleteArmy = async (id: string): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/armies/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    throw new Error('Failed to delete army');
  }
};


// --- Model API calls ---

export const getModels = async (): Promise<Model[]> => {
  const response = await fetch(`${API_BASE_URL}/models`);
  return handleResponse<Model[]>(response);
};

export const addModel = async (model: Omit<Model, 'id'>): Promise<Model> => {
    const response = await fetch(`${API_BASE_URL}/models`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(model),
    });
    return handleResponse<Model>(response);
};

export const updateModel = async (id: string, model: Partial<Omit<Model, 'id'>>): Promise<Model> => {
    const response = await fetch(`${API_BASE_URL}/models/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(model),
    });
    return handleResponse<Model>(response);
};

export const deleteModel = async (id: string): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/models/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    throw new Error('Failed to delete model');
  }
};
