/**
 * @file ModelDetailModal.tsx
 * @description A read-only modal to display the full details of a single model.
 */

import React from 'react';
import { Model } from '../types';
import { useData } from '../context/DataContext';
import { XIcon } from './icons/Icons';

interface ModelDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  model: Model;
}

const ModelDetailModal: React.FC<ModelDetailModalProps> = ({ isOpen, onClose, model }) => {
    const { gameSystems, armies } = useData();

    if (!isOpen) return null;

    const gameSystem = gameSystems.find(gs => gs.id === model.gameSystemId);
    const associatedArmies = armies.filter(a => model.armyIds.includes(a.id));
    const armyNames = associatedArmies.map(a => a.name).join(', ');

    const getStatusBadgeColor = (status: Model['status']) => {
        switch (status) {
          case 'Purchased':
            return 'bg-gray-500 text-white';
          case 'Printed':
            return 'bg-slate-500 text-white';
          case 'Assembled':
            return 'bg-cyan-600 text-white';
          case 'Primed':
            return 'bg-zinc-400 text-black';
          case 'Painted':
            return 'bg-yellow-500 text-black';
          case 'Based':
            return 'bg-amber-600 text-white';
          case 'Ready to Game':
            return 'bg-green-500 text-white';
          default:
            return 'bg-gray-200 text-gray-800';
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
                    {model.imageUrl ? (
                        <img src={model.imageUrl} alt={model.name} className="w-full h-auto max-h-96 object-contain rounded-lg bg-background" />
                    ) : (
                        <div className="w-full h-64 bg-gray-700 flex items-center justify-center rounded-lg">
                            <span className="text-text-secondary">No Image</span>
                        </div>
                    )}
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