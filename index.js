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

app.listen(port, () => {
    console.log('Running on port', port)
})
