/**
 * @file BulkDataPage.tsx
 * @description This page provides functionality for bulk importing and exporting of model data using CSV files.
 * It uses the PapaParse library for robust in-browser CSV parsing.
 */

import React, { useRef, useState } from 'react';
import { useData } from '../context/DataContext';
import { Model, Army, GameSystem } from '../types';
import { bulkImport } from '../services/apiService';

// Papa is globally available from the script tag in index.html, so we declare it here to satisfy TypeScript.
declare const Papa: any;

const BulkDataPage: React.FC = () => {
    const { state, dispatch } = useData();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [feedback, setFeedback] = useState<{ message: string, type: 'success' | 'error' } | null>(null);

    /**
     * Handles exporting the current collection to a CSV file.
     * It enriches the model data with army and game system names for a more readable export.
     */
    const handleExport = () => {
        const { models, armies, gameSystems } = state;
        // Map over models to create a new array with army and game system names included.
        const modelsWithNames = models.map(model => ({
            ...model,
            armyName: armies.find(a => a.id === model.armyId)?.name || 'N/A',
            gameSystemName: gameSystems.find(gs => gs.id === model.gameSystemId)?.name || 'N/A'
        }));

        // Convert the JSON data to a CSV string.
        const csv = Papa.unparse(modelsWithNames);
        // Create a Blob and trigger a file download.
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", "model_collection_export.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setFeedback({ message: 'Data exported successfully!', type: 'success' });
    };

    /**
     * Handles importing models from a selected CSV file.
     * It parses the file and sends the data to the backend for processing.
     */
    const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) {
            setFeedback({ message: 'No file selected.', type: 'error' });
            return;
        }

        Papa.parse(file, {
            header: true, // Treat the first row as headers.
            skipEmptyLines: true,
            complete: async (results: any) => {
                try {
                    const newGameSystems: GameSystem[] = [];
                    const newArmies: Army[] = [];
                    const newModels: Model[] = [];

                    // Use Maps for efficient lookup of existing data by name to avoid duplicates.
                    const existingGameSystems = new Map(state.gameSystems.map(gs => [gs.name.toLowerCase(), gs]));
                    const existingArmies = new Map(state.armies.map(a => [a.name.toLowerCase(), a]));

                    results.data.forEach((row: any, index: number) => {
                        if (!row.name || !row.gameSystemName || !row.armyName) {
                            throw new Error(`Row ${index + 2} is missing required fields (name, gameSystemName, armyName).`);
                        }

                        // Process Game System: Create if it doesn't exist.
                        let gameSystem = existingGameSystems.get(row.gameSystemName.toLowerCase());
                        if (!gameSystem) {
                            gameSystem = { id: `gs-imported-${Date.now()}-${newGameSystems.length}`, name: row.gameSystemName };
                            newGameSystems.push(gameSystem);
                            existingGameSystems.set(gameSystem.name.toLowerCase(), gameSystem);
                        }

                        // Process Army: Create if it doesn't exist.
                        let army = existingArmies.get(row.armyName.toLowerCase());
                        if (!army) {
                            army = { id: `army-imported-${Date.now()}-${newArmies.length}`, name: row.armyName, gameSystemId: gameSystem.id };
                            newArmies.push(army);
                            existingArmies.set(army.name.toLowerCase(), army);
                        } else if (army.gameSystemId !== gameSystem.id) {
                            console.warn(`Army "${army.name}" exists but is associated with a different game system. Sticking to existing association.`);
                        }

                        // Create the new model object.
                        const model: Model = {
                            id: `model-imported-${Date.now()}-${newModels.length}`,
                            name: row.name,
                            armyId: army.id,
                            gameSystemId: gameSystem.id,
                            description: row.description || '',
                            points: parseInt(row.points, 10) || 0,
                            quantity: parseInt(row.quantity, 10) || 1,
                            status: ['painted', 'wip', 'unpainted'].includes(row.status) ? row.status : 'unpainted',
                            imageUrl: row.imageUrl || undefined
                        };
                        newModels.push(model);
                    });

                    // Call the API service to send the data to the backend.
                    await bulkImport({ models: newModels, armies: newArmies, gameSystems: newGameSystems });
                    
                    // Dispatch the action to optimistically update the UI.
                    // A more robust solution might re-fetch the data from the server.
                    dispatch({ type: 'BULK_IMPORT', payload: { models: newModels, armies: newArmies, gameSystems: newGameSystems } });

                    setFeedback({ message: `Successfully imported ${newModels.length} models.`, type: 'success' });
                } catch (error: any) {
                    setFeedback({ message: `Import failed: ${error.message}`, type: 'error' });
                } finally {
                    // Reset the file input so the user can upload the same file again if they wish.
                    if (fileInputRef.current) {
                        fileInputRef.current.value = "";
                    }
                }
            },
            error: (error: any) => {
                setFeedback({ message: `CSV parsing error: ${error.message}`, type: 'error' });
            }
        });
    };

    return (
        <div className="space-y-8">
            <h1 className="text-3xl font-bold">Bulk Data Management</h1>
            
            {/* Display success or error feedback to the user. */}
            {feedback && (
                <div className={`p-4 rounded-md ${feedback.type === 'success' ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}>
                    {feedback.message}
                </div>
            )}

            <div className="bg-surface p-6 rounded-lg border border-border">
                <h2 className="text-2xl font-semibold mb-4">Export Collection</h2>
                <p className="text-text-secondary mb-4">Export your entire model collection to a CSV file. This file can be used as a backup or for editing your data in a spreadsheet application.</p>
                <button
                    onClick={handleExport}
                    className="px-6 py-2 bg-primary text-white font-semibold rounded-lg shadow-md hover:bg-indigo-500 transition-colors"
                >
                    Export to CSV
                </button>
            </div>

            <div className="bg-surface p-6 rounded-lg border border-border">
                <h2 className="text-2xl font-semibold mb-4">Import Collection</h2>
                <p className="text-text-secondary mb-4">Import models from a CSV file. The file should have headers matching the model data structure (e.g., name, armyName, gameSystemName, points, quantity, status, description, imageUrl).</p>
                <p className="text-xs text-yellow-400 mb-4">Note: The backend will create new game systems and armies automatically if they don't exist.</p>
                <input
                    type="file"
                    accept=".csv"
                    onChange={handleImport}
                    ref={fileInputRef}
                    className="block w-full text-sm text-text-secondary file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-white hover:file:bg-indigo-500"
                />
            </div>
        </div>
    );
};

export default BulkDataPage;
