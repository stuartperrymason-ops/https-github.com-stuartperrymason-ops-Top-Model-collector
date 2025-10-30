/**
 * @file BulkDataPage.tsx
 * @description This page provides functionality for bulk data operations,
 * allowing users to import their collection from a CSV file.
 * This program was written by Stuart Mason October 2025.
 */

import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { Army, GameSystem, Model, Paint } from '../types';
import Papa from 'papaparse'; // A powerful CSV parser for the browser.
import { XIcon } from '../components/icons/Icons';

// Define the expected structure of a row in the CSV file for models.
type ModelCsvRow = {
    name: string;
    'game system': string;
    army: string;
    quantity: string;
    status: string;
    'painting notes'?: string; // Optional column
};

// Define the expected structure of a row in the CSV file for paints.
type PaintCsvRow = {
    name: string;
    manufacturer: string;
    paintType: Paint['paintType'];
    colorScheme: string;
    stock: string;
    rgbCode?: string;
};

// Define the structure for the result of validating a single model CSV row.
interface ModelValidationResult {
  row: ModelCsvRow;
  data: Omit<Model, 'id' | 'createdAt' | 'lastUpdated'> | null;
  status: 'NEW' | 'DUPLICATE' | 'ERROR';
  errorMessage?: string;
  import: boolean;
  rowIndex: number;
}

// Define the structure for the result of validating a single paint CSV row.
interface PaintValidationResult {
  row: PaintCsvRow;
  data: Omit<Paint, 'id'> | null;
  status: 'NEW' | 'DUPLICATE' | 'ERROR';
  errorMessage?: string;
  import: boolean;
  rowIndex: number;
}


// Helper type for tracking new armies to be created.
type NewArmyInfo = {
    name: string;
    gameSystemName: string;
};

