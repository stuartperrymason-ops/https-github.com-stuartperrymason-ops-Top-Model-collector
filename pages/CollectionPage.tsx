
import React, { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { Model } from '../types';
import ModelCard from '../components/ModelCard';
import ModelFormModal from '../components/ModelFormModal';
import { PlusIcon } from '../components/icons/Icons';

const CollectionPage: React.FC = () => {
  const { state } = useData();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingModel, setEditingModel] = useState<Model | undefined>(undefined);
  const [filterGameSystem, setFilterGameSystem] = useState<string>('all');
  const [filterArmy, setFilterArmy] = useState<string>('all');

  const handleOpenModal = (model?: Model) => {
    setEditingModel(model);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingModel(undefined);
  };
  
  const filteredArmies = useMemo(() => {
    if (filterGameSystem === 'all') {
      return state.armies;
    }
    return state.armies.filter(army => army.gameSystemId === filterGameSystem);
  }, [filterGameSystem, state.armies]);

  const filteredModels = useMemo(() => {
    return state.models.filter(model => {
      const gameSystemMatch = filterGameSystem === 'all' || model.gameSystemId === filterGameSystem;
      const armyMatch = filterArmy === 'all' || model.armyId === filterArmy;
      return gameSystemMatch && armyMatch;
    });
  }, [state.models, filterGameSystem, filterArmy]);

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

      <div className="bg-surface p-4 rounded-lg border border-border flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <label htmlFor="gameSystemFilter" className="block text-sm font-medium text-text-secondary mb-1">Filter by Game System</label>
          <select
            id="gameSystemFilter"
            value={filterGameSystem}
            onChange={(e) => {
                setFilterGameSystem(e.target.value);
                setFilterArmy('all');
            }}
            className="w-full bg-background border border-border rounded-md p-2 focus:ring-primary focus:border-primary"
          >
            <option value="all">All Game Systems</option>
            {state.gameSystems.map(gs => <option key={gs.id} value={gs.id}>{gs.name}</option>)}
          </select>
        </div>
        <div className="flex-1">
          <label htmlFor="armyFilter" className="block text-sm font-medium text-text-secondary mb-1">Filter by Army</label>
          <select
            id="armyFilter"
            value={filterArmy}
            onChange={(e) => setFilterArmy(e.target.value)}
            className="w-full bg-background border border-border rounded-md p-2 focus:ring-primary focus:border-primary"
            disabled={filterGameSystem === 'all' && state.armies.length > 0}
          >
            <option value="all">All Armies</option>
            {filteredArmies.map(army => <option key={army.id} value={army.id}>{army.name}</option>)}
          </select>
        </div>
      </div>

      {filteredModels.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredModels.map(model => (
            <ModelCard key={model.id} model={model} onEdit={handleOpenModal} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-surface rounded-lg border border-dashed border-border">
          <h2 className="text-xl font-semibold">No models found.</h2>
          <p className="text-text-secondary mt-2">Try adjusting your filters or add a new model to your collection!</p>
        </div>
      )}

      {isModalOpen && <ModelFormModal model={editingModel} onClose={handleCloseModal} />}
    </div>
  );
};

export default CollectionPage;
