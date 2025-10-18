/**
 * @file CollectionPage.tsx
 * @description This page displays the user's collection of miniatures.
 * It includes filtering options and allows users to add, edit, or delete models.
 */

import React, { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import ModelCard from '../components/ModelCard';
import ModelFormModal from '../components/ModelFormModal';
import { PlusIcon } from '../components/icons/Icons';
import { Model } from '../types';

const CollectionPage: React.FC = () => {
  const { models, gameSystems, armies, loading, error } = useData();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedModel, setSelectedModel] = useState<Model | null>(null);

  // State for filters
  const [gameSystemFilter, setGameSystemFilter] = useState<string>('');
  const [armyFilter, setArmyFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

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


  if (loading) {
    return <div className="flex justify-center items-center h-full"><p>Loading your collection...</p></div>;
  }

  if (error) {
    return <div className="flex justify-center items-center h-full"><p className="text-red-500">{error}</p></div>;
  }

  return (
    <div className="container mx-auto">
      <header className="mb-6 flex flex-col sm:flex-row justify-between items-center gap-4">
        <h1 className="text-3xl font-bold text-white">My Collection</h1>
        <button
          onClick={handleAddModelClick}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white font-semibold rounded-lg shadow-md hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-400 focus:ring-offset-background transition duration-300"
        >
          <PlusIcon />
          Add Model
        </button>
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
            <ModelCard key={model.id} model={model} onEdit={handleEditModel} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <p className="text-xl text-text-secondary">Your collection is empty.</p>
          <p className="text-text-secondary">Click "Add Model" to get started!</p>
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
