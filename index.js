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

function verifyJWT(req, res, next) {
    const authHeader = req.headers.authorization;
    const token = authHeader?.split(' ')[1];
    if (!authHeader) {
        return res.status(401).send({ message: 'unauthorized access' });

    }
    jwt.verify(token, process.env.ACCESS_SECRET, function (err, decoded) {
        if (err) {
            return res.status(403).send({ message: 'forbidden access from middleware' })
        }
        req.decoded = decoded;
        next();
    })
}


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.vzpmm.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
const stripe = require("stripe")(`${process.env.PAYMENT_SECRET}`)
async function run() {
    try {
        await client.connect();
        const toolCollection = client.db('manufacturerWebsite').collection('toolCollection');
        const orderCollection = client.db('manufacturerWebsite').collection('orders');
        const userCollection = client.db('manufacturerWebsite').collection('users');
        const reviewCollection = client.db('manufacturerWebsite').collection('reviews');


        // provide jwttoken 
        app.put('/user/:email', async (req, res) => {
            const email = req.params.email;
            console.log(email);
            const { name } = req.body;
            const filter = { email: email };
            const options = { upsert: true };
            const updateDoc = {
                $set: {
                    name: name,
                    email: email
                }
            };
            const result = await userCollection.updateOne(filter, updateDoc, options);
            const token = jwt.sign({ email: email }, process.env.ACCESS_SECRET, { expiresIn: '2d' })
            res.send({ result, accessToken: token });
        })

        // get user data 
        app.get('/user/:email', verifyJWT, async (req, res) => {
            const email = req.params.email;
            const decodedEmail = req.decoded.email;
            const query = { email };
            if (decodedEmail === email) {
                const result = await userCollection.findOne(query);
                res.send(result);
            }
            else {
                res.status(403).send({ message: "forbidden accesss" })
            }
        })

        // update user 
        app.put('/user', verifyJWT, async (req, res) => {
            const { fullName, email, linkedIn, institute, educationFromYear, educationToYear, number, city, zip, country } = req.body;
            const decodedEmail = req.decoded.email;
            const filter = { email };
            const options = { upsert: true };
            const updateDoc = {
                $set: {
                    name: fullName,
                    linkedIn: linkedIn,
                    institute: institute,
                    session: { educationFromYear, educationToYear },
                    number: number,
                    city: city,
                    zip: zip,
                    country: country,
                },
            };
            if (decodedEmail === email) {
                const result = await userCollection.updateOne(filter, updateDoc, options);
                res.send(result);
            }
            else {
                res.status(403).send({ message: 'forbidden access ' })
            }
        })

        // update user image 
        app.put('/user/image/:id', verifyJWT, async (req, res) => {
            const { image } = req.body;
            const id = req.params.id;
            const email = req.query.email;
            const decodedEmail = req.decoded.email;
            console.log(id, email, decodedEmail, image);
            const options = { upsert: true }
            const filter = { _id: ObjectId(id) };
            const updateDoc = {
                $set: {
                    image: image
                },
            };
            if (decodedEmail === email) {
                const result = await userCollection.updateOne(filter, updateDoc, options);
                res.send(result);
            }
            else {
                res.status(403).send({ message: 'forbidden access ' })
            }
        })


        // get tools 
        app.get('/tool', async (req, res) => {
            const tools = await toolCollection.find({}).toArray();
            res.send(tools);
        })

        // post tools 
        app.post('/tool', verifyJWT, async (req, res) => {
            const email = req.query.email;
            const decodedEmail = req.decoded.email;
            const data = req.body;
            if (email === decodedEmail) {
                const result = await toolCollection.insertOne(data);
                res.send(result);
            }
            else {
                res.status(403).send({ message: "forbidden access" })
            }
        })


        // delete tool 
        app.delete('/tool/:id', verifyJWT, async (req, res) => {
            const id = req.params.id;
            const email = req.query.email;
            const decodedEmail = req.decoded.email;
            const filter = { _id: ObjectId(id) };
            if (decodedEmail === email) {
                const result = await toolCollection.deleteOne(filter);
                res.send(result);
            }
            else {
                res.status(403).send({ message: "forbidden access" })
            }
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
        app.get('/order', verifyJWT, async (req, res) => {
            const decodedEmail = req.decoded.email;
            const email = req.query.email;
            const userData = await userCollection.findOne({ email })
            if (decodedEmail === email) {
                if (userData.role === 'admin') {
                    const orders = await orderCollection.find({}).toArray();
                    res.send(orders);
                }
                else {
                    const orders = await orderCollection.find({ email }).toArray();
                    res.send(orders);
                }

            }
            else {
                res.status(403).send({ message: 'forbidden access' })
            }
        })
        app.get('/order/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: ObjectId(id) };
            const result = await orderCollection.findOne(filter);
            res.send(result)
        })

        // update order status 
        app.put('/order/:id', verifyJWT, async (req, res) => {
            const id = req.params.id;
            const email = req.query.email;
            const decodedEmail = req.decoded.email;
            const { operation } = req.body;
            const filter = { _id: ObjectId(id) };
            let updateDoc;
            if (operation === "payment") {
                updateDoc = {
                    $set: {
                        isPaid: "paid",
                        transitionId: "paidbyadmin",
                        status: "pending",
                    }
                }
            }
            if (operation === "deliver") {
                updateDoc = {
                    $set: {
                        status: "delivered"
                    }
                }
            }
            if (decodedEmail === email) {
                const result = await orderCollection.updateOne(filter, updateDoc);
                res.send(result)
            }
            else {
                res.status(403).send({ message: "forbidden access" })
            }
        })

        //delete order
        app.delete('/order/:id', verifyJWT, async (req, res) => {
            const id = req.params.id;
            const decodedEmail = req.decoded.email;
            const email = req.query.email;
            const query = { _id: ObjectId(id) };
            console.log(id);
            if (decodedEmail === email) {
                const result = await orderCollection.deleteOne(query);
                res.send(result);
            }
            else {
                res.status(403).send({ message: 'forbidden access' })
            }
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

        // update order after payment 
        app.put('/update-order', async (req, res) => {
            const { id, paymentId } = req.body;
            const transId = paymentId.split('_')[1];
            console.log(transId);
            const filter = { _id: ObjectId(id) };
            const updateDoc = {
                $set: {
                    isPaid: true,
                    transitionId: transId,
                    status: 'pending',
                },
            };
            const result = await orderCollection.updateOne(filter, updateDoc);
            res.send(result);
        })
        app.put('/update-tool', async (req, res) => {
            const { id, orderQuantity } = req.body;
            const filter = { _id: ObjectId(id) };
            const tool = await toolCollection.findOne(filter);
            const { quantity } = tool;
            const newQuantity = parseInt(quantity) - parseInt(orderQuantity);
            const updateDoc = {
                $set: {
                    quantity: parseInt(newQuantity)
                },
            };
            const result = await toolCollection.updateOne(filter, updateDoc);
            res.send(result);
        })

        // get all review 
        app.get('/reviews', async (req, res) => {
            const result = await reviewCollection.find({}).toArray();
            res.send(result);
        })

        // add review 
        app.post('/review', async (req, res) => {
            const data = req.body;
            const result = await reviewCollection.insertOne(data);
            res.send(result)
        })

        // get reviews 
        app.get('/review', verifyJWT, async (req, res) => {
            const email = req.query.email;
            const decodedEmail = req.decoded.email;
            const filter = { email }
            if (decodedEmail === email) {
                const reviews = await reviewCollection.find(filter).toArray();
                res.send(reviews)
            }
            else {
                res.status(403).send({ message: "forbidden access" })
            }

        })

        // get all users 
        app.get('/user', verifyJWT, async (req, res) => {
            const decodedEmail = req.decoded.email;
            const email = req.query.email;
            if (decodedEmail === email) {
                const result = await userCollection.find({}).toArray();
                res.send(result)
            }
            else {
                res.status(403).send({ message: "forbidden access" })
            }
        })

        // make user admin 
        app.put('/make-admin/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: ObjectId(id) }
            const updatedDoc = {
                $set: {
                    role: "admin"
                }
            }
            const result = await userCollection.updateOne(filter, updatedDoc);
            res.send(result)
        })

        // delete tool 
        // app.delete('/tool', async (req, res) => {

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
