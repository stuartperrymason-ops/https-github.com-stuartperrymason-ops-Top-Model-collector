/**
 * @file PaintingSessionFormModal.tsx
 * @description A modal dialog with a form for creating or editing a painting session.
 * This program was written by Stuart Mason October 2025.
 */

import React, { useState, useEffect } from 'react';
import { PaintingSession } from '../types';
import { useData } from '../context/DataContext';
import { XIcon, TrashIcon } from './icons/Icons';

interface PaintingSessionFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessionToEdit: PaintingSession | null;
  selectedDate: Date | null;
}

const PaintingSessionFormModal: React.FC<PaintingSessionFormModalProps> = ({
  isOpen,
  onClose,
  sessionToEdit,
  selectedDate,
}) => {
  const { models, gameSystems, addPaintingSession, updatePaintingSession, deletePaintingSession } = useData();
  const [formData, setFormData] = useState<Omit<PaintingSession, 'id'>>({
    title: '',
    start: '',
    end: '',
    notes: '',
    modelIds: [],
    gameSystemId: '',
  });
  
  // State for separate date and time inputs for better UX
  const [formDate, setFormDate] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('12:00');

  useEffect(() => {
    if (sessionToEdit) {
      // Editing existing session
      const startDate = new Date(sessionToEdit.start);
      const endDate = new Date(sessionToEdit.end);
      setFormData({ ...sessionToEdit, notes: sessionToEdit.notes || '', gameSystemId: sessionToEdit.gameSystemId || '' });
      setFormDate(startDate.toISOString().split('T')[0]);
      setStartTime(startDate.toTimeString().substring(0, 5));
      setEndTime(endDate.toTimeString().substring(0, 5));
    } else if (selectedDate) {
      // Creating a new session for a selected date
      setFormData({
        title: '',
        start: '',
        end: '',
        notes: '',
        modelIds: [],
        gameSystemId: '',
      });
      setFormDate(selectedDate.toISOString().split('T')[0]);
      setStartTime('09:00');
      setEndTime('12:00');
    }
  }, [sessionToEdit, selectedDate, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleModelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedIds = Array.from(e.target.selectedOptions, option => option.value);
    setFormData(prev => ({...prev, modelIds: selectedIds}));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formDate || !startTime || !endTime) {
        alert("Please ensure date and times are set.");
        return;
    }
    
    // Combine date and time into full ISO strings before submitting
    const finalFormData = {
        ...formData,
        start: new Date(`${formDate}T${startTime}`).toISOString(),
        end: new Date(`${formDate}T${endTime}`).toISOString(),
    };

    if (sessionToEdit) {
      await updatePaintingSession(sessionToEdit.id, finalFormData);
    } else {
      await addPaintingSession(finalFormData);
    }
    onClose();
  };

  const handleDelete = async () => {
    if (sessionToEdit && window.confirm('Are you sure you want to delete this painting session?')) {
        await deletePaintingSession(sessionToEdit.id);
        onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50 p-4">
      <div className="bg-surface rounded-lg shadow-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto border border-border">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-white">
            {sessionToEdit ? 'Edit Painting Session' : 'Schedule Painting Session'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <XIcon />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-text-secondary mb-1">
              Title / Goal
            </label>
            <input
              type="text"
              name="title"
              id="title"
              value={formData.title}
              onChange={handleChange}
              required
              className="w-full bg-background border border-border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label htmlFor="gameSystemId" className="block text-sm font-medium text-text-secondary mb-1">
              Game System (optional)
            </label>
            <select
              name="gameSystemId"
              id="gameSystemId"
              value={formData.gameSystemId || ''}
              onChange={handleChange}
              className="w-full bg-background border border-border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">None</option>
              {gameSystems.map(gs => (
                <option key={gs.id} value={gs.id}>{gs.name}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label htmlFor="date" className="block text-sm font-medium text-text-secondary mb-1">Date</label>
              <input type="date" id="date" value={formDate} onChange={e => setFormDate(e.target.value)} required className="w-full bg-background border border-border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"/>
            </div>
            <div>
              <label htmlFor="start" className="block text-sm font-medium text-text-secondary mb-1">Start Time</label>
              <input type="time" id="start" value={startTime} onChange={e => setStartTime(e.target.value)} required className="w-full bg-background border border-border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"/>
            </div>
            <div>
              <label htmlFor="end" className="block text-sm font-medium text-text-secondary mb-1">End Time</label>
              <input type="time" id="end" value={endTime} onChange={e => setEndTime(e.target.value)} required className="w-full bg-background border border-border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"/>
            </div>
          </div>
          
          <div>
            <label htmlFor="modelIds" className="block text-sm font-medium text-text-secondary mb-1">
              Associated Models (optional)
            </label>
            <select
                multiple
                id="modelIds"
                value={formData.modelIds}
                onChange={handleModelChange}
                className="w-full h-32 bg-background border border-border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
            >
                {models.map(model => (
                    <option key={model.id} value={model.id}>
                        {model.name}
                    </option>
                ))}
            </select>
            <p className="text-xs text-text-secondary mt-1">Hold Ctrl/Cmd to select multiple models.</p>
          </div>

          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-text-secondary mb-1">
              Notes
            </label>
            <textarea
              name="notes"
              id="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={3}
              className="w-full bg-background border border-border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div className="flex justify-between items-center pt-4">
            <div>
                {sessionToEdit && (
                    <button
                        type="button"
                        onClick={handleDelete}
                        className="p-2 text-red-400 hover:text-red-300 transition-colors"
                        title="Delete Session"
                    >
                        <TrashIcon />
                    </button>
                )}
            </div>
            <div className="flex gap-4">
              <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-600 text-white font-semibold rounded-lg hover:bg-gray-700 transition-colors">
                Cancel
              </button>
              <button type="submit" className="px-4 py-2 bg-primary text-white font-semibold rounded-lg hover:bg-indigo-500 transition-colors">
                {sessionToEdit ? 'Save Changes' : 'Add Session'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PaintingSessionFormModal;