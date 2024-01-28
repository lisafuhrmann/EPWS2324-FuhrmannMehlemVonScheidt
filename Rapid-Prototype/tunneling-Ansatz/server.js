// Ursprungscode und Konzept von: https://technology.amis.nl/cloud/implementing-serverless-multi-client-session-synchronization-with-oracle-cloud-infrastructure/
const cache = require('./live-cache.js');

const express = require('express');
const localtunnel = require('localtunnel');
const path = require('path');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const port = 3000;
// Header für CORS Responses
const allowedHeader = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,OPTIONS,POST,PUT',
    'Access-Control-Allow-Headers': '*',
}

const rootPath = path.join(__dirname, '');
console.log("Root Path: " + rootPath)

app.use(cors());
app.use(bodyParser.json());

// Set up localtunnel
const subdomain = 'ripe-mangos-super-smell';
localtunnel(port, { subdomain: subdomain }, (err, tunnel) => {
    if (err) {
        console.error('Error creating tunnel:', err);
    } else {
        console.log(`Tunnel URL: ${tunnel.url}`);
        // Share the tunnel URL with others
    }
});

app.get('/', (req, res) => {
    const sessionKey = req.query.sessionKey;

    if (!sessionKey || sessionKey.trim() === '') {
        res.redirect('index.html');
    } else {
        console.log("Deine Mudda war hier")
        result = cache.readFromCache(sessionKey)
        console.log("Result: " + JSON.stringify(result))
        res.set(allowedHeader);

        res.status(200).send({
            body: result,
            mode: "cors"
        });
    }
});

app.post('/', (req, res) => {
    result = cache.startNewSession();
    console.log("Result: " + JSON.stringify(result))
    res.set(allowedHeader);

    res.status(200).send({
        body: result,
    });
});

app.put('/', (req, res) => {
    const theBody = req.body;
    JSON.stringify("The Body: " + theBody);
    const sessionKey = req.query.sessionKey;

    result = cache.writeToCache(sessionKey, theBody.value)
    console.log("Result von Write to Cache: " + JSON.stringify(result))
    res.set(allowedHeader);

    res.status(200).send({
        body: result,
        mode: "cors"
    });
});

app.options('/', (req, res) => {
    console.log("Das Kitzelt");

    res.set(allowedHeader);
    res.status(200).send();
})

//Homepage route
app.get("/index.html", function (req, res) { //root dir
    res.sendFile(path.join(rootPath, 'index.html'));
});

app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});