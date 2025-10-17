/**
 * @file types.ts
 * @description This file contains TypeScript interfaces for the core data models
 * used throughout the application, ensuring type safety and consistency.
 */

// Represents a tabletop gaming system, e.g., "Warhammer 40,000".
export interface GameSystem {
  id: string; // Unique identifier
  name: string;
}

// Represents an army or faction within a specific game system.
export interface Army {
  id: string; // Unique identifier
  name:string;
  gameSystemId: string; // Foreign key linking to a GameSystem
}

// Represents a single miniature model in the user's collection.
export interface Model {
  id: string; // Unique identifier
  name: string;
  armyId: string; // Foreign key linking to an Army
  gameSystemId: string; // Foreign key linking to a GameSystem
  description: string;
  points: number; // Point cost in the game
  quantity: number; // How many of this model the user owns
  status: 'unpainted' | 'painted' | 'wip'; // Painting status
  imageUrl?: string; // Optional URL for an image of the model
}

// Represents a temporary notification message shown to the user.
export type ToastMessage = {
  id: number;
  message: string;
  type: 'success' | 'error';
};
