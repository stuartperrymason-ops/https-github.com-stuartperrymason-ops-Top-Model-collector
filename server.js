/**
 * @file server.js
 * @description Backend Express server for the ModelForge application.
 * Connects to a SQLite database and provides API endpoints for CRUD operations.
 * This program was written by Stuart Mason October 2025.
 */
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const { promisify } = require('util');

// --- App Initialization & Middleware ---
const app = express();
const PORT = process.env.PORT || 3001;
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// --- SQLite Configuration ---
const DB_PATH = path.resolve(__dirname, 'database.sqlite');
const db = new sqlite3.Database(DB_PATH, (err) => {
    if (err) {
        console.error('Error opening database', err.message);
    } else {
        console.log('Connected to the SQLite database.');
        // Enable foreign key support
        db.run('PRAGMA foreign_keys = ON;', (err) => {
            if (err) console.error("Could not enable foreign keys", err);
        });
    }
});

// Promisify database methods for async/await support
const dbGet = promisify(db.get).bind(db);
const dbAll = promisify(db.all).bind(db);

// Custom promisify for db.run to resolve with the statement object ('this') which contains lastID
const dbRun = (sql, params = []) => {
    return new Promise((resolve, reject) => {
        // Must use a `function` declaration to get the correct `this` context from sqlite3
        db.run(sql, params, function (err) {
            if (err) {
                reject(err);
            } else {
                resolve(this);
            }
        });
    });
};


// --- Database Schema Setup ---
const createSchema = async () => {
    const schemaQueries = [
        `CREATE TABLE IF NOT EXISTS game_systems (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL UNIQUE,
            color_scheme TEXT
        )`,
        `CREATE TABLE IF NOT EXISTS armies (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            game_system_id INTEGER NOT NULL,
            FOREIGN KEY (game_system_id) REFERENCES game_systems (id) ON DELETE CASCADE
        )`,
        `CREATE TABLE IF NOT EXISTS models (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            game_system_id INTEGER NOT NULL,
            description TEXT,
            quantity INTEGER NOT NULL DEFAULT 1,
            status TEXT NOT NULL,
            image_url TEXT,
            painting_notes TEXT,
            created_at TEXT NOT NULL,
            last_updated TEXT NOT NULL,
            FOREIGN KEY (game_system_id) REFERENCES game_systems (id) ON DELETE CASCADE
        )`,
        // Junction table for many-to-many relationship between models and armies
        `CREATE TABLE IF NOT EXISTS model_armies (
            model_id INTEGER,
            army_id INTEGER,
            PRIMARY KEY (model_id, army_id),
            FOREIGN KEY (model_id) REFERENCES models (id) ON DELETE CASCADE,
            FOREIGN KEY (army_id) REFERENCES armies (id) ON DELETE CASCADE
        )`,
        `CREATE TABLE IF NOT EXISTS painting_sessions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            start TEXT NOT NULL,
            "end" TEXT NOT NULL,
            notes TEXT,
            game_system_id INTEGER,
            FOREIGN KEY (game_system_id) REFERENCES game_systems (id) ON DELETE SET NULL
        )`,
        // Junction table for painting sessions and models
        `CREATE TABLE IF NOT EXISTS session_models (
            session_id INTEGER,
            model_id INTEGER,
            PRIMARY KEY (session_id, model_id),
            FOREIGN KEY (session_id) REFERENCES painting_sessions (id) ON DELETE CASCADE,
            FOREIGN KEY (model_id) REFERENCES models (id) ON DELETE CASCADE
        )`,
        `CREATE TABLE IF NOT EXISTS paints (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            paint_type TEXT NOT NULL,
            manufacturer TEXT NOT NULL,
            color_scheme TEXT NOT NULL,
            rgb_code TEXT,
            stock INTEGER NOT NULL DEFAULT 0
        )`
    ];
    for (const query of schemaQueries) {
        await dbRun(query);
    }
};

// --- API Helper Functions ---
// SQLite doesn't have a simple way to return the inserted row, so we fetch it manually.
const getById = (table, id) => dbGet(`SELECT * FROM ${table} WHERE id = ?`, id);

// --- Game Systems Endpoints ---
app.get('/api/game-systems', async (req, res) => {
    const systems = await dbAll('SELECT * FROM game_systems');
    res.json(systems.map(s => ({ ...s, colorScheme: JSON.parse(s.color_scheme) })));
});

app.post('/api/game-systems', async (req, res) => {
    const { name, colorScheme } = req.body;
    const result = await dbRun('INSERT INTO game_systems (name, color_scheme) VALUES (?, ?)', [name, JSON.stringify(colorScheme)]);
    const newSystem = await getById('game_systems', result.lastID);
    res.status(201).json({ ...newSystem, colorScheme: JSON.parse(newSystem.color_scheme) });
});

