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
}

const ModelCard: React.FC<ModelCardProps> = ({ model, onEdit }) => {
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
      case 'painted':
        return 'bg-green-500 text-white';
      case 'wip':
        return 'bg-yellow-500 text-black';
      case 'unpainted':
        return 'bg-gray-500 text-white';
      default:
        return 'bg-gray-200 text-gray-800';
    }
  };

  return (
    <div className="bg-surface rounded-lg shadow-lg overflow-hidden border border-border transform hover:scale-105 transition-transform duration-300">
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
                {model.status.toUpperCase()}
            </span>
            <span className="text-lg font-bold text-primary">{model.points} pts</span>
        </div>

        <p className="text-sm text-text-secondary mb-4 h-20 overflow-y-auto">{model.description}</p>
        
        <div className="flex justify-end gap-2 mt-4 border-t border-border pt-3">
          <button onClick={() => onEdit(model)} className="p-2 text-blue-400 hover:text-blue-300 transition-colors">
            <PencilIcon />
          </button>
          <button onClick={handleDelete} className="p-2 text-red-400 hover:text-red-300 transition-colors">
            <TrashIcon />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModelCard;
