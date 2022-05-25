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
const stripe = require("stripe")(`${process.env.PAYMENT_SECRET}`)
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
            const { name, orderQuantity, email, date, address, totalPrice, customerName, isPaid, _id, transitionId, status } = req.body;
            const filter = { email: email, isPaid: isPaid, id: _id };
            const options = { upsert: true };
            const updateDoc = {
                $set: {
                    name: name,
                    orderQuantity: orderQuantity,
                    email: email,
                    date: date,
                    address: address,
                    totalPrice: totalPrice,
                    customerName: customerName,
                    isPaid: isPaid,
                    id: _id,
                    transitionId: transitionId,
                    status: status,
                },
            };
            const result = await orderCollection.updateOne(filter, updateDoc, options);
            res.send(result);
        })

        // get order 
        app.get('/order', async (req, res) => {
            const email = req.query.email;
            const orders = await orderCollection.find({ email }).toArray();
            res.send(orders);
        })
        app.get('/order/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: ObjectId(id) };
            const result = await orderCollection.findOne(filter);
            res.send(result)
        })

        //delete order
        app.delete('/order/:id', async (req, res) => {
            const id = req.params.id;
            const query = { id: id };
            const result = await orderCollection.deleteOne(query);
            res.send(result);
        })

        // payment process 
        app.post('/create-payment-intent', async (req, res) => {
            const amount = parseInt(req.body.totalPrice) * 100;
            const paymentIntent = await stripe.paymentIntents.create({
                amount: amount,
                currency: "usd",
                automatic_payment_methods: {
                    enabled: true,
                },
            });
            res.send({
                clientSecret: paymentIntent.client_secret,
            });
        })

        app.put('/update-order', async (req, res) => {
            const { id, paymentId } = req.body;
            const transId = paymentId.split('_')[1];
            console.log(transId);
            const filter = { _id: ObjectId(id) };
            const updateDoc = {
                $set: {
                    isPaid: true,
                    transitionId: transId,
                },
            };
            const result = await orderCollection.updateOne(filter, updateDoc);
            res.send(result);
        })
        // app.put('/update-tool', async (req, res) => {
        //     const id = req.params.id;
        //     const filter = { _id: ObjectId(id) };
        //     const updateDoc = {
        //         $set: {
        //             isPaid: true
        //         },
        //     };
        //     const result = await orderCollection.updateOne(filter, updateDoc);
        //     res.send(result);
        // })
    }
    finally {
        // await client.close()
    }
}
run();
app.listen(port, () => {
    console.log('Running on port', port)
})