app.put('/api/game-systems/:id', async (req, res) => {
    const { name, colorScheme } = req.body;
    await dbRun('UPDATE game_systems SET name = ?, color_scheme = ? WHERE id = ?', [name, JSON.stringify(colorScheme), req.params.id]);
    const updatedSystem = await getById('game_systems', req.params.id);
    res.json({ ...updatedSystem, colorScheme: JSON.parse(updatedSystem.color_scheme) });
});

app.delete('/api/game-systems/:id', async (req, res) => {
    await dbRun('DELETE FROM game_systems WHERE id = ?', req.params.id);
    res.status(204).send();
});

// --- Armies Endpoints ---
app.get('/api/armies', async (req, res) => {
    const armies = await dbAll('SELECT * FROM armies');
    res.json(armies.map(a => ({ id: a.id, name: a.name, gameSystemId: a.game_system_id })));
});

app.post('/api/armies', async (req, res) => {
    const { name, gameSystemId } = req.body;
    const result = await dbRun('INSERT INTO armies (name, game_system_id) VALUES (?, ?)', [name, gameSystemId]);
    const newArmy = await getById('armies', result.lastID);
    res.status(201).json({ id: newArmy.id, name: newArmy.name, gameSystemId: newArmy.game_system_id });
});

app.put('/api/armies/:id', async (req, res) => {
    const { name, gameSystemId } = req.body;
    await dbRun('UPDATE armies SET name = ?, game_system_id = ? WHERE id = ?', [name, gameSystemId, req.params.id]);
    const updatedArmy = await getById('armies', req.params.id);
    res.json({ id: updatedArmy.id, name: updatedArmy.name, gameSystemId: updatedArmy.game_system_id });
});

app.delete('/api/armies/:id', async (req, res) => {
    // Note: ON DELETE CASCADE on model_armies handles disassociation.
    await dbRun('DELETE FROM armies WHERE id = ?', req.params.id);
    res.status(204).send();
});

// --- Models Endpoints ---
app.get('/api/models', async (req, res) => {
    const models = await dbAll('SELECT * FROM models');
    const modelArmies = await dbAll('SELECT * FROM model_armies');
    const modelsWithArmies = models.map(model => {
        const armyIds = modelArmies
            .filter(ma => ma.model_id === model.id)
            .map(ma => String(ma.army_id));
        return {
            id: model.id,
            name: model.name,
            armyIds,
            gameSystemId: model.game_system_id,
            description: model.description,
            quantity: model.quantity,
            status: model.status,
            imageUrl: model.image_url,
            paintingNotes: model.painting_notes,
            createdAt: model.created_at,
            lastUpdated: model.last_updated,
        };
    });
    res.json(modelsWithArmies);
});

app.post('/api/models', async (req, res) => {
    const { name, armyIds, gameSystemId, description, quantity, status, imageUrl, paintingNotes } = req.body;
    const now = new Date().toISOString();
    const result = await dbRun(
        'INSERT INTO models (name, game_system_id, description, quantity, status, image_url, painting_notes, created_at, last_updated) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [name, gameSystemId, description, quantity, status, imageUrl, paintingNotes, now, now]
    );
    const modelId = result.lastID;
    for (const armyId of armyIds) {
        await dbRun('INSERT INTO model_armies (model_id, army_id) VALUES (?, ?)', [modelId, armyId]);
    }
    const newModel = await getById('models', modelId);
    res.status(201).json({ ...newModel, id: modelId, armyIds, gameSystemId: newModel.game_system_id, imageUrl: newModel.image_url, paintingNotes: newModel.painting_notes, createdAt: newModel.created_at, lastUpdated: newModel.last_updated });
});

app.put('/api/models/:id', async (req, res) => {
    const { id } = req.params;
    const { name, armyIds, gameSystemId, description, quantity, status, imageUrl, paintingNotes } = req.body;
    const lastUpdated = new Date().toISOString();
    await dbRun(
        'UPDATE models SET name = ?, game_system_id = ?, description = ?, quantity = ?, status = ?, image_url = ?, painting_notes = ?, last_updated = ? WHERE id = ?',
        [name, gameSystemId, description, quantity, status, imageUrl, paintingNotes, lastUpdated, id]
    );
    // Update junction table
    await dbRun('DELETE FROM model_armies WHERE model_id = ?', id);
    for (const armyId of armyIds) {
        await dbRun('INSERT INTO model_armies (model_id, army_id) VALUES (?, ?)', [id, armyId]);
    }
    const updatedModel = await getById('models', id);
    res.json({ ...updatedModel, id, armyIds, gameSystemId: updatedModel.game_system_id, imageUrl: updatedModel.image_url, paintingNotes: updatedModel.painting_notes, createdAt: updatedModel.created_at, lastUpdated });
});

