/**
 * @file CollectionPage.tsx
 * @description This is the main page for viewing and managing the model collection.
 * It features filtering, sorting, and the ability to add or edit models via a modal.
 */

import React, { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { Model } from '../types';
import ModelCard from '../components/ModelCard';
import ModelFormModal from '../components/ModelFormModal';
import { PlusIcon } from '../components/icons/Icons';

type SortByType = 'name' | 'points' | 'status';

const CollectionPage: React.FC = () => {
  // Access global state using the custom hook.
  const { state } = useData();
  // State for controlling the add/edit model modal.
  const [isModalOpen, setIsModalOpen] = useState(false);
  // State to hold the model currently being edited. `undefined` means we are adding a new model.
  const [editingModel, setEditingModel] = useState<Model | undefined>(undefined);
  // State for filtering controls.
  const [filterGameSystem, setFilterGameSystem] = useState<string>('all');
  const [filterArmy, setFilterArmy] = useState<string>('all');
  // State for sorting control.
  const [sortBy, setSortBy] = useState<SortByType>('name');

  // Opens the modal, optionally pre-filling it with a model's data for editing.
  const handleOpenModal = (model?: Model) => {
    setEditingModel(model);
    setIsModalOpen(true);
  };

  // Closes the modal and resets the editing state.
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingModel(undefined);
  };
  
  // `useMemo` is used here for performance optimization.
  // This logic only re-runs if the `filterGameSystem` or `state.armies` array changes.
  // It computes the list of armies available in the army filter dropdown based on the selected game system.
  const filteredArmies = useMemo(() => {
    if (filterGameSystem === 'all') {
      return state.armies;
    }
    return state.armies.filter(army => army.gameSystemId === filterGameSystem);
  }, [filterGameSystem, state.armies]);

  // `useMemo` is used again to efficiently filter and sort the models.
  // The filtering and sorting logic will only re-execute when the source models or any filter/sort criteria change.
  // This prevents unnecessary re-computation on every render.
  const filteredModels = useMemo(() => {
    const statusOrder: Record<Model['status'], number> = {
        'painted': 0,
        'wip': 1,
        'unpainted': 2,
    };

    return state.models
      .filter(model => {
        const gameSystemMatch = filterGameSystem === 'all' || model.gameSystemId === filterGameSystem;
        const armyMatch = filterArmy === 'all' || model.armyId === filterArmy;
        return gameSystemMatch && armyMatch;
      })
      .sort((a, b) => {
        switch (sortBy) {
            case 'name':
                return a.name.localeCompare(b.name);
            case 'points':
                return a.points - b.points;
            case 'status':
                return statusOrder[a.status] - statusOrder[b.status];
            default:
                return 0;
        }
      });
  }, [state.models, filterGameSystem, filterArmy, sortBy]);

  // Handle loading and error states from the context.
  if (state.loading) {
    return <div className="text-center py-16">Loading your collection...</div>;
  }
  
  // Note: The context provides fallback demo data, so this error may not appear
  // unless that fallback is removed.
  if (state.error) {
    return <div className="text-center py-16 text-red-400">{state.error}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <h1 className="text-3xl font-bold">Your Collection</h1>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white font-semibold rounded-lg shadow-md hover:bg-indigo-500 transition-colors"
        >
          <PlusIcon />
          Add Model
        </button>
      </div>

      {/* Filtering and Sorting Controls */}
      <div className="bg-surface p-4 rounded-lg border border-border grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label htmlFor="gameSystemFilter" className="block text-sm font-medium text-text-secondary mb-1">Filter by Game System</label>
          <select
            id="gameSystemFilter"
            value={filterGameSystem}
            onChange={(e) => {
                // When game system changes, reset the army filter to 'all'.
                setFilterGameSystem(e.target.value);
                setFilterArmy('all');
            }}
            className="w-full bg-background border border-border rounded-md p-2 focus:ring-primary focus:border-primary"
          >
            <option value="all">All Game Systems</option>
            {state.gameSystems.map(gs => <option key={gs.id} value={gs.id}>{gs.name}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="armyFilter" className="block text-sm font-medium text-text-secondary mb-1">Filter by Army</label>
          <select
            id="armyFilter"
            value={filterArmy}
            onChange={(e) => setFilterArmy(e.target.value)}
            className="w-full bg-background border border-border rounded-md p-2 focus:ring-primary focus:border-primary"
            // The army dropdown is disabled if no game system is selected, preventing confusion.
            disabled={filterGameSystem === 'all' && state.armies.length > 0}
          >
            <option value="all">All Armies</option>
            {filteredArmies.map(army => <option key={army.id} value={army.id}>{army.name}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="sortBy" className="block text-sm font-medium text-text-secondary mb-1">Sort by</label>
          <select
            id="sortBy"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortByType)}
            className="w-full bg-background border border-border rounded-md p-2 focus:ring-primary focus:border-primary"
          >
            <option value="name">Name (A-Z)</option>
            <option value="points">Points (Low to High)</option>
            <option value="status">Status</option>
          </select>
        </div>
      </div>

      {/* Display Grid of Models */}
      {filteredModels.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredModels.map(model => (
            <ModelCard key={model.id} model={model} onEdit={handleOpenModal} />
          ))}
        </div>
      ) : (
        // Show a message if no models match the current filters.
        <div className="text-center py-16 bg-surface rounded-lg border border-dashed border-border">
          <h2 className="text-xl font-semibold">No models found.</h2>
          <p className="text-text-secondary mt-2">Try adjusting your filters or add a new model to your collection!</p>
        </div>
      )}

      {/* The modal is conditionally rendered based on `isModalOpen` state. */}
      {isModalOpen && <ModelFormModal model={editingModel} onClose={handleCloseModal} />}
    </div>
  );
};

export default CollectionPage;
