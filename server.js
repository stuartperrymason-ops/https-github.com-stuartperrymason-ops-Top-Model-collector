/**
 * @file server.js
 * @description Backend Express server for the ModelForge application.
 * Connects to a MongoDB database and provides API endpoints for CRUD operations.
 */
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { MongoClient, ObjectId } = require('mongodb');

const app = express();
const PORT = 3001;

// MongoDB connection settings
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017';
const DB_NAME = process.env.DB_NAME || 'tabletop_collector';
const client = new MongoClient(MONGODB_URI);

let db;
let gameSystemsCollection;
let armiesCollection;
let modelsCollection;

// Middleware
app.use(cors());
app.use(express.json());

/**
 * Seeds the database with initial data if it's empty.
 */
const seedDatabase = async () => {
    try {
        const systemCount = await gameSystemsCollection.countDocuments();
        if (systemCount > 0) {
            console.log('Database already contains data. Skipping seed.');
            return;
        }

        console.log('Seeding database with initial data...');

        // Game Systems
        const wh40k = await gameSystemsCollection.insertOne({ name: 'Warhammer 40,000' });
        const aos = await gameSystemsCollection.insertOne({ name: 'Age of Sigmar' });
        const mcp = await gameSystemsCollection.insertOne({ name: 'Marvel Crisis Protocol' });

        const wh40kId = wh40k.insertedId;
        const aosId = aos.insertedId;
        const mcpId = mcp.insertedId;

        // Armies
        const sm = await armiesCollection.insertOne({ name: 'Space Marines', gameSystemId: wh40kId });
        const orks = await armiesCollection.insertOne({ name: 'Orks', gameSystemId: wh40kId });
        await armiesCollection.insertOne({ name: 'Stormcast Eternals', gameSystemId: aosId });
        const avengers = await armiesCollection.insertOne({ name: 'Avengers', gameSystemId: mcpId });
        const xmen = await armiesCollection.insertOne({ name: 'Uncanny X-Men', gameSystemId: mcpId });

        const smId = sm.insertedId;
        const orksId = orks.insertedId;
        const avengersId = avengers.insertedId;
        const xmenId = xmen.insertedId;


        // Models
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
 * Connects to MongoDB and starts the Express server.
 */
async function main() {
    try {
        await client.connect();
        console.log('Connected successfully to MongoDB');
        db = client.db(DB_NAME);
        gameSystemsCollection = db.collection('game_systems');
        armiesCollection = db.collection('armies');
        modelsCollection = db.collection('models');

        // Seed database if empty
        await seedDatabase();

        app.listen(PORT, () => {
            console.log(`Server running on http://localhost:${PORT}`);
        });

    } catch (e) {
        console.error('Could not connect to MongoDB', e);
        process.exit(1);
    }
}

// --- API Helper ---
// Helper to convert _id to id for client-side consistency
const fromMongo = (doc) => {
    if (!doc) return doc;
    const { _id, ...rest } = doc;
    return { id: _id.toHexString(), ...rest };
};

const toMongoId = (id) => new ObjectId(id);

// --- API Endpoints ---

// Game Systems
app.get('/api/game-systems', async (req, res) => {
    const systems = await gameSystemsCollection.find({}).toArray();
    res.json(systems.map(fromMongo));
});

app.post('/api/game-systems', async (req, res) => {
    const { name } = req.body;
    const result = await gameSystemsCollection.insertOne({ name });
    const newSystem = { id: result.insertedId.toHexString(), name };
    res.status(201).json(newSystem);
});

app.put('/api/game-systems/:id', async (req, res) => {
    const { id } = req.params;
    const { name } = req.body;
    const result = await gameSystemsCollection.findOneAndUpdate(
        { _id: toMongoId(id) }, 
        { $set: { name } },
        { returnDocument: 'after' }
    );
    res.json(fromMongo(result));
});

app.delete('/api/game-systems/:id', async (req, res) => {
    const { id } = req.params;
    const systemId = toMongoId(id);
    
    // Find all armies associated with this game system
    const armiesToDelete = await armiesCollection.find({ gameSystemId: systemId }).toArray();
    const armyIdsToDelete = armiesToDelete.map(a => a._id);

    // Delete models associated with those armies or the game system
    if (armyIdsToDelete.length > 0) {
        await modelsCollection.deleteMany({ armyIds: { $in: armyIdsToDelete } });
    }
    // Delete the armies
    await armiesCollection.deleteMany({ gameSystemId: systemId });
    // Delete the game system
    await gameSystemsCollection.deleteOne({ _id: systemId });
    
    res.status(204).send();
});


// Armies
app.get('/api/armies', async (req, res) => {
    const armies = await armiesCollection.find({}).toArray();
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

    // Remove this armyId from any model's armyIds array
    await modelsCollection.updateMany(
        { armyIds: armyId },
        { $pull: { armyIds: armyId } }
    );
    
    // Delete the army itself
    await armiesCollection.deleteOne({ _id: armyId });
    
    res.status(204).send();
});


// Models
app.get('/api/models', async (req, res) => {
    const models = await modelsCollection.find({}).toArray();
    res.json(models.map(doc => ({
        ...fromMongo(doc), 
        gameSystemId: doc.gameSystemId.toHexString(),
        armyIds: doc.armyIds.map(id => id.toHexString())
    })));
});

app.post('/api/models', async (req, res) => {
    const { name, armyIds, gameSystemId, description, quantity, status, imageUrl, paintingNotes } = req.body;
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
    res.status(201).json({
        ...fromMongo(newDoc),
        gameSystemId: newDoc.gameSystemId.toHexString(),
        armyIds: newDoc.armyIds.map(id => id.toHexString())
    });
});

app.put('/api/models/:id', async (req, res) => {
    const { id } = req.params;
    const modelUpdates = req.body;
    
    // Convert string IDs to ObjectIds where necessary
    if(modelUpdates.gameSystemId) modelUpdates.gameSystemId = toMongoId(modelUpdates.gameSystemId);
    if(modelUpdates.armyIds) modelUpdates.armyIds = modelUpdates.armyIds.map(id => toMongoId(id));
    
    delete modelUpdates.id; // remove id property before update

    const result = await modelsCollection.findOneAndUpdate(
        { _id: toMongoId(id) }, 
        { $set: modelUpdates },
        { returnDocument: 'after' }
    );
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

main().catch(console.error);