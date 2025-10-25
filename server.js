/**
 * @file server.js
 * @description Backend Express server for the ModelForge application.
 * Connects to a MongoDB database and provides API endpoints for CRUD operations.
 * This program was written by Stuart Mason October 2025.
 */
// Load environment variables from a .env file into process.env
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { MongoClient, ObjectId } = require('mongodb');

const app = express();
const PORT = 3001;

// MongoDB connection settings. The connection string is read from MONGODB_URI environment variable.
// If it's not set, it defaults to a MongoDB Atlas connection string which requires a DB_PASSWORD environment variable.
if (!process.env.MONGODB_URI && !process.env.DB_PASSWORD) {
    console.error('FATAL ERROR: To connect to the default MongoDB Atlas database, a DB_PASSWORD environment variable must be set. Alternatively, provide a full MONGODB_URI.');
    process.exit(1);
}
const MONGODB_URI = process.env.MONGODB_URI || `mongodb+srv://stuartperrymason_db_user:${process.env.DB_PASSWORD}@tabletop-collector.ol9gelx.mongodb.net/?appName=tabletop-collector`;
const DB_NAME = process.env.DB_NAME || 'tabletop_collector';
const client = new MongoClient(MONGODB_URI);

// Global variables to hold references to the database and collections once connected.
let db;
let gameSystemsCollection;
let armiesCollection;
let modelsCollection;
let paintingSessionsCollection;
let paintsCollection;

// --- Middleware ---
// `cors()` enables Cross-Origin Resource Sharing, allowing the frontend (on a different port) to make requests to this server.
app.use(cors());
// `express.json()` is a body-parser that parses incoming request bodies with JSON payloads.
app.use(express.json());

/**
 * Seeds the database with initial sample data if it's empty.
 * This is useful for development and demonstration purposes.
 */
const seedDatabase = async () => {
    try {
        const systemCount = await gameSystemsCollection.countDocuments();
        const paintCount = await paintsCollection.countDocuments();
        if (systemCount > 0 && paintCount > 0) {
            console.log('Database already contains data. Skipping seed.');
            return;
        }

        console.log('Seeding database with initial data...');
        const now = new Date().toISOString();

        // --- Game Systems ---
        const wh40k = await gameSystemsCollection.insertOne({
            name: 'Warhammer 40,000',
            colorScheme: { primary: '#fde047', secondary: '#1e40af', background: '#0c1440' }
        });
        const aos = await gameSystemsCollection.insertOne({
            name: 'Age of Sigmar',
            colorScheme: { primary: '#60a5fa', secondary: '#facc15', background: '#1e3a8a' }
        });
        const mcp = await gameSystemsCollection.insertOne({
            name: 'Marvel Crisis Protocol',
            colorScheme: { primary: '#ef4444', secondary: '#3b82f6', background: '#4c0519' }
        });

        // Store the inserted IDs for creating relationships.
        const wh40kId = wh40k.insertedId;
        const aosId = aos.insertedId;
        const mcpId = mcp.insertedId;

        // --- Armies ---
        // Note how gameSystemId is used to link an army to its game system.
        const sm = await armiesCollection.insertOne({ name: 'Space Marines', gameSystemId: wh40kId });
        const orks = await armiesCollection.insertOne({ name: 'Orks', gameSystemId: wh40kId });
        await armiesCollection.insertOne({ name: 'Stormcast Eternals', gameSystemId: aosId });
        const avengers = await armiesCollection.insertOne({ name: 'Avengers', gameSystemId: mcpId });
        const xmen = await armiesCollection.insertOne({ name: 'Uncanny X-Men', gameSystemId: mcpId });

        const smId = sm.insertedId;
        const orksId = orks.insertedId;
        const avengersId = avengers.insertedId;
        const xmenId = xmen.insertedId;


        // --- Models ---
        // An example of a model belonging to multiple armies (Wolverine).
        await modelsCollection.insertMany([
            {
                name: 'Primaris Intercessor',
                armyIds: [smId],
                gameSystemId: wh40kId,
                description: 'The backbone of any Space Marine force, Primaris Intercessors are versatile and reliable infantry units.',
                quantity: 10,
                status: 'Ready to Game',
                imageUrl: 'https://via.placeholder.com/300x200.png?text=Intercessor',
                paintingNotes: 'Base: Macragge Blue\nShade: Nuln Oil\nHighlight: Calgar Blue',
                createdAt: now,
                lastUpdated: now,
            },
            {
                name: 'Ork Boy',
                armyIds: [orksId],
                gameSystemId: wh40kId,
                description: 'Ork Boyz are the rank-and-file infantry of an Ork army. What they lack in skill, they make up for in sheer numbers and enthusiasm for a good scrap.',
                quantity: 20,
                status: 'Primed',
                imageUrl: 'https://via.placeholder.com/300x200.png?text=Ork+Boy',
                paintingNotes: '',
                createdAt: now,
                lastUpdated: now,
            },
            {
                name: 'Wolverine',
                armyIds: [avengersId, xmenId],
                gameSystemId: mcpId,
                description: "He's the best there is at what he does, but what he does isn't very nice. A mutant with a healing factor and adamantium claws.",
                quantity: 1,
                status: 'Painted',
                imageUrl: 'https://via.placeholder.com/300x200.png?text=Wolverine',
                paintingNotes: 'Suit: Averland Sunset\nStripes: Abaddon Black\nClaws: Leadbelcher',
                createdAt: now,
                lastUpdated: now,
            }
        ]);
        
        // --- Paints ---
        if (paintCount === 0) {
            await paintsCollection.insertMany([
                {
                    name: 'Macragge Blue',
                    paintType: 'Base',
                    manufacturer: 'Citadel',
                    colorScheme: 'Blue',
                    rgbCode: '#0d4e8a',
                    stock: 1,
                },
                {
                    name: 'Mephiston Red',
                    paintType: 'Base',
                    manufacturer: 'Citadel',
                    colorScheme: 'Red',
                    rgbCode: '#9b100e',
                    stock: 2,
                },
                {
                    name: 'Nuln Oil',
                    paintType: 'Shade',
                    manufacturer: 'Citadel',
                    colorScheme: 'Black',
                    rgbCode: '#3c3c3c',
                    stock: 1,
                },
                 {
                    name: 'Leather Brown',
                    paintType: 'Layer',
                    manufacturer: 'Vallejo',
                    colorScheme: 'Brown',
                    rgbCode: '#8b4513',
                    stock: 1,
                }
            ]);
        }

        console.log('Database seeded successfully.');

    } catch (error) {
        console.error('Error seeding database:', error);
    }
};

