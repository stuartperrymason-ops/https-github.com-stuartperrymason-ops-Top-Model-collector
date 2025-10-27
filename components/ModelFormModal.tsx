/**
 * @file ModelFormModal.tsx
 * @description A modal dialog with a form for creating or editing a model.
 * It uses the DataContext for data operations and populating dropdowns, and integrates
 * with the Gemini service to generate model descriptions.
 * This program was written by Stuart Mason October 2025.
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Model, PaintRecipeStep, Paint } from '../types';
import { useData, useForm } from '../context/DataContext';
import { generateDescription } from '../services/geminiService';
import { SparklesIcon, XIcon, PlusIcon, TrashIcon } from './icons/Icons';

// Define the props that this component accepts.
interface ModelFormModalProps {
  isOpen: boolean; // Controls the visibility of the modal.
  onClose: () => void; // Callback function to close the modal.
  model: Model | null; // Pass a model object for editing, or null for creating a new model.
}

const ModelFormModal: React.FC<ModelFormModalProps> = ({ isOpen, onClose, model }) => {
  // Access global data and functions from the DataContext.
  const { gameSystems, armies, models, paints, addModel, updateModel } = useData();
  
  // State to track if the AI description is currently being generated.
  const [isGenerating, setIsGenerating] = useState(false);
  // State to hold the base64 string for the image preview.
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Define the initial state for the form.
  const initialState: Omit<Model, 'id' | 'createdAt' | 'lastUpdated'> = {
    name: '',
    armyIds: [],
    gameSystemId: '',
    description: '',
    quantity: 1,
    status: 'Purchased',
    imageUrl: '',
    paintingNotes: '',
    paintRecipe: [],
  };

  // The submission callback function for the useForm hook.
  const handleFormSubmit = async (formData: Omit<Model, 'id' | 'createdAt' | 'lastUpdated'>) => {
    // Validation: ensure at least one army is selected.
    if (formData.armyIds.length === 0) {
      alert("Please select at least one army for the model.");
      return; // Stop submission
    }
    
    // Check for duplicate models when creating a new one.
    if (!model) {
      const isDuplicate = models.some(
        m => m.name.trim().toLowerCase() === formData.name.trim().toLowerCase() && 
             m.armyIds.some(id => formData.armyIds.includes(id))
      );
      if (isDuplicate) {
        if (!window.confirm(`A model named "${formData.name.trim()}" already exists in one of the selected armies. Do you want to add it anyway?`)) {
          return; // Stop submission if user cancels.
        }
      }
    }
    
    // Call the appropriate context function.
    if (model) {
      await updateModel(model.id, formData);
    } else {
      await addModel(formData);
    }
    onClose(); // Close the modal on successful submission.
  };

  // Initialize the useForm hook.
  const {
    values: formData,
    setValues: setFormData,
    setFormValue,
    handleSubmit,
    isSubmitting,
  } = useForm(initialState, handleFormSubmit);

  // This effect populates the form when the modal is opened for editing, or resets it for adding.
  useEffect(() => {
    if (model) {
      const { id, createdAt, lastUpdated, ...modelData } = model;
      setFormData({ 
        ...initialState, 
        ...modelData, 
        armyIds: model.armyIds || [], 
        paintingNotes: model.paintingNotes || '',
        paintRecipe: model.paintRecipe || []
      });
      setImagePreview(model.imageUrl || null);
    } else {
      setFormData(initialState);
      setImagePreview(null);
    }
  }, [model, isOpen, setFormData]);

  // FIX: Implement a custom change handler to properly manage state when the game system is changed.
  // This prevents the user's army selections from being cleared on initial form load for an existing model.
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const processedValue = (e.target as HTMLInputElement).type === 'number' ? parseInt(value, 10) || 0 : value;

    if (name === 'gameSystemId') {
      // When the user manually changes the game system, also clear the selected armies.
      // This prevents having armies selected that don't belong to the new system.
      setFormData(prev => ({ ...prev, [name]: value, armyIds: [] }));
    } else {
      setFormData(prev => ({ ...prev, [name]: processedValue }));
    }
  };

  const availableArmies = useMemo(() => {
    if (!formData.gameSystemId) return [];
    return armies.filter(army => army.gameSystemId === formData.gameSystemId);
  }, [armies, formData.gameSystemId]);
  
  // This problematic effect was removed. Its logic is now correctly handled in the custom `handleChange` function.
  /*
  useEffect(() => {
    if (formData.gameSystemId) {
        setFormValue('armyIds', []);
    }
  }, [formData.gameSystemId, setFormValue]);
  */

  // Handler for the army checkboxes, using setFormValue from the hook.
  const handleArmyChange = (armyId: string) => {
    const newArmyIds = formData.armyIds.includes(armyId)
        ? formData.armyIds.filter(id => id !== armyId)
        : [...formData.armyIds, armyId];
    setFormValue('armyIds', newArmyIds);
  };

  // Handler for the image file input, using setFormValue.
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 2 * 1024 * 1024) {
        alert('File is too large. Please select an image under 2MB.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setFormValue('imageUrl', base64String);
        setImagePreview(base64String);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setFormValue('imageUrl', '');
    setImagePreview(null);
    const fileInput = document.getElementById('imageUpload') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  };

  const handleGenerateDescription = async () => {
    if (!formData.name || formData.armyIds.length === 0 || !formData.gameSystemId) {
        alert("Please select a Game System, at least one Army, and enter a Model Name first.");
        return;
    }
    setIsGenerating(true);
    try {
        const armyName = armies.find(a => a.id === formData.armyIds[0])?.name || '';
        const gameSystemName = gameSystems.find(gs => gs.id === formData.gameSystemId)?.name || '';
        const desc = await generateDescription(formData.name, armyName, gameSystemName);
        setFormValue('description', desc);
    } catch (error) {
        console.error("Failed to generate description:", error);
        alert("There was an error generating the description.");
    } finally {
        setIsGenerating(false);
    }
  };

  // --- Paint Recipe Handlers ---
  const groupedPaints = useMemo(() => {
    // FIX: The original `reduce` had a typing issue where the accumulator `acc` was not correctly
    // inferred. By explicitly providing the generic type to `reduce`, we ensure
    // TypeScript correctly types the accumulator, preventing `paintsList` from being `unknown` later on.
    return paints.reduce<Record<string, Paint[]>>((acc, paint) => {
        (acc[paint.manufacturer] = acc[paint.manufacturer] || []).push(paint);
        return acc;
    }, {});
  }, [paints]);

  const handleRecipeChange = (index: number, field: keyof PaintRecipeStep, value: string) => {
    const updatedRecipe = [...(formData.paintRecipe || [])];
    updatedRecipe[index] = { ...updatedRecipe[index], [field]: value };
    setFormValue('paintRecipe', updatedRecipe);
  };
  
  const addRecipeStep = () => {
    const newStep: PaintRecipeStep = { paintId: '', usage: '' };
    setFormValue('paintRecipe', [...(formData.paintRecipe || []), newStep]);
  };
  
  const removeRecipeStep = (index: number) => {
    const updatedRecipe = (formData.paintRecipe || []).filter((_, i) => i !== index);
    setFormValue('paintRecipe', updatedRecipe);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50">
      <div className="bg-surface rounded-lg shadow-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto border border-border">
        <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-white">{model ? 'Edit Model' : 'Add New Model'}</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-white">
              <XIcon />
            </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-text-secondary mb-1">Model Name</label>
            <input type="text" name="name" id="name" value={formData.name} onChange={handleChange} required className="w-full bg-background border border-border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="gameSystemId" className="block text-sm font-medium text-text-secondary mb-1">Game System</label>
              <select name="gameSystemId" id="gameSystemId" value={formData.gameSystemId} onChange={handleChange} required className="w-full bg-background border border-border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary">
                <option value="" disabled>Select a system</option>
                {gameSystems.map(gs => <option key={gs.id} value={gs.id}>{gs.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">Armies</label>
              <div className="bg-background border border-border rounded-md p-3 h-24 overflow-y-auto space-y-2">
                {availableArmies.length > 0 ? availableArmies.map(army => (
                  <div key={army.id} className="flex items-center">
                    <input
                      type="checkbox"
                      id={`army-${army.id}`}
                      checked={formData.armyIds.includes(army.id)}
                      onChange={() => handleArmyChange(army.id)}
                      className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <label htmlFor={`army-${army.id}`} className="ml-2 text-sm text-text-primary">
                      {army.name}
                    </label>
                  </div>
                )) : (
                  <p className="text-sm text-text-secondary">
                    {formData.gameSystemId ? 'No armies for this system.' : 'Select a game system.'}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-text-secondary mb-1">Description</label>
            <div className="relative">
                <textarea name="description" id="description" value={formData.description} onChange={handleChange} rows={4} className="w-full bg-background border border-border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary pr-10"></textarea>
                <button
                    type="button"
                    onClick={handleGenerateDescription}
                    disabled={isGenerating || isSubmitting}
                    className="absolute top-2 right-2 p-1 bg-primary text-white rounded-full hover:bg-indigo-500 disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors"
                    title="Generate description with AI"
                >
                    {isGenerating ? <div className="w-5 h-5 border-2 border-t-transparent border-white rounded-full animate-spin"></div> : <SparklesIcon />}
                </button>
            </div>
          </div>
          
          <div>
            <label htmlFor="paintingNotes" className="block text-sm font-medium text-text-secondary mb-1">Painting Notes</label>
            <textarea name="paintingNotes" id="paintingNotes" value={formData.paintingNotes} onChange={handleChange} rows={3} placeholder="e.g., General notes, techniques used..." className="w-full bg-background border border-border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"></textarea>
          </div>

          {/* Paint Recipe Section */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">Paint Recipe</label>
            <div className="space-y-3 bg-background p-3 rounded-md border border-border">
              {(formData.paintRecipe || []).map((step, index) => (
                <div key={index} className="flex items-center gap-2">
                  <select 
                    value={step.paintId}
                    onChange={(e) => handleRecipeChange(index, 'paintId', e.target.value)}
                    className="flex-grow bg-gray-800 border border-border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="" disabled>Select a paint</option>
                    {Object.entries(groupedPaints).map(([manufacturer, paintsList]) => (
                      <optgroup key={manufacturer} label={manufacturer}>
                        {paintsList.map(paint => <option key={paint.id} value={paint.id}>{paint.name}</option>)}
                      </optgroup>
                    ))}
                  </select>
                  <input
                    type="text"
                    value={step.usage}
                    onChange={(e) => handleRecipeChange(index, 'usage', e.target.value)}
                    placeholder="Usage (e.g., Armor Base)"
                    className="flex-grow bg-gray-800 border border-border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <button type="button" onClick={() => removeRecipeStep(index)} className="p-2 text-red-400 hover:text-red-300"><TrashIcon /></button>
                </div>
              ))}
              <button type="button" onClick={addRecipeStep} className="w-full flex items-center justify-center gap-2 text-sm px-4 py-2 mt-2 bg-gray-600 hover:bg-gray-700 text-white font-semibold rounded-lg transition-colors">
                <PlusIcon /> Add Recipe Step
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="quantity" className="block text-sm font-medium text-text-secondary mb-1">Quantity</label>
              <input type="number" name="quantity" id="quantity" value={formData.quantity} onChange={handleChange} required min="1" className="w-full bg-background border border-border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary" />
            </div>
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-text-secondary mb-1">Painting Status</label>
              <select name="status" id="status" value={formData.status} onChange={handleChange} required className="w-full bg-background border border-border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary">
                <option value="Purchased">Purchased</option>
                <option value="Printed">Printed</option>
                <option value="Assembled">Assembled</option>
                <option value="Primed">Primed</option>
                <option value="Painted">Painted</option>
                <option value="Based">Based</option>
                <option value="Ready to Game">Ready to Game</option>
              </select>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Model Image</label>
            <div className="mt-1 flex items-center gap-4 p-3 bg-background border border-border rounded-md">
              {imagePreview ? (
                <img src={imagePreview} alt="Model Preview" className="w-20 h-20 object-cover rounded-md bg-background" />
              ) : (
                <div className="w-20 h-20 bg-gray-700 rounded-md flex items-center justify-center text-text-secondary text-xs text-center p-2">
                  No Image
                </div>
              )}
              <div className="flex-grow">
                <label htmlFor="imageUpload" className="cursor-pointer bg-primary text-white font-semibold text-sm py-2 px-4 rounded-lg hover:bg-indigo-500 transition-colors">
                  Choose Image
                </label>
                <input 
                  id="imageUpload"
                  name="imageUpload"
                  type="file" 
                  accept="image/png, image/jpeg, image/webp" 
                  onChange={handleImageChange}
                  className="hidden"
                />
                {imagePreview && (
                  <button type="button" onClick={removeImage} className="ml-3 text-sm text-red-400 hover:text-red-300">
                    Remove
                  </button>
                )}
                <p className="text-xs text-text-secondary mt-2">Max file size: 2MB</p>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-4 pt-4">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-600 text-white font-semibold rounded-lg hover:bg-gray-700 transition-colors">Cancel</button>
            <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-primary text-white font-semibold rounded-lg hover:bg-indigo-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">{isSubmitting ? 'Saving...' : (model ? 'Save Changes' : 'Add Model')}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ModelFormModal;