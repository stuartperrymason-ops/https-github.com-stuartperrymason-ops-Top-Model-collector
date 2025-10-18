/**
 * @file ModelCard.tsx
 * @description A card component to display summary information for a single model.
 * It includes controls for editing and deleting the model.
 */

import React from 'react';
import { Model } from '../types';
import { useData } from '../context/DataContext';
import { PencilIcon, TrashIcon } from './icons/Icons';

interface ModelCardProps {
  model: Model;
  onEdit: (model: Model) => void;
  isBulkEditMode: boolean;
  isSelected: boolean;
  onSelect: (modelId: string) => void;
}

const ModelCard: React.FC<ModelCardProps> = ({ model, onEdit, isBulkEditMode, isSelected, onSelect }) => {
  const { gameSystems, armies, deleteModel } = useData();

  const gameSystem = gameSystems.find(gs => gs.id === model.gameSystemId);
  const army = armies.find(a => a.id === model.armyId);

  const handleDelete = () => {
    if (window.confirm(`Are you sure you want to delete ${model.name}?`)) {
      deleteModel(model.id);
    }
  };

  const getStatusBadgeColor = (status: Model['status']) => {
    switch (status) {
      case 'Purchased':
        return 'bg-gray-500 text-white';
      case 'Printed':
        return 'bg-slate-500 text-white';
      case 'Primed':
        return 'bg-zinc-400 text-black';
      case 'Painted':
        return 'bg-yellow-500 text-black';
      case 'Based':
        return 'bg-amber-600 text-white';
      case 'Ready to Game':
        return 'bg-green-500 text-white';
      default:
        // Fallback for any unexpected status
        return 'bg-gray-200 text-gray-800';
    }
  };

  return (
    <div 
        className={`relative bg-surface rounded-lg shadow-lg overflow-hidden border transition-all duration-300 ${
            isSelected ? 'border-primary scale-105' : 'border-border'
        } ${isBulkEditMode ? 'cursor-pointer hover:border-primary' : 'hover:scale-105'}`}
        onClick={() => isBulkEditMode && onSelect(model.id)}
    >
        {isBulkEditMode && (
            <div className="absolute top-2 right-2 z-10 bg-surface bg-opacity-75 rounded-full">
                <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => onSelect(model.id)}
                    onClick={(e) => e.stopPropagation()} // Prevent card click from firing twice
                    className="h-6 w-6 rounded-full border-gray-300 text-primary focus:ring-primary bg-transparent"
                    aria-label={`Select ${model.name}`}
                />
            </div>
        )}
      {model.imageUrl ? (
        <img src={model.imageUrl} alt={model.name} className="w-full h-48 object-cover" />
      ) : (
        <div className="w-full h-48 bg-gray-700 flex items-center justify-center">
            <span className="text-text-secondary">No Image</span>
        </div>
      )}
      <div className="p-4">
        <h3 className="text-xl font-bold text-white mb-2">{model.name}</h3>
        <p className="text-sm text-text-secondary mb-1">{army?.name || 'Unknown Army'}</p>
        <p className="text-xs text-gray-400 mb-4">{gameSystem?.name || 'Unknown System'}</p>
        
        <div className="flex justify-between items-center mb-4">
            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeColor(model.status)}`}>
                {model.status}
            </span>
            <span className="text-lg font-bold text-primary">{model.quantity}x</span>
        </div>

        <p className="text-sm text-text-secondary mb-4 h-20 overflow-y-auto">{model.description}</p>
        
        <div className="flex justify-end gap-2 mt-4 border-t border-border pt-3">
          <button 
            onClick={() => onEdit(model)} 
            className="p-2 text-blue-400 hover:text-blue-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isBulkEditMode}
            aria-label={`Edit ${model.name}`}
          >
            <PencilIcon />
          </button>
          <button 
            onClick={handleDelete} 
            className="p-2 text-red-400 hover:text-red-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isBulkEditMode}
            aria-label={`Delete ${model.name}`}
          >
            <TrashIcon />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModelCard;