/**
 * @file ModelCard.tsx
 * @description A component that displays a single model's information in a card format.
 * It also provides controls for editing and deleting the model.
 */

import React from 'react';
import { useData } from '../context/DataContext';
import { Model } from '../types';
import { PencilIcon, TrashIcon } from './icons/Icons';
import { deleteModel } from '../services/apiService';

interface ModelCardProps {
  model: Model;
  onEdit: (model: Model) => void; // Callback function to trigger the edit modal in the parent.
}

// A map to associate model status with specific Tailwind CSS classes for color-coding.
const statusStyles = {
  painted: 'bg-green-500 text-green-50',
  wip: 'bg-yellow-500 text-yellow-50',
  unpainted: 'bg-red-500 text-red-50',
};

const ModelCard: React.FC<ModelCardProps> = ({ model, onEdit }) => {
  const { state, dispatch } = useData();

  // Find the full army and game system objects from the global state using the IDs stored in the model.
  // This is necessary to display their names.
  const army = state.armies.find(a => a.id === model.armyId);
  const gameSystem = state.gameSystems.find(gs => gs.id === model.gameSystemId);

  // Handles the delete action. It shows a confirmation dialog before calling the API.
  const handleDelete = async () => {
    if (window.confirm(`Are you sure you want to delete ${model.name}?`)) {
      try {
        await deleteModel(model.id);
        // On successful deletion from the backend, dispatch the action to update the UI.
        dispatch({ type: 'DELETE_MODEL', payload: model.id });
      } catch (error) {
        console.error("Failed to delete model:", error);
        alert("Could not delete the model. Please try again.");
      }
    }
  };

  return (
    <div className="bg-surface rounded-lg shadow-lg overflow-hidden border border-border transition-transform hover:scale-105 duration-300 flex flex-col">
      <img src={model.imageUrl || 'https://picsum.photos/400/300'} alt={model.name} className="w-full h-48 object-cover" />
      <div className="p-4 flex-grow flex flex-col">
        <div className="flex justify-between items-start mb-2">
            <h3 className="text-lg font-bold text-text-primary">{model.name}</h3>
            {/* The status badge's color is determined by the `statusStyles` map. */}
            <span className={`px-2 py-1 text-xs font-bold rounded-full ${statusStyles[model.status]}`}>
                {model.status.toUpperCase()}
            </span>
        </div>
        <p className="text-sm text-primary font-semibold">{army?.name || 'Unknown Army'}</p>
        <p className="text-xs text-text-secondary mb-3">{gameSystem?.name || 'Unknown System'}</p>
        <p className="text-sm text-text-secondary flex-grow mb-4">{model.description}</p>
        
        {/* Footer section with stats and action buttons */}
        <div className="flex justify-between items-center text-sm mt-auto pt-4 border-t border-border">
          <div className="space-x-4">
            <span>Qty: <span className="font-bold">{model.quantity}</span></span>
            <span>Pts: <span className="font-bold">{model.points}</span></span>
          </div>
          <div className="flex gap-2">
            {/* The onEdit prop is called with the current model to open the edit modal. */}
            <button onClick={() => onEdit(model)} className="p-2 text-text-secondary hover:text-primary transition-colors"><PencilIcon /></button>
            <button onClick={handleDelete} className="p-2 text-text-secondary hover:text-red-500 transition-colors"><TrashIcon /></button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModelCard;
