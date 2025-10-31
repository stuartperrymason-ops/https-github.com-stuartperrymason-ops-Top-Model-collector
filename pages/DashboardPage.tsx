/**
 * @file DashboardPage.tsx
 * @description This page provides a visual dashboard of the model collection's status,
 * showing overall progress and breakdowns by game system and army.
 * This program was written by Stuart Mason October 2025.
 */

import React, { useMemo, useState, useEffect } from 'react';
import { useData } from '../context/DataContext';
import { Model } from '../types';

// Centralized configuration for statuses. This object makes it easy to manage the color,
// display order, and text contrast for each status type, ensuring consistency across the UI.
const statusConfig: { [key in Model['status']]: { color: string; order: number; textColor: string; } } = {
    'Ready to Game': { color: 'bg-green-500', order: 1, textColor: 'text-white' },
    'Based': { color: 'bg-amber-600', order: 2, textColor: 'text-white' },
    'Painted': { color: 'bg-yellow-500', order: 3, textColor: 'text-black' },
    'Primed': { color: 'bg-zinc-400', order: 4, textColor: 'text-black' },
    'Assembled': { color: 'bg-cyan-600', order: 5, textColor: 'text-white' },
    'Printed': { color: 'bg-slate-500', order: 6, textColor: 'text-white' },
    'Purchased': { color: 'bg-gray-500', order: 7, textColor: 'text-white' },
};

// Define which statuses are considered "ready" for progress calculations.
const readyStatuses: Model['status'][] = ['Ready to Game', 'Based', 'Painted'];


