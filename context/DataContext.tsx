/**
 * @file DataContext.tsx
 * @description This file sets up a global state management system using React's Context API and the `useReducer` hook.
 * It provides a centralized place to manage all application data (game systems, armies, models)
 * and the logic for updating that data. It now fetches its initial state from a backend API.
 */

import React, { createContext, useContext, useReducer, ReactNode, useEffect, useState } from 'react';
import { GameSystem, Army, Model } from '../types';
import { getInitialData } from '../services/apiService';

// Defines the shape of our global state.
interface State {
  gameSystems: GameSystem[];
  armies: Army[];
  models: Model[];
  loading: boolean; // To track the initial data load.
  error: string | null; // To store any initial loading errors.
}

// Defines the possible actions that can be dispatched to update the state.
type Action =
  | { type: 'INITIALIZE_DATA'; payload: { gameSystems: GameSystem[]; armies: Army[]; models: Model[] } }
  | { type: 'SET_ERROR'; payload: string }
  | { type: 'ADD_GAMESYSTEM'; payload: GameSystem }
  | { type: 'DELETE_GAMESYSTEM'; payload: string }
  | { type: 'ADD_ARMY'; payload: Army }
  | { type: 'DELETE_ARMY'; payload: string }
  | { type: 'ADD_MODEL'; payload: Model }
  | { type: 'UPDATE_MODEL'; payload: Model }
  | { type: 'DELETE_MODEL'; payload: string }
  | { type: 'BULK_IMPORT'; payload: { models: Model[]; armies: Army[]; gameSystems: GameSystem[] } };

// The initial state of the application is now empty, waiting for data from the API.
const initialState: State = {
  gameSystems: [],
  armies: [],
  models: [],
  loading: true,
  error: null,
};

// The reducer function handles state updates based on dispatched actions.
// It's now a pure function that only modifies state based on action payloads.
const dataReducer = (state: State, action: Action): State => {
  switch (action.type) {
    case 'INITIALIZE_DATA':
        return { ...state, ...action.payload, loading: false };
    case 'SET_ERROR':
        return { ...state, loading: false, error: action.payload };
    case 'ADD_GAMESYSTEM':
      return { ...state, gameSystems: [...state.gameSystems, action.payload] };
    case 'DELETE_GAMESYSTEM':
      // When a game system is deleted, all its associated armies and models must also be removed.
      return {
        ...state,
        gameSystems: state.gameSystems.filter(gs => gs.id !== action.payload),
        armies: state.armies.filter(a => a.gameSystemId !== action.payload),
        models: state.models.filter(m => m.gameSystemId !== action.payload),
      };
    case 'ADD_ARMY':
      return { ...state, armies: [...state.armies, action.payload] };
    case 'DELETE_ARMY':
      // When an army is deleted, its associated models must also be removed.
      return {
        ...state,
        armies: state.armies.filter(a => a.id !== action.payload),
        models: state.models.filter(m => m.armyId !== action.payload),
      };
    case 'ADD_MODEL':
      return { ...state, models: [...state.models, action.payload] };
    case 'UPDATE_MODEL':
      return {
        ...state,
        models: state.models.map(m => m.id === action.payload.id ? action.payload : m),
      };
    case 'DELETE_MODEL':
      return { ...state, models: state.models.filter(m => m.id !== action.payload) };
    case 'BULK_IMPORT':
       // This assumes the backend returns the newly created items, and we refresh the state.
       // For simplicity here, we'll just merge them, but a better approach would be to re-fetch.
      return {
        ...state,
        gameSystems: [...state.gameSystems, ...action.payload.gameSystems],
        armies: [...state.armies, ...action.payload.armies],
        models: [...state.models, ...action.payload.models],
      };
    default:
      return state;
  }
};

// Create the React Context.
const DataContext = createContext<{
  state: State;
  dispatch: React.Dispatch<Action>;
}>({
  state: initialState,
  dispatch: () => null,
});

// Create the Provider component. This component will wrap parts of our app that need access to the context.
export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(dataReducer, initialState);

  // useEffect hook to fetch data from the API when the component mounts.
  useEffect(() => {
    const loadData = async () => {
        try {
            // A backend developer would need to implement these API endpoints.
            // For now, this will fail gracefully.
            const data = await getInitialData();
            dispatch({ type: 'INITIALIZE_DATA', payload: data });
        } catch (error) {
            console.error("Failed to fetch initial data:", error);
            // In a real app, you might show a more user-friendly error message.
            // For now, we'll proceed with an empty state.
             dispatch({ type: 'SET_ERROR', payload: 'Could not connect to the backend. Please ensure the server is running.' });
             // Fallback to demo data if API fails
            dispatch({ type: 'INITIALIZE_DATA', payload: {
              gameSystems: [
                { id: 'gs1', name: 'Warhammer 40,000' },
                { id: 'gs2', name: 'Age of Sigmar' },
              ],
              armies: [
                { id: 'a1', name: 'Ultramarines', gameSystemId: 'gs1' },
                { id: 'a2', name: 'Orks', gameSystemId: 'gs1' },
                { id: 'a3', name: 'Stormcast Eternals', gameSystemId: 'gs2' },
              ],
              models: [
                { id: 'm1', name: 'Primaris Intercessor Squad', armyId: 'a1', gameSystemId: 'gs1', description: 'Standard troops for the Ultramarines.', points: 100, quantity: 10, status: 'painted', imageUrl: 'https://picsum.photos/seed/intercessor/400/300' },
                { id: 'm2', name: 'Ork Boyz', armyId: 'a2', gameSystemId: 'gs1', description: 'The backbone of any Ork WAAAGH!', points: 80, quantity: 12, status: 'wip', imageUrl: 'https://picsum.photos/seed/orkboyz/400/300' },
                { id: 'm3', name: 'Liberators', armyId: 'a3', gameSystemId: 'gs2', description: 'Shining warriors of Sigmar.', points: 120, quantity: 5, status: 'unpainted', imageUrl: 'https://picsum.photos/seed/liberators/400/300' },
              ],
            }});

        }
    };
    loadData();
  }, []); // The empty dependency array ensures this runs only once on mount.


  return (
    <DataContext.Provider value={{ state, dispatch }}>
      {children}
    </DataContext.Provider>
  );
};

// Custom hook for easy access to the context's state and dispatch function.
export const useData = () => useContext(DataContext);