app.delete('/api/models/:id', async (req, res) => {
    await dbRun('DELETE FROM models WHERE id = ?', req.params.id);
    res.status(204).send();
});

// --- Painting Sessions Endpoints ---
app.get('/api/painting-sessions', async (req, res) => {
    const sessions = await dbAll('SELECT * FROM painting_sessions ORDER BY start ASC');
    const sessionModels = await dbAll('SELECT * FROM session_models');
    
    const result = sessions.map(s => {
        const modelIds = sessionModels.filter(sm => sm.session_id === s.id).map(sm => String(sm.model_id));
        return { id: s.id, title: s.title, start: s.start, end: s.end, notes: s.notes, modelIds, gameSystemId: s.game_system_id };
    });
    res.json(result);
});

app.post('/api/painting-sessions', async (req, res) => {
    const { title, start, end, notes, modelIds, gameSystemId } = req.body;
    const result = await dbRun(
        'INSERT INTO painting_sessions (title, start, "end", notes, game_system_id) VALUES (?, ?, ?, ?, ?)',
        [title, start, end, notes, gameSystemId || null]
    );
    const sessionId = result.lastID;
    for (const modelId of modelIds) {
        await dbRun('INSERT INTO session_models (session_id, model_id) VALUES (?, ?)', [sessionId, modelId]);
    }
    const newSession = await getById('painting_sessions', sessionId);
    res.status(201).json({ ...newSession, id: sessionId, modelIds, gameSystemId: newSession.game_system_id });
});

app.put('/api/painting-sessions/:id', async (req, res) => {
    const { id } = req.params;
    const { title, start, end, notes, modelIds, gameSystemId } = req.body;
    await dbRun(
        'UPDATE painting_sessions SET title = ?, start = ?, "end" = ?, notes = ?, game_system_id = ? WHERE id = ?',
        [title, start, end, notes, gameSystemId || null, id]
    );
    await dbRun('DELETE FROM session_models WHERE session_id = ?', id);
    for (const modelId of modelIds) {
        await dbRun('INSERT INTO session_models (session_id, model_id) VALUES (?, ?)', [id, modelId]);
    }
    const updatedSession = await getById('painting_sessions', id);
    res.json({ ...updatedSession, id, modelIds, gameSystemId: updatedSession.game_system_id });
});

app.delete('/api/painting-sessions/:id', async (req, res) => {
    await dbRun('DELETE FROM painting_sessions WHERE id = ?', req.params.id);
    res.status(204).send();
});

// --- Paints Endpoints ---
app.get('/api/paints', async (req, res) => {
    const paints = await dbAll('SELECT * FROM paints ORDER BY manufacturer, name');
    res.json(paints.map(p => ({ ...p, paintType: p.paint_type, colorScheme: p.color_scheme, rgbCode: p.rgb_code })));
});

app.post('/api/paints', async (req, res) => {
    const { name, paintType, manufacturer, colorScheme, rgbCode, stock } = req.body;
    const result = await dbRun(
        'INSERT INTO paints (name, paint_type, manufacturer, color_scheme, rgb_code, stock) VALUES (?, ?, ?, ?, ?, ?)',
        [name, paintType, manufacturer, colorScheme, rgbCode, stock]
    );
    const newPaint = await getById('paints', result.lastID);
    res.status(201).json({ ...newPaint, paintType: newPaint.paint_type, colorScheme: newPaint.color_scheme, rgbCode: newPaint.rgb_code });
});

app.put('/api/paints/:id', async (req, res) => {
    const { name, paintType, manufacturer, colorScheme, rgbCode, stock } = req.body;
    await dbRun(
        'UPDATE paints SET name = ?, paint_type = ?, manufacturer = ?, color_scheme = ?, rgb_code = ?, stock = ? WHERE id = ?',
        [name, paintType, manufacturer, colorScheme, rgbCode, stock, req.params.id]
    );
    const updatedPaint = await getById('paints', req.params.id);
    res.json({ ...updatedPaint, paintType: updatedPaint.paint_type, colorScheme: updatedPaint.color_scheme, rgbCode: updatedPaint.rgb_code });
});

app.delete('/api/paints/:id', async (req, res) => {
    await dbRun('DELETE FROM paints WHERE id = ?', req.params.id);
    res.status(204).send();
});


