/**
 * @file ModelFormModal.tsx
 * @description A modal dialog with a form for creating or editing a model.
 * It uses the DataContext for data operations and populating dropdowns, and integrates
 * with the Gemini service to generate model descriptions.
 * This program was written by Stuart Mason October 2025.
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Model } from '../types';
import { useData } from '../context/DataContext';
import { generateDescription } from '../services/geminiService';
import { SparklesIcon, XIcon } from './icons/Icons';

// Define the props that this component accepts.
interface ModelFormModalProps {
  isOpen: boolean; // Controls the visibility of the modal.
  onClose: () => void; // Callback function to close the modal.
  model: Model | null; // Pass a model object for editing, or null for creating a new model.
}

const ModelFormModal: React.FC<ModelFormModalProps> = ({ isOpen, onClose, model }) => {
  // Access global data and functions from the DataContext.
  const { gameSystems, armies, models, addModel, updateModel } = useData();
  
  // State to hold the form data. Omit is used because the excluded fields are not part of the form.
  const [formData, setFormData] = useState<Omit<Model, 'id' | 'createdAt' | 'lastUpdated'>>({
    name: '',
    armyIds: [],
    gameSystemId: '',
    description: '',
    quantity: 1,
    status: 'Purchased',
    imageUrl: '',
    paintingNotes: '',
  });
  
  // State to track if the AI description is currently being generated.
  const [isGenerating, setIsGenerating] = useState(false);
  // State to hold the base64 string for the image preview.
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // The useEffect hook runs when the `model` or `isOpen` prop changes.
  useEffect(() => {
    if (model) {
      // If a model is passed, it means we are in "edit" mode.
      // Destructure to separate non-form fields from the model data.
      const { id, createdAt, lastUpdated, ...modelData } = model;
      // Populate the form with the existing model's data, ensuring optional fields have defaults.
      setFormData({ ...modelData, armyIds: model.armyIds || [], paintingNotes: model.paintingNotes || '' });
      setImagePreview(model.imageUrl || null);
    } else {
      // If no model is passed, we are in "add" mode.
      // Reset the form to its default empty state.
      setFormData({
        name: '',
        armyIds: [],
        gameSystemId: '',
        description: '',
        quantity: 1,
        status: 'Purchased',
        imageUrl: '',
        paintingNotes: '',
      });
      setImagePreview(null);
    }
  }, [model, isOpen]); // Rerun this effect if the model prop changes or the modal is reopened.

  // Memoize the calculation of available armies. This list is filtered based on the selected
  // game system and only recalculates when `armies` or `formData.gameSystemId` changes.
  const availableArmies = useMemo(() => {
    if (!formData.gameSystemId) return [];
    return armies.filter(army => army.gameSystemId === formData.gameSystemId);
  }, [armies, formData.gameSystemId]);
  
  // This effect ensures that if the user changes the game system, the selected armies are cleared.
  // This prevents a model from being accidentally assigned to an army from a different game system.
  useEffect(() => {
    if (formData.gameSystemId) {
        setFormData(prev => ({ ...prev, armyIds: [] }));
    }
  }, [formData.gameSystemId]);

  // A generic change handler for most form inputs (text, textarea, select).
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    // Update the corresponding field in the formData state.
    // For 'quantity', ensure the value is parsed as an integer.
    setFormData(prev => ({ ...prev, [name]: name === 'quantity' ? parseInt(value, 10) || 0 : value }));
  };

  // A specific handler for the army checkboxes, as it manages an array of IDs.
  const handleArmyChange = (armyId: string) => {
    setFormData(prev => {
        // Toggle the presence of the armyId in the array.
        const newArmyIds = prev.armyIds.includes(armyId)
            ? prev.armyIds.filter(id => id !== armyId)
            : [...prev.armyIds, armyId];
        return { ...prev, armyIds: newArmyIds };
    });
  };

  // Handler for the image file input.
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      // Basic validation for file size to prevent large uploads.
      if (file.size > 2 * 1024 * 1024) { // 2MB limit
        alert('File is too large. Please select an image under 2MB.');
        return;
      }
      // Use FileReader to convert the image to a base64 string for storage and preview.
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setFormData(prev => ({ ...prev, imageUrl: base64String }));
        setImagePreview(base64String);
      };
      reader.readAsDataURL(file);
    }
  };

  // Function to remove the selected image.
  const removeImage = () => {
    setFormData(prev => ({ ...prev, imageUrl: '' }));
    setImagePreview(null);
    // Also reset the file input element itself.
    const fileInput = document.getElementById('imageUpload') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  };

  // Async handler to call the Gemini service for AI-powered description generation.
  const handleGenerateDescription = async () => {
    // Ensure required fields are filled out first to provide context to the AI.
    if (!formData.name || formData.armyIds.length === 0 || !formData.gameSystemId) {
        alert("Please select a Game System, at least one Army, and enter a Model Name first.");
        return;
    }
    setIsGenerating(true); // Set loading state for the button.
    try {
        // Resolve IDs to names to create a meaningful prompt.
        const armyName = armies.find(a => a.id === formData.armyIds[0])?.name || '';
        const gameSystemName = gameSystems.find(gs => gs.id === formData.gameSystemId)?.name || '';
        const desc = await generateDescription(formData.name, armyName, gameSystemName);
        // Update the form state with the generated description.
        setFormData(prev => ({ ...prev, description: desc }));
    } catch (error) {
        console.error("Failed to generate description:", error);
        alert("There was an error generating the description.");
    } finally {
        setIsGenerating(false); // Reset loading state.
    }
  };

  // Handler for the final form submission.
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); // Prevent default form submission behavior.

    // Validation: ensure at least one army is selected.
    if (formData.armyIds.length === 0) {
        alert("Please select at least one army for the model.");
        return;
    }
    
    // Check for duplicate models when creating a new one.
    if (!model) { // This check only runs in "add" mode.
      const isDuplicate = models.some(
        m => m.name.trim().toLowerCase() === formData.name.trim().toLowerCase() && 
             m.armyIds.some(id => formData.armyIds.includes(id))
      );

      if (isDuplicate) {
        // Ask the user for confirmation if a potential duplicate is found.
        if (!window.confirm(`A model named "${formData.name.trim()}" already exists in one of the selected armies. Do you want to add it anyway?`)) {
          return; // Stop submission if user cancels.
        }
      }
    }
    
    // Call the appropriate function from the context based on whether we are editing or adding.
    if (model) {
      await updateModel(model.id, formData);
    } else {
      await addModel(formData);
    }
    onClose(); // Close the modal on successful submission.
  };

  // If the modal is not open, render nothing.
  if (!isOpen) return null;

  return (
    // The modal container with a semi-transparent background overlay.
    <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50">
      <div className="bg-surface rounded-lg shadow-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto border border-border">
        <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-white">{model ? 'Edit Model' : 'Add New Model'}</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-white">
              <XIcon />
            </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Form fields */}
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
                {/* Render checkboxes for the armies available for the selected game system. */}
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
                {/* AI generation button, positioned absolutely within the textarea container. */}
                <button
                    type="button"
                    onClick={handleGenerateDescription}
                    disabled={isGenerating}
                    className="absolute top-2 right-2 p-1 bg-primary text-white rounded-full hover:bg-indigo-500 disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors"
                    title="Generate description with AI"
                >
                    {isGenerating ? <div className="w-5 h-5 border-2 border-t-transparent border-white rounded-full animate-spin"></div> : <SparklesIcon />}
                </button>
            </div>
          </div>
          
          <div>
            <label htmlFor="paintingNotes" className="block text-sm font-medium text-text-secondary mb-1">Painting Notes</label>
            <textarea name="paintingNotes" id="paintingNotes" value={formData.paintingNotes} onChange={handleChange} rows={3} placeholder="e.g., Base: Macragge Blue, Shade: Nuln Oil..." className="w-full bg-background border border-border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"></textarea>
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
              {/* Show the image preview or a placeholder. */}
              {imagePreview ? (
                <img src={imagePreview} alt="Model Preview" className="w-20 h-20 object-cover rounded-md bg-background" />
              ) : (
                <div className="w-20 h-20 bg-gray-700 rounded-md flex items-center justify-center text-text-secondary text-xs text-center p-2">
                  No Image
                </div>
              )}
              <div className="flex-grow">
                {/* The label acts as the button to trigger the hidden file input. */}
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
            <button type="submit" className="px-4 py-2 bg-primary text-white font-semibold rounded-lg hover:bg-indigo-500 transition-colors">{model ? 'Save Changes' : 'Add Model'}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ModelFormModal;