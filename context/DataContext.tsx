/**
 * @file DataContext.tsx
 * @description Provides a global state context for managing game systems, armies, and models data.
 * It centralizes data fetching and all CRUD (Create, Read, Update, Delete) operations.
 * This program was written by Stuart Mason October 2025.
 */

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, ChangeEvent, FormEvent } from 'react';
import { GameSystem, Army, Model, ToastMessage, PaintingSession, Paint } from '../types';
import * as apiService from '../services/apiService';

// Define the shape of the context state. This interface describes all the data
// and functions that will be made available to components consuming this context.
interface DataContextState {
  // State slices
  gameSystems: GameSystem[];
  armies: Army[];
  models: Model[];
  paintingSessions: PaintingSession[];
  paints: Paint[];
  loading: boolean; // Indicates if initial data is being fetched.
  error: string | null; // Stores any critical error messages.
  toasts: ToastMessage[]; // An array of active toast notifications.
  minStockThreshold: number; // Minimum stock level before a paint is considered "low".
  
  // Functions to interact with the state
  addToast: (message: string, type: 'success' | 'error') => void;
  updateMinStockThreshold: (threshold: number) => void;
  clearAllData: () => Promise<void>;

  // Game System functions
  addGameSystem: (name: string, colorScheme: GameSystem['colorScheme']) => Promise<GameSystem | undefined>;
  updateGameSystem: (id: string, updates: Partial<Omit<GameSystem, 'id'>>) => Promise<void>;
  deleteGameSystem: (id: string) => Promise<void>;
  // Army functions
  addArmy: (name: string, gameSystemId: string) => Promise<Army | undefined>;
  updateArmy: (id: string, name: string, gameSystemId: string) => Promise<void>;
  deleteArmy: (id: string) => Promise<void>;
  // Model functions
  addModel: (model: Omit<Model, 'id' | 'createdAt' | 'lastUpdated'>) => Promise<void>;
  updateModel: (id: string, model: Partial<Omit<Model, 'id'>>) => Promise<void>;
  deleteModel: (id: string) => Promise<void>;
  // Bulk Model functions
  bulkUpdateModels: (ids: string[], updates: Partial<Omit<Model, 'id'>>) => Promise<void>;
  bulkDeleteModels: (ids: string[]) => Promise<void>;
  bulkAddModels: (models: Omit<Model, 'id' | 'createdAt' | 'lastUpdated'>[]) => Promise<void>;
  // Painting Session functions
  addPaintingSession: (session: Omit<PaintingSession, 'id'>) => Promise<void>;
  updatePaintingSession: (id: string, session: Partial<Omit<PaintingSession, 'id'>>) => Promise<void>;
  deletePaintingSession: (id: string) => Promise<void>;
  // Paint functions
  addPaint: (paint: Omit<Paint, 'id'>) => Promise<void>;
  updatePaint: (id: string, paint: Partial<Omit<Paint, 'id'>>) => Promise<void>;
  deletePaint: (id: string) => Promise<void>;
  // Bulk Paint functions
  bulkUpdatePaints: (ids: string[], updates: Partial<Omit<Paint, 'id'>>) => Promise<void>;
  bulkDeletePaints: (ids: string[]) => Promise<void>;
  bulkAddPaints: (paints: Omit<Paint, 'id'>[]) => Promise<void>;
}

// Create the context with a default value of `undefined`.
// The actual value will be provided by the DataProvider component.
const DataContext = createContext<DataContextState | undefined>(undefined);

// Define props for the provider component, which will accept children to render.
interface DataProviderProps {
  children: ReactNode;
}

