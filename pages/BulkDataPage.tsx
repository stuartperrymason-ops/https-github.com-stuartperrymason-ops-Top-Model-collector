/**
 * @file BulkDataPage.tsx
 * @description This page provides functionality for bulk data operations,
 * allowing users to import their collection from a CSV file.
 * This program was written by Stuart Mason October 2025.
 */

import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { Army, GameSystem, Model } from '../types';
import Papa from 'papaparse'; // A powerful CSV parser for the browser.
import { XIcon } from '../components/icons/Icons';

// Define the expected structure of a row in the CSV file.
type CsvRow = {
    name: string;
    'game system': string;
    army: string;
    quantity: string;
    status: string;
    'painting notes'?: string; // Optional column
};

// Define the structure for the result of validating a single CSV row.
interface ValidationResult {
  row: CsvRow; // The original row data.
  data: Omit<Model, 'id'> | null; // The processed model data, or null if there's an error.
  status: 'NEW' | 'DUPLICATE' | 'ERROR'; // The validation status.
  errorMessage?: string; // An error message if status is 'ERROR'.
  import: boolean; // User's choice for duplicates, defaults to true.
  rowIndex: number; // The original index of the row in the file.
}

// Helper type for tracking new armies to be created.
type NewArmyInfo = {
    name: string;
    gameSystemName: string;
};

