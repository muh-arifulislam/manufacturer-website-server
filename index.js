const express = require('express');
const app = express();
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion } = require('mongodb');
const cors = require('cors');
require('dotenv').config();
const port = process.env.PORT || 5000;
// middleware
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
    res.send('Server running')
})


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.vzpmm.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run() {
    try {
        await client.connect();
        const toolCollection = client.db('manufacturerWebsite').collection('toolCollection');

        // get tools 
        app.get('/tool', async (req, res) => {
            const tools = await toolCollection.find({}).toArray();
            res.send(tools);
        })
    }
    finally {
        // await client.close()
    }
}
run();
app.listen(port, () => {
    console.log('Running on port', port)
})
