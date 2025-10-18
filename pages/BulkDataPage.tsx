/**
 * @file BulkDataPage.tsx
 * @description This page provides functionality for bulk data operations,
 * allowing users to import or export their entire collection as JSON.
 */

import React, { useState } from 'react';
import { useData } from '../context/DataContext';

const BulkDataPage: React.FC = () => {
    const { models, armies, gameSystems, addToast } = useData();
    const [jsonData, setJsonData] = useState('');

    // This is a placeholder for a real import function. In a real app,
    // this would involve complex logic to validate and merge data,
    // likely calling multiple API endpoints.
    const handleImport = () => {
        try {
            const data = JSON.parse(jsonData);
            // Basic validation
            if (!data.gameSystems || !data.armies || !data.models) {
                throw new Error('Invalid JSON format. Must contain gameSystems, armies, and models arrays.');
            }
            console.log('Importing data:', data);
            // Here you would typically send this data to the backend to be processed.
            addToast('Data import started! (This is a demo)', 'success');
        } catch (error) {
            console.error('Import failed:', error);
            if (error instanceof Error) {
                addToast(`Import failed: ${error.message}`, 'error');
            } else {
                addToast('Import failed: Invalid JSON data.', 'error');
            }
        }
    };

    const handleExport = () => {
        const data = {
            gameSystems,
            armies,
            models,
        };
        const dataStr = JSON.stringify(data, null, 2);
        setJsonData(dataStr);
        addToast('Data exported to text area!', 'success');
    };
    
    const handleCopyToClipboard = () => {
        navigator.clipboard.writeText(jsonData).then(() => {
            addToast('Copied to clipboard!', 'success');
        }, (err) => {
            addToast('Failed to copy to clipboard.', 'error');
            console.error('Could not copy text: ', err);
        });
    };

    return (
        <div className="container mx-auto">
            <h1 className="text-3xl font-bold text-white mb-6">Bulk Data Management</h1>
            <div className="bg-surface p-6 rounded-lg shadow-md border border-border">
                <p className="text-text-secondary mb-4">
                    You can export your entire collection to JSON format or import data from a JSON structure.
                    This is useful for backups or migrating your collection.
                </p>
                <div className="mb-4">
                    <textarea
                        className="w-full h-80 p-3 bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary font-mono text-sm"
                        value={jsonData}
                        onChange={(e) => setJsonData(e.target.value)}
                        placeholder='Paste your JSON data here to import, or click "Export My Data" to generate it.'
                    />
                </div>
                <div className="flex flex-col sm:flex-row gap-4">
                    <button
                        onClick={handleExport}
                        className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 transition-colors"
                    >
                        Export My Data
                    </button>
                    <button
                        onClick={handleImport}
                        className="px-6 py-2 bg-green-600 text-white font-semibold rounded-lg shadow-md hover:bg-green-700 transition-colors"
                    >
                        Import This Data (Demo)
                    </button>
                    <button
                        onClick={handleCopyToClipboard}
                        disabled={!jsonData}
                        className="px-6 py-2 bg-gray-600 text-white font-semibold rounded-lg shadow-md hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Copy to Clipboard
                    </button>
                </div>
            </div>
        </div>
    );
};

export default BulkDataPage;
