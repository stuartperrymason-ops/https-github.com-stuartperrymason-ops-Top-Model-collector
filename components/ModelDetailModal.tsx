/**
 * @file ModelDetailModal.tsx
 * @description A read-only modal to display the full details of a single model.
 * It also allows for quick image adding, changing, and removing.
 * This program was written by Stuart Mason October 2025.
 */

import React, { useRef } from 'react';
import { Model } from '../types';
import { useData } from '../context/DataContext';
import { XIcon, ImageIcon } from './icons/Icons';

// Define the props that this component accepts.
interface ModelDetailModalProps {
  isOpen: boolean; // Controls the visibility of the modal.
  onClose: () => void; // Callback function to close the modal.
  model: Model; // The model data to display.
}

const ModelDetailModal: React.FC<ModelDetailModalProps> = ({ isOpen, onClose, model }) => {
    // Access global data and functions from the context.
    const { gameSystems, armies, paints, updateModel, addToast } = useData();
    const fileInputRef = useRef<HTMLInputElement>(null);

    // If the modal is not supposed to be open, render nothing.
    if (!isOpen) return null;

    // Resolve IDs to names for display.
    const gameSystem = gameSystems.find(gs => gs.id === model.gameSystemId);
    const associatedArmies = armies.filter(a => model.armyIds.includes(a.id));
    const armyNames = associatedArmies.map(a => a.name).join(', ');

    // A utility function to determine the badge color based on status.
    const getStatusBadgeColor = (status: Model['status']) => {
        switch (status) {
          case 'Purchased': return 'bg-gray-500 text-white';
          case 'Printed': return 'bg-slate-500 text-white';
          case 'Assembled': return 'bg-cyan-600 text-white';
          case 'Primed': return 'bg-zinc-400 text-black';
          case 'Painted': return 'bg-yellow-500 text-black';
          case 'Based': return 'bg-amber-600 text-white';
          case 'Ready to Game': return 'bg-green-500 text-white';
          default: return 'bg-gray-200 text-gray-800';
        }
    };

    // Programmatically triggers the hidden file input.
    const handleImageContainerClick = () => {
        fileInputRef.current?.click();
    };

    // Handles the file selection, validation, and update call.
    const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            if (file.size > 2 * 1024 * 1024) { // 2MB limit
                addToast('File is too large. Please select an image under 2MB.', 'error');
                return;
            }
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64String = reader.result as string;
                updateModel(model.id, { imageUrl: base64String });
            };
            reader.readAsDataURL(file);
        }
        // Reset the file input so the user can re-upload the same file if needed.
        if (e.target) {
            e.target.value = '';
        }
    };

    // Handles the image removal.
    const handleRemoveImage = (e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent the modal from closing.
        if (window.confirm("Are you sure you want to remove this image?")) {
            updateModel(model.id, { imageUrl: '' });
        }
    };

    return (
        <div 
            className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50 p-4" 
            onClick={onClose}
            aria-modal="true"
            role="dialog"
        >
            <div 
                className="bg-surface rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col border border-border" 
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex justify-between items-center p-4 border-b border-border flex-shrink-0">
                    <h2 className="text-2xl font-bold text-white" id="model-detail-title">{model.name}</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white">
                        <XIcon />
                    </button>
                </div>
                <div className="p-6 overflow-y-auto space-y-6">
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileSelected}
                        className="hidden"
                        accept="image/png, image/jpeg, image/webp"
                    />
                    <div className="relative group rounded-lg bg-background cursor-pointer" onClick={handleImageContainerClick}>
                        {model.imageUrl ? (
                            <img src={model.imageUrl} alt={model.name} className="w-full h-auto max-h-96 object-contain rounded-lg" />
                        ) : (
                            <div className="w-full h-64 bg-gray-700 flex items-center justify-center rounded-lg border-2 border-dashed border-gray-500 hover:border-primary transition-colors">
                                <div className="text-center text-text-secondary">
                                    <div className="flex justify-center">
                                       <ImageIcon />
                                    </div>
                                    <span className="mt-2 block font-medium">Click to add an image</span>
                                </div>
                            </div>
                        )}
                        
                        {model.imageUrl && (
                            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-60 transition-all duration-300 flex items-center justify-center gap-4 rounded-lg">
                                <button 
                                    onClick={(e) => { e.stopPropagation(); handleImageContainerClick(); }}
                                    className="opacity-0 group-hover:opacity-100 transition-opacity px-4 py-2 bg-white/90 text-black font-semibold rounded-lg hover:bg-white"
                                >
                                    Change Image
                                </button>
                                <button 
                                    onClick={handleRemoveImage}
                                    className="opacity-0 group-hover:opacity-100 transition-opacity px-4 py-2 bg-red-600/90 text-white font-semibold rounded-lg hover:bg-red-600"
                                >
                                    Remove
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center md:text-left">
                        <div>
                            <p className="text-sm font-bold text-text-secondary uppercase tracking-wider">Game System</p>
                            <p className="text-lg">{gameSystem?.name || 'Unknown'}</p>
                        </div>
                        <div className="md:col-span-2">
                             <p className="text-sm font-bold text-text-secondary uppercase tracking-wider">Armies</p>
                            <p className="text-lg">{armyNames || 'N/A'}</p>
                        </div>
                        <div>
                            <p className="text-sm font-bold text-text-secondary uppercase tracking-wider">Quantity</p>
                            <p className="text-2xl font-bold">{model.quantity}x</p>
                        </div>
                        <div className="md:col-span-2">
                            <p className="text-sm font-bold text-text-secondary uppercase tracking-wider">Status</p>
                            <span className={`inline-block mt-1 px-3 py-1 text-sm font-semibold rounded-full ${getStatusBadgeColor(model.status)}`}>
                                {model.status}
                            </span>
                        </div>
                    </div>
                    <div>
                        <p className="text-sm font-bold text-text-secondary uppercase tracking-wider mb-2">Description</p>
                        <p className="text-text-primary whitespace-pre-wrap leading-relaxed bg-background p-4 rounded-md">
                            {model.description || 'No description provided.'}
                        </p>
                    </div>

                    {model.paintRecipe && model.paintRecipe.length > 0 && (
                        <div>
                            <p className="text-sm font-bold text-text-secondary uppercase tracking-wider mb-2">Paint Recipe</p>
                            <div className="bg-background p-4 rounded-md space-y-3">
                                {model.paintRecipe.map((step, index) => {
                                    const paint = paints.find(p => p.id === step.paintId);
                                    return (
                                        <div key={index} className="flex items-center gap-4 border-b border-border last:border-b-0 pb-2">
                                            <div 
                                                className="w-8 h-8 rounded-full border-2 border-surface flex-shrink-0"
                                                style={{ backgroundColor: paint?.rgbCode || '#888' }}
                                                title={paint?.rgbCode}
                                            ></div>
                                            <div className="flex-grow">
                                                <p className="font-semibold text-text-primary">{paint?.name || 'Unknown Paint'}</p>
                                                <p className="text-xs text-text-secondary">{paint?.manufacturer}</p>
                                            </div>
                                            <p className="text-sm text-text-secondary text-right flex-shrink-0">{step.usage}</p>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    )}

                    {model.paintingNotes && (
                         <div>
                            <p className="text-sm font-bold text-text-secondary uppercase tracking-wider mb-2">Painting Notes</p>
                            <p className="text-text-primary whitespace-pre-wrap leading-relaxed bg-background p-4 rounded-md">
                                {model.paintingNotes}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ModelDetailModal;