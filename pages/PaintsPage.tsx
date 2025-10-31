/**
 * @file PaintsPage.tsx
 * @description This page allows users to manage their collection of hobby paints.
 * This program was written by Stuart Mason October 2025.
 */

import React, { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { Paint } from '../types';
import { PlusIcon, PencilIcon, TrashIcon, XIcon } from '../components/icons/Icons';

// Helper to check if a string is a valid 6-digit hex color code.
const isValidHex = (color: string) => /^#[0-9a-f]{6}$/i.test(color);

// A local modal component for editing a Paint.
const PaintEditModal: React.FC<{
    paint: Paint;
    onClose: () => void;
    onSave: (id: string, updates: Partial<Omit<Paint, 'id'>>) => void;
}> = ({ paint, onClose, onSave }) => {
    const [formData, setFormData] = useState<Omit<Paint, 'id'>>(paint);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        const isNumber = type === 'number';
        setFormData(prev => ({ ...prev, [name]: isNumber ? parseInt(value, 10) || 0 : value }));
    };

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(paint.id, formData);
        onClose();
    };

    const paintTypes: Paint['paintType'][] = ['Primer', 'Wash', 'Base', 'Layer', 'Shade', 'Contrast', 'Technical', 'Dry', 'Air', 'Metallic'];

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50 p-4">
            <div className="bg-surface rounded-lg shadow-xl p-6 w-full max-w-md border border-border">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-white">Edit Paint</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-white"><XIcon /></button>
                </div>
                <form onSubmit={handleSave} className="space-y-4">
                     <div>
                        <label htmlFor="edit-name" className="block text-sm font-medium text-text-secondary mb-1">Paint Name</label>
                        <input id="edit-name" name="name" type="text" value={formData.name} onChange={handleChange} required className="w-full bg-background border border-border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary" />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="edit-manufacturer" className="block text-sm font-medium text-text-secondary mb-1">Manufacturer</label>
                            <input id="edit-manufacturer" name="manufacturer" type="text" value={formData.manufacturer} onChange={handleChange} required className="w-full bg-background border border-border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary" />
                        </div>
                        <div>
                            <label htmlFor="edit-paintType" className="block text-sm font-medium text-text-secondary mb-1">Type</label>
                            <select id="edit-paintType" name="paintType" value={formData.paintType} onChange={handleChange} required className="w-full bg-background border border-border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary">
                                {paintTypes.map(type => <option key={type} value={type}>{type}</option>)}
                            </select>
                        </div>
                    </div>
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="edit-colorScheme" className="block text-sm font-medium text-text-secondary mb-1">Color Scheme</label>
                            <input id="edit-colorScheme" name="colorScheme" type="text" value={formData.colorScheme} onChange={handleChange} required className="w-full bg-background border border-border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary" />
                        </div>
                        <div>
                            <label htmlFor="edit-stock" className="block text-sm font-medium text-text-secondary mb-1">Stock</label>
                            <input id="edit-stock" name="stock" type="number" value={formData.stock} onChange={handleChange} required min="0" className="w-full bg-background border border-border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary" />
                        </div>
                    </div>
                    <div className="flex items-end gap-2">
                         <div className="flex-grow">
                            <label htmlFor="edit-rgbCode" className="block text-sm font-medium text-text-secondary mb-1">Hex or RGB Code</label>
                            <input id="edit-rgbCode" name="rgbCode" type="text" value={formData.rgbCode || ''} onChange={handleChange} placeholder="#RRGGBB or rgb(r,g,b)" className="w-full bg-background border border-border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary" />
                        </div>
                        <input type="color" value={isValidHex(formData.rgbCode || '') ? formData.rgbCode! : '#ffffff'} onChange={(e) => handleChange({ ...e, target: { ...e.target, name: 'rgbCode', value: e.target.value }})} className="h-10 w-12 p-1 bg-background border border-border rounded-md cursor-pointer"/>
                    </div>
                    <div className="flex justify-end gap-4 mt-6">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-600 text-white font-semibold rounded-lg hover:bg-gray-700">Cancel</button>
                        <button type="submit" className="px-4 py-2 bg-primary text-white font-semibold rounded-lg hover:bg-indigo-500">Save Changes</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const PaintsPage: React.FC = () => {
    const { paints, addPaint, updatePaint, deletePaint, bulkUpdatePaints, bulkDeletePaints, minStockThreshold, loading, error } = useData();
    const defaultPaint: Omit<Paint, 'id'> = {
        name: '',
        paintType: 'Base',
        manufacturer: '',
        colorScheme: '',
        rgbCode: '#ffffff',
        stock: 1,
    };
    const [newPaint, setNewPaint] = useState(defaultPaint);
    const [editingPaint, setEditingPaint] = useState<Paint | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [manufacturerFilter, setManufacturerFilter] = useState('');
    const [typeFilter, setTypeFilter] = useState('');
    const [colorSchemeFilter, setColorSchemeFilter] = useState('');
    const [sortOption, setSortOption] = useState<string>('name-asc');
    
    // State for bulk actions
    const [isBulkEditMode, setIsBulkEditMode] = useState(false);
    const [selectedPaintIds, setSelectedPaintIds] = useState<string[]>([]);
    const [bulkStockValue, setBulkStockValue] = useState<number>(1);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        const isNumber = type === 'number';
        setNewPaint({ ...newPaint, [name]: isNumber ? parseInt(value, 10) || 0 : value });
    };

    const handleAddPaint = (e: React.FormEvent) => {
        e.preventDefault();
        if (newPaint.name.trim() && newPaint.manufacturer.trim() && newPaint.colorScheme.trim()) {
            addPaint(newPaint);
            setNewPaint(defaultPaint);
        }
    };

    const handleDeletePaint = (paint: Paint) => {
        if (window.confirm(`Are you sure you want to delete "${paint.name}"?`)) {
            deletePaint(paint.id);
        }
    };

    // --- Bulk Action Handlers ---
    const toggleBulkEditMode = () => {
        setIsBulkEditMode(prev => !prev);
        setSelectedPaintIds([]);
    };

    const handleSelectPaint = (paintId: string) => {
        setSelectedPaintIds(prev =>
            prev.includes(paintId)
                ? prev.filter(id => id !== paintId)
                : [...prev, paintId]
        );
    };

    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            setSelectedPaintIds(sortedAndFilteredPaints.map(p => p.id));
        } else {
            setSelectedPaintIds([]);
        }
    };

    const handleBulkUpdateStock = async () => {
        if (bulkStockValue < 0) {
            alert("Stock cannot be negative.");
            return;
        }
        await bulkUpdatePaints(selectedPaintIds, { stock: bulkStockValue });
        toggleBulkEditMode();
    };

    const handleBulkDelete = async () => {
        if (window.confirm(`Are you sure you want to delete ${selectedPaintIds.length} paints?`)) {
            await bulkDeletePaints(selectedPaintIds);
            toggleBulkEditMode();
        }
    };

    const uniqueManufacturers = useMemo(() => [...new Set(paints.map(p => p.manufacturer).sort())], [paints]);
    const uniqueColorSchemes = useMemo(() => [...new Set(paints.map(p => p.colorScheme).sort())], [paints]);
    const paintTypes: Paint['paintType'][] = ['Primer', 'Wash', 'Base', 'Layer', 'Shade', 'Contrast', 'Technical', 'Dry', 'Air', 'Metallic'];

    const sortedAndFilteredPaints = useMemo(() => {
        const filtered = paints
            .filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
            .filter(p => !manufacturerFilter || p.manufacturer === manufacturerFilter)
            .filter(p => !typeFilter || p.paintType === typeFilter)
            .filter(p => !colorSchemeFilter || p.colorScheme === colorSchemeFilter);

        const sortable = [...filtered];

        sortable.sort((a, b) => {
            switch (sortOption) {
                case 'name-asc':
                    return a.name.localeCompare(b.name);
                case 'name-desc':
                    return b.name.localeCompare(a.name);
                case 'manufacturer-asc':
                    return a.manufacturer.localeCompare(b.manufacturer);
                case 'manufacturer-desc':
                    return b.manufacturer.localeCompare(a.manufacturer);
                case 'colorScheme-asc':
                    return a.colorScheme.localeCompare(b.colorScheme);
                case 'colorScheme-desc':
                    return b.colorScheme.localeCompare(a.colorScheme);
                case 'type-asc':
                    return a.paintType.localeCompare(b.paintType);
                case 'type-desc':
                    return b.paintType.localeCompare(a.paintType);
                case 'stock-desc':
                    return b.stock - a.stock;
                case 'stock-asc':
                    return a.stock - b.stock;
                default:
                    return a.name.localeCompare(b.name);
            }
        });

        return sortable;
    }, [paints, searchQuery, manufacturerFilter, typeFilter, colorSchemeFilter, sortOption]);

    if (loading) return <div className="flex justify-center items-center h-full"><p>Loading paints...</p></div>;
    if (error) return <div className="flex justify-center items-center h-full"><p className="text-red-500">{error}</p></div>;

    return (
        <div className="container mx-auto pb-20">
            <header className="mb-6 flex flex-col sm:flex-row justify-between items-center gap-4">
                <h1 className="text-3xl font-bold text-white">Paint Collection</h1>
                <button
                    onClick={toggleBulkEditMode}
                    className={`px-4 py-2 font-semibold rounded-lg shadow-md transition duration-300 ${isBulkEditMode ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-surface hover:bg-gray-700 text-text-primary border border-border'}`}
                >
                    {isBulkEditMode ? 'Cancel Bulk Edit' : 'Bulk Edit Stock'}
                </button>
            </header>
            
            {/* Add Paint Form Card */}
            <div className="bg-surface p-6 rounded-lg shadow-md border border-border mb-8">
                <h2 className="text-2xl font-semibold text-white mb-4">Add New Paint</h2>
                <form onSubmit={handleAddPaint} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
                        <input name="name" type="text" value={newPaint.name} onChange={handleInputChange} placeholder="Paint Name" required className="lg:col-span-2 bg-background border border-border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary" />
                        <input name="manufacturer" type="text" value={newPaint.manufacturer} onChange={handleInputChange} placeholder="Manufacturer" required className="bg-background border border-border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary" />
                        <select name="paintType" value={newPaint.paintType} onChange={handleInputChange} required className="bg-background border border-border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary">
                             {paintTypes.map(type => <option key={type} value={type}>{type}</option>)}
                        </select>
                        <input name="colorScheme" type="text" value={newPaint.colorScheme} onChange={handleInputChange} placeholder="Color Scheme" required className="bg-background border border-border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary" />
                        <input name="stock" type="number" value={newPaint.stock} onChange={handleInputChange} placeholder="Stock" required min="0" className="bg-background border border-border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary" />
                    </div>
                    <div className="flex items-end gap-4">
                        <div className="flex-grow max-w-xs">
                             <label htmlFor="rgbCode" className="block text-sm font-medium text-text-secondary mb-1">Hex or RGB Code (optional)</label>
                             <input id="rgbCode" name="rgbCode" type="text" value={newPaint.rgbCode} onChange={handleInputChange} placeholder="#RRGGBB or rgb(r,g,b)" className="w-full bg-background border border-border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary" />
                        </div>
                        <input type="color" value={isValidHex(newPaint.rgbCode || '') ? newPaint.rgbCode! : '#ffffff'} onChange={(e) => handleInputChange({ ...e, target: { ...e.target, name: 'rgbCode', value: e.target.value }})} className="h-10 w-12 p-1 bg-background border border-border rounded-md cursor-pointer"/>
                        <button type="submit" className="flex-grow md:flex-grow-0 flex items-center justify-center gap-2 px-6 py-2 bg-primary text-white font-semibold rounded-lg shadow-md hover:opacity-80 transition-opacity">
                            <PlusIcon /> Add Paint
                        </button>
                    </div>
                </form>
            </div>

            {/* Filters */}
            <div className="mb-6 p-4 bg-surface rounded-lg shadow-md flex flex-col lg:flex-row gap-4">
                <input type="text" placeholder="Search by name..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="flex-grow bg-background border border-border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary" />
                <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
                    <select value={manufacturerFilter} onChange={e => setManufacturerFilter(e.target.value)} className="bg-background border border-border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary sm:w-1/2 lg:w-auto">
                        <option value="">All Manufacturers</option>
                        {uniqueManufacturers.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                    <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="bg-background border border-border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary sm:w-1/2 lg:w-auto">
                        <option value="">All Types</option>
                        {paintTypes.map(type => <option key={type} value={type}>{type}</option>)}
                    </select>
                    <select value={colorSchemeFilter} onChange={e => setColorSchemeFilter(e.target.value)} className="bg-background border border-border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary sm:w-1/2 lg:w-auto">
                        <option value="">All Color Schemes</option>
                        {uniqueColorSchemes.map(cs => <option key={cs} value={cs}>{cs}</option>)}
                    </select>
                    <select
                        value={sortOption}
                        onChange={e => setSortOption(e.target.value)}
                        className="bg-background border border-border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary w-full lg:w-auto"
                    >
                        <option value="name-asc">Sort: Name (A-Z)</option>
                        <option value="name-desc">Sort: Name (Z-A)</option>
                        <option value="manufacturer-asc">Sort: Manufacturer (A-Z)</option>
                        <option value="manufacturer-desc">Sort: Manufacturer (Z-A)</option>
                        <option value="colorScheme-asc">Sort: Color Scheme (A-Z)</option>
                        <option value="colorScheme-desc">Sort: Color Scheme (Z-A)</option>
                        <option value="type-asc">Sort: Type (A-Z)</option>
                        <option value="type-desc">Sort: Type (Z-A)</option>
                        <option value="stock-desc">Sort: Stock (High-Low)</option>
                        <option value="stock-asc">Sort: Stock (Low-High)</option>
                    </select>
                </div>
            </div>

            {/* Paint List */}
            <div className="bg-surface p-2 rounded-lg shadow-md border border-border">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="border-b border-border">
                            <tr>
                                {isBulkEditMode && (
                                    <th className="p-4 w-12">
                                        <input
                                            type="checkbox"
                                            className="h-5 w-5 rounded border-gray-300 text-primary focus:ring-primary bg-surface"
                                            onChange={handleSelectAll}
                                            checked={sortedAndFilteredPaints.length > 0 && selectedPaintIds.length === sortedAndFilteredPaints.length}
                                        />
                                    </th>
                                )}
                                <th className="p-4">Color</th>
                                <th className="p-4">Name</th>
                                <th className="p-4 hidden sm:table-cell">Manufacturer</th>
                                <th className="p-4 hidden md:table-cell">Type</th>
                                <th className="p-4 hidden lg:table-cell">Color Scheme</th>
                                <th className="p-4">Stock</th>
                                <th className="p-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sortedAndFilteredPaints.map(paint => {
                                const isLowStock = paint.stock <= minStockThreshold;
                                return (
                                <tr key={paint.id} className={`border-b border-border last:border-b-0 hover:bg-background ${isBulkEditMode ? 'cursor-pointer' : ''}`} onClick={() => isBulkEditMode && handleSelectPaint(paint.id)}>
                                    {isBulkEditMode && (
                                        <td className="p-4">
                                             <input
                                                type="checkbox"
                                                className="h-5 w-5 rounded border-gray-300 text-primary focus:ring-primary bg-surface pointer-events-none"
                                                checked={selectedPaintIds.includes(paint.id)}
                                                readOnly
                                            />
                                        </td>
                                    )}
                                    <td className="p-4">
                                        <div className="w-8 h-8 rounded-full border-2 border-background" style={{ backgroundColor: paint.rgbCode || '#888' }} title={paint.rgbCode}></div>
                                    </td>
                                    <td className="p-4 font-semibold">{paint.name}</td>
                                    <td className="p-4 hidden sm:table-cell">{paint.manufacturer}</td>
                                    <td className="p-4 hidden md:table-cell">{paint.paintType}</td>
                                    <td className="p-4 hidden lg:table-cell">{paint.colorScheme}</td>
                                    <td className={`p-4 font-semibold ${isLowStock ? 'text-red-500' : ''}`} title={isLowStock ? `Stock is at or below threshold (${minStockThreshold})` : ''}>
                                        {paint.stock}
                                    </td>
                                    <td className="p-4">
                                        <div className="flex justify-end gap-2">
                                            <button disabled={isBulkEditMode} onClick={() => setEditingPaint(paint)} className="text-blue-400 hover:text-blue-300 disabled:opacity-50 disabled:cursor-not-allowed"><PencilIcon /></button>
                                            <button disabled={isBulkEditMode} onClick={() => handleDeletePaint(paint)} className="text-red-400 hover:text-red-300 disabled:opacity-50 disabled:cursor-not-allowed"><TrashIcon /></button>
                                        </div>
                                    </td>
                                </tr>
                            )})}
                        </tbody>
                    </table>
                </div>
                {sortedAndFilteredPaints.length === 0 && (
                    <div className="text-center py-8 text-text-secondary">
                        <p>No paints match your search criteria.</p>
                    </div>
                )}
            </div>
            
            {/* Bulk Actions Toolbar */}
            {isBulkEditMode && selectedPaintIds.length > 0 && (
                <div className="fixed bottom-0 left-0 right-0 md:left-64 bg-surface border-t border-border p-3 shadow-lg z-40 flex items-center justify-between gap-4 flex-wrap">
                    <span className="font-semibold">{selectedPaintIds.length} selected</span>
                    <div className="flex items-center gap-2 flex-wrap">
                        <label htmlFor="bulkStock" className="text-sm font-medium">Set Stock to:</label>
                        <input
                            type="number"
                            id="bulkStock"
                            min="0"
                            value={bulkStockValue}
                            onChange={(e) => setBulkStockValue(parseInt(e.target.value, 10) || 0)}
                            className="bg-background border border-border rounded-md px-2 py-1.5 w-24 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                        <button onClick={handleBulkUpdateStock} className="px-3 py-1.5 text-sm bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors">Apply Stock</button>
                        <button onClick={handleBulkDelete} className="px-3 py-1.5 text-sm bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors">Delete</button>
                    </div>
                </div>
            )}

            {editingPaint && (
                <PaintEditModal
                    paint={editingPaint}
                    onClose={() => setEditingPaint(null)}
                    onSave={updatePaint}
                />
            )}
        </div>
    );
};

export default PaintsPage;