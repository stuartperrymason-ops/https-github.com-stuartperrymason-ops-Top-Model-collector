/**
 * @file SettingsPage.tsx
 * @description This page allows users to manage core data such as game systems and armies.
 * This program was written by Stuart Mason October 2025.
 */

import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { GameSystem, Army } from '../types';
import { PlusIcon, PencilIcon, TrashIcon } from '../components/icons/Icons';

const SettingsPage: React.FC = () => {
    // Destructure all necessary data and functions from the global DataContext.
    const { 
        gameSystems, armies, 
        addGameSystem, updateGameSystem, deleteGameSystem,
        addArmy, updateArmy, deleteArmy 
    } = useData();

    // State for managing the "Add Game System" form input.
    const [newSystemName, setNewSystemName] = useState('');
    // State for managing the "Add Army" form inputs.
    const [newArmyName, setNewArmyName] = useState('');
    const [newArmySystemId, setNewArmySystemId] = useState('');

    // --- Event Handlers for Game Systems ---

    const handleAddSystem = (e: React.FormEvent) => {
        e.preventDefault(); // Prevent the form from causing a page reload.
        if (newSystemName.trim()) {
            addGameSystem(newSystemName.trim());
            setNewSystemName(''); // Clear the input field after submission.
        }
    };
    
    const handleUpdateSystem = (system: GameSystem) => {
        // Use the browser's `prompt` for a simple inline edit UI.
        const newName = prompt('Enter new name for the game system:', system.name);
        // Only call the update function if the user provided a new, different name.
        if (newName && newName.trim() !== system.name) {
            updateGameSystem(system.id, newName.trim());
        }
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


    return (
        <div className="container mx-auto">
            <h1 className="text-3xl font-bold text-white mb-6">Settings</h1>
            {/* The layout is a two-column grid on large screens, stacking on smaller screens. */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                
                {/* Game Systems Management Card */}
                <div className="bg-surface p-6 rounded-lg shadow-md border border-border">
                    <h2 className="text-2xl font-semibold text-white mb-4">Game Systems</h2>
                    <form onSubmit={handleAddSystem} className="flex gap-2 mb-4">
                        <input
                            type="text"
                            value={newSystemName}
                            onChange={(e) => setNewSystemName(e.target.value)}
                            placeholder="New game system name"
                            className="flex-grow bg-background border border-border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                        <button type="submit" className="p-2 bg-primary text-white rounded-md hover:bg-indigo-500 transition-colors"><PlusIcon /></button>
                    </form>
                    {/* List of existing game systems */}
                    <ul className="space-y-2 max-h-64 overflow-y-auto">
                        {gameSystems.map(system => (
                            <li key={system.id} className="flex justify-between items-center bg-background p-2 rounded-md">
                                <span>{system.name}</span>
                                <div className="flex gap-2">
                                    <button onClick={() => handleUpdateSystem(system)} className="text-blue-400 hover:text-blue-300"><PencilIcon /></button>
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
            </div>
        </div>
    );
};

export default SettingsPage;
