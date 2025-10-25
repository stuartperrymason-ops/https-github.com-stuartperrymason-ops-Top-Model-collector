/**
 * @file CollectionPage.tsx
 * @description This page displays the user's collection of miniatures.
 * It includes filtering options, bulk actions, and allows users to add, edit, or delete models.
 * This program was written by Stuart Mason October 2025.
 */

import React, { useState, useMemo, useEffect } from 'react';
import { useData } from '../context/DataContext';
import ModelCard from '../components/ModelCard';
import ModelFormModal from '../components/ModelFormModal';
import ModelDetailModal from '../components/ModelDetailModal';
import { PlusIcon } from '../components/icons/Icons';
import { Model } from '../types';
import Papa from 'papaparse';

// Configuration for status sort order.
const statusConfig: { [key in Model['status']]: { order: number; } } = {
    'Ready to Game': { order: 1 },
    'Based': { order: 2 },
    'Painted': { order: 3 },
    'Primed': { order: 4 },
    'Assembled': { order: 5 },
    'Printed': { order: 6 },
    'Purchased': { order: 7 },
};


const CollectionPage: React.FC = () => {
  // Destructure data and functions from the global DataContext.
  const { models, gameSystems, armies, loading, error, bulkUpdateModels, bulkDeleteModels } = useData();

  // State for managing the visibility of the Add/Edit form modal.
  const [isModalOpen, setIsModalOpen] = useState(false);
  // State to hold the model currently being edited. If null, the form is for adding a new model.
  const [selectedModel, setSelectedModel] = useState<Model | null>(null);

  // State for managing the visibility of the read-only detail modal.
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [modelForDetail, setModelForDetail] = useState<Model | null>(null);

  // State for filter and sort controls.
  const [gameSystemFilter, setGameSystemFilter] = useState<string>('');
  const [armyFilter, setArmyFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortOption, setSortOption] = useState<string>('updated-desc');

  // State for bulk action mode.
  const [isBulkEditMode, setIsBulkEditMode] = useState(false);
  const [selectedModelIds, setSelectedModelIds] = useState<string[]>([]);
  // State for the status to be applied during a bulk update.
  const [bulkStatus, setBulkStatus] = useState<Model['status']>('Purchased');
  
  // Effect for dynamic theming based on the selected game system.
  useEffect(() => {
    const mainElement = document.querySelector('main');
    if (!mainElement) return;

    const root = document.documentElement;

    // A helper function to reset all theme-related styles to their defaults.
    const resetToDefault = () => {
        root.style.removeProperty('--theme-primary-color');
        root.style.removeProperty('--theme-secondary-color');
        mainElement.style.removeProperty('background-color');
        mainElement.classList.remove('transition-colors', 'duration-500');
    };

    if (gameSystemFilter) {
      const selectedSystem = gameSystems.find(gs => gs.id === gameSystemFilter);
      // If the selected system exists and has a color scheme defined, apply it.
      if (selectedSystem && selectedSystem.colorScheme) {
        root.style.setProperty('--theme-primary-color', selectedSystem.colorScheme.primary);
        root.style.setProperty('--theme-secondary-color', selectedSystem.colorScheme.secondary);
        mainElement.style.backgroundColor = selectedSystem.colorScheme.background;
        mainElement.classList.add('transition-colors', 'duration-500');
      } else {
        resetToDefault();
      }
    } else {
      // If no filter is applied, reset to the default theme.
      resetToDefault();
    }

    // The cleanup function of the effect is crucial. It runs when the component unmounts
    // or before the effect re-runs, ensuring that the theme doesn't "leak" to other pages.
    return () => {
        resetToDefault();
    };
  }, [gameSystemFilter, gameSystems]);


  // --- Modal Handlers ---
  const handleAddModelClick = () => {
    setSelectedModel(null); // Ensure no model is selected for editing.
    setIsModalOpen(true);
  };
  
  const handleEditModel = (model: Model) => {
    setSelectedModel(model);
    setIsModalOpen(true);
  };

  const handleViewModel = (model: Model) => {
    setModelForDetail(model);
    setIsDetailModalOpen(true);
  };
  
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedModel(null);
  };
  
  const handleCloseDetailModal = () => {
    setIsDetailModalOpen(false);
    setModelForDetail(null);
  };

  // Memoized filtering and sorting logic. `useMemo` prevents this expensive calculation from running
  // on every render. It only recalculates when one of its dependencies changes.
  const sortedAndFilteredModels = useMemo(() => {
    const filtered = models
      .filter(model => !gameSystemFilter || model.gameSystemId === gameSystemFilter)
      .filter(model => !armyFilter || model.armyIds.includes(armyFilter))
      .filter(model => model.name.toLowerCase().includes(searchQuery.toLowerCase()));

    // Create a mutable copy for sorting.
    const sortable = [...filtered];

    sortable.sort((a, b) => {
      switch (sortOption) {
        case 'name-asc':
          return a.name.localeCompare(b.name);
        case 'name-desc':
          return b.name.localeCompare(a.name);
        case 'status':
          return statusConfig[a.status].order - statusConfig[b.status].order;
        case 'quantity-desc':
          return b.quantity - a.quantity;
        case 'quantity-asc':
          return a.quantity - b.quantity;
        case 'updated-asc':
          // Fallback to 0 for models that might not have a timestamp yet.
          return new Date(a.lastUpdated || 0).getTime() - new Date(b.lastUpdated || 0).getTime();
        case 'updated-desc':
        default:
          return new Date(b.lastUpdated || 0).getTime() - new Date(a.lastUpdated || 0).getTime();
      }
    });

    return sortable;
  }, [models, gameSystemFilter, armyFilter, searchQuery, sortOption]);

  // Memoized calculation for armies available in the dropdown, based on the selected game system.
  const availableArmies = useMemo(() => {
    if (!gameSystemFilter) return armies; // If no system is selected, show all armies.
    return armies.filter(army => army.gameSystemId === gameSystemFilter);
  }, [armies, gameSystemFilter]);

  // This effect ensures that if a game system is selected that doesn't contain the currently
  // selected army, the army filter is reset. This prevents an inconsistent UI state.
  useEffect(() => {
    if (armyFilter && !availableArmies.some(a => a.id === armyFilter)) {
      setArmyFilter('');
    }
  }, [availableArmies, armyFilter]);

  // --- Bulk Action Handlers ---
  const toggleBulkEditMode = () => {
    setIsBulkEditMode(prev => !prev);
    setSelectedModelIds([]); // Clear selections when toggling mode.
  };

  const handleSelectModel = (modelId: string) => {
    setSelectedModelIds(prev =>
      prev.includes(modelId)
        ? prev.filter(id => id !== modelId) // Deselect if already selected
        : [...prev, modelId]                 // Select if not already selected
    );
  };
  
  // Handler for the "Select All" checkbox in the bulk edit toolbar.
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      // Select all models that are currently visible based on filters.
      setSelectedModelIds(sortedAndFilteredModels.map(m => m.id));
    } else {
      setSelectedModelIds([]);
    }
  };
  
  const handleBulkDelete = async () => {
    // A confirmation dialog is a good practice for destructive actions.
    if (window.confirm(`Are you sure you want to delete ${selectedModelIds.length} models?`)) {
        await bulkDeleteModels(selectedModelIds);
        toggleBulkEditMode(); // Exit bulk edit mode after the action.
    }
  };

  const handleBulkUpdateStatus = async () => {
    await bulkUpdateModels(selectedModelIds, { status: bulkStatus });
    toggleBulkEditMode();
  };
  
  // --- CSV Export Handler ---
  const handleExportCsv = () => {
    // Map the filtered model data to a format suitable for CSV export.
    // This includes resolving IDs to names for better readability.
    const dataToExport = sortedAndFilteredModels.map(model => {
      const gameSystem = gameSystems.find(gs => gs.id === model.gameSystemId);
      const associatedArmies = armies.filter(a => model.armyIds.includes(a.id));
      const armyNames = associatedArmies.map(a => a.name).join(', ');
      return {
        name: model.name,
        'game system': gameSystem?.name || 'N/A',
        army: armyNames || 'N/A',
        quantity: model.quantity,
        status: model.status,
      };
    });

    // Use PapaParse to convert the JSON data to a CSV string.
    const csv = Papa.unparse(dataToExport);
    // Create a Blob and a temporary link to trigger the file download.
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'model_collection.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click(); // Programmatically click the link to start download.
    document.body.removeChild(link); // Clean up the temporary link.
  };


  // Conditional rendering for loading state.
  if (loading) {
    return <div className="flex justify-center items-center h-full"><p>Loading your collection...</p></div>;
  }

  // Conditional rendering for error state.
  if (error) {
    return <div className="flex justify-center items-center h-full"><p className="text-red-500">{error}</p></div>;
  }

  return (
    <div className="container mx-auto pb-20"> {/* Padding bottom for the fixed bulk actions toolbar */}
      <header className="mb-6 flex flex-col sm:flex-row justify-between items-center gap-4">
        <h1 className="text-3xl font-bold text-white">My Collection</h1>
        <div className="flex gap-2 flex-wrap justify-center">
            <button
             onClick={handleExportCsv}
             className="px-4 py-2 font-semibold rounded-lg shadow-md transition duration-300 bg-surface hover:bg-gray-700 text-text-primary border border-border"
           >
             Export to CSV
           </button>
           <button
             onClick={toggleBulkEditMode}
             className={`px-4 py-2 font-semibold rounded-lg shadow-md transition duration-300 ${isBulkEditMode ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-surface hover:bg-gray-700 text-text-primary border border-border'}`}
           >
             {isBulkEditMode ? 'Cancel Bulk Edit' : 'Bulk Edit'}
           </button>
           <button
             onClick={handleAddModelClick}
             className="flex items-center gap-2 px-4 py-2 bg-primary text-white font-semibold rounded-lg shadow-md hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary focus:ring-offset-background transition-all duration-300"
           >
             <PlusIcon />
             Add Model
           </button>
        </div>
      </header>

      {/* Filter and sort controls section */}
      <div className="mb-6 p-4 bg-surface rounded-lg shadow-md flex flex-col lg:flex-row gap-4">
          <input
            type="text"
            placeholder="Search by name..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="flex-grow bg-background border border-border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
          />
        <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
         <select
            value={gameSystemFilter}
            onChange={e => setGameSystemFilter(e.target.value)}
            className="bg-background border border-border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary sm:w-1/2 lg:w-auto"
        >
            <option value="">All Game Systems</option>
            {gameSystems.map(gs => <option key={gs.id} value={gs.id}>{gs.name}</option>)}
        </select>
        <select
            value={armyFilter}
            onChange={e => setArmyFilter(e.target.value)}
            className="bg-background border border-border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary sm:w-1/2 lg:w-auto"
            disabled={!gameSystemFilter && availableArmies.length === 0}
        >
            <option value="">All Armies</option>
            {availableArmies.map(army => <option key={army.id} value={army.id}>{army.name}</option>)}
        </select>
        <select
            value={sortOption}
            onChange={e => setSortOption(e.target.value)}
            className="bg-background border border-border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary w-full lg:w-auto"
          >
            <option value="updated-desc">Sort: Last Updated (Newest)</option>
            <option value="updated-asc">Sort: Last Updated (Oldest)</option>
            <option value="name-asc">Sort: Name (A-Z)</option>
            <option value="name-desc">Sort: Name (Z-A)</option>
            <option value="status">Sort: Status</option>
            <option value="quantity-desc">Sort: Quantity (High-Low)</option>
            <option value="quantity-asc">Sort: Quantity (Low-High)</option>
          </select>
        </div>
      </div>

      {/* Display the grid of model cards or an empty state message. */}
      {sortedAndFilteredModels.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {sortedAndFilteredModels.map(model => (
            <ModelCard
              key={model.id}
              model={model}
              onEdit={handleEditModel}
              onView={handleViewModel}
              isBulkEditMode={isBulkEditMode}
              isSelected={selectedModelIds.includes(model.id)}
              onSelect={handleSelectModel}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-surface rounded-lg border border-border">
            <div className="flex justify-center mb-4">
                <svg className="w-16 h-16 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 S0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
            </div>
          {models.length === 0 ? (
            <>
              <h3 className="text-xl font-semibold text-text-primary">Your collection is empty.</h3>
              <p className="text-text-secondary mt-2">Click the "Add Model" button to get started!</p>
            </>
          ) : (
            <>
              <h3 className="text-xl font-semibold text-text-primary">No Models Found</h3>
              <p className="text-text-secondary mt-2">Try adjusting your search or filter criteria.</p>
            </>
          )}
        </div>
      )}

      {/* The bulk actions toolbar appears at the bottom of the screen when in bulk edit mode. */}
      {isBulkEditMode && selectedModelIds.length > 0 && (
          <div className="fixed bottom-0 left-0 right-0 md:left-64 bg-surface border-t border-border p-3 shadow-lg z-40 flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-3">
                  <input
                      type="checkbox"
                      className="h-5 w-5 rounded border-gray-300 text-primary focus:ring-primary bg-surface"
                      onChange={handleSelectAll}
                      checked={sortedAndFilteredModels.length > 0 && selectedModelIds.length === sortedAndFilteredModels.length}
                      title="Select All/None"
                  />
                  <span className="font-semibold">{selectedModelIds.length} selected</span>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                  {/* Status update controls */}
                  <div className="flex items-center gap-2">
                    <select
                        value={bulkStatus}
                        onChange={(e) => setBulkStatus(e.target.value as Model['status'])}
                        className="bg-background border border-border rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                        <option value="Purchased">Purchased</option>
                        <option value="Printed">Printed</option>
                        <option value="Assembled">Assembled</option>
                        <option value="Primed">Primed</option>
                        <option value="Painted">Painted</option>
                        <option value="Based">Based</option>
                        <option value="Ready to Game">Ready to Game</option>
                    </select>
                    <button onClick={handleBulkUpdateStatus} className="px-3 py-1.5 text-sm bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors">Apply Status</button>
                  </div>
                  {/* Delete button */}
                  <button onClick={handleBulkDelete} className="px-3 py-1.5 text-sm bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors">Delete</button>
              </div>
          </div>
      )}

      {/* Render the form modal if isModalOpen is true. */}
      {isModalOpen && (
        <ModelFormModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          model={selectedModel}
        />
      )}
      
      {/* Render the detail modal if isDetailModalOpen is true. */}
      {isDetailModalOpen && modelForDetail && (
        <ModelDetailModal
          isOpen={isDetailModalOpen}
          onClose={handleCloseDetailModal}
          model={modelForDetail}
        />
      )}
    </div>
  );
};

export default CollectionPage;