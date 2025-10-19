/**
 * @file CollectionPage.tsx
 * @description This page displays the user's collection of miniatures.
 * It includes filtering options and allows users to add, edit, or delete models.
 */

import React, { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import ModelCard from '../components/ModelCard';
import ModelFormModal from '../components/ModelFormModal';
import ModelDetailModal from '../components/ModelDetailModal';
import { PlusIcon } from '../components/icons/Icons';
import { Model } from '../types';
import Papa from 'papaparse';


const CollectionPage: React.FC = () => {
  const { models, gameSystems, armies, loading, error, bulkUpdateModels, bulkDeleteModels } = useData();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedModel, setSelectedModel] = useState<Model | null>(null);

  // State for detail modal
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [modelForDetail, setModelForDetail] = useState<Model | null>(null);

  // State for filters
  const [gameSystemFilter, setGameSystemFilter] = useState<string>('');
  const [armyFilter, setArmyFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // State for bulk actions
  const [isBulkEditMode, setIsBulkEditMode] = useState(false);
  const [selectedModelIds, setSelectedModelIds] = useState<string[]>([]);
  const [bulkStatus, setBulkStatus] = useState<Model['status']>('Purchased');
  

  const handleAddModelClick = () => {
    setSelectedModel(null);
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

  // Memoized filtering logic
  const filteredModels = useMemo(() => {
    return models
      .filter(model => !gameSystemFilter || model.gameSystemId === gameSystemFilter)
      .filter(model => !armyFilter || model.armyIds.includes(armyFilter))
      .filter(model => model.name.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [models, gameSystemFilter, armyFilter, searchQuery]);

  // Armies available for the selected game system filter
  const availableArmies = useMemo(() => {
    if (!gameSystemFilter) return armies;
    return armies.filter(army => army.gameSystemId === gameSystemFilter);
  }, [armies, gameSystemFilter]);

  // Reset army filter if the selected game system doesn't contain it
  React.useEffect(() => {
    if (armyFilter && !availableArmies.some(a => a.id === armyFilter)) {
      setArmyFilter('');
    }
  }, [availableArmies, armyFilter]);

  // --- Bulk Action Handlers ---
  const toggleBulkEditMode = () => {
    setIsBulkEditMode(prev => !prev);
    setSelectedModelIds([]);
  };

  const handleSelectModel = (modelId: string) => {
    setSelectedModelIds(prev =>
      prev.includes(modelId)
        ? prev.filter(id => id !== modelId)
        : [...prev, modelId]
    );
  };
  
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedModelIds(filteredModels.map(m => m.id));
    } else {
      setSelectedModelIds([]);
    }
  };
  
  const handleBulkDelete = async () => {
    if (window.confirm(`Are you sure you want to delete ${selectedModelIds.length} models?`)) {
        await bulkDeleteModels(selectedModelIds);
        toggleBulkEditMode();
    }
  };

  const handleBulkUpdateStatus = async () => {
    await bulkUpdateModels(selectedModelIds, { status: bulkStatus });
    toggleBulkEditMode();
  };

  const handleExportCsv = () => {
    const dataToExport = filteredModels.map(model => {
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

    const csv = Papa.unparse(dataToExport);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'model_collection.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };


  if (loading) {
    return <div className="flex justify-center items-center h-full"><p>Loading your collection...</p></div>;
  }

  if (error) {
    return <div className="flex justify-center items-center h-full"><p className="text-red-500">{error}</p></div>;
  }

  return (
    <div className="container mx-auto pb-20"> {/* Padding bottom for bulk actions toolbar */}
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
             className="flex items-center gap-2 px-4 py-2 bg-primary text-white font-semibold rounded-lg shadow-md hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-400 focus:ring-offset-background transition duration-300"
           >
             <PlusIcon />
             Add Model
           </button>
        </div>
      </header>

      {/* Filter controls */}
      <div className="mb-6 p-4 bg-surface rounded-lg shadow-md flex flex-col sm:flex-row gap-4">
          <input
            type="text"
            placeholder="Search by name..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="flex-grow bg-background border border-border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
          />
         <select
            value={gameSystemFilter}
            onChange={e => setGameSystemFilter(e.target.value)}
            className="bg-background border border-border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
        >
            <option value="">All Game Systems</option>
            {gameSystems.map(gs => <option key={gs.id} value={gs.id}>{gs.name}</option>)}
        </select>
        <select
            value={armyFilter}
            onChange={e => setArmyFilter(e.target.value)}
            className="bg-background border border-border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
            disabled={!gameSystemFilter && availableArmies.length === 0}
        >
            <option value="">All Armies</option>
            {availableArmies.map(army => <option key={army.id} value={army.id}>{army.name}</option>)}
        </select>
      </div>

      {filteredModels.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredModels.map(model => (
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
        <div className="text-center py-16">
          <p className="text-xl text-text-secondary">Your collection is empty.</p>
          <p className="text-text-secondary">Click "Add Model" to get started!</p>
        </div>
      )}

      {isBulkEditMode && selectedModelIds.length > 0 && (
          <div className="fixed bottom-0 left-0 right-0 md:left-64 bg-surface border-t border-border p-3 shadow-lg z-40 flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-3">
                  <input
                      type="checkbox"
                      className="h-5 w-5 rounded border-gray-300 text-primary focus:ring-primary bg-surface"
                      onChange={handleSelectAll}
                      checked={filteredModels.length > 0 && selectedModelIds.length === filteredModels.length}
                      title="Select All/None"
                  />
                  <span className="font-semibold">{selectedModelIds.length} selected</span>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                  {/* Status update */}
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
                  {/* Delete */}
                  <button onClick={handleBulkDelete} className="px-3 py-1.5 text-sm bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors">Delete</button>
              </div>
          </div>
      )}

      {isModalOpen && (
        <ModelFormModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          model={selectedModel}
        />
      )}

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