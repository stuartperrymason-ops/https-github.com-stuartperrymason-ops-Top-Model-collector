/**
 * @file DashboardPage.tsx
 * @description This page provides a visual dashboard of the model collection's status.
 */

import React, { useMemo } from 'react';
import { useData } from '../context/DataContext';
import { Model } from '../types';

// Centralized configuration for statuses to ensure consistency in color, display order, and text contrast.
const statusConfig: { [key in Model['status']]: { color: string; order: number; textColor: string; } } = {
    'Ready to Game': { color: 'bg-green-500', order: 1, textColor: 'text-white' },
    'Based': { color: 'bg-amber-600', order: 2, textColor: 'text-white' },
    'Painted': { color: 'bg-yellow-500', order: 3, textColor: 'text-black' },
    'Primed': { color: 'bg-zinc-400', order: 4, textColor: 'text-black' },
    'Assembled': { color: 'bg-cyan-600', order: 5, textColor: 'text-white' },
    'Printed': { color: 'bg-slate-500', order: 6, textColor: 'text-white' },
    'Purchased': { color: 'bg-gray-500', order: 7, textColor: 'text-white' },
};


const DashboardPage: React.FC = () => {
    const { models, gameSystems, armies, loading, error } = useData();

    // Memoize the calculation of status breakdown to prevent re-computation on every render.
    const statusBreakdown = useMemo(() => {
        if (models.length === 0) return [];
        
        // Count the number of models for each status.
        const counts = models.reduce((acc, model) => {
            acc[model.status] = (acc[model.status] || 0) + 1;
            return acc;
        }, {} as { [key in Model['status']]: number });
        
        // Map the counts to a more usable format for rendering.
        return Object.entries(counts)
            .map(([status, count]) => ({
                status: status as Model['status'],
                count,
                percentage: (count / models.length) * 100,
                ...statusConfig[status as Model['status']],
            }))
            .sort((a, b) => a.order - b.order); // Sort based on the defined order for consistent display.

    }, [models]);
    
    // Memoize progress calculation by game system
    const gameSystemProgress = useMemo(() => {
        return gameSystems.map(system => {
            const systemModels = models.filter(model => model.gameSystemId === system.id);
            const totalModels = systemModels.length;
            if (totalModels === 0) return null;
            
            const readyModels = systemModels.filter(model => model.status === 'Ready to Game').length;
            const percentage = (readyModels / totalModels) * 100;
            return { name: system.name, totalModels, readyModels, percentage };
        }).filter(Boolean); // Remove null entries
    }, [models, gameSystems]);

    // Memoize progress calculation by army
    const armyProgress = useMemo(() => {
        return armies.map(army => {
            const armyModels = models.filter(model => model.armyIds.includes(army.id));
            const totalModels = armyModels.length;
            if (totalModels === 0) return null;

            const readyModels = armyModels.filter(model => model.status === 'Ready to Game').length;
            const percentage = (readyModels / totalModels) * 100;
            const gameSystemName = gameSystems.find(gs => gs.id === army.gameSystemId)?.name || 'Unknown';
            return { name: army.name, gameSystemName, totalModels, readyModels, percentage };
        }).filter(Boolean); // Remove null entries
    }, [models, armies, gameSystems]);

    if (loading) {
        return <div className="flex justify-center items-center h-full"><p>Loading dashboard...</p></div>;
    }

    if (error) {
        return <div className="flex justify-center items-center h-full"><p className="text-red-500">{error}</p></div>;
    }

    return (
        <div className="container mx-auto">
            <h1 className="text-3xl font-bold text-white mb-6">Collection Dashboard</h1>
            
            {models.length > 0 ? (
                <>
                 <div className="bg-surface p-6 rounded-lg shadow-md border border-border">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-semibold text-white">Overall Painting Progress</h2>
                        <span className="text-2xl font-bold text-primary">{models.length} Total Models</span>
                    </div>

                    {/* The main status bar */}
                    <div className="w-full bg-background rounded-full h-8 flex overflow-hidden border border-border my-4" role="progressbar" aria-valuenow={statusBreakdown.find(s => s.status === 'Ready to Game')?.percentage || 0} aria-valuemin={0} aria-valuemax={100}>
                        {statusBreakdown.map(({ status, percentage, color }) => (
                            <div
                                key={status}
                                className={`h-full transition-all duration-500 ease-out ${color}`}
                                style={{ width: `${percentage}%` }}
                                title={`${status}: ${models.filter(m => m.status === status).length} models (${percentage.toFixed(1)}%)`}
                            />
                        ))}
                    </div>

                    {/* Legend */}
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

                <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Progress by Game System */}
                    <div className="bg-surface p-6 rounded-lg shadow-md border border-border">
                        <h2 className="text-xl font-semibold text-white mb-4">Progress by Game System</h2>
                        <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                            {gameSystemProgress.map(progress => (
                                <div key={progress.name}>
                                    <div className="flex justify-between items-baseline mb-1">
                                        <span className="font-bold text-text-primary">{progress.name}</span>
                                        <span className="text-sm text-text-secondary">{progress.readyModels} / {progress.totalModels} ready</span>
                                    </div>
                                    <div className="w-full bg-background rounded-full h-4 border border-border">
                                        <div className="bg-primary h-4 rounded-full" style={{ width: `${progress.percentage}%` }}></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    {/* Progress by Army */}
                    <div className="bg-surface p-6 rounded-lg shadow-md border border-border">
                        <h2 className="text-xl font-semibold text-white mb-4">Progress by Army</h2>
                         <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                            {armyProgress.map(progress => (
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
                            ))}
                        </div>
                    </div>
                </div>
                </>
            ) : (
                <div className="text-center py-16 bg-surface rounded-lg">
                    <p className="text-xl text-text-secondary">No models in your collection yet.</p>
                    <p className="text-text-secondary">Add some models to see your dashboard!</p>
                </div>
            )}
        </div>
    );
};

export default DashboardPage;