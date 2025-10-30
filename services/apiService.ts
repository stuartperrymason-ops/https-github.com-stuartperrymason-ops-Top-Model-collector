/**
 * @file apiService.ts
 * @description This service provides functions for interacting with the local database.
 * It encapsulates all calls for CRUD operations on game systems, armies, and models.
 */

import { GameSystem, Army, Model, PaintingSession, Paint } from '../types';
import * as db from './database';

// --- Game System API calls ---

/** Fetches all game systems from the database. */
export const getGameSystems = async (): Promise<GameSystem[]> => {
  return db.getGameSystems();
};

/** Adds a new game system to the database. */
export const addGameSystem = async (system: Omit<GameSystem, 'id'>): Promise<GameSystem> => {
  return db.addGameSystem(system);
};

/** Updates an existing game system. */
export const updateGameSystem = async (id: string, system: Partial<Omit<GameSystem, 'id'>>): Promise<GameSystem> => {
    return db.updateGameSystem(id, system);
  };
  
/** Deletes a game system by its ID. */
export const deleteGameSystem = async (id: string): Promise<void> => {
  return db.deleteGameSystem(id);
};


// --- Army API calls ---

/** Fetches all armies. */
export const getArmies = async (): Promise<Army[]> => {
  return db.getArmies();
};

/** Adds a new army. */
export const addArmy = async (army: Omit<Army, 'id'>): Promise<Army> => {
    return db.addArmy(army);
};
  
/** Updates an existing army. */
export const updateArmy = async (id: string, army: Partial<Omit<Army, 'id'>>): Promise<Army> => {
    return db.updateArmy(id, army);
};

/** Deletes an army by its ID. */
export const deleteArmy = async (id: string): Promise<void> => {
  return db.deleteArmy(id);
};


// --- Model API calls ---

/** Fetches all models. */
export const getModels = async (): Promise<Model[]> => {
  return db.getModels();
};

/** Adds a new model. */
export const addModel = async (model: Omit<Model, 'id' | 'createdAt' | 'lastUpdated'>): Promise<Model> => {
    return db.addModel(model);
};

/** Updates an existing model. */
export const updateModel = async (id: string, model: Partial<Omit<Model, 'id'>>): Promise<Model> => {
    return db.updateModel(id, model);
};

/** Deletes a model by its ID. */
export const deleteModel = async (id: string): Promise<void> => {
  return db.deleteModel(id);
};

// --- Painting Session API calls ---

/** Fetches all painting sessions. */
export const getPaintingSessions = async (): Promise<PaintingSession[]> => {
  return db.getPaintingSessions();
};

/** Adds a new painting session. */
export const addPaintingSession = async (session: Omit<PaintingSession, 'id'>): Promise<PaintingSession> => {
    return db.addPaintingSession(session);
};

/** Updates an existing painting session. */
export const updatePaintingSession = async (id: string, session: Partial<Omit<PaintingSession, 'id'>>): Promise<PaintingSession> => {
    return db.updatePaintingSession(id, session);
};

/** Deletes a painting session by its ID. */
export const deletePaintingSession = async (id: string): Promise<void> => {
  return db.deletePaintingSession(id);
};

// --- Paint API calls ---

/** Fetches all paints from the database. */
export const getPaints = async (): Promise<Paint[]> => {
  return db.getPaints();
};

/** Adds a new paint to the database. */
export const addPaint = async (paint: Omit<Paint, 'id'>): Promise<Paint> => {
  return db.addPaint(paint);
};

/** Updates an existing paint. */
export const updatePaint = async (id: string, paint: Partial<Omit<Paint, 'id'>>): Promise<Paint> => {
    return db.updatePaint(id, paint);
  };
  
/** Deletes a paint by its ID. */
export const deletePaint = async (id: string): Promise<void> => {
  return db.deletePaint(id);
};

// --- Bulk Operations ---

/** Bulk adds multiple models to the database. */
export const bulkAddModels = async (models: Omit<Model, 'id' | 'createdAt' | 'lastUpdated'>[]): Promise<Model[]> => {
  return db.bulkAddModels(models);
};

/** Bulk adds multiple paints to the database. */
export const bulkAddPaints = async (paints: Omit<Paint, 'id'>[]): Promise<Paint[]> => {
  return db.bulkAddPaints(paints);
};

// --- Global Operations ---

/**
 * Clears all data from the application.
 * This is a destructive operation and will remove all game systems, armies, models, etc.
 */
export const clearAllData = async (): Promise<void> => {
    return db.clearAllData();
};