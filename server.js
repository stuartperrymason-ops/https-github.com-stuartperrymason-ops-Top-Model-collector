/**
 * @file server.js
 * @description An Express server with a MongoDB connection to provide a persistent API for the ModelForge application.
 * It provides CRUD endpoints for game systems, armies, and models.
 */

const express = require('express');
const cors = require('cors');
const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config();

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB connection settings from .env file
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const DB_NAME = process.env.DB_NAME || 'model_collector';

let gameSystemsCollection;
let armiesCollection;
let modelsCollection;

/**
 * Maps MongoDB's internal _id to a frontend-friendly 'id' string.
 * @param {object} doc - The document from MongoDB.
 * @returns {object} The document with `_id` replaced by `id`.
 */
const mapMongoId = (doc) => {
    if (doc && doc._id) {
        doc.id = doc._id.toString();
        delete doc._id;
    }
    return doc;
};

/**
 * Seeds the database with initial data if the collections are empty.
 */
async function seedDatabase() {
    const systemCount = await gameSystemsCollection.countDocuments();
    if (systemCount === 0) {
        console.log('Database is empty, seeding with initial data...');
        const gsResult = await gameSystemsCollection.insertMany([
            { name: 'Warhammer 40,000' },
            { name: 'Age of Sigmar' },
        ]);

        const wh40kId = gsResult.insertedIds[0].toString();
        const aosId = gsResult.insertedIds[1].toString();

        const armyResult = await armiesCollection.insertMany([
            { name: 'Space Marines', gameSystemId: wh40kId },
            { name: 'Orks', gameSystemId: wh40kId },
            { name: 'Stormcast Eternals', gameSystemId: aosId },
        ]);

        const smId = armyResult.insertedIds[0].toString();
        const orkId = armyResult.insertedIds[1].toString();

        await modelsCollection.insertMany([
            {
                name: 'Primaris Intercessor',
                armyIds: [smId],
                gameSystemId: wh40kId,
                description: 'The backbone of any Space Marine force, Primaris Intercessors are versatile and reliable infantry units.',
                quantity: 10,
                status: 'Ready to Game',
                imageUrl: 'https://via.placeholder.com/300x200.png?text=Intercessor',
            },
            {
                name: 'Ork Boy',
                armyIds: [orkId],
                gameSystemId: wh40kId,
                description: 'Ork Boyz are the rank-and-file infantry of an Ork army. What they lack in skill, they make up for in sheer numbers and enthusiasm for a good scrap.',
                quantity: 20,
                status: 'Primed',
                imageUrl: 'https://via.placeholder.com/300x200.png?text=Ork+Boy',
            }
        ]);
        console.log('Seeding complete.');
    }
}

/**
 * Connects to the MongoDB database and initializes collection variables.
 */
async function connectToDb() {
    try {
        const client = new MongoClient(MONGODB_URI);
        await client.connect();
        console.log('Connected successfully to MongoDB');
        
        const db = client.db(DB_NAME);
        gameSystemsCollection = db.collection('gameSystems');
        armiesCollection = db.collection('armies');
        modelsCollection = db.collection('models');

        await seedDatabase();
    } catch (e) {
        console.error('Could not connect to MongoDB', e);
        process.exit(1);
    }
}

// --- API Endpoints ---

// Game Systems
app.get('/api/game-systems', async (req, res) => {
    const systems = await gameSystemsCollection.find({}).toArray();
    res.json(systems.map(mapMongoId));
});

app.post('/api/game-systems', async (req, res) => {
    const { name } = req.body;
    const result = await gameSystemsCollection.insertOne({ name });
    const newSystem = await gameSystemsCollection.findOne({ _id: result.insertedId });
    res.status(201).json(mapMongoId(newSystem));
});

app.put('/api/game-systems/:id', async (req, res) => {
    const { id } = req.params;
    const { name } = req.body;
    if (!ObjectId.isValid(id)) return res.status(400).json({ message: 'Invalid ID format' });
    
    const result = await gameSystemsCollection.updateOne({ _id: new ObjectId(id) }, { $set: { name } });
    if (result.matchedCount === 0) return res.status(404).json({ message: 'Game system not found' });
    
    const updatedSystem = await gameSystemsCollection.findOne({ _id: new ObjectId(id) });
    res.json(mapMongoId(updatedSystem));
});

