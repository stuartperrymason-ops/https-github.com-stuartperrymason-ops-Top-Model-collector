
export interface GameSystem {
  id: string;
  name: string;
}

export interface Army {
  id: string;
  name: string;
  gameSystemId: string;
}

export interface Model {
  id: string;
  name: string;
  armyId: string;
  gameSystemId: string;
  description: string;
  points: number;
  quantity: number;
  status: 'unpainted' | 'painted' | 'wip';
  imageUrl?: string;
}

export type ToastMessage = {
  id: number;
  message: string;
  type: 'success' | 'error';
};
