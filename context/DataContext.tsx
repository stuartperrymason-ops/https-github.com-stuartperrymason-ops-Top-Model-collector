/**
 * @file DataContext.tsx
 * @description Provides a global state context for managing game systems, armies, and models data.
 * It fetches initial data and offers functions to interact with the API for CRUD operations.
 */

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { GameSystem, Army, Model, ToastMessage } from '../types';
import * as apiService from '../services/apiService';

// Define the shape of the context state.
interface DataContextState {
  gameSystems: GameSystem[];
  armies: Army[];
  models: Model[];
  loading: boolean;
  error: string | null;
  toasts: ToastMessage[];
  addToast: (message: string, type: 'success' | 'error') => void;
  // Game System functions
  addGameSystem: (name: string) => Promise<void>;
  updateGameSystem: (id: string, name: string) => Promise<void>;
  deleteGameSystem: (id: string) => Promise<void>;
  // Army functions
  addArmy: (name: string, gameSystemId: string) => Promise<void>;
  updateArmy: (id: string, name: string, gameSystemId: string) => Promise<void>;
  deleteArmy: (id: string) => Promise<void>;
  // Model functions
  addModel: (model: Omit<Model, 'id'>) => Promise<void>;
  updateModel: (id: string, model: Partial<Omit<Model, 'id'>>) => Promise<void>;
  deleteModel: (id: string) => Promise<void>;
  bulkUpdateModels: (ids: string[], updates: Partial<Omit<Model, 'id'>>) => Promise<void>;
  bulkDeleteModels: (ids: string[]) => Promise<void>;
  bulkAddModels: (models: Omit<Model, 'id'>[]) => Promise<void>;
}

// Create the context with a default undefined value.
const DataContext = createContext<DataContextState | undefined>(undefined);

// Define props for the provider component.
interface DataProviderProps {
  children: ReactNode;
}

