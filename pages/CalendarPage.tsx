/**
 * @file CalendarPage.tsx
 * @description This page displays a calendar for scheduling and viewing painting sessions.
 * It features a custom-built, responsive calendar grid.
 * This program was written by Stuart Mason October 2025.
 */

import React, { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { PaintingSession } from '../types';
import PaintingSessionFormModal from '../components/PaintingSessionFormModal';

const CalendarPage: React.FC = () => {
    const { paintingSessions, gameSystems, deletePaintingSession } = useData();
    const [currentDate, setCurrentDate] = useState(new Date());
    
    // State for managing the form modal
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedSession, setSelectedSession] = useState<PaintingSession | null>(null);
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);

    // Create a memoized map of game system IDs to their color and name for efficient lookup.
    const gameSystemColorMap = useMemo(() => {
        return gameSystems.reduce((acc, system) => {
            if (system.colorScheme) {
                acc[system.id] = { 
                    color: system.colorScheme.primary, 
                    name: system.name 
                };
            }
            return acc;
        }, {} as Record<string, { color: string; name: string }>);
    }, [gameSystems]);

    // --- Calendar Logic ---
    const calendarData = useMemo(() => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();

        const firstDayOfMonth = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        const days = Array.from({ length: daysInMonth }, (_, i) => new Date(year, month, i + 1));
        const blanks = Array.from({ length: firstDayOfMonth }, (_, i) => null);
        
        const calendarGrid = [...blanks, ...days];

        // Group sessions by date for efficient lookup
        const sessionsByDate: { [key: string]: PaintingSession[] } = {};
        paintingSessions.forEach(session => {
            const sessionDate = new Date(session.start).toDateString();
            if (!sessionsByDate[sessionDate]) {
                sessionsByDate[sessionDate] = [];
            }
            sessionsByDate[sessionDate].push(session);
        });

        return { calendarGrid, sessionsByDate };
    }, [currentDate, paintingSessions]);

    const { calendarGrid, sessionsByDate } = calendarData;
    const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    // --- Navigation Handlers ---
    const goToNextMonth = () => {
        setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
    };

    const goToPrevMonth = () => {
        setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
    };

    // --- Modal and Action Handlers ---
    const handleAddSession = (date: Date) => {
        setSelectedDate(date);
        setSelectedSession(null);
        setIsModalOpen(true);
    };

    const handleEditSession = (session: PaintingSession) => {
        setSelectedSession(session);
        setSelectedDate(null);
        setIsModalOpen(true);
    };

    const handleDeleteSession = (session: PaintingSession) => {
        if (window.confirm(`Are you sure you want to delete the session "${session.title}"?`)) {
            deletePaintingSession(session.id);
        }
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedSession(null);
        setSelectedDate(null);
    };

    return (
        <div className="container mx-auto">
            <h1 className="text-3xl font-bold text-white mb-6">Painting Calendar</h1>

            <div className="bg-surface p-4 sm:p-6 rounded-lg shadow-md border border-border">
                {/* Calendar Header */}
                <div className="flex justify-between items-center mb-4">
                    <button onClick={goToPrevMonth} className="px-4 py-2 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors">&lt; Prev</button>
                    <h2 className="text-xl sm:text-2xl font-bold text-primary">
                        {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                    </h2>
                    <button onClick={goToNextMonth} className="px-4 py-2 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors">Next &gt;</button>
                </div>

                {/* Calendar Grid */}
                <div className="grid grid-cols-7 gap-1">
                    {/* Weekday Headers */}
                    {weekdays.map(day => (
                        <div key={day} className="text-center font-semibold text-text-secondary p-2 text-xs sm:text-base">{day}</div>
                    ))}
                    
                    {/* Day Cells */}
                    {calendarGrid.map((day, index) => {
                        if (!day) return <div key={`blank-${index}`} className="border border-border rounded-md min-h-[100px] sm:min-h-[140px]"></div>;
                        
                        const dayString = day.toDateString();
                        const sessionsForDay = sessionsByDate[dayString] || [];
                        const isToday = new Date().toDateString() === dayString;

                        return (
                            <div 
                                key={dayString}
                                className={`border border-border rounded-md p-2 flex flex-col min-h-[100px] sm:min-h-[140px] transition-colors ${isToday ? 'bg-background' : 'hover:bg-background'}`}
                                onClick={() => handleAddSession(day)}
                            >
                                <span className={`font-bold ${isToday ? 'text-primary' : 'text-text-primary'}`}>{day.getDate()}</span>
                                <div className="flex-grow mt-1 overflow-y-auto space-y-1 pr-1">
                                    {sessionsForDay
                                      .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())
                                      .map(session => {
                                        const systemInfo = session.gameSystemId ? gameSystemColorMap[session.gameSystemId] : null;

                                        return (
                                            <div 
                                                key={session.id}
                                                className="flex items-center justify-between bg-background p-1.5 rounded group"
                                            >
                                                <div
                                                    className="flex items-center truncate flex-grow cursor-pointer"
                                                    onClick={(e) => { e.stopPropagation(); handleEditSession(session); }}
                                                    title={`Edit: ${session.title}${systemInfo ? ` (${systemInfo.name})` : ''}`}
                                                >
                                                    <span
                                                        className="w-2.5 h-2.5 rounded-full mr-2 flex-shrink-0 border border-black/20"
                                                        style={{ backgroundColor: systemInfo ? systemInfo.color : '#4b5563' }}
                                                    ></span>
                                                    <span className="text-white text-xs truncate">{session.title}</span>
                                                </div>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleDeleteSession(session); }}
                                                    className="text-gray-400 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity ml-1 p-0.5 rounded flex-shrink-0"
                                                    title="Delete session"
                                                >
                                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {isModalOpen && (
                <PaintingSessionFormModal
                    isOpen={isModalOpen}
                    onClose={handleCloseModal}
                    sessionToEdit={selectedSession}
                    selectedDate={selectedDate}
                />
            )}
        </div>
    );
};

export default CalendarPage;