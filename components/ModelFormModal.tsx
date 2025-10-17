
import React, { useState, useEffect, useCallback } from 'react';
import { useData } from '../context/DataContext';
import { Model, Army } from '../types';
import { generateDescription } from '../services/geminiService';
import { SparklesIcon } from './icons/Icons';

interface ModelFormModalProps {
  model?: Model;
  onClose: () => void;
}

const ModelFormModal: React.FC<ModelFormModalProps> = ({ model, onClose }) => {
  const { state, dispatch } = useData();
  const [formData, setFormData] = useState<Omit<Model, 'id'>>({
    name: '',
    armyId: '',
    gameSystemId: '',
    description: '',
    points: 0,
    quantity: 1,
    status: 'unpainted',
    imageUrl: '',
  });
  const [availableArmies, setAvailableArmies] = useState<Army[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    if (model) {
      setFormData(model);
    }
  }, [model]);
  
  useEffect(() => {
    if (formData.gameSystemId) {
      setAvailableArmies(state.armies.filter(a => a.gameSystemId === formData.gameSystemId));
      // Reset army if it's not in the new list of available armies
      if (!state.armies.some(a => a.gameSystemId === formData.gameSystemId && a.id === formData.armyId)) {
        setFormData(f => ({ ...f, armyId: ''}));
      }
    } else {
      setAvailableArmies([]);
      setFormData(f => ({...f, armyId: ''}));
    }
  }, [formData.gameSystemId, state.armies, formData.armyId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: name === 'points' || name === 'quantity' ? parseInt(value, 10) : value }));
  };

  const handleGenerateDescription = async () => {
      if (!formData.name || !formData.armyId || !formData.gameSystemId) {
          alert("Please fill in Name, Game System, and Army before generating a description.");
          return;
      }
      setIsGenerating(true);
      const armyName = state.armies.find(a => a.id === formData.armyId)?.name || '';
      const gameSystemName = state.gameSystems.find(gs => gs.id === formData.gameSystemId)?.name || '';
      const description = await generateDescription(formData.name, armyName, gameSystemName);
      setFormData(prev => ({...prev, description}));
      setIsGenerating(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (model) {
      dispatch({ type: 'UPDATE_MODEL', payload: { ...formData, id: model.id } });
    } else {
      dispatch({ type: 'ADD_MODEL', payload: { ...formData, id: new Date().toISOString() } });
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50">
      <div className="bg-surface rounded-lg shadow-xl p-6 w-full max-w-lg max-h-screen overflow-y-auto border border-border">
        <h2 className="text-2xl font-bold mb-4">{model ? 'Edit Model' : 'Add New Model'}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium">Game System</label>
              <select name="gameSystemId" value={formData.gameSystemId} onChange={handleChange} required className="mt-1 block w-full bg-background border border-border rounded-md p-2">
                <option value="">Select System</option>
                {state.gameSystems.map(gs => <option key={gs.id} value={gs.id}>{gs.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium">Army</label>
              <select name="armyId" value={formData.armyId} onChange={handleChange} required className="mt-1 block w-full bg-background border border-border rounded-md p-2" disabled={!formData.gameSystemId}>
                <option value="">Select Army</option>
                {availableArmies.map(army => <option key={army.id} value={army.id}>{army.name}</option>)}
              </select>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium">Model Name</label>
            <input type="text" name="name" value={formData.name} onChange={handleChange} required className="mt-1 block w-full bg-background border border-border rounded-md p-2"/>
          </div>

          <div>
            <label className="block text-sm font-medium">Description</label>
            <div className="relative">
              <textarea name="description" value={formData.description} onChange={handleChange} rows={4} className="mt-1 block w-full bg-background border border-border rounded-md p-2 pr-10"/>
              <button type="button" onClick={handleGenerateDescription} disabled={isGenerating} className="absolute top-2 right-2 p-1 bg-primary rounded-full text-white hover:bg-indigo-500 disabled:bg-gray-500">
                <SparklesIcon />
              </button>
            </div>
            {isGenerating && <p className="text-xs text-primary mt-1">Generating with AI...</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium">Quantity</label>
              <input type="number" name="quantity" value={formData.quantity} onChange={handleChange} required className="mt-1 block w-full bg-background border border-border rounded-md p-2"/>
            </div>
            <div>
              <label className="block text-sm font-medium">Points</label>
              <input type="number" name="points" value={formData.points} onChange={handleChange} required className="mt-1 block w-full bg-background border border-border rounded-md p-2"/>
            </div>
            <div>
              <label className="block text-sm font-medium">Status</label>
              <select name="status" value={formData.status} onChange={handleChange} required className="mt-1 block w-full bg-background border border-border rounded-md p-2">
                <option value="unpainted">Unpainted</option>
                <option value="wip">Work in Progress</option>
                <option value="painted">Painted</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium">Image URL</label>
            <input type="text" name="imageUrl" value={formData.imageUrl} onChange={handleChange} placeholder="https://..." className="mt-1 block w-full bg-background border border-border rounded-md p-2"/>
          </div>

          <div className="flex justify-end gap-4 pt-4">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700">Cancel</button>
            <button type="submit" className="px-4 py-2 bg-primary text-white rounded-md hover:bg-indigo-500">{model ? 'Update' : 'Save'}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ModelFormModal;
