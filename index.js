const express = require('express');
const app = express();
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion } = require('mongodb');
const cors = require('cors');
require('dotenv').config();
const ObjectId = require('mongodb').ObjectId;
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
        const orderCollection = client.db('manufacturerWebsite').collection('orders');
        const userCollection = client.db('manufacturerWebsite').collection('users');



        // get tools 
        app.get('/tool', async (req, res) => {
            const tools = await toolCollection.find({}).toArray();
            res.send(tools);
        })

        // post order 
        app.put('/order', async (req, res) => {
            const { email, isPaid, _id } = req.body;
            const filter = { email: email, isPaid: isPaid, id: _id };
            const options = { upsert: true };
            const updateDoc = {
                $set: {
                    data: req.body
                },
            };
            const result = await orderCollection.updateOne(filter, updateDoc, options);
            res.send(result);
        })

        // get order 
        app.get('/order/:email', async (req, res) => {
            const email = req.params.email;
            const orders = await orderCollection.find({ email }).toArray();
            res.send(orders);
        })

        //delete order
        app.delete('/order/:id', async (req, res) => {
            const id = req.params.id;
            const query = { id: id };
            const result = await orderCollection.deleteOne(query);
            res.send(result);
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
