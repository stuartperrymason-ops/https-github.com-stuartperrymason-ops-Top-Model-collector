/**
 * @file BulkDataPage.tsx
 * @description This page provides functionality for bulk data operations,
 * allowing users to import their collection from a CSV file.
 */

import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { Model } from '../types';
import Papa from 'papaparse';

type CsvRow = {
    name: string;
    'game system': string;
    army: string;
    points: string;
    quantity: string;
    status: string;
};

const BulkDataPage: React.FC = () => {
    const { gameSystems, armies, addToast, bulkAddModels } = useData();
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isImporting, setIsImporting] = useState(false);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files.length > 0) {
            setSelectedFile(event.target.files[0]);
        }
    };

    const handleImport = () => {
        if (!selectedFile) {
            addToast('Please select a file to import.', 'error');
            return;
        }

        setIsImporting(true);

        Papa.parse<CsvRow>(selectedFile, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                processCsvData(results.data);
                setIsImporting(false);
                setSelectedFile(null);
                // Reset file input
                const fileInput = document.getElementById('csv-file-input') as HTMLInputElement;
                if (fileInput) fileInput.value = '';
            },
            error: (error) => {
                addToast(`CSV parsing failed: ${error.message}`, 'error');
                setIsImporting(false);
            },
        });
    };

    const processCsvData = async (data: CsvRow[]) => {
        let successfulImports = 0;
        let failedRows = 0;
        const modelsToAdd: Omit<Model, 'id'>[] = [];

        for (const row of data) {
            const { name, 'game system': gameSystemName, army: armyName, points, quantity, status } = row;

            // Basic validation
            if (!name || !gameSystemName || !armyName || !points || !quantity || !status) {
                console.warn('Skipping row due to missing data:', row);
                failedRows++;
                continue;
            }

            // Find game system ID
            const gameSystem = gameSystems.find(gs => gs.name.toLowerCase() === gameSystemName.trim().toLowerCase());
            if (!gameSystem) {
                console.warn(`Skipping row: Game system "${gameSystemName}" not found.`, row);
                failedRows++;
                continue;
            }

            // Find army ID within that game system
            const army = armies.find(a => a.name.toLowerCase() === armyName.trim().toLowerCase() && a.gameSystemId === gameSystem.id);
            if (!army) {
                console.warn(`Skipping row: Army "${armyName}" not found in "${gameSystemName}".`, row);
                failedRows++;
                continue;
            }

            // Validate and format model data
            const pointsNum = parseInt(points, 10);
            const quantityNum = parseInt(quantity, 10);
            
            // Validate status (case-insensitive) and map to the correct casing
            const validStatuses: Model['status'][] = ['Purchased', 'Printed', 'Primed', 'Painted', 'Based', 'Ready to Game'];
            const formattedStatus = validStatuses.find(s => s.toLowerCase() === status.trim().toLowerCase());

            if (isNaN(pointsNum) || pointsNum < 0 || isNaN(quantityNum) || quantityNum < 1 || !formattedStatus) {
                console.warn('Skipping row due to invalid data format:', row);
                failedRows++;
                continue;
            }

            modelsToAdd.push({
                name: name.trim(),
                gameSystemId: gameSystem.id,
                armyId: army.id,
                points: pointsNum,
                quantity: quantityNum,
                status: formattedStatus,
                description: '', // Default empty description
                imageUrl: '',
            });

            successfulImports++;
        }
        
        if (modelsToAdd.length > 0) {
            await bulkAddModels(modelsToAdd);
        }

        if (failedRows > 0) {
            addToast(`${successfulImports} models imported. ${failedRows} rows were skipped due to errors.`, 'error');
        } else if (successfulImports > 0) {
            addToast(`Successfully imported ${successfulImports} models!`, 'success');
        } else {
            addToast('Import finished, but no new models were added.', 'error');
        }
    };

    return (
        <div className="container mx-auto">
            <h1 className="text-3xl font-bold text-white mb-6">Bulk Data Management</h1>
            <div className="bg-surface p-6 rounded-lg shadow-md border border-border">
                <h2 className="text-2xl font-semibold text-white mb-4">Import from CSV</h2>
                <div className="text-text-secondary mb-4 space-y-2">
                    <p>
                        Import your model collection by uploading a CSV file. The file must contain the following headers:
                        <code className="bg-background text-primary p-1 rounded-md text-sm mx-1">name</code>,
                        <code className="bg-background text-primary p-1 rounded-md text-sm mx-1">game system</code>,
                        <code className="bg-background text-primary p-1 rounded-md text-sm mx-1">army</code>,
                        <code className="bg-background text-primary p-1 rounded-md text-sm mx-1">points</code>,
                        <code className="bg-background text-primary p-1 rounded-md text-sm mx-1">quantity</code>, and
                        <code className="bg-background text-primary p-1 rounded-md text-sm mx-1">status</code>.
                    </p>
                    <p>
                        The <code className="bg-background text-primary p-1 rounded-md text-sm mx-1">status</code> column must contain one of the following values (case-insensitive): Purchased, Printed, Primed, Painted, Based, Ready to Game.
                    </p>
                </div>
                <p className="text-text-secondary mb-4">
                    Note: The 'game system' and 'army' names in your file must match existing entries in the Settings page exactly.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 items-center">
                    <input
                        id="csv-file-input"
                        type="file"
                        accept=".csv"
                        onChange={handleFileChange}
                        className="block w-full text-sm text-text-secondary file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-white hover:file:bg-indigo-500"
                    />
                    <button
                        onClick={handleImport}
                        disabled={!selectedFile || isImporting}
                        className="w-full sm:w-auto px-6 py-2 bg-green-600 text-white font-semibold rounded-lg shadow-md hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isImporting ? 'Importing...' : 'Import CSV'}
                    </button>
                </div>
                 {selectedFile && (
                    <p className="text-text-secondary mt-4">Selected file: {selectedFile.name}</p>
                )}
            </div>
        </div>
    );
};

export default BulkDataPage;