// --- Database Seeding ---
const seedDatabase = async () => {
    const { count: systemCount } = await dbGet('SELECT COUNT(*) as count FROM game_systems');
    if (systemCount > 0) {
        console.log('Database already contains data. Skipping seed.');
        return;
    }
    console.log('Seeding database with initial data...');
    try {
        const now = new Date().toISOString();
        // Game Systems
        const wh40k = await dbRun(`INSERT INTO game_systems (name, color_scheme) VALUES (?, ?)`, ['Warhammer 40,000', JSON.stringify({ primary: '#fde047', secondary: '#1e40af', background: '#0c1440' })]);
        const aos = await dbRun(`INSERT INTO game_systems (name, color_scheme) VALUES (?, ?)`, ['Age of Sigmar', JSON.stringify({ primary: '#60a5fa', secondary: '#facc15', background: '#1e3a8a' })]);
        const mcp = await dbRun(`INSERT INTO game_systems (name, color_scheme) VALUES (?, ?)`, ['Marvel Crisis Protocol', JSON.stringify({ primary: '#ef4444', secondary: '#3b82f6', background: '#4c0519' })]);
        const wh40kId = wh40k.lastID, aosId = aos.lastID, mcpId = mcp.lastID;

        // Armies
        const sm = await dbRun(`INSERT INTO armies (name, game_system_id) VALUES (?, ?)`, ['Space Marines', wh40kId]);
        const orks = await dbRun(`INSERT INTO armies (name, game_system_id) VALUES (?, ?)`, ['Orks', wh40kId]);
        await dbRun(`INSERT INTO armies (name, game_system_id) VALUES (?, ?)`, ['Stormcast Eternals', aosId]);
        const avengers = await dbRun(`INSERT INTO armies (name, game_system_id) VALUES (?, ?)`, ['Avengers', mcpId]);
        const xmen = await dbRun(`INSERT INTO armies (name, game_system_id) VALUES (?, ?)`, ['Uncanny X-Men', mcpId]);
        const smId = sm.lastID, orksId = orks.lastID, avengersId = avengers.lastID, xmenId = xmen.lastID;
        
        // Models
        const intercessor = await dbRun(`INSERT INTO models (name, game_system_id, description, quantity, status, image_url, painting_notes, created_at, last_updated) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`, ['Primaris Intercessor', wh40kId, 'The backbone of any Space Marine force...', 10, 'Ready to Game', 'https://via.placeholder.com/300x200.png?text=Intercessor', 'Base: Macragge Blue', now, now]);
        await dbRun(`INSERT INTO model_armies (model_id, army_id) VALUES (?, ?)`, [intercessor.lastID, smId]);
        
        const boy = await dbRun(`INSERT INTO models (name, game_system_id, description, quantity, status, image_url, painting_notes, created_at, last_updated) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`, ['Ork Boy', wh40kId, 'Ork Boyz are the rank-and-file...', 20, 'Primed', 'https://via.placeholder.com/300x200.png?text=Ork+Boy', '', now, now]);
        await dbRun(`INSERT INTO model_armies (model_id, army_id) VALUES (?, ?)`, [boy.lastID, orksId]);
        
        const wolverine = await dbRun(`INSERT INTO models (name, game_system_id, description, quantity, status, image_url, painting_notes, created_at, last_updated) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`, ['Wolverine', mcpId, "He's the best there is at what he does...", 1, 'Painted', 'https://via.placeholder.com/300x200.png?text=Wolverine', 'Suit: Averland Sunset', now, now]);
        await dbRun(`INSERT INTO model_armies (model_id, army_id) VALUES (?, ?), (?, ?)`, [wolverine.lastID, avengersId, wolverine.lastID, xmenId]);

        // Paints
        await dbRun(`INSERT INTO paints (name, paint_type, manufacturer, color_scheme, rgb_code, stock) VALUES (?,?,?,?,?,?), (?,?,?,?,?,?), (?,?,?,?,?,?), (?,?,?,?,?,?)`, 
            ['Macragge Blue', 'Base', 'Citadel', 'Blue', '#0d4e8a', 1],
            ['Mephiston Red', 'Base', 'Citadel', 'Red', '#9b100e', 2],
            ['Nuln Oil', 'Shade', 'Citadel', 'Black', '#3c3c3c', 1],
            ['Leather Brown', 'Layer', 'Vallejo', 'Brown', '#8b4513', 1]
        );
        console.log('Database seeded successfully.');
    } catch (err) {
        console.error('Error seeding database:', err);
    }
};

// --- Start Server ---
const startServer = async () => {
    try {
        await createSchema();
        await seedDatabase();
        app.listen(PORT, () => {
            console.log(`Server running on http://localhost:${PORT}`);
        });
    } catch (err) {
        console.error('Failed to start server:', err);
        process.exit(1);
    }
};

startServer();