const BulkDataPage: React.FC = () => {
    // Access global data and functions from the DataContext.
    const { 
        gameSystems, armies, models, paints, addToast, 
        bulkAddModels, addGameSystem, addArmy, bulkAddPaints 
    } = useData();
    
    // --- State for Model Import ---
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isImporting, setIsImporting] = useState(false);
    const [validationResults, setValidationResults] = useState<ModelValidationResult[]>([]);
    const [showReviewModal, setShowReviewModal] = useState(false);
    const [showSummaryModal, setShowSummaryModal] = useState(false);
    const [importSummary, setImportSummary] = useState({ success: 0, errors: 0, skippedDuplicates: 0 });
    const [importErrors, setImportErrors] = useState<ModelValidationResult[]>([]);
    const [newGameSystemsToCreate, setNewGameSystemsToCreate] = useState<string[]>([]);
    const [newArmiesToCreate, setNewArmiesToCreate] = useState<NewArmyInfo[]>([]);
    
    // --- State for Paint Import ---
    const [selectedPaintFile, setSelectedPaintFile] = useState<File | null>(null);
    const [isImportingPaints, setIsImportingPaints] = useState(false);
    const [paintValidationResults, setPaintValidationResults] = useState<PaintValidationResult[]>([]);
    const [showPaintReviewModal, setShowPaintReviewModal] = useState(false);
    const [showPaintSummaryModal, setShowPaintSummaryModal] = useState(false);
    const [paintImportSummary, setPaintImportSummary] = useState({ success: 0, errors: 0, skippedDuplicates: 0 });
    const [paintImportErrors, setPaintImportErrors] = useState<PaintValidationResult[]>([]);


    // --- Handlers for Model Import ---
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
        Papa.parse<ModelCsvRow>(selectedFile, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                validateCsvData(results.data);
            },
            error: (error) => {
                addToast(`CSV parsing failed: ${error.message}`, 'error');
                setIsImporting(false);
            },
        });
    };

    const validateCsvData = (data: ModelCsvRow[]) => {
        const results: ModelValidationResult[] = [];
        const systemsToCreate = new Set<string>();
        const armiesToCreate = new Map<string, NewArmyInfo>();
        const validStatuses: Model['status'][] = ['Purchased', 'Printed', 'Assembled', 'Primed', 'Painted', 'Based', 'Ready to Game'];

        data.forEach((row, index) => {
            if (Object.values(row).every(val => val === null || val === '')) return;
            
            const { name, 'game system': gameSystemName, army: armyNamesRaw, quantity, status } = row;
            const paintingNotes = row['painting notes'];

            const missingFields = [];
            if (!name) missingFields.push('name');
            if (!gameSystemName) missingFields.push('game system');
            if (!armyNamesRaw) missingFields.push('army');
            if (!quantity) missingFields.push('quantity');
            if (!status) missingFields.push('status');
            
            if (missingFields.length > 0) {
                results.push({ row, data: null, status: 'ERROR', errorMessage: `Missing required fields: ${missingFields.join(', ')}.`, import: false, rowIndex: index });
                return;
            }
            
            const cleanGameSystemName = gameSystemName.trim();
            if (!gameSystems.some(gs => gs.name.trim().toLowerCase() === cleanGameSystemName.toLowerCase())) {
                systemsToCreate.add(cleanGameSystemName);
            }
            
            const armyNames = armyNamesRaw.split(',').map(n => n.trim());
            const foundArmyIdsInContext: string[] = [];
            
            armyNames.forEach(armyName => {
                const existingArmy = armies.find(a =>
                    a.name.trim().toLowerCase() === armyName.toLowerCase() &&
                    gameSystems.find(gs => gs.id === a.gameSystemId)?.name.trim().toLowerCase() === cleanGameSystemName.toLowerCase()
                );
                if (existingArmy) {
                    foundArmyIdsInContext.push(existingArmy.id);
                } else {
                    const newArmyKey = `${armyName.toLowerCase()}|${cleanGameSystemName.toLowerCase()}`;
                    if (!armiesToCreate.has(newArmyKey)) {
                        armiesToCreate.set(newArmyKey, { name: armyName, gameSystemName: cleanGameSystemName });
                    }
                }
            });

            const quantityNum = parseInt(quantity, 10);
            const formattedStatus = validStatuses.find(s => s.toLowerCase() === status.trim().toLowerCase());

            let errorMessage = '';
            if (isNaN(quantityNum) || quantityNum < 1) errorMessage = `Invalid quantity: "${quantity}". Must be > 0.`;
            if (!formattedStatus) errorMessage += `${errorMessage ? ' ' : ''}Invalid status: "${status}".`;
            
            if (errorMessage) {
                results.push({ row, data: null, status: 'ERROR', errorMessage, import: false, rowIndex: index });
                return;
            }
            
            const isDuplicate = models.some(m => 
                m.name.trim().toLowerCase() === name.trim().toLowerCase() && 
                m.armyIds.some(id => foundArmyIdsInContext.includes(id))
            );
            
            const modelData: Omit<Model, 'id' | 'createdAt' | 'lastUpdated'> = {
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
        
        if (finalNewSystems.length > 0 || finalNewArmies.length > 0 || results.some(r => r.status === 'ERROR' || r.status === 'DUPLICATE')) {
            setShowReviewModal(true);
        } else {
            finalizeImport(results, finalNewSystems, finalNewArmies);
        }
    };
    
    const handleDuplicateSelectionChange = (rowIndex: number, shouldImport: boolean) => {
        setValidationResults(prev => prev.map(r => r.rowIndex === rowIndex ? { ...r, import: shouldImport } : r));
    };

    const handleSelectAllDuplicates = (shouldImport: boolean) => {
        setValidationResults(prev => prev.map(r => r.status === 'DUPLICATE' ? { ...r, import: shouldImport } : r));
    };

    const finalizeImport = async (
        results: ModelValidationResult[],
        systemsToCreate: string[],
        armiesToCreate: NewArmyInfo[]
    ) => {
        setShowReviewModal(false);
        setIsImporting(true);
    
        try {
            const createdSystems = (await Promise.all(
                systemsToCreate.map(name => addGameSystem(name, { primary: '#4f46e5', secondary: '#10b981', background: '#1f2937' }))
            )).filter((s): s is GameSystem => s !== undefined);
            
            const allGameSystems = [...gameSystems, ...createdSystems];
    
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
            
            const modelsToAdd: Omit<Model, 'id' | 'createdAt' | 'lastUpdated'>[] = [];
            let successCount = 0;
            let skippedDuplicatesCount = 0;
            const finalErrors: ModelValidationResult[] = [];
    
            for (const result of results) {
                if (result.status === 'ERROR' || !result.import) {
                    if (result.status === 'ERROR') finalErrors.push(result);
                    if (!result.import && result.status === 'DUPLICATE') skippedDuplicatesCount++;
                    continue;
                }
    
                const { row, data } = result;
                if (!data) continue;
    
                const gameSystem = allGameSystems.find(gs => gs.name.trim().toLowerCase() === row['game system'].trim().toLowerCase());
                if (!gameSystem) {
                    finalErrors.push({ ...result, status: 'ERROR', errorMessage: `Failed to find/create game system: ${row['game system']}` });
                    continue;
                }
    
                // Defensive army name handling:
                // - preserve original casing for creation
                // - normalize names for lookups (trim + lowercase)
                // - dedupe names so duplicates in CSV don't cause mismatches
                const rawArmyNames = row.army.split(',').map(n => n.trim()).filter(n => n.length > 0);
                const armyNamesNormalized = Array.from(new Set(rawArmyNames.map(n => n.toLowerCase())));

                // Build a quick lookup for existing armies within the target game system.
                const armyLookup = new Map<string, string>(); // normalized name -> id
                allArmies
                    .filter(a => a.gameSystemId === gameSystem.id)
                    .forEach(a => armyLookup.set(a.name.trim().toLowerCase(), a.id));

                const armyIds: string[] = [];
                // For each original name (preserving the original for creation if needed),
                // attempt to lookup an ID; if missing, create the army on-the-fly.
                for (const originalName of rawArmyNames) {
                    const key = originalName.trim().toLowerCase();
                    let id = armyLookup.get(key);
                    if (!id) {
                        // Try to create the missing army and add it to our lookup and allArmies list.
                        try {
                            const created = await addArmy(originalName, gameSystem.id);
                            if (created) {
                                id = created.id;
                                armyLookup.set(key, id);
                                allArmies.push(created);
                            }
                        } catch (err) {
                            // If creation fails, we'll catch it in the length check below and return a helpful error.
                            console.error('Failed to create army during import:', originalName, err);
                        }
                    }
                    if (id) armyIds.push(id);
                }

                // After attempting creation, ensure we have a matching id for every distinct army name.
                if (armyIds.length !== armyNamesNormalized.length) {
                    finalErrors.push({ ...result, status: 'ERROR', errorMessage: `Failed to find/create one or more armies for ${row.name}` });
                    return;
                }
    
                modelsToAdd.push({ ...data, gameSystemId: gameSystem.id, armyIds: armyIds });
                successCount++;
            }
            
            if (modelsToAdd.length > 0) {
                await bulkAddModels(modelsToAdd);
            }
            
            setImportSummary({ success: successCount, errors: finalErrors.length, skippedDuplicates: skippedDuplicatesCount });
            setImportErrors(finalErrors);
        } catch (err) {
            console.error("Error during final import phase:", err);
            addToast("A critical error occurred during import.", "error");
        } finally {
            setShowSummaryModal(true);
            setIsImporting(false);
        }
    };
    
    const closeSummaryAndReset = () => {
        setShowSummaryModal(false);
        setSelectedFile(null);
        setValidationResults([]);
        setImportErrors([]);
        setNewGameSystemsToCreate([]);
        setNewArmiesToCreate([]);
        const fileInput = document.getElementById('csv-file-input') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
    };

    // --- Handlers for Paint Import ---
    const handlePaintFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files.length > 0) {
            setSelectedPaintFile(event.target.files[0]);
        }
    };

    const handlePaintImport = () => {
        if (!selectedPaintFile) {
            addToast('Please select a paint CSV file to import.', 'error');
            return;
        }
        setIsImportingPaints(true);
        Papa.parse<PaintCsvRow>(selectedPaintFile, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                validatePaintCsvData(results.data);
            },
            error: (error) => {
                addToast(`Paint CSV parsing failed: ${error.message}`, 'error');
                setIsImportingPaints(false);
            },
        });
    };

    const validatePaintCsvData = (data: PaintCsvRow[]) => {
        const results: PaintValidationResult[] = [];
        const validPaintTypes: Paint['paintType'][] = ['Base', 'Layer', 'Shade', 'Contrast', 'Technical', 'Dry', 'Air'];

        data.forEach((row, index) => {
            if (Object.values(row).every(val => val === null || val === '')) return;

            const { name, manufacturer, paintType, colorScheme, stock, rgbCode } = row;

            const missingFields = [];
            if (!name) missingFields.push('name');
            if (!manufacturer) missingFields.push('manufacturer');
            if (!paintType) missingFields.push('paintType');
            if (!colorScheme) missingFields.push('colorScheme');
            if (!stock) missingFields.push('stock');
            
            if (missingFields.length > 0) {
                results.push({ row, data: null, status: 'ERROR', errorMessage: `Missing required fields: ${missingFields.join(', ')}.`, import: false, rowIndex: index });
                return;
            }
            
            const stockNum = parseInt(stock, 10);
            const formattedType = validPaintTypes.find(t => t.toLowerCase() === paintType.trim().toLowerCase());
            
            let errorMessage = '';
            if (isNaN(stockNum) || stockNum < 0) errorMessage = `Invalid stock: "${stock}". Must be a number >= 0.`;
            if (!formattedType) errorMessage += `${errorMessage ? ' ' : ''}Invalid paintType: "${paintType}".`;

            if (errorMessage) {
                results.push({ row, data: null, status: 'ERROR', errorMessage, import: false, rowIndex: index });
                return;
            }

            const isDuplicate = paints.some(p => 
                p.name.trim().toLowerCase() === name.trim().toLowerCase() && 
                p.manufacturer.trim().toLowerCase() === manufacturer.trim().toLowerCase()
            );

            const paintData: Omit<Paint, 'id'> = {
                name: name.trim(),
                manufacturer: manufacturer.trim(),
                paintType: formattedType!,
                colorScheme: colorScheme.trim(),
                stock: stockNum,
                rgbCode: rgbCode || '',
            };

            results.push({ row, data: paintData, status: isDuplicate ? 'DUPLICATE' : 'NEW', import: true, rowIndex: index });
        });

        setPaintValidationResults(results);

        if (results.some(r => r.status === 'ERROR' || r.status === 'DUPLICATE')) {
            setShowPaintReviewModal(true);
        } else {
            finalizePaintImport(results);
        }
    };
    
    const handlePaintDuplicateSelectionChange = (rowIndex: number, shouldImport: boolean) => {
        setPaintValidationResults(prev => prev.map(r => r.rowIndex === rowIndex ? { ...r, import: shouldImport } : r));
    };

    const handleSelectAllPaintDuplicates = (shouldImport: boolean) => {
        setPaintValidationResults(prev => prev.map(r => r.status === 'DUPLICATE' ? { ...r, import: shouldImport } : r));
    };

    const finalizePaintImport = async (results: PaintValidationResult[]) => {
        setShowPaintReviewModal(false);
        setIsImportingPaints(true);
        
        const paintsToAdd: Omit<Paint, 'id'>[] = [];
        let successCount = 0;
        let skippedDuplicatesCount = 0;
        const finalErrors: PaintValidationResult[] = [];

        results.forEach(result => {
            if (result.status === 'ERROR' || !result.import) {
                if (result.status === 'ERROR') finalErrors.push(result);
                if (!result.import && result.status === 'DUPLICATE') skippedDuplicatesCount++;
                return;
            }

            if (result.data) {
                paintsToAdd.push(result.data);
                successCount++;
            }
        });

        try {
            if (paintsToAdd.length > 0) {
                await bulkAddPaints(paintsToAdd);
            }
        } catch (err) {
            addToast('A critical error occurred during paint import.', 'error');
        } finally {
            setPaintImportSummary({ success: successCount, errors: finalErrors.length, skippedDuplicates: skippedDuplicatesCount });
            setPaintImportErrors(finalErrors);
            setShowPaintSummaryModal(true);
            setIsImportingPaints(false);
        }
    };
    
    const closePaintSummaryAndReset = () => {
        setShowPaintSummaryModal(false);
        setSelectedPaintFile(null);
        setPaintValidationResults([]);
        setPaintImportErrors([]);
        const fileInput = document.getElementById('paint-csv-file-input') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
    };

    const duplicates = validationResults.filter(r => r.status === 'DUPLICATE');
    const errorsInReview = validationResults.filter(r => r.status === 'ERROR');
    const paintDuplicates = paintValidationResults.filter(r => r.status === 'DUPLICATE');
    const paintErrorsInReview = paintValidationResults.filter(r => r.status === 'ERROR');

    return (
        <div className="container mx-auto space-y-8">
            <h1 className="text-3xl font-bold text-white mb-6">Bulk Data Management</h1>
            {/* Model Import Card */}
            <div className="bg-surface p-6 rounded-lg shadow-md border border-border">
                <h2 className="text-2xl font-semibold text-white mb-4">Import Models from CSV</h2>
                <div className="text-text-secondary mb-4 space-y-2">
                    <p>
                        Import your model collection by uploading a CSV file. The file must contain the headers:
                        <code className="bg-background text-primary p-1 rounded-md text-sm mx-1">name</code>,
                        <code className="bg-background text-primary p-1 rounded-md text-sm mx-1">game system</code>,
                        <code className="bg-background text-primary p-1 rounded-md text-sm mx-1">army</code>,
                        <code className="bg-background text-primary p-1 rounded-md text-sm mx-1">quantity</code>,
                        <code className="bg-background text-primary p-1 rounded-md text-sm mx-1">status</code>.
                        Optional: <code className="bg-background text-primary p-1 rounded-md text-sm mx-1">painting notes</code>.
                    </p>
                </div>
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
                        {isImporting ? 'Processing...' : 'Import Models'}
                    </button>
                </div>
                 {selectedFile && (
                    <p className="text-text-secondary mt-4">Selected file: {selectedFile.name}</p>
                )}
            </div>
            
            {/* Paint Import Card */}
            <div className="bg-surface p-6 rounded-lg shadow-md border border-border">
                <h2 className="text-2xl font-semibold text-white mb-4">Import Paints from CSV</h2>
                <div className="text-text-secondary mb-4 space-y-2">
                    <p>
                        Import your paint collection from a CSV. Headers must include:
                        <code className="bg-background text-primary p-1 rounded-md text-sm mx-1">name</code>,
                        <code className="bg-background text-primary p-1 rounded-md text-sm mx-1">manufacturer</code>,
                        <code className="bg-background text-primary p-1 rounded-md text-sm mx-1">paintType</code>,
                        <code className="bg-background text-primary p-1 rounded-md text-sm mx-1">colorScheme</code>,
                        <code className="bg-background text-primary p-1 rounded-md text-sm mx-1">stock</code>.
                        Optional: <code className="bg-background text-primary p-1 rounded-md text-sm mx-1">rgbCode</code> (in #RRGGBB or rgb(r,g,b) format).
                    </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-4 items-center">
                    <input
                        id="paint-csv-file-input"
                        type="file"
                        accept=".csv"
                        onChange={handlePaintFileChange}
                        className="block w-full text-sm text-text-secondary file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-white hover:file:bg-indigo-500"
                    />
                    <button
                        onClick={handlePaintImport}
                        disabled={!selectedPaintFile || isImportingPaints}
                        className="w-full sm:w-auto px-6 py-2 bg-green-600 text-white font-semibold rounded-lg shadow-md hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isImportingPaints ? 'Processing...' : 'Import Paints'}
                    </button>
                </div>
                 {selectedPaintFile && (
                    <p className="text-text-secondary mt-4">Selected file: {selectedPaintFile.name}</p>
                )}
            </div>

            {/* Model Review Modal */}
            {showReviewModal && (
                <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50 p-4">
                    <div className="bg-surface rounded-lg shadow-xl p-6 w-full max-w-2xl border border-border max-h-[90vh] flex flex-col">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-bold text-white">Review Model Import</h3>
                            <button onClick={() => setShowReviewModal(false)} className="text-gray-400 hover:text-white"><XIcon /></button>
                        </div>
                        {(newGameSystemsToCreate.length > 0 || newArmiesToCreate.length > 0) && (
                            <div className="mb-4">
                                <h4 className="font-semibold text-green-400 mb-2">The following new items will be created:</h4>
                                <div className="space-y-2 bg-background p-3 rounded-md max-h-40 overflow-y-auto">
                                    {newGameSystemsToCreate.length > 0 && (
                                        <div>
                                            <p className="text-sm font-bold text-text-secondary">Game Systems</p>
                                            <ul className="list-disc list-inside ml-4">{newGameSystemsToCreate.map(name => <li key={name} className="text-sm text-text-primary">{name}</li>)}</ul>
                                        </div>
                                    )}
                                    {newArmiesToCreate.length > 0 && (
                                        <div className="mt-2">
                                            <p className="text-sm font-bold text-text-secondary">Armies</p>
                                            <ul className="list-disc list-inside ml-4">{newArmiesToCreate.map(army => <li key={`${army.gameSystemName}-${army.name}`} className="text-sm text-text-primary">{army.name} ({army.gameSystemName})</li>)}</ul>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                        {errorsInReview.length > 0 && (
                            <div className="mb-4">
                                <h4 className="font-semibold text-red-400 mb-2">The following rows have errors and will not be imported:</h4>
                                <ul className="space-y-2 bg-background p-3 rounded-md max-h-40 overflow-y-auto">
                                    {errorsInReview.map(error => (<li key={error.rowIndex} className="text-sm"><p className="font-semibold">Row {error.rowIndex + 2}: {error.errorMessage}</p></li>))}
                                </ul>
                            </div>
                        )}
                        {duplicates.length > 0 && (
                           <>
                            <p className="text-text-secondary my-4">The following models already exist. Please select which ones you still wish to import.</p>
                            <div className="flex justify-between items-center mb-4 p-2 bg-background rounded-md">
                                <span className="font-semibold">Toggle All Duplicates</span>
                                <div><button onClick={() => handleSelectAllDuplicates(true)} className="text-sm text-green-400 hover:underline mr-4">Select All</button><button onClick={() => handleSelectAllDuplicates(false)} className="text-sm text-red-400 hover:underline">Deselect All</button></div>
                            </div>
                           </>
                        )}
                        <div className="flex-grow overflow-y-auto space-y-2 pr-2">
                            {duplicates.map((result) => (
                                <div key={result.rowIndex} className="flex items-center justify-between p-2 bg-background rounded-md">
                                    <div className="flex items-center">
                                        <input type="checkbox" checked={result.import} onChange={(e) => handleDuplicateSelectionChange(result.rowIndex, e.target.checked)} className="h-5 w-5 rounded border-gray-300 text-primary focus:ring-primary mr-3" />
                                        <div><p className="font-semibold text-text-primary">{result.row.name}</p><p className="text-sm text-text-secondary">{result.row.army} / {result.row['game system']}</p></div>
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
            
            {/* Model Summary Modal */}
            {showSummaryModal && (
                <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50 p-4">
                    <div className="bg-surface rounded-lg shadow-xl p-6 w-full max-w-lg border border-border text-center flex flex-col max-h-[90vh]">
                        <h3 className="text-2xl font-bold text-white mb-4">Model Import Complete</h3>
                        <div className="space-y-3 text-left my-6">
                            <p className="text-lg text-green-400 flex justify-between"><span>Models Imported:</span> <span>{importSummary.success}</span></p>
                            <p className="text-lg text-yellow-400 flex justify-between"><span>Duplicates Skipped:</span> <span>{importSummary.skippedDuplicates}</span></p>
                            <p className="text-lg text-red-400 flex justify-between"><span>Rows with Errors:</span> <span>{importSummary.errors}</span></p>
                        </div>
                        {importErrors.length > 0 && (
                            <div className="text-left mt-2 flex-grow overflow-y-auto">
                                <h4 className="font-semibold text-text-primary mb-2">Error Details:</h4>
                                <ul className="space-y-2 bg-background p-3 rounded-md">
                                    {importErrors.map(error => ( <li key={error.rowIndex} className="text-sm border-b border-border pb-1 last:border-b-0"><p className="text-red-400 font-semibold">Row {error.rowIndex + 2}: {error.errorMessage}</p><p className="text-text-secondary truncate text-xs">Data: {Object.values(error.row).join(', ')}</p></li>))}
                                </ul>
                            </div>
                        )}
                        <button onClick={closeSummaryAndReset} className="mt-6 px-6 py-2 bg-primary text-white font-semibold rounded-lg hover:bg-indigo-500 w-full flex-shrink-0">OK</button>
                    </div>
                </div>
            )}

            {/* Paint Review Modal */}
            {showPaintReviewModal && (
                <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50 p-4">
                    <div className="bg-surface rounded-lg shadow-xl p-6 w-full max-w-2xl border border-border max-h-[90vh] flex flex-col">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-bold text-white">Review Paint Import</h3>
                            <button onClick={() => setShowPaintReviewModal(false)} className="text-gray-400 hover:text-white"><XIcon /></button>
                        </div>
                        {paintErrorsInReview.length > 0 && (
                             <div className="mb-4">
                                <h4 className="font-semibold text-red-400 mb-2">The following rows have errors and will not be imported:</h4>
                                <ul className="space-y-2 bg-background p-3 rounded-md max-h-40 overflow-y-auto">
                                    {paintErrorsInReview.map(error => (<li key={error.rowIndex} className="text-sm"><p className="font-semibold">Row {error.rowIndex + 2}: {error.errorMessage}</p></li>))}
                                </ul>
                            </div>
                        )}
                        {paintDuplicates.length > 0 && (
                           <>
                            <p className="text-text-secondary my-4">The following paints already exist. Please select which ones you still wish to import.</p>
                            <div className="flex justify-between items-center mb-4 p-2 bg-background rounded-md">
                                <span className="font-semibold">Toggle All Duplicates</span>
                                <div><button onClick={() => handleSelectAllPaintDuplicates(true)} className="text-sm text-green-400 hover:underline mr-4">Select All</button><button onClick={() => handleSelectAllPaintDuplicates(false)} className="text-sm text-red-400 hover:underline">Deselect All</button></div>
                            </div>
                           </>
                        )}
                        <div className="flex-grow overflow-y-auto space-y-2 pr-2">
                            {paintDuplicates.map((result) => (
                                <div key={result.rowIndex} className="flex items-center justify-between p-2 bg-background rounded-md">
                                    <div className="flex items-center">
                                        <input type="checkbox" checked={result.import} onChange={(e) => handlePaintDuplicateSelectionChange(result.rowIndex, e.target.checked)} className="h-5 w-5 rounded border-gray-300 text-primary focus:ring-primary mr-3" />
                                        <div><p className="font-semibold text-text-primary">{result.row.name}</p><p className="text-sm text-text-secondary">{result.row.manufacturer}</p></div>
                                    </div>
                                    <span className="text-yellow-400 text-sm font-semibold">DUPLICATE</span>
                                </div>
                            ))}
                        </div>
                        <div className="flex justify-end gap-4 pt-6 flex-shrink-0">
                            <button onClick={() => setShowPaintReviewModal(false)} className="px-4 py-2 bg-gray-600 text-white font-semibold rounded-lg hover:bg-gray-700">Cancel</button>
                            <button onClick={() => finalizePaintImport(paintValidationResults)} className="px-4 py-2 bg-primary text-white font-semibold rounded-lg hover:bg-indigo-500">Confirm Import</button>
                        </div>
                    </div>
                </div>
            )}
            
            {/* Paint Summary Modal */}
            {showPaintSummaryModal && (
                 <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50 p-4">
                    <div className="bg-surface rounded-lg shadow-xl p-6 w-full max-w-lg border border-border text-center flex flex-col max-h-[90vh]">
                        <h3 className="text-2xl font-bold text-white mb-4">Paint Import Complete</h3>
                        <div className="space-y-3 text-left my-6">
                            <p className="text-lg text-green-400 flex justify-between"><span>Paints Imported:</span> <span>{paintImportSummary.success}</span></p>
                            <p className="text-lg text-yellow-400 flex justify-between"><span>Duplicates Skipped:</span> <span>{paintImportSummary.skippedDuplicates}</span></p>
                            <p className="text-lg text-red-400 flex justify-between"><span>Rows with Errors:</span> <span>{paintImportSummary.errors}</span></p>
                        </div>
                        {paintImportErrors.length > 0 && (
                            <div className="text-left mt-2 flex-grow overflow-y-auto">
                                <h4 className="font-semibold text-text-primary mb-2">Error Details:</h4>
                                <ul className="space-y-2 bg-background p-3 rounded-md">
                                    {paintImportErrors.map(error => ( <li key={error.rowIndex} className="text-sm border-b border-border pb-1 last:border-b-0"><p className="text-red-400 font-semibold">Row {error.rowIndex + 2}: {error.errorMessage}</p><p className="text-text-secondary truncate text-xs">Data: {Object.values(error.row).join(', ')}</p></li>))}
                                </ul>
                            </div>
                        )}
                        <button onClick={closePaintSummaryAndReset} className="mt-6 px-6 py-2 bg-primary text-white font-semibold rounded-lg hover:bg-indigo-500 w-full flex-shrink-0">OK</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BulkDataPage;