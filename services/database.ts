/**
 * @file database.ts
 * @description This service provides functions for interacting with the local file-based database.
 * It encapsulates all file system operations for CRUD operations on game systems, armies, and models.
 */

import { GameSystem, Army, Model, PaintingSession, Paint } from '../types';

// Helper function to read data from a JSON file
const readData = async <T>(fileName: string): Promise<T[]> => {
  try {
    const data = localStorage.getItem(fileName);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error(`Error reading from ${fileName}:`, error);
    return [];
  }
};

// Helper function to write data to a JSON file
const writeData = async <T>(fileName: string, data: T[]): Promise<void> => {
  try {
    localStorage.setItem(fileName, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error(`Error writing to ${fileName}:`, error);
  }
};

// --- Game System ---

export const getGameSystems = async (): Promise<GameSystem[]> => {
  return await readData<GameSystem>('game-systems.json');
};

export const addGameSystem = async (system: Omit<GameSystem, 'id'>): Promise<GameSystem> => {
  const systems = await getGameSystems();
  const newSystem = { ...system, id: Date.now().toString() };
  systems.push(newSystem);
  await writeData('game-systems.json', systems);
  return newSystem;
};

export const updateGameSystem = async (id: string, systemUpdate: Partial<Omit<GameSystem, 'id'>>): Promise<GameSystem> => {
  const systems = await getGameSystems();
  const index = systems.findIndex(s => s.id === id);
  if (index === -1) throw new Error('Game system not found');
  const updatedSystem = { ...systems[index], ...systemUpdate };
  systems[index] = updatedSystem;
  await writeData('game-systems.json', systems);
  return updatedSystem;
};

export const deleteGameSystem = async (id: string): Promise<void> => {
  let systems = await getGameSystems();
  systems = systems.filter(s => s.id !== id);
  await writeData('game-systems.json', systems);
};

// --- Army ---

export const getArmies = async (): Promise<Army[]> => {
  return await readData<Army>('armies.json');
};

export const addArmy = async (army: Omit<Army, 'id'>): Promise<Army> => {
  const armies = await getArmies();
  const newArmy = { ...army, id: Date.now().toString() };
  armies.push(newArmy);
  await writeData('armies.json', armies);
  return newArmy;
};

export const updateArmy = async (id: string, armyUpdate: Partial<Omit<Army, 'id'>>): Promise<Army> => {
  const armies = await getArmies();
  const index = armies.findIndex(a => a.id === id);
  if (index === -1) throw new Error('Army not found');
  const updatedArmy = { ...armies[index], ...armyUpdate };
  armies[index] = updatedArmy;
  await writeData('armies.json', armies);
  return updatedArmy;
};

export const deleteArmy = async (id: string): Promise<void> => {
  let armies = await getArmies();
  armies = armies.filter(a => a.id !== id);
  await writeData('armies.json', armies);
};

// --- Model ---

export const getModels = async (): Promise<Model[]> => {
  return await readData<Model>('models.json');
};

export const addModel = async (model: Omit<Model, 'id' | 'createdAt' | 'lastUpdated'>): Promise<Model> => {
  const models = await getModels();
  const newModel = { 
    ...model, 
    id: Date.now().toString(),
    createdAt: new Date().toISOString(),
    lastUpdated: new Date().toISOString()
  };
  models.push(newModel);
  await writeData('models.json', models);
  return newModel;
};

export const updateModel = async (id: string, modelUpdate: Partial<Omit<Model, 'id'>>): Promise<Model> => {
  const models = await getModels();
  const index = models.findIndex(m => m.id === id);
  if (index === -1) throw new Error('Model not found');
  const updatedModel = { ...models[index], ...modelUpdate, lastUpdated: new Date().toISOString() };
  models[index] = updatedModel;
  await writeData('models.json', models);
  return updatedModel;
};

export const deleteModel = async (id: string): Promise<void> => {
  let models = await getModels();
  models = models.filter(m => m.id !== id);
  await writeData('models.json', models);
};

// --- Painting Session ---

export const getPaintingSessions = async (): Promise<PaintingSession[]> => {
  return await readData<PaintingSession>('painting-sessions.json');
};

export const addPaintingSession = async (session: Omit<PaintingSession, 'id'>): Promise<PaintingSession> => {
  const sessions = await getPaintingSessions();
  const newSession = { ...session, id: Date.now().toString() };
  sessions.push(newSession);
  await writeData('painting-sessions.json', sessions);
  return newSession;
};

export const updatePaintingSession = async (id: string, sessionUpdate: Partial<Omit<PaintingSession, 'id'>>): Promise<PaintingSession> => {
  const sessions = await getPaintingSessions();
  const index = sessions.findIndex(s => s.id === id);
  if (index === -1) throw new Error('Painting session not found');
  const updatedSession = { ...sessions[index], ...sessionUpdate };
  sessions[index] = updatedSession;
  await writeData('painting-sessions.json', sessions);
  return updatedSession;
};

export const deletePaintingSession = async (id: string): Promise<void> => {
  let sessions = await getPaintingSessions();
  sessions = sessions.filter(s => s.id !== id);
  await writeData('painting-sessions.json', sessions);
};

// --- Paint ---

export const getPaints = async (): Promise<Paint[]> => {
  return await readData<Paint>('paints.json');
};

export const addPaint = async (paint: Omit<Paint, 'id'>): Promise<Paint> => {
  const paints = await getPaints();
  const newPaint = { ...paint, id: Date.now().toString() };
  paints.push(newPaint);
  await writeData('paints.json', paints);
  return newPaint;
};

export const updatePaint = async (id: string, paintUpdate: Partial<Omit<Paint, 'id'>>): Promise<Paint> => {
  const paints = await getPaints();
  const index = paints.findIndex(p => p.id === id);
  if (index === -1) throw new Error('Paint not found');
  const updatedPaint = { ...paints[index], ...paintUpdate };
  paints[index] = updatedPaint;
  await writeData('paints.json', paints);
  return updatedPaint;
};

export const deletePaint = async (id: string): Promise<void> => {
  let paints = await getPaints();
  paints = paints.filter(p => p.id !== id);
  await writeData('paints.json', paints);
};

// --- Bulk Operations ---

export const bulkAddModels = async (newModels: Omit<Model, 'id' | 'createdAt' | 'lastUpdated'>[]): Promise<Model[]> => {
  const models = await getModels();
  const modelsToAdd = newModels.map(model => ({
    ...model,
    id: Date.now().toString() + Math.random().toString(36).substr(2, 9), // Add randomness to avoid collision
    createdAt: new Date().toISOString(),
    lastUpdated: new Date().toISOString(),
  }));
  const updatedModels = [...models, ...modelsToAdd];
  await writeData('models.json', updatedModels);
  return modelsToAdd;
};

export const bulkAddPaints = async (newPaints: Omit<Paint, 'id'>[]): Promise<Paint[]> => {
  const paints = await getPaints();
  const paintsToAdd = newPaints.map(paint => ({
    ...paint,
    id: Date.now().toString() + Math.random().toString(36).substr(2, 9), // Add randomness to avoid collision
  }));
  const updatedPaints = [...paints, ...paintsToAdd];
  await writeData('paints.json', updatedPaints);
  return paintsToAdd;
};

export const clearAllData = async (): Promise<void> => {
    // This is a destructive operation and should be used with caution.
    console.log('Clearing all application data...');
    try {
        // Get all keys from localStorage
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            // In this app, all data files end with .json
            if (key && key.endsWith('.json')) {
                keysToRemove.push(key);
            }
        }
        // Remove all identified keys
        keysToRemove.forEach(key => localStorage.removeItem(key));
        // Also clear other settings that might be stored
        localStorage.removeItem('minStockThreshold');
        console.log('All data cleared successfully.');
    } catch (error) {
        console.error('Error clearing data:', error);
        // We might want to re-throw the error or handle it in a specific way
        throw new Error('Failed to clear all data.');
    }
};