const BulkDataPage: React.FC = () => {
    // Access global data and functions from the DataContext.
    const { gameSystems, armies, models, addToast, bulkAddModels, addGameSystem, addArmy } = useData();
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isImporting, setIsImporting] = useState(false);
    
    // State for managing the multi-step import process.
    const [validationResults, setValidationResults] = useState<ValidationResult[]>([]);
    const [showReviewModal, setShowReviewModal] = useState(false);
    const [showSummaryModal, setShowSummaryModal] = useState(false);
    const [importSummary, setImportSummary] = useState({ success: 0, errors: 0, skippedDuplicates: 0 });
    const [importErrors, setImportErrors] = useState<ValidationResult[]>([]);
    const [newGameSystemsToCreate, setNewGameSystemsToCreate] = useState<string[]>([]);
    const [newArmiesToCreate, setNewArmiesToCreate] = useState<NewArmyInfo[]>([]);


    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files.length > 0) {
            setSelectedFile(event.target.files[0]);
        }
    };
    
    // Kicks off the import process when the "Import CSV" button is clicked.
    const handleImport = () => {
        if (!selectedFile) {
            addToast('Please select a file to import.', 'error');
            return;
        }
        setIsImporting(true);
        // Use PapaParse to parse the CSV file from the browser.
        Papa.parse<CsvRow>(selectedFile, {
            header: true, // Treat the first row as headers.
            skipEmptyLines: true, // Ignore empty lines.
            complete: (results) => {
                // Once parsing is complete, proceed to the validation step.
                validateCsvData(results.data);
            },
            error: (error) => {
                addToast(`CSV parsing failed: ${error.message}`, 'error');
                setIsImporting(false);
            },
        });
    };

    // First major step: Validate the parsed CSV data.
    const validateCsvData = (data: CsvRow[]) => {
        const results: ValidationResult[] = [];
        const systemsToCreate = new Set<string>(); // Use a Set to avoid duplicate entries.
        const armiesToCreate = new Map<string, NewArmyInfo>(); // Use a Map for efficient lookup.
        const validStatuses: Model['status'][] = ['Purchased', 'Printed', 'Assembled', 'Primed', 'Painted', 'Based', 'Ready to Game'];

        data.forEach((row, index) => {
            // Skip rows that might be completely empty but not skipped by the parser.
            if (Object.values(row).every(val => val === null || val === '')) return;
            
            const { name, 'game system': gameSystemName, army: armyNamesRaw, quantity, status } = row;
            const paintingNotes = row['painting notes'];

            // Validate that all required fields are present.
            const missingFields = [];
            if (!name) missingFields.push('name');
            if (!gameSystemName) missingFields.push('game system');
            if (!armyNamesRaw) missingFields.push('army');
            if (!quantity) missingFields.push('quantity');
            if (!status) missingFields.push('status');
            
            if (missingFields.length > 0) {
                results.push({ row, data: null, status: 'ERROR', errorMessage: `Missing required fields: ${missingFields.join(', ')}.`, import: false, rowIndex: index });
                return; // Stop processing this row.
            }
            
            // --- Identify new Game Systems and Armies to be created ---
            const cleanGameSystemName = gameSystemName.trim();
            // Check if a game system with this name already exists (case-insensitive).
            if (!gameSystems.some(gs => gs.name.trim().toLowerCase() === cleanGameSystemName.toLowerCase())) {
                systemsToCreate.add(cleanGameSystemName);
            }
            
            // Handle potentially multiple armies (comma-separated).
            const armyNames = armyNamesRaw.split(',').map(n => n.trim());
            const foundArmyIdsInContext: string[] = [];
            
            armyNames.forEach(armyName => {
                // Check if an army with this name already exists within the specified game system.
                const existingArmy = armies.find(a =>
                    a.name.trim().toLowerCase() === armyName.toLowerCase() &&
                    gameSystems.find(gs => gs.id === a.gameSystemId)?.name.trim().toLowerCase() === cleanGameSystemName.toLowerCase()
                );
                if (existingArmy) {
                    foundArmyIdsInContext.push(existingArmy.id);
                } else {
                    // If it doesn't exist, add it to the list of armies to create.
                    const newArmyKey = `${armyName.toLowerCase()}|${cleanGameSystemName.toLowerCase()}`;
                    if (!armiesToCreate.has(newArmyKey)) {
                        armiesToCreate.set(newArmyKey, { name: armyName, gameSystemName: cleanGameSystemName });
                    }
                }
            });

            // Validate data types and values for quantity and status.
            const quantityNum = parseInt(quantity, 10);
            const formattedStatus = validStatuses.find(s => s.toLowerCase() === status.trim().toLowerCase());

            let errorMessage = '';
            if (isNaN(quantityNum) || quantityNum < 1) errorMessage = `Invalid quantity: "${quantity}". Must be > 0.`;
            if (!formattedStatus) errorMessage += `${errorMessage ? ' ' : ''}Invalid status: "${status}".`;
            
            if (errorMessage) {
                results.push({ row, data: null, status: 'ERROR', errorMessage, import: false, rowIndex: index });
                return;
            }
            
            // Check for duplicates against models already in the user's collection.
            const isDuplicate = models.some(m => 
                m.name.trim().toLowerCase() === name.trim().toLowerCase() && 
                m.armyIds.some(id => foundArmyIdsInContext.includes(id))
            );
            
            // Prepare the model data object, ready for import. IDs will be filled in later.
            const modelData = {
                name: name.trim(),
                gameSystemId: '',
                armyIds: [],
                quantity: quantityNum,
                status: formattedStatus!,
                description: '',
                imageUrl: '',
                paintingNotes: paintingNotes || '',
            };

            results.push({ row, data: modelData, status: isDuplicate ? 'DUPLICATE' : 'NEW', import: true, rowIndex: index });
        });

        const finalNewSystems = Array.from(systemsToCreate);
        const finalNewArmies = Array.from(armiesToCreate.values());
        setNewGameSystemsToCreate(finalNewSystems);
        setNewArmiesToCreate(finalNewArmies);
        setValidationResults(results);
        
        // Decide whether to proceed directly to import or show the review modal.
        if (finalNewSystems.length > 0 || finalNewArmies.length > 0 || results.some(r => r.status === 'ERROR' || r.status === 'DUPLICATE')) {
            setShowReviewModal(true);
        } else {
            // If there are no issues, proceed to the final import step.
            finalizeImport(results, finalNewSystems, finalNewArmies);
        }
    };
    
    // Handler for toggling the import status of a single duplicate model in the review modal.
    const handleDuplicateSelectionChange = (rowIndex: number, shouldImport: boolean) => {
        setValidationResults(prev => prev.map(r => r.rowIndex === rowIndex ? { ...r, import: shouldImport } : r));
    };

    // Handler for the "Select All" / "Deselect All" buttons in the review modal.
    const handleSelectAllDuplicates = (shouldImport: boolean) => {
        setValidationResults(prev => prev.map(r => r.status === 'DUPLICATE' ? { ...r, import: shouldImport } : r));
    };

    // Second major step: Finalize the import after user review (if any).
    const finalizeImport = async (
        results: ValidationResult[],
        systemsToCreate: string[],
        armiesToCreate: NewArmyInfo[]
    ) => {
        setShowReviewModal(false);
        setIsImporting(true);
    
        try {
            // Step 1: Create any new game systems. `addGameSystem` returns the created object.
            const createdSystems = (await Promise.all(
// FIX: The addGameSystem function requires a colorScheme argument. A default is provided here.
                systemsToCreate.map(name => addGameSystem(name, { primary: '#4f46e5', secondary: '#10b981', background: '#1f2937' }))
            )).filter((s): s is GameSystem => s !== undefined);
            
            // Combine existing and newly created systems for the next step.
            const allGameSystems = [...gameSystems, ...createdSystems];
    
            // Step 2: Create any new armies, linking them to their game system by ID.
            const createdArmies = (await Promise.all(
                armiesToCreate.map(async (army) => {
                    const gameSystem = allGameSystems.find(gs => gs.name.trim().toLowerCase() === army.gameSystemName.trim().toLowerCase());
                    if (gameSystem) {
                        return addArmy(army.name, gameSystem.id);
                    }
                    return undefined;
                })
            )).filter((a): a is Army => a !== undefined);
            
            const allArmies = [...armies, ...createdArmies];
            
            // Step 3: Prepare the final list of models to add, resolving names to IDs.
            const modelsToAdd: Omit<Model, 'id'>[] = [];
            let successCount = 0;
            let skippedDuplicatesCount = 0;
            const finalErrors: ValidationResult[] = [];
    
            results.forEach(result => {
                if (result.status === 'ERROR' || !result.import) {
                    if (result.status === 'ERROR') finalErrors.push(result);
                    if (!result.import && result.status === 'DUPLICATE') skippedDuplicatesCount++;
                    return;
                }
    
                const { row, data } = result;
                if (!data) return;
    
                // Find the game system ID from our combined list.
                const gameSystem = allGameSystems.find(gs => gs.name.trim().toLowerCase() === row['game system'].trim().toLowerCase());
                if (!gameSystem) {
                    finalErrors.push({ ...result, status: 'ERROR', errorMessage: `Failed to find/create game system: ${row['game system']}` });
                    return;
                }
    
                // Find all relevant army IDs.
                const armyNames = row.army.split(',').map(n => n.trim().toLowerCase());
                const armyIds = allArmies
                    .filter(a => a.gameSystemId === gameSystem.id && armyNames.includes(a.name.trim().toLowerCase()))
                    .map(a => a.id);
                
                // If we couldn't find all armies, it's an error.
                if (armyIds.length !== armyNames.length) {
                    finalErrors.push({ ...result, status: 'ERROR', errorMessage: `Failed to find/create one or more armies for ${row.name}` });
                    return;
                }
    
                modelsToAdd.push({ ...data, gameSystemId: gameSystem.id, armyIds: armyIds });
                successCount++;
            });
            
            // Step 4: Perform the bulk import API call with the processed models.
            if (modelsToAdd.length > 0) {
                await bulkAddModels(modelsToAdd);
            }
            
            // Set up state for the summary modal.
            setImportSummary({ success: successCount, errors: finalErrors.length, skippedDuplicates: skippedDuplicatesCount });
            setImportErrors(finalErrors);
        } catch (err) {
            console.error("Error during final import phase:", err);
            addToast("A critical error occurred during import.", "error");
        } finally {
            // Always show the summary modal and reset the importing state.
            setShowSummaryModal(true);
            setIsImporting(false);
        }
    };

    // Resets the component's state after the import process is complete.
    const closeSummaryAndReset = () => {
        setShowSummaryModal(false);
        setSelectedFile(null);
        setValidationResults([]);
        setImportErrors([]);
        setNewGameSystemsToCreate([]);
        setNewArmiesToCreate([]);
        // Reset the file input element.
        const fileInput = document.getElementById('csv-file-input') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
    };

    // Filter results for easier rendering in the review modal.
    const duplicates = validationResults.filter(r => r.status === 'DUPLICATE');
    const errorsInReview = validationResults.filter(r => r.status === 'ERROR');

    return (
        <div className="container mx-auto">
            <h1 className="text-3xl font-bold text-white mb-6">Bulk Data Management</h1>
            <div className="bg-surface p-6 rounded-lg shadow-md border border-border">
                <h2 className="text-2xl font-semibold text-white mb-4">Import from CSV</h2>
                {/* Instructions for the user on how to format their CSV file. */}
                <div className="text-text-secondary mb-4 space-y-2">
                    <p>
                        Import your model collection by uploading a CSV file. The file must contain the following headers:
                        <code className="bg-background text-primary p-1 rounded-md text-sm mx-1">name</code>,
                        <code className="bg-background text-primary p-1 rounded-md text-sm mx-1">game system</code>,
                        <code className="bg-background text-primary p-1 rounded-md text-sm mx-1">army</code>,
                        <code className="bg-background text-primary p-1 rounded-md text-sm mx-1">quantity</code>, and
                        <code className="bg-background text-primary p-1 rounded-md text-sm mx-1">status</code>.
                    </p>
                    <p>
                        You can also include an optional header: <code className="bg-background text-primary p-1 rounded-md text-sm mx-1">painting notes</code>.
                    </p>
                    <p>
                        To assign multiple armies, separate their names with a comma in the <code className="bg-background text-primary p-1 rounded-md text-sm mx-1">army</code> column (e.g., "Army A, Army B").
                    </p>
                    <p>
                        The <code className="bg-background text-primary p-1 rounded-md text-sm mx-1">status</code> column must contain one of the following values (case-insensitive): Purchased, Printed, Assembled, Primed, Painted, Based, Ready to Game.
                    </p>
                </div>
                <p className="text-text-secondary mb-4">
                    Note: If 'game system' or 'army' names in your file don't exist, they will be created automatically.
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
                        {isImporting ? 'Processing...' : 'Import CSV'}
                    </button>
                </div>
                 {selectedFile && (
                    <p className="text-text-secondary mt-4">Selected file: {selectedFile.name}</p>
                )}
            </div>

            {/* Review Modal: Shown if there are new items to create, errors, or duplicates. */}
            {showReviewModal && (
                <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50 p-4">
                    <div className="bg-surface rounded-lg shadow-xl p-6 w-full max-w-2xl border border-border max-h-[90vh] flex flex-col">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-bold text-white">Review Import</h3>
                            <button onClick={() => setShowReviewModal(false)} className="text-gray-400 hover:text-white"><XIcon /></button>
                        </div>
                        
                        {/* Section for new items to be created */}
                        {(newGameSystemsToCreate.length > 0 || newArmiesToCreate.length > 0) && (
                            <div className="mb-4">
                                <h4 className="font-semibold text-green-400 mb-2">The following new items will be created:</h4>
                                <div className="space-y-2 bg-background p-3 rounded-md max-h-40 overflow-y-auto">
                                    {newGameSystemsToCreate.length > 0 && (
                                        <div>
                                            <p className="text-sm font-bold text-text-secondary">Game Systems</p>
                                            <ul className="list-disc list-inside ml-4">
                                                {newGameSystemsToCreate.map(name => <li key={name} className="text-sm text-text-primary">{name}</li>)}
                                            </ul>
                                        </div>
                                    )}
                                    {newArmiesToCreate.length > 0 && (
                                        <div className="mt-2">
                                            <p className="text-sm font-bold text-text-secondary">Armies</p>
                                            <ul className="list-disc list-inside ml-4">
                                                {newArmiesToCreate.map(army => <li key={`${army.gameSystemName}-${army.name}`} className="text-sm text-text-primary">{army.name} ({army.gameSystemName})</li>)}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                        
                        {/* Section for rows with errors */}
                        {errorsInReview.length > 0 && (
                            <div className="mb-4">
                                <h4 className="font-semibold text-red-400 mb-2">The following rows have errors and will not be imported:</h4>
                                <ul className="space-y-2 bg-background p-3 rounded-md max-h-40 overflow-y-auto">
                                    {errorsInReview.map(error => (
                                        <li key={error.rowIndex} className="text-sm">
                                            <p className="font-semibold">Row {error.rowIndex + 2}: {error.errorMessage}</p>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                        
                        {/* Section for handling duplicates */}
                        {duplicates.length > 0 && (
                           <>
                            <p className="text-text-secondary my-4">The following models already exist. Please select which ones you still wish to import.</p>
                            <div className="flex justify-between items-center mb-4 p-2 bg-background rounded-md">
                                <span className="font-semibold">Toggle All Duplicates</span>
                                <div>
                                    <button onClick={() => handleSelectAllDuplicates(true)} className="text-sm text-green-400 hover:underline mr-4">Select All</button>
                                    <button onClick={() => handleSelectAllDuplicates(false)} className="text-sm text-red-400 hover:underline">Deselect All</button>
                                </div>
                            </div>
                           </>
                        )}

                        <div className="flex-grow overflow-y-auto space-y-2 pr-2">
                            {duplicates.map((result) => (
                                <div key={result.rowIndex} className="flex items-center justify-between p-2 bg-background rounded-md">
                                    <div className="flex items-center">
                                        <input
                                            type="checkbox"
                                            checked={result.import}
                                            onChange={(e) => handleDuplicateSelectionChange(result.rowIndex, e.target.checked)}
                                            className="h-5 w-5 rounded border-gray-300 text-primary focus:ring-primary mr-3"
                                        />
                                        <div>
                                            <p className="font-semibold text-text-primary">{result.row.name}</p>
                                            <p className="text-sm text-text-secondary">{result.row.army} / {result.row['game system']}</p>
                                        </div>
                                    </div>
                                    <span className="text-yellow-400 text-sm font-semibold">DUPLICATE</span>
                                </div>
                            ))}
                        </div>
                        <div className="flex justify-end gap-4 pt-6 flex-shrink-0">
                            <button onClick={() => setShowReviewModal(false)} className="px-4 py-2 bg-gray-600 text-white font-semibold rounded-lg hover:bg-gray-700">Cancel</button>
                            <button onClick={() => finalizeImport(validationResults, newGameSystemsToCreate, newArmiesToCreate)} className="px-4 py-2 bg-primary text-white font-semibold rounded-lg hover:bg-indigo-500">Confirm Import</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Import Summary Modal: Shown after the import process is complete. */}
            {showSummaryModal && (
                <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50 p-4">
                    <div className="bg-surface rounded-lg shadow-xl p-6 w-full max-w-lg border border-border text-center flex flex-col max-h-[90vh]">
                        <h3 className="text-2xl font-bold text-white mb-4">Import Complete</h3>
                        <div className="space-y-3 text-left my-6">
                            <p className="text-lg text-green-400 flex justify-between"><span>Models Imported:</span> <span>{importSummary.success}</span></p>
                            <p className="text-lg text-yellow-400 flex justify-between"><span>Duplicates Skipped:</span> <span>{importSummary.skippedDuplicates}</span></p>
                            <p className="text-lg text-red-400 flex justify-between"><span>Rows with Errors:</span> <span>{importSummary.errors}</span></p>
                        </div>
                        
                        {importErrors.length > 0 && (
                            <div className="text-left mt-2 flex-grow overflow-y-auto">
                                <h4 className="font-semibold text-text-primary mb-2">Error Details:</h4>
                                <ul className="space-y-2 bg-background p-3 rounded-md">
                                    {importErrors.map(error => (
                                        <li key={error.rowIndex} className="text-sm border-b border-border pb-1 last:border-b-0">
                                            <p className="text-red-400 font-semibold">Row {error.rowIndex + 2}: {error.errorMessage}</p>
                                            <p className="text-text-secondary truncate text-xs">
                                                Data: {Object.values(error.row).join(', ')}
                                            </p>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        <button onClick={closeSummaryAndReset} className="mt-6 px-6 py-2 bg-primary text-white font-semibold rounded-lg hover:bg-indigo-500 w-full flex-shrink-0">OK</button>
                    </div>
                </div>
            )}

        </div>
    );
};

export default BulkDataPage;
