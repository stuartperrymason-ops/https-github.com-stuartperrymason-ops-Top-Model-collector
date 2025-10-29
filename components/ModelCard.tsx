/**
 * @file ModelCard.tsx
 * @description A card component to display summary information for a single model.
 * It includes controls for viewing details, editing, and deleting the model.
 * It also supports a bulk selection mode.
 * This program was written by Stuart Mason October 2025.
 */

import React from 'react';
import { Model } from '../types';
import { useData } from '../context/DataContext';
import { PencilIcon, TrashIcon } from './icons/Icons';

// Define the props that this component accepts.
interface ModelCardProps {
  model: Model; // The model data to display.
  onEdit: (model: Model) => void; // Callback function to trigger edit mode.
  onView: (model: Model) => void; // Callback function to open the detail view.
  isBulkEditMode: boolean; // Flag indicating if the collection page is in bulk edit mode.
  isSelected: boolean; // Flag indicating if this specific card is selected in bulk edit mode.
  onSelect: (modelId: string) => void; // Callback function to toggle the selection status.
}

const ModelCard: React.FC<ModelCardProps> = ({ model, onEdit, onView, isBulkEditMode, isSelected, onSelect }) => {
  // Access global data and functions from the DataContext.
  const { gameSystems, armies, paints, deleteModel } = useData();

  // Find the full game system object from its ID for display.
  const gameSystem = gameSystems.find(gs => gs.id === model.gameSystemId);
  // Find all associated army objects and join their names for display.
  const associatedArmies = armies.filter(a => model.armyIds.includes(a.id) && a.gameSystemId === model.gameSystemId);
  const armyNames = associatedArmies.map(a => a.name).join(', ');

  // Handler for the delete button. Shows a confirmation dialog before proceeding.
  const handleDelete = () => {
    if (window.confirm(`Are you sure you want to delete ${model.name}?`)) {
      deleteModel(model.id);
    }
  };

  // The main click handler for the card. Its behavior changes based on the mode.
  const handleCardClick = () => {
    if (isBulkEditMode) {
      // In bulk edit mode, clicking the card toggles its selection.
      onSelect(model.id);
    } else {
      // Otherwise, it opens the detailed view modal.
      onView(model);
    }
  };

  // A utility function to determine the badge color based on the model's status.
  const getStatusBadgeColor = (status: Model['status']) => {
    switch (status) {
      case 'Purchased': return 'bg-gray-500 text-white';
      case 'Printed': return 'bg-slate-500 text-white';
      case 'Assembled': return 'bg-cyan-600 text-white';
      case 'Primed': return 'bg-zinc-400 text-black';
      case 'Painted': return 'bg-yellow-500 text-black';
      case 'Based': return 'bg-amber-600 text-white';
      case 'Ready to Game': return 'bg-green-500 text-white';
      default: return 'bg-gray-200 text-gray-800'; // Fallback style.
    }
  };

  return (
    // The main card container. Styling changes based on selection and hover state.
    <div 
        className={`relative bg-surface rounded-lg shadow-lg overflow-hidden border transition-all duration-300 group flex flex-col ${
            isSelected ? 'border-primary scale-105' : 'border-border'
        } ${isBulkEditMode ? 'cursor-pointer' : ''} hover:border-primary hover:scale-105`}
        onClick={handleCardClick}
    >
        {/* The selection checkbox is only rendered when in bulk edit mode. */}
        {isBulkEditMode && (
            <div className="absolute top-2 right-2 z-10 bg-surface bg-opacity-75 rounded-full">
                <input
                    type="checkbox"
                    checked={isSelected}
                    // onChange is needed for the checkbox to be interactive.
                    onChange={(e) => {
                      // Stop the click from propagating to the card's onClick handler,
                      // which would cause the selection to toggle twice.
                      e.stopPropagation(); 
                      onSelect(model.id);
                    }}
                    // onClick is also stopped to prevent double-firing in some browsers.
                    onClick={(e) => e.stopPropagation()}
                    className="h-6 w-6 rounded-full border-gray-300 text-primary focus:ring-primary bg-transparent"
                    aria-label={`Select ${model.name}`}
                />
            </div>
        )}
      {/* Display the model image or a placeholder if no image URL is provided. */}
      {model.imageUrl ? (
        <img src={model.imageUrl} alt={model.name} className="w-full h-48 object-cover" />
      ) : (
        <div className="w-full h-48 bg-gray-700 flex items-center justify-center">
            <span className="text-text-secondary">No Image</span>
        </div>
      )}
      <div className="p-4 flex-grow flex flex-col">
        <h3 className="text-xl font-bold text-white mb-2">{model.name}</h3>
        <p className="text-sm text-text-secondary mb-1">{armyNames || 'No Army Assigned'}</p>
        <p className="text-xs text-gray-400 mb-4">{gameSystem?.name || 'Unknown System'}</p>
        
        <div className="flex justify-between items-center mb-4">
            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeColor(model.status)}`}>
                {model.status}
            </span>
            <span className="text-lg font-bold text-primary">{model.quantity}x</span>
        </div>

        {/* The description is given a fixed height and vertical scroll for long texts. */}
        <p className="text-sm text-text-secondary mb-4 h-20 overflow-y-auto flex-grow">{model.description}</p>
        
        {/* Paint Recipe Swatches */}
        {model.paintRecipe && model.paintRecipe.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 mt-auto pt-2">
            {model.paintRecipe.slice(0, 7).map((step, index) => {
              const paint = paints.find(p => p.id === step.paintId);
              if (!paint) return null;
              return (
                <div 
                  key={index} 
                  className="w-5 h-5 rounded-full border-2 border-background shadow-sm" 
                  style={{ backgroundColor: paint.rgbCode || '#888' }} 
                  title={`${paint.name} (${paint.manufacturer}) - ${step.usage}`}
                ></div>
              );
            })}
            {model.paintRecipe.length > 7 && (
              <span className="text-xs text-text-secondary ml-1">+{model.paintRecipe.length - 7} more</span>
            )}
          </div>
        )}
        
        {/* Action buttons for edit and delete. */}
        <div className="flex justify-end gap-2 mt-4 border-t border-border pt-3">
          <button 
            // `e.stopPropagation()` is crucial here to prevent the card's `onClick` from firing when a button is clicked.
            onClick={(e) => { e.stopPropagation(); onEdit(model); }} 
            className="p-2 text-blue-400 hover:text-blue-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            // The button is disabled during bulk edit mode to prevent conflicting actions.
            disabled={isBulkEditMode}
            aria-label={`Edit ${model.name}`}
          >
            <PencilIcon />
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); handleDelete(); }} 
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