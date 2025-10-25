/**
 * @file PaintsPage.tsx
 * @description This page allows users to manage their collection of hobby paints.
 * This program was written by Stuart Mason October 2025.
 */

import React, { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { Paint } from '../types';
import { PlusIcon, PencilIcon, TrashIcon, XIcon } from '../components/icons/Icons';

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

    const paintTypes: Paint['paintType'][] = ['Base', 'Layer', 'Shade', 'Contrast', 'Technical', 'Dry', 'Air'];

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
                            <label htmlFor="edit-rgbCode" className="block text-sm font-medium text-text-secondary mb-1">RGB Code</label>
                            <input id="edit-rgbCode" name="rgbCode" type="text" value={formData.rgbCode || ''} onChange={handleChange} placeholder="#RRGGBB" className="w-full bg-background border border-border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary" />
                        </div>
                        <input type="color" value={formData.rgbCode || '#ffffff'} onChange={(e) => handleChange({ ...e, target: { ...e.target, name: 'rgbCode' }})} className="h-10 w-12 p-1 bg-background border border-border rounded-md cursor-pointer"/>
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
    const { paints, addPaint, updatePaint, deletePaint, loading, error } = useData();
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
    const [sortOption, setSortOption] = useState<string>('name-asc');

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

    const uniqueManufacturers = useMemo(() => [...new Set(paints.map(p => p.manufacturer))], [paints]);
    const paintTypes: Paint['paintType'][] = ['Base', 'Layer', 'Shade', 'Contrast', 'Technical', 'Dry', 'Air'];

    const sortedAndFilteredPaints = useMemo(() => {
        const filtered = paints
            .filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
            .filter(p => !manufacturerFilter || p.manufacturer === manufacturerFilter)
            .filter(p => !typeFilter || p.paintType === typeFilter);

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
                case 'stock-desc':
                    return b.stock - a.stock;
                case 'stock-asc':
                    return a.stock - b.stock;
                default:
                    return a.name.localeCompare(b.name);
            }
        });

        return sortable;
    }, [paints, searchQuery, manufacturerFilter, typeFilter, sortOption]);

    if (loading) return <div className="flex justify-center items-center h-full"><p>Loading paints...</p></div>;
    if (error) return <div className="flex justify-center items-center h-full"><p className="text-red-500">{error}</p></div>;

    return (
        <div className="container mx-auto">
            <h1 className="text-3xl font-bold text-white mb-6">Paint Collection</h1>
            
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
                             <label htmlFor="rgbCode" className="block text-sm font-medium text-text-secondary mb-1">RGB Hex Code (optional)</label>
                             <input id="rgbCode" name="rgbCode" type="text" value={newPaint.rgbCode} onChange={handleInputChange} placeholder="#RRGGBB" className="w-full bg-background border border-border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary" />
                        </div>
                        <input type="color" value={newPaint.rgbCode || '#ffffff'} onChange={(e) => handleInputChange({ ...e, target: { ...e.target, name: 'rgbCode' }})} className="h-10 w-12 p-1 bg-background border border-border rounded-md cursor-pointer"/>
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
                    <select
                        value={sortOption}
                        onChange={e => setSortOption(e.target.value)}
                        className="bg-background border border-border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary w-full lg:w-auto"
                    >
                        <option value="name-asc">Sort: Name (A-Z)</option>
                        <option value="name-desc">Sort: Name (Z-A)</option>
                        <option value="manufacturer-asc">Sort: Manufacturer (A-Z)</option>
                        <option value="manufacturer-desc">Sort: Manufacturer (Z-A)</option>
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
                            {sortedAndFilteredPaints.map(paint => (
                                <tr key={paint.id} className="border-b border-border last:border-b-0 hover:bg-background">
                                    <td className="p-4">
                                        <div className="w-8 h-8 rounded-full border-2 border-background" style={{ backgroundColor: paint.rgbCode || '#888' }} title={paint.rgbCode}></div>
                                    </td>
                                    <td className="p-4 font-semibold">{paint.name}</td>
                                    <td className="p-4 hidden sm:table-cell">{paint.manufacturer}</td>
                                    <td className="p-4 hidden md:table-cell">{paint.paintType}</td>
                                    <td className="p-4 hidden lg:table-cell">{paint.colorScheme}</td>
                                    <td className="p-4 font-semibold">{paint.stock}</td>
                                    <td className="p-4">
                                        <div className="flex justify-end gap-2">
                                            <button onClick={() => setEditingPaint(paint)} className="text-blue-400 hover:text-blue-300"><PencilIcon /></button>
                                            <button onClick={() => handleDeletePaint(paint)} className="text-red-400 hover:text-red-300"><TrashIcon /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {sortedAndFilteredPaints.length === 0 && (
                    <div className="text-center py-8 text-text-secondary">
                        <p>No paints match your search criteria.</p>
                    </div>
                )}
            </div>

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