app.delete('/api/game-systems/:id', async (req, res) => {
    const { id } = req.params;
    if (!ObjectId.isValid(id)) return res.status(400).json({ message: 'Invalid ID format' });
    
    // Cascade delete associated armies and models
    await armiesCollection.deleteMany({ gameSystemId: id });
    await modelsCollection.deleteMany({ gameSystemId: id });
    
    const result = await gameSystemsCollection.deleteOne({ _id: new ObjectId(id) });
    if (result.deletedCount === 0) return res.status(404).json({ message: 'Game system not found' });
    
    res.status(204).send();
});


// Armies
app.get('/api/armies', async (req, res) => {
    const armies = await armiesCollection.find({}).toArray();
    res.json(armies.map(mapMongoId));
});

app.post('/api/armies', async (req, res) => {
    const { name, gameSystemId } = req.body;
    const result = await armiesCollection.insertOne({ name, gameSystemId });
    const newArmy = await armiesCollection.findOne({ _id: result.insertedId });
    res.status(201).json(mapMongoId(newArmy));
});

app.put('/api/armies/:id', async (req, res) => {
    const { id } = req.params;
    const { name, gameSystemId } = req.body;
    if (!ObjectId.isValid(id)) return res.status(400).json({ message: 'Invalid ID format' });
    
    const updateDoc = {};
    if (name) updateDoc.name = name;
    if (gameSystemId) updateDoc.gameSystemId = gameSystemId;

    const result = await armiesCollection.updateOne({ _id: new ObjectId(id) }, { $set: updateDoc });
    if (result.matchedCount === 0) return res.status(404).json({ message: 'Army not found' });

    const updatedArmy = await armiesCollection.findOne({ _id: new ObjectId(id) });
    res.json(mapMongoId(updatedArmy));
});

app.delete('/api/armies/:id', async (req, res) => {
    const { id } = req.params;
    if (!ObjectId.isValid(id)) return res.status(400).json({ message: 'Invalid ID format' });
    
    // Disassociate models from the deleted army, instead of deleting the models.
    await modelsCollection.updateMany({ armyIds: id }, { $pull: { armyIds: id } });
    
    const result = await armiesCollection.deleteOne({ _id: new ObjectId(id) });
    if (result.deletedCount === 0) return res.status(404).json({ message: 'Army not found' });
    
    res.status(204).send();
});


// Models
app.get('/api/models', async (req, res) => {
    const models = await modelsCollection.find({}).toArray();
    res.json(models.map(mapMongoId));
});

app.post('/api/models', async (req, res) => {
    const modelData = req.body;
    const result = await modelsCollection.insertOne(modelData);
    const newModel = await modelsCollection.findOne({ _id: result.insertedId });
    res.status(201).json(mapMongoId(newModel));
});

app.put('/api/models/:id', async (req, res) => {
    const { id } = req.params;
    const modelUpdates = req.body;
    if (!ObjectId.isValid(id)) return res.status(400).json({ message: 'Invalid ID format' });
    
    const result = await modelsCollection.updateOne({ _id: new ObjectId(id) }, { $set: modelUpdates });
    if (result.matchedCount === 0) return res.status(404).json({ message: 'Model not found' });
    
    const updatedModel = await modelsCollection.findOne({ _id: new ObjectId(id) });
    res.json(mapMongoId(updatedModel));
});

app.delete('/api/models/:id', async (req, res) => {
    const { id } = req.params;
    if (!ObjectId.isValid(id)) return res.status(400).json({ message: 'Invalid ID format' });

    const result = await modelsCollection.deleteOne({ _id: new ObjectId(id) });
    if (result.deletedCount === 0) return res.status(404).json({ message: 'Model not found' });
    
    res.status(204).send();
});


// Start server after connecting to DB
connectToDb().then(() => {
    app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
    });
}).catch(err => {
    console.error("Failed to start server:", err);
});