// The provider component that will wrap the application.
export const DataProvider: React.FC<DataProviderProps> = ({ children }) => {
  // State management using React's useState hook for all global data.
  const [gameSystems, setGameSystems] = useState<GameSystem[]>([]);
  const [armies, setArmies] = useState<Army[]>([]);
  const [models, setModels] = useState<Model[]>([]);
  const [paintingSessions, setPaintingSessions] = useState<PaintingSession[]>([]);
  const [paints, setPaints] = useState<Paint[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [minStockThreshold, setMinStockThreshold] = useState<number>(1);

  // Function to add a toast message to the queue.
  // It automatically removes the toast after a 5-second timeout.
  const addToast = (message: string, type: 'success' | 'error') => {
    const id = Date.now(); // Simple unique ID
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      // Use a functional update to ensure we're filtering the latest state.
      setToasts(currentToasts => currentToasts.filter(toast => toast.id !== id));
    }, 5000);
  };
  
  // Function to update the minimum stock threshold and save it to localStorage.
  const updateMinStockThreshold = (threshold: number) => {
    const newThreshold = Math.max(0, threshold); // Ensure it's not negative.
    setMinStockThreshold(newThreshold);
    localStorage.setItem('minStockThreshold', newThreshold.toString());
    addToast('Minimum stock threshold updated!', 'success');
  };

  // Memoized function to fetch all initial data from the API.
  // `useCallback` ensures this function is not recreated on every render,
  // which is important for performance and preventing unnecessary effects.
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      // Use Promise.all to fetch all data concurrently for faster loading.
      const [systems, armyData, modelData, sessionData, paintData] = await Promise.all([
        apiService.getGameSystems(),
        apiService.getArmies(),
        apiService.getModels(),
        apiService.getPaintingSessions(),
        apiService.getPaints(),
      ]);
      // Update state with the fetched data.
      setGameSystems(systems);
      setArmies(armyData);
      setModels(modelData);
      setPaintingSessions(sessionData);
      setPaints(paintData);
    } catch (err) {
      const errorMessage = 'Failed to load data. Please try refreshing the page.';
      setError(errorMessage);
      console.error(err);
      addToast('Failed to load data.', 'error');
    } finally {
      // Ensure loading is set to false even if an error occurs.
      setLoading(false);
    }
  }, []); // Empty dependency array means this function is created only once.

  // The useEffect hook runs after the component mounts.
  // It calls `fetchData` and loads settings from localStorage.
  useEffect(() => {
    fetchData();
    const savedThreshold = localStorage.getItem('minStockThreshold');
    if (savedThreshold) {
      setMinStockThreshold(parseInt(savedThreshold, 10));
    }
  }, [fetchData]);

  const clearAllData = async () => {
    try {
        await apiService.clearAllData();
        // Reset all state to its initial empty state.
        setGameSystems([]);
        setArmies([]);
        setModels([]);
        setPaintingSessions([]);
        setPaints([]);
        setMinStockThreshold(1); // Reset to default
        addToast('All data has been cleared successfully!', 'success');
    } catch (err) {
        console.error('Failed to clear all data:', err);
        addToast('Failed to clear data. Please check the console for errors.', 'error');
    }
  };

  // --- CRUD operations for Game Systems ---
  // Each function follows a similar pattern:
  // 1. Make an API call.
  // 2. On success, update the local state to reflect the change immediately.
  // 3. Show a success or error toast to the user.
  // 4. Handle any errors gracefully.
  const addGameSystem = async (name: string, colorScheme: GameSystem['colorScheme']): Promise<GameSystem | undefined> => {
    try {
      const newSystem = await apiService.addGameSystem({ name, colorScheme });
      setGameSystems(prev => [...prev, newSystem]); // Optimistic update
      addToast('Game system added successfully!', 'success');
      return newSystem;
    } catch (err) {
      console.error('Failed to add game system:', err);
      addToast('Failed to add game system.', 'error');
      return undefined;
    }
  };
  
  const updateGameSystem = async (id: string, updates: Partial<Omit<GameSystem, 'id'>>) => {
    try {
      const updatedSystem = await apiService.updateGameSystem(id, updates);
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
      // Remove the deleted system and any associated armies/models from local state.
      setGameSystems(prev => prev.filter(s => s.id !== id));
      setArmies(prev => prev.filter(a => a.gameSystemId !== id));
      setModels(prev => prev.filter(m => m.gameSystemId !== id));
      addToast('Game system deleted successfully!', 'success');
    } catch (err)
 {
      console.error('Failed to delete game system:', err);
      addToast('Failed to delete game system.', 'error');
    }
  };

  // --- CRUD operations for Armies ---
  const addArmy = async (name: string, gameSystemId: string): Promise<Army | undefined> => {
    try {
      const newArmy = await apiService.addArmy({ name, gameSystemId });
      setArmies(prev => [...prev, newArmy]);
      addToast('Army added successfully!', 'success');
      return newArmy;
    } catch (err) {
      console.error('Failed to add army:', err);
      addToast('Failed to add army.', 'error');
      return undefined;
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
      // When an army is deleted, we must also remove its ID from any models associated with it.
      setModels(prev =>
        prev.map(model => {
          if (model.armyIds.includes(id)) {
            return { ...model, armyIds: model.armyIds.filter(armyId => armyId !== id) };
          }
          return model;
        })
      );
      addToast('Army deleted successfully!', 'success');
    } catch (err) {
      console.error('Failed to delete army:', err);
      addToast('Failed to delete army.', 'error');
    }
  };

  // --- CRUD operations for Models ---
  const addModel = async (model: Omit<Model, 'id' | 'createdAt' | 'lastUpdated'>) => {
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

  // --- Bulk operations for Models ---
  const bulkAddModels = async (modelsToAdd: Omit<Model, 'id' | 'createdAt' | 'lastUpdated'>[]) => {
    try {
      const addedModels = await apiService.bulkAddModels(modelsToAdd);
      setModels(prev => [...prev, ...addedModels]);
      // Toast notifications are handled on the BulkDataPage for more detailed feedback.
    } catch (err) {
      console.error('Failed to bulk add models:', err);
      addToast('An error occurred during bulk import.', 'error');
    }
  };
  
  const bulkUpdateModels = async (ids: string[], updates: Partial<Omit<Model, 'id'>>) => {
    try {
      // In a real app, this would be a single API call like `PATCH /models` with a list of IDs.
      // For our mock server, we loop and call the single update endpoint for each ID.
      // This now returns the fully updated models from the server, including the new `lastUpdated` timestamp.
      const updatedModels = await Promise.all(ids.map(id => apiService.updateModel(id, updates)));
      
      // Create a map for efficient lookup to update the local state.
      const updatedModelsMap = new Map(updatedModels.map(m => [m.id, m]));
      
      // Update local state in one go for better performance and to avoid multiple re-renders.
      setModels(prev =>
        prev.map(m => updatedModelsMap.get(m.id) || m)
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

  // --- CRUD operations for Painting Sessions ---
  const addPaintingSession = async (session: Omit<PaintingSession, 'id'>) => {
    try {
      const newSession = await apiService.addPaintingSession(session);
      setPaintingSessions(prev => [...prev, newSession]);
      addToast('Painting session scheduled!', 'success');
    } catch (err) {
      console.error('Failed to add painting session:', err);
      addToast('Failed to schedule session.', 'error');
    }
  };

  const updatePaintingSession = async (id: string, session: Partial<Omit<PaintingSession, 'id'>>) => {
    try {
      const updatedSession = await apiService.updatePaintingSession(id, session);
      setPaintingSessions(prev => prev.map(s => (s.id === id ? updatedSession : s)));
      addToast('Painting session updated!', 'success');
    } catch (err) {
      console.error('Failed to update painting session:', err);
      addToast('Failed to update session.', 'error');
    }
  };

  const deletePaintingSession = async (id: string) => {
    try {
      await apiService.deletePaintingSession(id);
      setPaintingSessions(prev => prev.filter(s => s.id !== id));
      addToast('Painting session deleted!', 'success');
    } catch (err) {
      console.error('Failed to delete painting session:', err);
      addToast('Failed to delete session.', 'error');
    }
  };

  // --- CRUD operations for Paints ---
  const addPaint = async (paint: Omit<Paint, 'id'>) => {
    try {
      const newPaint = await apiService.addPaint(paint);
      setPaints(prev => [...prev, newPaint].sort((a, b) => a.name.localeCompare(b.name)));
      addToast('Paint added successfully!', 'success');
    } catch (err) {
      console.error('Failed to add paint:', err);
      addToast('Failed to add paint.', 'error');
    }
  };

  const updatePaint = async (id: string, paint: Partial<Omit<Paint, 'id'>>) => {
    try {
      const updatedPaint = await apiService.updatePaint(id, paint);
      setPaints(prev => prev.map(p => (p.id === id ? updatedPaint : p)));
      addToast('Paint updated successfully!', 'success');
    } catch (err) {
      console.error('Failed to update paint:', err);
      addToast('Failed to update paint.', 'error');
    }
  };

  const deletePaint = async (id: string) => {
    try {
      await apiService.deletePaint(id);
      setPaints(prev => prev.filter(p => p.id !== id));
      addToast('Paint deleted successfully!', 'success');
    } catch (err) {
      console.error('Failed to delete paint:', err);
      addToast('Failed to delete paint.', 'error');
    }
  };
  
  // --- Bulk operations for Paints ---
  const bulkAddPaints = async (paintsToAdd: Omit<Paint, 'id'>[]) => {
    try {
        const addedPaints = await apiService.bulkAddPaints(paintsToAdd);
        setPaints(prev => [...prev, ...addedPaints].sort((a, b) => a.name.localeCompare(b.name)));
    } catch (err) {
        console.error('Failed to bulk add paints:', err);
        addToast('An error occurred during bulk paint import.', 'error');
    }
  };

  const bulkUpdatePaints = async (ids: string[], updates: Partial<Omit<Paint, 'id'>>) => {
    try {
        const updatedPaints = await Promise.all(ids.map(id => apiService.updatePaint(id, updates)));
        const updatedPaintsMap = new Map(updatedPaints.map(p => [p.id, p]));
        setPaints(prev => prev.map(p => updatedPaintsMap.get(p.id) || p));
        addToast(`${ids.length} paints updated successfully!`, 'success');
    } catch (err) {
        console.error('Failed to bulk update paints:', err);
        addToast('Failed to bulk update paints.', 'error');
    }
  };

  const bulkDeletePaints = async (ids: string[]) => {
    try {
        await Promise.all(ids.map(id => apiService.deletePaint(id)));
        setPaints(prev => prev.filter(p => !ids.includes(p.id)));
        addToast(`${ids.length} paints deleted successfully!`, 'success');
    } catch (err) {
        console.error('Failed to bulk delete paints:', err);
        addToast('Failed to bulk delete paints.', 'error');
    }
  };

  // The 'value' object bundles all state and functions to be provided to consuming components.
  const value = {
    gameSystems,
    armies,
    models,
    paintingSessions,
    paints,
    loading,
    error,
    toasts,
    minStockThreshold,
    updateMinStockThreshold,
    clearAllData,
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
    addPaintingSession,
    updatePaintingSession,
    deletePaintingSession,
    addPaint,
    updatePaint,
    deletePaint,
    bulkAddPaints,
    bulkUpdatePaints,
    bulkDeletePaints,
  };

  // The DataContext.Provider makes the 'value' object available to all child components.
  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};

/**
 * @file useForm.ts
 * @description A custom hook for managing form state, validation, and submission logic.
 * This abstracts common form handling patterns to make form components cleaner and more reusable.
 * This program was written by Stuart Mason October 2025.
 */

// Defines the shape of the object returned by the useForm hook.
interface UseFormReturn<T> {
  values: T;
  errors: Record<string, string>;
  isSubmitting: boolean;
  setValues: React.Dispatch<React.SetStateAction<T>>;
  handleChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  setFormValue: <K extends keyof T>(key: K, value: T[K]) => void;
  // FIX: Correct the event handler type to match the form's onSubmit prop.
  handleSubmit: (e: React.FormEvent<HTMLFormElement>) => Promise<void>;
}

/**
 * A generic custom hook for managing form logic.
 * @param initialState - The initial state of the form.
 * @param onSubmit - An async callback function to execute when the form is submitted and valid.
 * @param validate - An optional function that takes form values and returns an object of validation errors.
 */
export const useForm = <T extends object>(
  initialState: T,
  onSubmit: (values: T) => Promise<void>,
  validate?: (values: T) => Record<string, string>
): UseFormReturn<T> => {
  const [values, setValues] = useState<T>(initialState);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // A generic change handler that works for most standard input types.
  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const processedValue = (e.target as HTMLInputElement).type === 'number' ? parseInt(value, 10) || 0 : value;
    setValues(prev => ({ ...prev, [name]: processedValue }));
  };

  // A more direct way to set a specific form field's value, useful for custom components.
  const setFormValue = <K extends keyof T>(key: K, value: T[K]) => {
    setValues(prev => ({ ...prev, [key]: value }));
  };

  // The main submission handler.
  // FIX: Correct the event handler type to match the form's onSubmit prop.
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isSubmitting) return;

    const validationErrors = validate ? validate(values) : {};
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length === 0) {
      setIsSubmitting(true);
      try {
        await onSubmit(values);
      } catch (error) {
        console.error("Submission failed:", error);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  return {
    values,
    errors,
    isSubmitting,
    setValues,
    handleChange,
    setFormValue,
    handleSubmit,
  };
};

// Custom hook to simplify the use of the data context.
// This hook provides a clean way for components to access the context's value
// and also includes an error check to ensure it's used within a DataProvider.
export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};