/**
 * The main function that connects to MongoDB and starts the Express server.
 */
async function main() {
    try {
        await client.connect();
        console.log('Connected successfully to MongoDB');
        db = client.db(DB_NAME);
        // Get references to our collections.
        gameSystemsCollection = db.collection('game_systems');
        armiesCollection = db.collection('armies');
        modelsCollection = db.collection('models');
        paintingSessionsCollection = db.collection('painting_sessions');
        paintsCollection = db.collection('paints');

        // Seed the database with initial data if it's empty.
        await seedDatabase();

        // Start listening for incoming HTTP requests.
        app.listen(PORT, () => {
            console.log(`Server running on http://localhost:${PORT}`);
        });

    } catch (e) {
        console.error('Could not connect to MongoDB', e);
        process.exit(1); // Exit the process if DB connection fails.
    }
}

// --- API Helper Functions ---
// MongoDB uses an `_id` field with an ObjectId. The frontend expects a simple `id` string.
// This helper converts the MongoDB document format to the format expected by the client.
const fromMongo = (doc) => {
    if (!doc) return doc;
    const { _id, ...rest } = doc;
    return { id: _id.toHexString(), ...rest };
};

// Converts a string ID from the client back into a MongoDB ObjectId for database queries.
const toMongoId = (id) => new ObjectId(id);

// --- API Endpoints ---
// Each endpoint corresponds to a CRUD operation for a specific resource.

// --- Game Systems Endpoints ---
app.get('/api/game-systems', async (req, res) => {
    const systems = await gameSystemsCollection.find({}).toArray();
    res.json(systems.map(fromMongo)); // Convert all documents before sending.
});

