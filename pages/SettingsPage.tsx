
import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { PlusIcon, TrashIcon } from '../components/icons/Icons';
import { GameSystem, Army } from '../types';

const SettingsPage: React.FC = () => {
    const { state, dispatch } = useData();
    const [newGameSystem, setNewGameSystem] = useState('');
    const [newArmy, setNewArmy] = useState({ name: '', gameSystemId: '' });

    const handleAddGameSystem = (e: React.FormEvent) => {
        e.preventDefault();
        if (newGameSystem.trim()) {
            dispatch({ type: 'ADD_GAMESYSTEM', payload: { id: new Date().toISOString(), name: newGameSystem.trim() } });
            setNewGameSystem('');
        }
    };

    const handleDeleteGameSystem = (id: string) => {
        if (window.confirm('Are you sure? Deleting a game system will also delete all associated armies and models.')) {
            dispatch({ type: 'DELETE_GAMESYSTEM', payload: id });
        }
    };

    const handleAddArmy = (e: React.FormEvent) => {
        e.preventDefault();
        if (newArmy.name.trim() && newArmy.gameSystemId) {
            dispatch({ type: 'ADD_ARMY', payload: { id: new Date().toISOString(), ...newArmy } });
            setNewArmy({ name: '', gameSystemId: '' });
        }
    };

    const handleDeleteArmy = (id: string) => {
        if (window.confirm('Are you sure? Deleting an army will also delete all associated models.')) {
            dispatch({ type: 'DELETE_ARMY', payload: id });
        }
    };

    return (
        <div className="space-y-8">
            <h1 className="text-3xl font-bold">Settings</h1>

            {/* Game Systems Management */}
            <div className="bg-surface p-6 rounded-lg border border-border">
                <h2 className="text-2xl font-semibold mb-4">Manage Game Systems</h2>
                <form onSubmit={handleAddGameSystem} className="flex gap-4 mb-4">
                    <input
                        type="text"
                        value={newGameSystem}
                        onChange={(e) => setNewGameSystem(e.target.value)}
                        placeholder="New Game System Name"
                        className="flex-grow bg-background border border-border rounded-md p-2"
                    />
                    <button type="submit" className="flex items-center gap-2 px-4 py-2 bg-primary text-white font-semibold rounded-lg hover:bg-indigo-500">
                        <PlusIcon /> Add
                    </button>
                </form>
                <div className="space-y-2">
                    {state.gameSystems.map((gs: GameSystem) => (
                        <div key={gs.id} className="flex justify-between items-center bg-background p-3 rounded-md">
                            <span>{gs.name}</span>
                            <button onClick={() => handleDeleteGameSystem(gs.id)} className="p-2 text-text-secondary hover:text-red-500">
                                <TrashIcon />
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            {/* Armies Management */}
            <div className="bg-surface p-6 rounded-lg border border-border">
                <h2 className="text-2xl font-semibold mb-4">Manage Armies</h2>
                <form onSubmit={handleAddArmy} className="flex flex-col md:flex-row gap-4 mb-4">
                    <input
                        type="text"
                        value={newArmy.name}
                        onChange={(e) => setNewArmy({ ...newArmy, name: e.target.value })}
                        placeholder="New Army Name"
                        className="flex-grow bg-background border border-border rounded-md p-2"
                    />
                    <select
                        value={newArmy.gameSystemId}
                        onChange={(e) => setNewArmy({ ...newArmy, gameSystemId: e.target.value })}
                        className="flex-grow bg-background border border-border rounded-md p-2"
                    >
                        <option value="">Select Game System</option>
                        {state.gameSystems.map((gs: GameSystem) => <option key={gs.id} value={gs.id}>{gs.name}</option>)}
                    </select>
                    <button type="submit" className="flex items-center justify-center gap-2 px-4 py-2 bg-primary text-white font-semibold rounded-lg hover:bg-indigo-500">
                        <PlusIcon /> Add
                    </button>
                </form>
                <div className="space-y-2">
                    {state.armies.map((army: Army) => (
                        <div key={army.id} className="flex justify-between items-center bg-background p-3 rounded-md">
                            <div>
                                <p>{army.name}</p>
                                <p className="text-xs text-text-secondary">{state.gameSystems.find(gs => gs.id === army.gameSystemId)?.name || 'Unlinked'}</p>
                            </div>
                            <button onClick={() => handleDeleteArmy(army.id)} className="p-2 text-text-secondary hover:text-red-500">
                                <TrashIcon />
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default SettingsPage;
