
import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { GameSystem, Army, Model } from '../types';

interface State {
  gameSystems: GameSystem[];
  armies: Army[];
  models: Model[];
}

type Action =
  | { type: 'ADD_GAMESYSTEM'; payload: GameSystem }
  | { type: 'DELETE_GAMESYSTEM'; payload: string }
  | { type: 'ADD_ARMY'; payload: Army }
  | { type: 'DELETE_ARMY'; payload: string }
  | { type: 'ADD_MODEL'; payload: Model }
  | { type: 'UPDATE_MODEL'; payload: Model }
  | { type: 'DELETE_MODEL'; payload: string }
  | { type: 'BULK_IMPORT'; payload: { models: Model[]; armies: Army[]; gameSystems: GameSystem[] } };

const initialState: State = {
  gameSystems: [
    { id: 'gs1', name: 'Warhammer 40,000' },
    { id: 'gs2', name: 'Age of Sigmar' },
  ],
  armies: [
    { id: 'a1', name: 'Ultramarines', gameSystemId: 'gs1' },
    { id: 'a2', name: 'Orks', gameSystemId: 'gs1' },
    { id: 'a3', name: 'Stormcast Eternals', gameSystemId: 'gs2' },
  ],
  models: [
    { id: 'm1', name: 'Primaris Intercessor Squad', armyId: 'a1', gameSystemId: 'gs1', description: 'Standard troops for the Ultramarines.', points: 100, quantity: 10, status: 'painted', imageUrl: 'https://picsum.photos/seed/intercessor/400/300' },
    { id: 'm2', name: 'Ork Boyz', armyId: 'a2', gameSystemId: 'gs1', description: 'The backbone of any Ork WAAAGH!', points: 80, quantity: 12, status: 'wip', imageUrl: 'https://picsum.photos/seed/orkboyz/400/300' },
    { id: 'm3', name: 'Liberators', armyId: 'a3', gameSystemId: 'gs2', description: 'Shining warriors of Sigmar.', points: 120, quantity: 5, status: 'unpainted', imageUrl: 'https://picsum.photos/seed/liberators/400/300' },
  ],
};

const dataReducer = (state: State, action: Action): State => {
  // In a real application, these actions would trigger API calls to a MongoDB backend.
  switch (action.type) {
    case 'ADD_GAMESYSTEM':
      return { ...state, gameSystems: [...state.gameSystems, action.payload] };
    case 'DELETE_GAMESYSTEM':
      return {
        ...state,
        gameSystems: state.gameSystems.filter(gs => gs.id !== action.payload),
        armies: state.armies.filter(a => a.gameSystemId !== action.payload),
        models: state.models.filter(m => m.gameSystemId !== action.payload),
      };
    case 'ADD_ARMY':
      return { ...state, armies: [...state.armies, action.payload] };
    case 'DELETE_ARMY':
      return {
        ...state,
        armies: state.armies.filter(a => a.id !== action.payload),
        models: state.models.filter(m => m.armyId !== action.payload),
      };
    case 'ADD_MODEL':
      return { ...state, models: [...state.models, action.payload] };
    case 'UPDATE_MODEL':
      return {
        ...state,
        models: state.models.map(m => m.id === action.payload.id ? action.payload : m),
      };
    case 'DELETE_MODEL':
      return { ...state, models: state.models.filter(m => m.id !== action.payload) };
    case 'BULK_IMPORT':
      // Simple merge, could be more sophisticated (e.g., handling duplicates)
      return {
        ...state,
        gameSystems: [...state.gameSystems, ...action.payload.gameSystems],
        armies: [...state.armies, ...action.payload.armies],
        models: [...state.models, ...action.payload.models],
      };
    default:
      return state;
  }
};

const DataContext = createContext<{
  state: State;
  dispatch: React.Dispatch<Action>;
}>({
  state: initialState,
  dispatch: () => null,
});

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(dataReducer, initialState);

  return (
    <DataContext.Provider value={{ state, dispatch }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => useContext(DataContext);