app.post('/api/game-systems', async (req, res) => {
    try {
        const { name, colorScheme } = req.body;
        // Basic validation
        if (!name || typeof name !== 'string' || name.trim() === '') {
            return res.status(400).json({ message: 'Game system name is required and must be a non-empty string.' });
        }
        if (colorScheme && (typeof colorScheme !== 'object' || !colorScheme.primary || !colorScheme.secondary || !colorScheme.background)) {
             return res.status(400).json({ message: 'colorScheme must be an object with primary, secondary, and background properties.' });
        }
        
        const result = await gameSystemsCollection.insertOne({ name: name.trim(), colorScheme });
        const newSystem = await gameSystemsCollection.findOne({ _id: result.insertedId });
        res.status(201).json(fromMongo(newSystem));
    } catch (error) {
        console.error('Error adding game system:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

app.put('/api/game-systems/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, colorScheme } = req.body;
        const updateData = {};
        
        // Input validation
        if (name !== undefined) {
            if (typeof name !== 'string' || name.trim() === '') {
                return res.status(400).json({ message: 'Name must be a non-empty string.' });
            }
            updateData.name = name.trim();
        }

        if (colorScheme !== undefined) {
            if (typeof colorScheme !== 'object' || colorScheme === null || !colorScheme.primary || !colorScheme.secondary || !colorScheme.background) {
                return res.status(400).json({ message: 'colorScheme must be an object with primary, secondary, and background properties.' });
            }
            updateData.colorScheme = colorScheme;
        }

        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({ message: 'No update data provided.' });
        }
        
        const result = await gameSystemsCollection.findOneAndUpdate(
            { _id: toMongoId(id) }, 
            { $set: updateData },
            { returnDocument: 'after' }
        );

        if (!result) {
            return res.status(404).json({ message: 'Game system not found.' });
        }
        
        res.json(fromMongo(result));
    } catch (error) {
        if (error.name === 'BSONError') {
             return res.status(400).json({ message: 'Invalid ID format.' });
        }
        console.error('Error updating game system:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

app.delete('/api/game-systems/:id', async (req, res) => {
    const { id } = req.params;
    const systemId = toMongoId(id);
    
    // This is a cascading delete. Deleting a game system also deletes its associated armies and models.
    // 1. Find all armies associated with this game system.
    const armiesToDelete = await armiesCollection.find({ gameSystemId: systemId }).toArray();
    const armyIdsToDelete = armiesToDelete.map(a => a._id);

    // 2. Delete models associated with those armies OR whose primary gameSystemId matches.
    if (armyIdsToDelete.length > 0) {
        await modelsCollection.deleteMany({
             $or: [
                { armyIds: { $in: armyIdsToDelete } },
                { gameSystemId: systemId }
             ]
        });
    } else {
        // if no armies, still delete models associated with the game system
        await modelsCollection.deleteMany({ gameSystemId: systemId });
    }

    // 3. Delete the armies themselves.
    await armiesCollection.deleteMany({ gameSystemId: systemId });
    // 4. Finally, delete the game system.
    await gameSystemsCollection.deleteOne({ _id: systemId });
    
    res.status(204).send(); // 204 No Content status
});


// --- Armies Endpoints ---
app.get('/api/armies', async (req, res) => {
    const armies = await armiesCollection.find({}).toArray();
    // Here we need to convert both _id and the gameSystemId ObjectId.
    res.json(armies.map(doc => ({...fromMongo(doc), gameSystemId: doc.gameSystemId.toHexString()})));
});

app.post('/api/armies', async (req, res) => {
    const { name, gameSystemId } = req.body;
    const newArmyData = { name, gameSystemId: toMongoId(gameSystemId) };
    const result = await armiesCollection.insertOne(newArmyData);
    const newDoc = await armiesCollection.findOne({_id: result.insertedId});
    res.status(201).json({...fromMongo(newDoc), gameSystemId: newDoc.gameSystemId.toHexString()});
});

app.put('/api/armies/:id', async (req, res) => {
    const { id } = req.params;
    const { name, gameSystemId } = req.body;
    const updateData = {};
    if (name) updateData.name = name;
    if (gameSystemId) updateData.gameSystemId = toMongoId(gameSystemId);
    
    const result = await armiesCollection.findOneAndUpdate(
        { _id: toMongoId(id) }, 
        { $set: updateData },
        { returnDocument: 'after' }
    );
    res.json({...fromMongo(result), gameSystemId: result.gameSystemId.toHexString()});
});

app.delete('/api/armies/:id', async (req, res) => {
    const { id } = req.params;
    const armyId = toMongoId(id);

    // When deleting an army, we don't delete the model, just disassociate it.
    // Use MongoDB's `$pull` operator to remove the armyId from any model's `armyIds` array.
    await modelsCollection.updateMany(
        { armyIds: armyId },
        { $pull: { armyIds: armyId } }
    );
    
    // Then, delete the army document itself.
    await armiesCollection.deleteOne({ _id: armyId });
    
    res.status(204).send();
});


// --- Models Endpoints ---
app.get('/api/models', async (req, res) => {
    const models = await modelsCollection.find({}).toArray();
    // Convert all relevant ObjectIds to strings for the client.
    res.json(models.map(doc => ({
        ...fromMongo(doc), 
        gameSystemId: doc.gameSystemId.toHexString(),
        armyIds: doc.armyIds.map(id => id.toHexString())
    })));
});

app.post('/api/models', async (req, res) => {
    const { name, armyIds, gameSystemId, description, quantity, status, imageUrl, paintingNotes } = req.body;
    const now = new Date().toISOString();
    // Convert incoming string IDs to ObjectIds before inserting into the database.
    const newModelData = {
        name,
        armyIds: armyIds.map(id => toMongoId(id)),
        gameSystemId: toMongoId(gameSystemId),
        description,
        quantity,
        status,
        imageUrl,
        paintingNotes,
        createdAt: now,
        lastUpdated: now,
    };
    const result = await modelsCollection.insertOne(newModelData);
    const newDoc = await modelsCollection.findOne({_id: result.insertedId});
    // Convert the newly created document back to the client-friendly format.
    res.status(201).json({
        ...fromMongo(newDoc),
        gameSystemId: newDoc.gameSystemId.toHexString(),
        armyIds: newDoc.armyIds.map(id => id.toHexString())
    });
});

app.put('/api/models/:id', async (req, res) => {
    const { id } = req.params;
    const modelUpdates = req.body;
    
    // Convert any ID strings in the update payload to ObjectIds.
    if(modelUpdates.gameSystemId) modelUpdates.gameSystemId = toMongoId(modelUpdates.gameSystemId);
    if(modelUpdates.armyIds) modelUpdates.armyIds = modelUpdates.armyIds.map(id => toMongoId(id));
    
    // The `id` property is not part of the MongoDB document, so remove it before updating.
    delete modelUpdates.id;

    // Automatically set the lastUpdated timestamp on every update.
    modelUpdates.lastUpdated = new Date().toISOString();

    const result = await modelsCollection.findOneAndUpdate(
        { _id: toMongoId(id) }, 
        { $set: modelUpdates },
        { returnDocument: 'after' }
    );
    // Convert the updated document back to the client-friendly format.
    res.json({
        ...fromMongo(result),
        gameSystemId: result.gameSystemId.toHexString(),
        armyIds: result.armyIds.map(id => id.toHexString())
    });
});

app.delete('/api/models/:id', async (req, res) => {
    const { id } = req.params;
    await modelsCollection.deleteOne({ _id: toMongoId(id) });
    res.status(204).send();
});

// --- Painting Sessions Endpoints ---
app.get('/api/painting-sessions', async (req, res) => {
    const sessions = await paintingSessionsCollection.find({}).sort({ start: 1 }).toArray();
    res.json(sessions.map(doc => ({
        ...fromMongo(doc),
        modelIds: (doc.modelIds || []).map(id => id.toHexString()),
        gameSystemId: doc.gameSystemId ? doc.gameSystemId.toHexString() : undefined
    })));
});

app.post('/api/painting-sessions', async (req, res) => {
    const { title, start, end, notes, modelIds, gameSystemId } = req.body;
    const newSessionData = {
        title,
        start,
        end,
        notes,
        modelIds: (modelIds || []).map(id => toMongoId(id)),
    };
    if (gameSystemId && ObjectId.isValid(gameSystemId)) {
        newSessionData.gameSystemId = toMongoId(gameSystemId);
    }
    const result = await paintingSessionsCollection.insertOne(newSessionData);
    const newDoc = await paintingSessionsCollection.findOne({ _id: result.insertedId });
    res.status(201).json({
        ...fromMongo(newDoc),
        modelIds: (newDoc.modelIds || []).map(id => id.toHexString()),
        gameSystemId: newDoc.gameSystemId ? newDoc.gameSystemId.toHexString() : undefined
    });
});

app.put('/api/painting-sessions/:id', async (req, res) => {
    const { id } = req.params;
    const sessionUpdates = req.body;
    if (sessionUpdates.modelIds) {
        sessionUpdates.modelIds = sessionUpdates.modelIds.map(id => toMongoId(id));
    }
    // Handle gameSystemId: convert if it's a valid ID string, otherwise set to null to clear it.
    if (sessionUpdates.hasOwnProperty('gameSystemId')) {
        if (sessionUpdates.gameSystemId && ObjectId.isValid(sessionUpdates.gameSystemId)) {
            sessionUpdates.gameSystemId = toMongoId(sessionUpdates.gameSystemId);
        } else {
            sessionUpdates.gameSystemId = null;
        }
    }
    delete sessionUpdates.id;

    const result = await paintingSessionsCollection.findOneAndUpdate(
        { _id: toMongoId(id) },
        { $set: sessionUpdates },
        { returnDocument: 'after' }
    );

    if (!result) {
        return res.status(404).json({ message: 'Painting session not found.' });
    }

    res.json({
        ...fromMongo(result),
        modelIds: (result.modelIds || []).map(id => id.toHexString()),
        gameSystemId: result.gameSystemId ? result.gameSystemId.toHexString() : undefined
    });
});

app.delete('/api/painting-sessions/:id', async (req, res) => {
    const { id } = req.params;
    const result = await paintingSessionsCollection.deleteOne({ _id: toMongoId(id) });
    if (result.deletedCount === 0) {
        return res.status(404).json({ message: 'Painting session not found.' });
    }
    res.status(204).send();
});

// --- Paints Endpoints ---
app.get('/api/paints', async (req, res) => {
    const paints = await paintsCollection.find({}).sort({ manufacturer: 1, name: 1 }).toArray();
    res.json(paints.map(fromMongo));
});

app.post('/api/paints', async (req, res) => {
    try {
        const { name, paintType, manufacturer, colorScheme, rgbCode, stock } = req.body;
        // Basic validation
        if (!name || !paintType || !manufacturer || !colorScheme) {
            return res.status(400).json({ message: 'Missing required fields: name, paintType, manufacturer, colorScheme.' });
        }
        
        const newPaintData = { name, paintType, manufacturer, colorScheme, rgbCode, stock: Number(stock) || 0 };
        const result = await paintsCollection.insertOne(newPaintData);
        const newPaint = await paintsCollection.findOne({ _id: result.insertedId });
        res.status(201).json(fromMongo(newPaint));
    } catch (error) {
        console.error('Error adding paint:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

app.put('/api/paints/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, paintType, manufacturer, colorScheme, rgbCode, stock } = req.body;
        const updateData = {};

        if (name !== undefined) updateData.name = name;
        if (paintType !== undefined) updateData.paintType = paintType;
        if (manufacturer !== undefined) updateData.manufacturer = manufacturer;
        if (colorScheme !== undefined) updateData.colorScheme = colorScheme;
        // Allow setting rgbCode to an empty string to clear it
        if (rgbCode !== undefined) updateData.rgbCode = rgbCode;
        if (stock !== undefined) updateData.stock = Number(stock);

        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({ message: 'No update data provided.' });
        }
        
        const result = await paintsCollection.findOneAndUpdate(
            { _id: toMongoId(id) }, 
            { $set: updateData },
            { returnDocument: 'after' }
        );

        if (!result) {
            return res.status(404).json({ message: 'Paint not found.' });
        }
        
        res.json(fromMongo(result));
    } catch (error) {
        if (error.name === 'BSONError') {
             return res.status(400).json({ message: 'Invalid ID format.' });
        }
        console.error('Error updating paint:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

app.delete('/api/paints/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await paintsCollection.deleteOne({ _id: toMongoId(id) });
        if (result.deletedCount === 0) {
            return res.status(404).json({ message: 'Paint not found.' });
        }
        res.status(204).send();
    } catch (error) {
         if (error.name === 'BSONError') {
             return res.status(400).json({ message: 'Invalid ID format.' });
        }
        console.error('Error deleting paint:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Start the application.
main().catch(console.error);