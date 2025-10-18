/**
 * @file CollectionPage.tsx
 * @description This page displays the user's collection of miniatures.
 * It includes filtering options and allows users to add, edit, or delete models.
 */

import React, { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import ModelCard from '../components/ModelCard';
import ModelFormModal from '../components/ModelFormModal';
import { PlusIcon, XIcon } from '../components/icons/Icons';
import { Model } from '../types';

const CollectionPage: React.FC = () => {
  const { models, gameSystems, armies, loading, error, bulkUpdateModels, bulkDeleteModels } = useData();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedModel, setSelectedModel] = useState<Model | null>(null);

  // State for filters
  const [gameSystemFilter, setGameSystemFilter] = useState<string>('');
  const [armyFilter, setArmyFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // State for bulk actions
  const [isBulkEditMode, setIsBulkEditMode] = useState(false);
  const [selectedModelIds, setSelectedModelIds] = useState<string[]>([]);
  const [bulkStatus, setBulkStatus] = useState<Model['status']>('unpainted');
  
  // State for points update modal
  const [isPointsModalOpen, setIsPointsModalOpen] = useState(false);
  const [newPoints, setNewPoints] = useState<string>('');


  const handleAddModelClick = () => {
    setSelectedModel(null);
    setIsModalOpen(true);
  };
  
  const handleEditModel = (model: Model) => {
    setSelectedModel(model);
    setIsModalOpen(true);
  };
  
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedModel(null);
  };

  // Memoized filtering logic
  const filteredModels = useMemo(() => {
    return models
      .filter(model => !gameSystemFilter || model.gameSystemId === gameSystemFilter)
      .filter(model => !armyFilter || model.armyId === armyFilter)
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
  
  const handleConfirmUpdatePoints = async (e: React.FormEvent) => {
    e.preventDefault();
    const points = parseInt(newPoints, 10);
    if (!isNaN(points) && points >= 0) {
      await bulkUpdateModels(selectedModelIds, { points });
      setIsPointsModalOpen(false);
      setNewPoints('');
      toggleBulkEditMode();
    } else {
      alert('Invalid point value. Please enter a non-negative number.');
    }
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
        <div className="flex gap-2">
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
                        <option value="unpainted">Unpainted</option>
                        <option value="wip">Work in Progress</option>
                        <option value="painted">Painted</option>
                    </select>
                    <button onClick={handleBulkUpdateStatus} className="px-3 py-1.5 text-sm bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors">Apply Status</button>
                  </div>
                  {/* Points update */}
                  <button onClick={() => setIsPointsModalOpen(true)} className="px-3 py-1.5 text-sm bg-yellow-600 text-white font-semibold rounded-lg hover:bg-yellow-700 transition-colors">Update Points</button>
                  {/* Delete */}
                  <button onClick={handleBulkDelete} className="px-3 py-1.5 text-sm bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors">Delete</button>
              </div>
          </div>
      )}

      {isPointsModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50">
          <div className="bg-surface rounded-lg shadow-xl p-6 w-full max-w-sm border border-border">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-white">Update Points</h3>
              <button onClick={() => { setIsPointsModalOpen(false); setNewPoints(''); }} className="text-gray-400 hover:text-white">
                <XIcon />
              </button>
            </div>
            <form onSubmit={handleConfirmUpdatePoints}>
              <p className="text-text-secondary mb-4">
                Set a new point value for the {selectedModelIds.length} selected models.
              </p>
              <div>
                <label htmlFor="points-bulk" className="block text-sm font-medium text-text-secondary mb-1">New Point Value</label>
                <input 
                  type="number" 
                  name="points" 
                  id="points-bulk" 
                  value={newPoints} 
                  onChange={(e) => setNewPoints(e.target.value)} 
                  required 
                  min="0"
                  className="w-full bg-background border border-border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                  autoFocus
                />
              </div>
              <div className="flex justify-end gap-4 pt-6">
                <button type="button" onClick={() => { setIsPointsModalOpen(false); setNewPoints(''); }} className="px-4 py-2 bg-gray-600 text-white font-semibold rounded-lg hover:bg-gray-700 transition-colors">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-primary text-white font-semibold rounded-lg hover:bg-indigo-500 transition-colors">Save</button>
              </div>
            </form>
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
    </div>
  );
};

export default CollectionPage;