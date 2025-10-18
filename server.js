/**
 * @file server.js
 * @description A simple Express server to provide a mock API for the ModelForge application.
 * It uses an in-memory database and provides CRUD endpoints for game systems, armies, and models.
 */

const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

const generateId = () => `id-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// In-memory database
let db = {
  gameSystems: [
    { id: 'gs1', name: 'Warhammer 40,000' },
    { id: 'gs2', name: 'Age of Sigmar' },
  ],
  armies: [
    { id: 'a1', name: 'Space Marines', gameSystemId: 'gs1' },
    { id: 'a2', name: 'Orks', gameSystemId: 'gs1' },
    { id: 'a3', name: 'Stormcast Eternals', gameSystemId: 'gs2' },
  ],
  models: [
    {
      id: 'm1',
      name: 'Primaris Intercessor',
      armyId: 'a1',
      gameSystemId: 'gs1',
      description: 'The backbone of any Space Marine force, Primaris Intercessors are versatile and reliable infantry units.',
      points: 20,
      quantity: 10,
      status: 'painted',
      imageUrl: 'https://via.placeholder.com/300x200.png?text=Intercessor',
    },
    {
      id: 'm2',
      name: 'Ork Boy',
      armyId: 'a2',
      gameSystemId: 'gs1',
      description: 'Ork Boyz are the rank-and-file infantry of an Ork army. What they lack in skill, they make up for in sheer numbers and enthusiasm for a good scrap.',
      points: 8,
      quantity: 20,
      status: 'wip',
      imageUrl: 'https://via.placeholder.com/300x200.png?text=Ork+Boy',
    },
  ],
};

// --- API Endpoints ---

// Game Systems
app.get('/api/game-systems', (req, res) => res.json(db.gameSystems));

app.post('/api/game-systems', (req, res) => {
  const newSystem = { id: generateId(), ...req.body };
  db.gameSystems.push(newSystem);
  res.status(201).json(newSystem);
});

app.put('/api/game-systems/:id', (req, res) => {
    const { id } = req.params;
    const index = db.gameSystems.findIndex(s => s.id === id);
    if (index === -1) return res.status(404).json({ message: 'Game system not found' });
    db.gameSystems[index] = { ...db.gameSystems[index], ...req.body };
    res.json(db.gameSystems[index]);
});

app.delete('/api/game-systems/:id', (req, res) => {
    const { id } = req.params;
    db.gameSystems = db.gameSystems.filter(s => s.id !== id);
    // Cascade delete
    db.armies = db.armies.filter(a => a.gameSystemId !== id);
    db.models = db.models.filter(m => m.gameSystemId !== id);
    res.status(204).send();
});


// Armies
app.get('/api/armies', (req, res) => res.json(db.armies));

app.post('/api/armies', (req, res) => {
    const newArmy = { id: generateId(), ...req.body };
    db.armies.push(newArmy);
    res.status(201).json(newArmy);
});

app.put('/api/armies/:id', (req, res) => {
    const { id } = req.params;
    const index = db.armies.findIndex(a => a.id === id);
    if (index === -1) return res.status(404).json({ message: 'Army not found' });
    db.armies[index] = { ...db.armies[index], ...req.body };
    res.json(db.armies[index]);
});

app.delete('/api/armies/:id', (req, res) => {
    const { id } = req.params;
    db.armies = db.armies.filter(a => a.id !== id);
    // Cascade delete
    db.models = db.models.filter(m => m.armyId !== id);
    res.status(204).send();
});


// Models
app.get('/api/models', (req, res) => res.json(db.models));

app.post('/api/models', (req, res) => {
    const newModel = { id: generateId(), ...req.body };
    db.models.push(newModel);
    res.status(201).json(newModel);
});

app.put('/api/models/:id', (req, res) => {
    const { id } = req.params;
    const index = db.models.findIndex(m => m.id === id);
    if (index === -1) return res.status(404).json({ message: 'Model not found' });
    db.models[index] = { ...db.models[index], ...req.body };
    res.json(db.models[index]);
});

app.delete('/api/models/:id', (req, res) => {
    const { id } = req.params;
    db.models = db.models.filter(m => m.id !== id);
    res.status(204).send();
});

app.listen(PORT, () => {
  console.log(`Mock server running on http://localhost:${PORT}`);
});