// The provider component that will wrap the application.
export const DataProvider: React.FC<DataProviderProps> = ({ children }) => {
  const [gameSystems, setGameSystems] = useState<GameSystem[]>([]);
  const [armies, setArmies] = useState<Army[]>([]);
  const [models, setModels] = useState<Model[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Function to add a toast message.
  const addToast = (message: string, type: 'success' | 'error') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(currentToasts => currentToasts.filter(toast => toast.id !== id));
    }, 5000); // Increased timeout for potentially longer messages
  };

  // Memoized function to fetch all data.
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [systems, armyData, modelData] = await Promise.all([
        apiService.getGameSystems(),
        apiService.getArmies(),
        apiService.getModels(),
      ]);
      setGameSystems(systems);
      setArmies(armyData);
      setModels(modelData);
    } catch (err) {
      setError('Failed to load data. Please try refreshing the page.');
      console.error(err);
      addToast('Failed to load data.', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch data on component mount.
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // CRUD operations for Game Systems
  const addGameSystem = async (name: string) => {
    try {
      const newSystem = await apiService.addGameSystem({ name });
      setGameSystems(prev => [...prev, newSystem]);
      addToast('Game system added successfully!', 'success');
    } catch (err) {
      console.error('Failed to add game system:', err);
      addToast('Failed to add game system.', 'error');
    }
  };
  
  const updateGameSystem = async (id: string, name: string) => {
    try {
      const updatedSystem = await apiService.updateGameSystem(id, { name });
      setGameSystems(prev => prev.map(s => (s.id === id ? updatedSystem : s)));
      addToast('Game system updated successfully!', 'success');
    } catch (err) {
      console.error('Failed to update game system:', err);
      addToast('Failed to update game system.', 'error');
    }
  };

  const deleteGameSystem = async (id: string) => {
    try {
      await apiService.deleteGameSystem(id);
      setGameSystems(prev => prev.filter(s => s.id !== id));
      // Also delete associated armies and models
      setArmies(prev => prev.filter(a => a.gameSystemId !== id));
      setModels(prev => prev.filter(m => m.gameSystemId !== id));
      addToast('Game system deleted successfully!', 'success');
    } catch (err) {
      console.error('Failed to delete game system:', err);
      addToast('Failed to delete game system.', 'error');
    }
  };

  // CRUD operations for Armies
  const addArmy = async (name: string, gameSystemId: string) => {
    try {
      const newArmy = await apiService.addArmy({ name, gameSystemId });
      setArmies(prev => [...prev, newArmy]);
      addToast('Army added successfully!', 'success');
    } catch (err) {
      console.error('Failed to add army:', err);
      addToast('Failed to add army.', 'error');
    }
  };
  
  const updateArmy = async (id: string, name: string, gameSystemId: string) => {
    try {
      const updatedArmy = await apiService.updateArmy(id, { name, gameSystemId });
      setArmies(prev => prev.map(a => (a.id === id ? updatedArmy : a)));
      addToast('Army updated successfully!', 'success');
    } catch (err) {
      console.error('Failed to update army:', err);
      addToast('Failed to update army.', 'error');
    }
  };
  
  const deleteArmy = async (id: string) => {
    try {
      await apiService.deleteArmy(id);
      setArmies(prev => prev.filter(a => a.id !== id));
      // Also delete associated models
      setModels(prev => prev.filter(m => m.armyId !== id));
      addToast('Army deleted successfully!', 'success');
    } catch (err) {
      console.error('Failed to delete army:', err);
      addToast('Failed to delete army.', 'error');
    }
  };

  // CRUD operations for Models
  const addModel = async (model: Omit<Model, 'id'>) => {
    try {
      const newModel = await apiService.addModel(model);
      setModels(prev => [...prev, newModel]);
      addToast('Model added successfully!', 'success');
    } catch (err) {
      console.error('Failed to add model:', err);
      addToast('Failed to add model.', 'error');
    }
  };
  
  const updateModel = async (id: string, model: Partial<Omit<Model, 'id'>>) => {
    try {
      const updatedModel = await apiService.updateModel(id, model);
      setModels(prev => prev.map(m => (m.id === id ? updatedModel : m)));
      addToast('Model updated successfully!', 'success');
    } catch (err) {
      console.error('Failed to update model:', err);
      addToast('Failed to update model.', 'error');
    }
  };
  
  const deleteModel = async (id: string) => {
    try {
      await apiService.deleteModel(id);
      setModels(prev => prev.filter(m => m.id !== id));
      addToast('Model deleted successfully!', 'success');
    } catch (err) {
      console.error('Failed to delete model:', err);
      addToast('Failed to delete model.', 'error');
    }
  };

  // Bulk operations for Models
  const bulkAddModels = async (modelsToAdd: Omit<Model, 'id'>[]) => {
    try {
      const addedModels = await Promise.all(
        modelsToAdd.map(model => apiService.addModel(model))
      );
      setModels(prev => [...prev, ...addedModels]);
      // Toast is handled on the page for more detailed feedback
    } catch (err) {
      console.error('Failed to bulk add models:', err);
      addToast('An error occurred during bulk import.', 'error');
    }
  };
  
  const bulkUpdateModels = async (ids: string[], updates: Partial<Omit<Model, 'id'>>) => {
    try {
      // In a real app, this would ideally be a single API call.
      // For our mock server, we loop and call the single update endpoint.
      await Promise.all(ids.map(id => apiService.updateModel(id, updates)));
      
      // Update local state in one go for better performance.
      setModels(prev =>
        prev.map(m => (ids.includes(m.id) ? { ...m, ...updates, id: m.id } : m))
      );
      addToast(`${ids.length} models updated successfully!`, 'success');
    } catch (err) {
      console.error('Failed to bulk update models:', err);
      addToast('Failed to bulk update models.', 'error');
    }
  };

  const bulkDeleteModels = async (ids: string[]) => {
    try {
      await Promise.all(ids.map(id => apiService.deleteModel(id)));
      setModels(prev => prev.filter(m => !ids.includes(m.id)));
      addToast(`${ids.length} models deleted successfully!`, 'success');
    } catch (err) {
      console.error('Failed to bulk delete models:', err);
      addToast('Failed to bulk delete models.', 'error');
    }
  };

  // Value provided to consuming components.
  const value = {
    gameSystems,
    armies,
    models,
    loading,
    error,
    toasts,
    addToast,
    addGameSystem,
    updateGameSystem,
    deleteGameSystem,
    addArmy,
    updateArmy,
    deleteArmy,
    addModel,
    updateModel,
    deleteModel,
    bulkAddModels,
    bulkUpdateModels,
    bulkDeleteModels,
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};

// Custom hook to use the data context.
export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};