/**
 * @file SettingsPage.tsx
 * @description This page allows users to manage core data such as game systems and armies.
 * This program was written by Stuart Mason October 2025.
 */

import React, { useState, useEffect } from 'react';
import { useData } from '../context/DataContext';
import { GameSystem, Army } from '../types';
import { PlusIcon, PencilIcon, TrashIcon, XIcon } from '../components/icons/Icons';

// A local modal component for editing a Game System.
// This keeps the logic self-contained within the SettingsPage.
const GameSystemEditModal: React.FC<{
    system: GameSystem;
    onClose: () => void;
    onSave: (id: string, updates: Partial<Omit<GameSystem, 'id'>>) => void;
}> = ({ system, onClose, onSave }) => {
    const [name, setName] = useState(system.name);
    const [colorScheme, setColorScheme] = useState(system.colorScheme || {
        primary: '#4f46e5',
        secondary: '#10b981',
        background: '#111827',
    });

    const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setColorScheme(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSave = () => {
        onSave(system.id, { name, colorScheme });
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50 p-4">
            <div className="bg-surface rounded-lg shadow-xl p-6 w-full max-w-md border border-border">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-white">Edit Game System</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-white"><XIcon /></button>
                </div>
                <div className="space-y-4">
                    <div>
                        <label htmlFor="edit-system-name" className="block text-sm font-medium text-text-secondary mb-1">System Name</label>
                        <input
                            id="edit-system-name"
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full bg-background border border-border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                    </div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">Color Scheme</label>
                    <div className="grid grid-cols-3 gap-4">
                         {Object.entries(colorScheme).map(([key, value]) => (
                            <div key={key}>
                                <label htmlFor={`color-${key}`} className="block text-xs font-medium text-text-secondary capitalize">{key}</label>
                                <input
                                    id={`color-${key}`}
                                    type="color"
                                    name={key}
                                    value={value}
                                    onChange={handleColorChange}
                                    className="w-full h-10 p-1 bg-background border border-border rounded-md cursor-pointer"
                                />
                            </div>
                        ))}
                    </div>
                </div>
                <div className="flex justify-end gap-4 mt-6">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-600 text-white font-semibold rounded-lg hover:bg-gray-700">Cancel</button>
                    <button onClick={handleSave} className="px-4 py-2 bg-primary text-white font-semibold rounded-lg hover:bg-indigo-500">Save Changes</button>
                </div>
            </div>
        </div>
    );
};


const SettingsPage: React.FC = () => {
    // Destructure all necessary data and functions from the global DataContext.
    const { 
        gameSystems, armies, 
        addGameSystem, updateGameSystem, deleteGameSystem,
        addArmy, updateArmy, deleteArmy,
        minStockThreshold, updateMinStockThreshold,
        clearAllData
    } = useData();

    // State for managing the "Add Game System" form input.
    const [newSystemName, setNewSystemName] = useState('');
    const [newSystemColorScheme, setNewSystemColorScheme] = useState({
        primary: '#4f46e5',
        secondary: '#10b981',
        background: '#1f2937',
    });
    // State for managing the "Add Army" form inputs.
    const [newArmyName, setNewArmyName] = useState('');
    const [newArmySystemId, setNewArmySystemId] = useState('');
    
    // State for managing the stock threshold input.
    const [localThreshold, setLocalThreshold] = useState(minStockThreshold);
    useEffect(() => {
        setLocalThreshold(minStockThreshold);
    }, [minStockThreshold]);

    // State for the edit modal
    const [editingSystem, setEditingSystem] = useState<GameSystem | null>(null);

    // --- Event Handlers for Game Systems ---

    const handleAddSystem = (e: React.FormEvent) => {
        e.preventDefault(); // Prevent the form from causing a page reload.
        if (newSystemName.trim()) {
            addGameSystem(newSystemName.trim(), newSystemColorScheme);
            setNewSystemName(''); // Clear the input field after submission.
            // Reset colors to default for the next entry
            setNewSystemColorScheme({ primary: '#4f46e5', secondary: '#10b981', background: '#1f2937' });
        }
    };
    
    const handleUpdateSystem = (id: string, updates: Partial<Omit<GameSystem, 'id'>>) => {
        updateGameSystem(id, updates);
    };
    
    const handleDeleteSystem = (system: GameSystem) => {
        // Use the browser's `confirm` to prevent accidental deletion of critical data.
        if (window.confirm(`Are you sure you want to delete "${system.name}"? This will also delete all associated armies and models.`)) {
            deleteGameSystem(system.id);
        }
    };
    
    // --- Event Handlers for Armies ---

    const handleAddArmy = (e: React.FormEvent) => {
        e.preventDefault();
        if (newArmyName.trim() && newArmySystemId) {
            addArmy(newArmyName.trim(), newArmySystemId);
            // Clear both input fields after submission.
            setNewArmyName('');
            setNewArmySystemId('');
        }
    };

    const handleUpdateArmy = (army: Army) => {
        const newName = prompt('Enter new name for the army:', army.name);
        if (newName && newName.trim() !== army.name) {
            updateArmy(army.id, newName.trim(), army.gameSystemId);
        }
    };

    const handleDeleteArmy = (army: Army) => {
        if (window.confirm(`Are you sure you want to delete "${army.name}"? This will also disassociate it from any models.`)) {
            deleteArmy(army.id);
        }
    };
    
    // --- Event Handler for Inventory Settings ---
    const handleThresholdSave = (e: React.FormEvent) => {
        e.preventDefault();
        updateMinStockThreshold(localThreshold);
    };

    // --- Event Handler for Data Management ---
    const handleClearData = () => {
        if (window.confirm('Are you absolutely sure you want to clear all data? This action is irreversible and will remove all game systems, armies, models, and paints.')) {
            clearAllData();
        }
    };

    return (
        <div className="container mx-auto">
            <h1 className="text-3xl font-bold text-white mb-6">Settings</h1>
            {/* The layout is a two-column grid on large screens, stacking on smaller screens. */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                
                {/* Game Systems Management Card */}
                <div className="bg-surface p-6 rounded-lg shadow-md border border-border">
                    <h2 className="text-2xl font-semibold text-white mb-4">Game Systems</h2>
                    <form onSubmit={handleAddSystem} className="space-y-3 mb-4">
                        <input
                            type="text"
                            value={newSystemName}
                            onChange={(e) => setNewSystemName(e.target.value)}
                            placeholder="New game system name"
                            className="w-full bg-background border border-border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                        <div className="grid grid-cols-3 gap-2 items-center">
                            {Object.entries(newSystemColorScheme).map(([key, value]) => (
                                <div key={key}>
                                    <label className="text-xs text-text-secondary capitalize">{key}</label>
                                    <input
                                        type="color"
                                        value={value}
                                        onChange={(e) => setNewSystemColorScheme(prev => ({...prev, [key]: e.target.value}))}
                                        className="w-full h-10 p-1 bg-background border border-border rounded-md cursor-pointer"
                                    />
                                </div>
                            ))}
                        </div>
                        <button type="submit" className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-primary text-white font-semibold rounded-lg shadow-md hover:opacity-80 transition-opacity">
                            <PlusIcon /> Add System
                        </button>
                    </form>
                    {/* List of existing game systems */}
                    <ul className="space-y-2 max-h-64 overflow-y-auto">
                        {gameSystems.map(system => (
                            <li key={system.id} className="flex justify-between items-center bg-background p-2 rounded-md">
                                <div className="flex items-center">
                                    <span 
                                        className="w-5 h-5 rounded-full mr-3 border border-border" 
                                        style={{ backgroundColor: system.colorScheme?.primary || '#4f46e5' }}
                                        title={`Primary: ${system.colorScheme?.primary}\nSecondary: ${system.colorScheme?.secondary}\nBackground: ${system.colorScheme?.background}`}
                                    ></span>
                                    <span>{system.name}</span>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => setEditingSystem(system)} className="text-blue-400 hover:text-blue-300"><PencilIcon /></button>
                                    <button onClick={() => handleDeleteSystem(system)} className="text-red-400 hover:text-red-300"><TrashIcon /></button>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Armies Management Card */}
                <div className="bg-surface p-6 rounded-lg shadow-md border border-border">
                    <h2 className="text-2xl font-semibold text-white mb-4">Armies</h2>
                    <form onSubmit={handleAddArmy} className="flex flex-col sm:flex-row gap-2 mb-4">
                        <input
                            type="text"
                            value={newArmyName}
                            onChange={(e) => setNewArmyName(e.target.value)}
                            placeholder="New army name"
                            className="flex-grow bg-background border border-border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                         <select
                            value={newArmySystemId}
                            onChange={(e) => setNewArmySystemId(e.target.value)}
                            required
                            className="bg-background border border-border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                        >
                            <option value="" disabled>Select System</option>
                            {/* The dropdown is populated with the list of available game systems. */}
                            {gameSystems.map(gs => <option key={gs.id} value={gs.id}>{gs.name}</option>)}
                        </select>
                        <button type="submit" className="p-2 bg-primary text-white rounded-md hover:bg-indigo-500 transition-colors"><PlusIcon /></button>
                    </form>
                    {/* List of existing armies */}
                    <ul className="space-y-2 max-h-64 overflow-y-auto">
                        {armies.map(army => (
                            <li key={army.id} className="flex justify-between items-center bg-background p-2 rounded-md">
                                <div>
                                    <p>{army.name}</p>
                                    {/* Display the associated game system name for context. */}
                                    <p className="text-xs text-gray-400">{gameSystems.find(gs => gs.id === army.gameSystemId)?.name}</p>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => handleUpdateArmy(army)} className="text-blue-400 hover:text-blue-300"><PencilIcon /></button>
                                    <button onClick={() => handleDeleteArmy(army)} className="text-red-400 hover:text-red-300"><TrashIcon /></button>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
                 {/* Inventory Settings Card */}
                <div className="bg-surface p-6 rounded-lg shadow-md border border-border">
                    <h2 className="text-2xl font-semibold text-white mb-4">Inventory Settings</h2>
                    <form onSubmit={handleThresholdSave} className="space-y-3 max-w-sm">
                        <div>
                            <label htmlFor="min-stock" className="block text-sm font-medium text-text-secondary mb-1">
                                Minimum Stock Threshold
                            </label>
                            <p className="text-xs text-text-secondary mb-2">
                                Get alerts when paint stock falls to this level or below.
                            </p>
                            <input
                                id="min-stock"
                                type="number"
                                min="0"
                                value={localThreshold}
                                onChange={(e) => setLocalThreshold(parseInt(e.target.value, 10) || 0)}
                                className="w-full bg-background border border-border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                            />
                        </div>
                        <button type="submit" className="w-full px-4 py-2 bg-primary text-white font-semibold rounded-lg shadow-md hover:opacity-80 transition-opacity">
                            Save Threshold
                        </button>
                    </form>
                </div>
                 {/* Data Management Card */}
                 <div className="bg-surface p-6 rounded-lg shadow-md border border-border">
                    <h2 className="text-2xl font-semibold text-white mb-4">Data Management</h2>
                    <div className="space-y-4 max-w-sm">
                        <div>
                            <label className="block text-sm font-medium text-text-secondary mb-1">Clear All Data</label>
                            <p className="text-xs text-text-secondary mb-2">
                                This will permanently delete all game systems, armies, models, and paints. This action cannot be undone.
                            </p>
                            <button 
                                onClick={handleClearData}
                                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white font-semibold rounded-lg shadow-md hover:bg-red-700 transition-colors"
                            >
                                <ExclamationTriangleIcon /> Clear All Application Data
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            {editingSystem && (
                <GameSystemEditModal 
                    system={editingSystem}
                    onClose={() => setEditingSystem(null)}
                    onSave={handleUpdateSystem}
                />
            )}
        </div>
    );
};

export default SettingsPage;