const DashboardPage: React.FC = () => {
    // Fetch all necessary data from the global context.
    const { models, gameSystems, armies, paints, minStockThreshold, loading, error } = useData();
    
    // State for filter controls.
    const [gameSystemFilter, setGameSystemFilter] = useState<string>('');
    const [armyFilter, setArmyFilter] = useState<string>('');

    // Memoized calculation for armies available in the dropdown, based on the selected game system.
    const availableArmies = useMemo(() => {
        if (!gameSystemFilter) return armies;
        return armies.filter(army => army.gameSystemId === gameSystemFilter);
    }, [armies, gameSystemFilter]);

    // This effect ensures that if a game system is selected that doesn't contain the currently
    // selected army, the army filter is reset. This prevents an inconsistent UI state.
    useEffect(() => {
        if (armyFilter && !availableArmies.some(a => a.id === armyFilter)) {
            setArmyFilter('');
        }
    }, [availableArmies, armyFilter]);

    // Memoized filtering logic for models.
    const filteredModels = useMemo(() => {
        return models
            .filter(model => !gameSystemFilter || model.gameSystemId === gameSystemFilter)
            .filter(model => !armyFilter || model.armyIds.includes(armyFilter));
    }, [models, gameSystemFilter, armyFilter]);


    // Memoize the calculation of the overall status breakdown. `useMemo` is crucial here for performance,
    // as it prevents this potentially expensive calculation from re-running on every render,
    // only recalculating when the `filteredModels` array changes.
    const statusBreakdown = useMemo(() => {
        if (filteredModels.length === 0) return [];
        
        // Step 1: Count the number of models for each status using `reduce`.
        // FIX: The original `reduce` had a typing issue. By explicitly providing the generic
        // type to `reduce`, we ensure the accumulator `acc` is correctly typed as
        // `Record<string, number>`, allowing arithmetic operations on its properties.
        const counts = filteredModels.reduce<Record<string, number>>((acc, model) => {
            const status = model.status;
            acc[status] = (acc[status] || 0) + 1;
            return acc;
        }, {});
        
        // Step 2: Map the counts to a more usable format for rendering, including percentages and style info.
        return Object.entries(counts)
            .map(([status, count]) => ({
                status: status as Model['status'],
                count,
                percentage: (count / filteredModels.length) * 100,
                ...statusConfig[status as Model['status']], // Merge in color and order from the config.
            }))
            .sort((a, b) => a.order - b.order); // Sort based on the defined order for a consistent display.

    }, [filteredModels]);
    
    // Memoize the calculation of paints that are at or below the minimum stock threshold.
    const lowStockPaints = useMemo(() => {
        if (minStockThreshold < 0) return []; // Should not happen, but defensive check
        return paints
            .filter(paint => paint.stock <= minStockThreshold)
            .sort((a, b) => a.stock - b.stock); // Sort by stock, lowest first
    }, [paints, minStockThreshold]);

    // Memoize the calculation of "Ready to Game" progress for each game system.
    // All calculations are based on the currently filtered models for a fully reactive dashboard.
    const gameSystemProgress = useMemo(() => {
        const systemsToDisplay = gameSystemFilter
            ? gameSystems.filter(gs => gs.id === gameSystemFilter)
            : gameSystems;

        return systemsToDisplay.map(system => {
            const systemModelsInFilter = filteredModels.filter(model => model.gameSystemId === system.id);
            const totalModels = systemModelsInFilter.length;

            if (totalModels === 0) return null;
            
            const readyModels = systemModelsInFilter.filter(model => readyStatuses.includes(model.status)).length;
            const percentage = (readyModels / totalModels) * 100;

            return { name: system.name, totalModels, readyModels, percentage };
        }).filter((p): p is NonNullable<typeof p> => p !== null);
    }, [filteredModels, gameSystems, gameSystemFilter]);

    // Memoize the calculation of "Ready to Game" progress for each army.
    // All calculations are based on the currently filtered models for a fully reactive dashboard.
    const armyProgress = useMemo(() => {
        const armiesToDisplay = armyFilter
            ? armies.filter(a => a.id === armyFilter)
            : gameSystemFilter
            ? armies.filter(a => a.gameSystemId === gameSystemFilter)
            : armies;

        return armiesToDisplay.map(army => {
            const armyModelsInFilter = filteredModels.filter(model => model.armyIds.includes(army.id));
            const totalModels = armyModelsInFilter.length;

            if (totalModels === 0) return null;

            const readyModels = armyModelsInFilter.filter(model => readyStatuses.includes(model.status)).length;
            const percentage = (readyModels / totalModels) * 100;
            const gameSystemName = gameSystems.find(gs => gs.id === army.gameSystemId)?.name || 'Unknown';
            return { name: army.name, gameSystemName, totalModels, readyModels, percentage };
        }).filter((p): p is NonNullable<typeof p> => p !== null);
    }, [filteredModels, armies, gameSystems, armyFilter, gameSystemFilter]);

    // Show a loading message while data is being fetched.
    if (loading) {
        return <div className="flex justify-center items-center h-full"><p>Loading dashboard...</p></div>;
    }

    // Show an error message if data fetching failed.
    if (error) {
        return <div className="flex justify-center items-center h-full"><p className="text-red-500">{error}</p></div>;
    }

    const handleResetFilters = () => {
        setGameSystemFilter('');
        setArmyFilter('');
    }

    return (
        <div className="container mx-auto">
            <h1 className="text-3xl font-bold text-white mb-6">Collection Dashboard</h1>
            
            {/* Filter controls section */}
            <div className="mb-6 p-4 bg-surface rounded-lg shadow-md flex flex-col sm:flex-row gap-4">
                <select
                    value={gameSystemFilter}
                    onChange={e => setGameSystemFilter(e.target.value)}
                    className="flex-grow bg-background border border-border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                >
                    <option value="">All Game Systems</option>
                    {gameSystems.map(gs => <option key={gs.id} value={gs.id}>{gs.name}</option>)}
                </select>
                <select
                    value={armyFilter}
                    onChange={e => setArmyFilter(e.target.value)}
                    className="flex-grow bg-background border border-border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                    disabled={availableArmies.length === 0}
                >
                    <option value="">All Armies</option>
                    {availableArmies.map(army => <option key={army.id} value={army.id}>{army.name}</option>)}
                </select>
                <button
                    onClick={handleResetFilters}
                    className="px-4 py-2 bg-gray-600 text-white font-semibold rounded-lg hover:bg-gray-700 transition-colors"
                >
                    Reset
                </button>
            </div>

            {/* Low Stock Alerts Card (moved to bottom of page) */}

            {/* Conditionally render the dashboard content only if there are models to display. */}
            {models.length > 0 ? (
                <>
                 {/* Overall Progress Card */}
                 <div className="bg-surface p-6 rounded-lg shadow-md border border-border">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-semibold text-white">Overall Painting Progress</h2>
                        <span className="text-2xl font-bold text-primary">{filteredModels.length} Total Models</span>
                    </div>

                    {/* The main status bar is a flex container. Each status is a div whose width
                        is set by its percentage of the total, creating a stacked progress bar effect. */}
                    <div className="w-full bg-background rounded-full h-8 flex overflow-hidden border border-border my-4" role="progressbar" aria-valuenow={statusBreakdown.find(s => s.status === 'Ready to Game')?.percentage || 0} aria-valuemin={0} aria-valuemax={100}>
                        {statusBreakdown.map(({ status, percentage, color }) => (
                            <div
                                key={status}
                                className={`h-full transition-all duration-500 ease-out ${color}`}
                                style={{ width: `${percentage}%` }}
                                title={`${status}: ${filteredModels.filter(m => m.status === status).length} models (${percentage.toFixed(1)}%)`}
                            />
                        ))}
                    </div>

                    {/* Legend for the status bar */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mt-6">
                        {statusBreakdown.map(({ status, count, percentage, color }) => (
                            <div key={status} className="flex items-center">
                                <span className={`w-4 h-4 rounded-full mr-3 ${color}`} />
                                <div>
                                    <p className="font-semibold text-text-primary">{status}</p>
                                    <p className="text-sm text-text-secondary">{count} models ({percentage.toFixed(1)}%)</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Grid for breakdown cards */}
                <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Progress by Game System Card */}
                    <div className="bg-surface p-6 rounded-lg shadow-md border border-border">
                        <h2 className="text-xl font-semibold text-white mb-4">Progress by Game System</h2>
                        <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                            {gameSystemProgress.length > 0 ? gameSystemProgress.map(progress => (
                                <div key={progress.name}>
                                    <div className="flex justify-between items-baseline mb-1">
                                        <span className="font-bold text-text-primary">{progress.name}</span>
                                        <span className="text-sm text-text-secondary">{progress.readyModels} / {progress.totalModels} ready</span>
                                    </div>
                                    <div className="w-full bg-background rounded-full h-4 border border-border">
                                        <div className="bg-primary h-4 rounded-full" style={{ width: `${progress.percentage}%` }}></div>
                                    </div>
                                </div>
                            )) : <p className="text-text-secondary">No systems with models match the current filter.</p>}
                        </div>
                    </div>
                    {/* Progress by Army Card */}
                    <div className="bg-surface p-6 rounded-lg shadow-md border border-border">
                        <h2 className="text-xl font-semibold text-white mb-4">Progress by Army</h2>
                         <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                             {armyProgress.length > 0 ? armyProgress.map(progress => (
                                <div key={`${progress.gameSystemName}-${progress.name}`}>
                                    <div className="flex justify-between items-baseline mb-1">
                                        <div>
                                            <p className="font-bold text-text-primary">{progress.name}</p>
                                            <p className="text-xs text-gray-400">{progress.gameSystemName}</p>
                                        </div>
                                        <span className="text-sm text-text-secondary">{progress.readyModels} / {progress.totalModels} ready</span>
                                    </div>
                                    <div className="w-full bg-background rounded-full h-4 border border-border">
                                        <div className="bg-primary h-4 rounded-full" style={{ width: `${progress.percentage}%` }}></div>
                                    </div>
                                </div>
                            )) : <p className="text-text-secondary">No armies with models match the current filter.</p>}
                        </div>
                    </div>
                </div>
                </>
            ) : (
                <div className="text-center py-16 bg-surface rounded-lg border border-border">
                    <div className="flex justify-center mb-4">
                        <svg className="w-16 h-16 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                    </div>
                    <h3 className="text-xl font-semibold text-text-primary">
                        {models.length === 0
                            ? "Your Dashboard is Empty"
                            : "No Data for Current Filters"
                        }
                    </h3>
                    <p className="text-text-secondary mt-2">
                        {models.length === 0
                            ? "Add models to your collection to see your progress here."
                            : "Try adjusting or resetting your filters to see your stats."
                        }
                    </p>
                </div>
            )}

            {/* Low Stock Alerts Card (moved to bottom of page) */}
            {lowStockPaints.length > 0 && (
                <div className="mt-8 mb-12 bg-yellow-900/50 border border-yellow-600 p-6 rounded-lg shadow-md">
                    <h2 className="text-xl font-semibold text-yellow-300 mb-4">Low Stock Alerts</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {lowStockPaints.map(paint => (
                            <div key={paint.id} className="bg-surface p-3 rounded-md">
                                <p className="font-bold text-white truncate" title={paint.name}>{paint.name}</p>
                                <p className="text-sm text-text-secondary">{paint.manufacturer}</p>
                                <p className="text-lg font-bold text-red-500 mt-1">Stock: {paint.stock}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default DashboardPage;