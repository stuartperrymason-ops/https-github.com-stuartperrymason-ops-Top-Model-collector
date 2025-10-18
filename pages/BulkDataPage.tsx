/**
 * @file BulkDataPage.tsx
 * @description This page provides functionality for bulk data operations,
 * allowing users to import their collection from a CSV file.
 */

import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { Model } from '../types';
import Papa from 'papaparse';
import { XIcon } from '../components/icons/Icons';

type CsvRow = {
    name: string;
    'game system': string;
    army: string;
    quantity: string;
    status: string;
};

interface ValidationResult {
  row: CsvRow;
  data: Omit<Model, 'id'> | null;
  status: 'NEW' | 'DUPLICATE' | 'ERROR';
  errorMessage?: string;
  import: boolean; // User's choice for duplicates, default true
  rowIndex: number;
}

const BulkDataPage: React.FC = () => {
    const { gameSystems, armies, models, addToast, bulkAddModels } = useData();
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isImporting, setIsImporting] = useState(false);
    
    // State for the new multi-step import process
    const [validationResults, setValidationResults] = useState<ValidationResult[]>([]);
    const [showReviewModal, setShowReviewModal] = useState(false);
    const [showSummaryModal, setShowSummaryModal] = useState(false);
    const [importSummary, setImportSummary] = useState({ success: 0, errors: 0, skippedDuplicates: 0 });
    const [importErrors, setImportErrors] = useState<ValidationResult[]>([]);


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
                validateCsvData(results.data);
            },
            error: (error) => {
                addToast(`CSV parsing failed: ${error.message}`, 'error');
                setIsImporting(false);
            },
        });
    };

    const validateCsvData = (data: CsvRow[]) => {
        const results: ValidationResult[] = [];
        const validStatuses: Model['status'][] = ['Purchased', 'Printed', 'Assembled', 'Primed', 'Painted', 'Based', 'Ready to Game'];

        data.forEach((row, index) => {
            // Defensive check for malformed rows (e.g., from trailing empty lines)
            if (Object.values(row).every(val => val === null || val === '')) {
                return;
            }
            const { name, 'game system': gameSystemName, army: armyName, quantity, status } = row;
            
            if (!name || !gameSystemName || !armyName || !quantity || !status) {
                results.push({ row, data: null, status: 'ERROR', errorMessage: 'Row has missing data.', import: false, rowIndex: index });
                return;
            }

            const gameSystem = gameSystems.find(gs => gs.name.trim().toLowerCase() === gameSystemName.trim().toLowerCase());
            if (!gameSystem) {
                results.push({ row, data: null, status: 'ERROR', errorMessage: `Game system "${gameSystemName}" not found.`, import: false, rowIndex: index });
                return;
            }

            const army = armies.find(a => a.name.trim().toLowerCase() === armyName.trim().toLowerCase() && a.gameSystemId === gameSystem.id);
            if (!army) {
                results.push({ row, data: null, status: 'ERROR', errorMessage: `Army "${armyName}" not found in "${gameSystemName}".`, import: false, rowIndex: index });
                return;
            }
            
            const quantityNum = parseInt(quantity, 10);
            const formattedStatus = validStatuses.find(s => s.toLowerCase() === status.trim().toLowerCase());

            if (isNaN(quantityNum) || quantityNum < 1) {
                results.push({ row, data: null, status: 'ERROR', errorMessage: `Invalid quantity: "${quantity}". Must be a number greater than 0.`, import: false, rowIndex: index });
                return;
            }
            
            if (!formattedStatus) {
                results.push({ row, data: null, status: 'ERROR', errorMessage: `Invalid status: "${status}".`, import: false, rowIndex: index });
                return;
            }
            
            const isDuplicate = models.some(m => m.name.trim().toLowerCase() === name.trim().toLowerCase() && m.armyId === army.id);
            
            const modelData = {
                name: name.trim(),
                gameSystemId: gameSystem.id,
                armyId: army.id,
                quantity: quantityNum,
                status: formattedStatus,
                description: '',
                imageUrl: '',
            };

            results.push({
                row,
                data: modelData,
                status: isDuplicate ? 'DUPLICATE' : 'NEW',
                import: true,
                rowIndex: index
            });
        });

        setValidationResults(results);

        if (results.some(r => r.status === 'DUPLICATE' || r.status === 'ERROR')) {
            const hasDuplicates = results.some(r => r.status === 'DUPLICATE');
            if (hasDuplicates) {
                setShowReviewModal(true);
            } else {
                // If there are only errors, go straight to summary
                finalizeImport(results);
            }
        } else {
            finalizeImport(results);
        }
    };

    const handleDuplicateSelectionChange = (rowIndex: number, shouldImport: boolean) => {
        setValidationResults(prev => prev.map(r => r.rowIndex === rowIndex ? { ...r, import: shouldImport } : r));
    };

    const handleSelectAllDuplicates = (shouldImport: boolean) => {
        setValidationResults(prev => prev.map(r => r.status === 'DUPLICATE' ? { ...r, import: shouldImport } : r));
    };

    const finalizeImport = async (results: ValidationResult[]) => {
        const modelsToAdd: Omit<Model, 'id'>[] = [];
        let successCount = 0;
        let skippedDuplicatesCount = 0;
        const errors: ValidationResult[] = [];

        results.forEach(result => {
            if (result.status === 'ERROR') {
                errors.push(result);
            } else if (result.import && result.data) {
                modelsToAdd.push(result.data);
                successCount++;
            } else if (result.status === 'DUPLICATE' && !result.import) {
                skippedDuplicatesCount++;
            }
        });
        
        if (modelsToAdd.length > 0) {
            await bulkAddModels(modelsToAdd);
        }
        
        setImportSummary({
            success: successCount,
            errors: errors.length,
            skippedDuplicates: skippedDuplicatesCount
        });
        setImportErrors(errors);
        
        // Close review modal and open summary modal
        setShowReviewModal(false);
        setShowSummaryModal(true);
        setIsImporting(false);
    };

    const closeSummaryAndReset = () => {
        setShowSummaryModal(false);
        setSelectedFile(null);
        setValidationResults([]);
        setImportErrors([]);
        const fileInput = document.getElementById('csv-file-input') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
    };

    const duplicates = validationResults.filter(r => r.status === 'DUPLICATE');
    const errorsInReview = validationResults.filter(r => r.status === 'ERROR');

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
                        <code className="bg-background text-primary p-1 rounded-md text-sm mx-1">quantity</code>, and
                        <code className="bg-background text-primary p-1 rounded-md text-sm mx-1">status</code>.
                    </p>
                    <p>
                        The <code className="bg-background text-primary p-1 rounded-md text-sm mx-1">status</code> column must contain one of the following values (case-insensitive): Purchased, Printed, Assembled, Primed, Painted, Based, Ready to Game.
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
                        {isImporting ? 'Processing...' : 'Import CSV'}
                    </button>
                </div>
                 {selectedFile && (
                    <p className="text-text-secondary mt-4">Selected file: {selectedFile.name}</p>
                )}
            </div>

            {/* Review Duplicates Modal */}
            {showReviewModal && (
                <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50 p-4">
                    <div className="bg-surface rounded-lg shadow-xl p-6 w-full max-w-2xl border border-border max-h-[90vh] flex flex-col">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-bold text-white">Review Import</h3>
                            <button onClick={() => setShowReviewModal(false)} className="text-gray-400 hover:text-white"><XIcon /></button>
                        </div>
                        
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
                        
                        {duplicates.length > 0 && (
                           <>
                            <p className="text-text-secondary mb-4">The following models already exist in your collection. Please select the ones you still wish to import.</p>
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
                            <button onClick={() => finalizeImport(validationResults)} className="px-4 py-2 bg-primary text-white font-semibold rounded-lg hover:bg-indigo-500">Confirm Import</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Import Summary Modal */}
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