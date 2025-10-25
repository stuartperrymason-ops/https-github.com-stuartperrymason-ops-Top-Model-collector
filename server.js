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

// MongoDB connection settings, read from environment variables with sensible defaults.
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017';
const DB_NAME = process.env.DB_NAME || 'tabletop_collector';
const client = new MongoClient(MONGODB_URI);

// Global variables to hold references to the database and collections once connected.
let db;
let gameSystemsCollection;
let armiesCollection;
let modelsCollection;

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
        if (systemCount > 0) {
            console.log('Database already contains data. Skipping seed.');
            return;
        }

        console.log('Seeding database with initial data...');

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
            }
        ]);

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
    const { name, colorScheme } = req.body;
    const result = await gameSystemsCollection.insertOne({ name, colorScheme });
    const newSystem = await gameSystemsCollection.findOne({ _id: result.insertedId });
    res.status(201).json(fromMongo(newSystem));
});

app.put('/api/game-systems/:id', async (req, res) => {
    const { id } = req.params;
    const { name, colorScheme } = req.body;
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (colorScheme !== undefined) updateData.colorScheme = colorScheme;
    
    const result = await gameSystemsCollection.findOneAndUpdate(
        { _id: toMongoId(id) }, 
        { $set: updateData },
        { returnDocument: 'after' } // Return the updated document.
    );
    res.json(fromMongo(result));
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

// Start the application.
main().catch(console.error);