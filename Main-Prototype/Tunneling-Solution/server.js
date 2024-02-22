/* Konzept von: https://technology.amis.nl/cloud/implementing-serverless-multi-client-session-synchronization-with-oracle-cloud-infrastructure/ */
const cache = require('./live-cache.js');
const memberCache = require('./member-cache.js');
const express = require('express');
const localtunnel = require('localtunnel');
const path = require('path');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const port = 3000;
const allowedHeader = {     // Header für CORS Responses
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,OPTIONS,POST,PUT',
    'Access-Control-Allow-Headers': '*',
}

const rootPath = path.join(__dirname, '');
console.log("Root Path: " + rootPath)

app.use(cors());
app.use(bodyParser.json());
app.use('/src/css/main.css', express.static(path.join(__dirname, 'src/css/main.css')));
app.use('/src', express.static(path.join(__dirname, 'src')));

// Set up localtunnel
////const subdomain = 'ripe-mangos-super-smell';
const subdomain = '';
localtunnel(port, { subdomain: subdomain }, (err, tunnel) => {
    if (err) {
        console.error('Error creating tunnel:', err);
    } else {
        console.log(`Tunnel URL: ${tunnel.url}`); // Public Url
    }
});

// Gibt den SessionContext aus wenn ein sessionKey vorhanden ist, ansonsten gibt die HTML Seite
app.get('/', (req, res) => {
    const sessionKey = req.query.sessionKey;
    const print = req.query.print;

    if (!sessionKey || sessionKey.trim() === '') {
        res.redirect('index.html');
    } else {
        if (!memberCache.isBanned(sessionKey, print)) {
            result = cache.readFromCache(sessionKey);
            member = memberCache.readFromCache(sessionKey);
            console.log("Result: " + JSON.stringify(result))
            res.set(allowedHeader);

            res.status(200).send({
                body: result,
                memberBody: member,
                mode: "cors"
            });
        } else {
            res.status(403).send("Sie haben keine Rechte für diese Gruppe");
        }
    }
});

// Lässt einen neuen sessionKey für eine neue Session generieren und legt eine Gruppe für diese an
app.post('/', (req, res) => {
    result = cache.startNewSession();
    //memberCache.initializeCache(result.sessionKey);
    console.log("Result: " + JSON.stringify(result))
    const print = req.body;
    console.log("Das ist der Host: " + JSON.stringify(print.fingerprint))
    memberCache.addHost("\"" + result.sessionKey + "\"", print.fingerprint)
    res.set(allowedHeader);

    res.status(200).send({
        body: result,
    });
});

// Updated die Daten der Session mit dem übermittelten sessionKey
app.put('/', (req, res) => {
    const theBody = req.body;
    JSON.stringify("The Body: " + theBody);
    const sessionKey = req.query.sessionKey;
    const print = req.query.print;

    if (!memberCache.isBanned(sessionKey, print)) {
        result = cache.writeToCache(sessionKey, theBody.value)
        console.log("Result von Write to Cache: " + JSON.stringify(result))
        res.set(allowedHeader);

        res.status(200).send({
            body: result,
            mode: "cors"
        });
    } else {
        res.status(403).send("Sie haben keine Rechte für diese Gruppe");
    }
});

// löscht die Daten der Session mit dem übermittelten sessionKey
app.delete('/', (req, res) => {
    const sessionKey = req.query.sessionKey;
    const print = req.query.print;

    if (memberCache.hasPermission(sessionKey, print)) {
        result = cache.deleteSession(sessionKey)
        memberResult = memberCache.deleteSession(sessionKey)
        console.log("Result von Cache delte: " + JSON.stringify(result) + " und Member Cache: " + JSON.stringify(memberResult))
        res.set(allowedHeader);

        res.status(200).send();
    } else {
        res.status(403).send("Sie haben keine Rechte für diese Gruppe");
    }
});

// Funktion für Test und Debbunging zwecke. (CORS macht manchmal Options Requests um zu prüfen ob die Anfrage gültig ist)
app.options('/', (req, res) => {
    console.log("Das Kitzelt");

    res.set(allowedHeader);
    res.status(200).send();
})

// fügt ein Member einer Session Gruppe hinzu
app.post('/member', async (req, res) => {
    try {
        const sessionKey = req.query.sessionKey;
        const member = req.query.member;
        const print = req.body;

        console.log("Die VisitorId: " + JSON.stringify(print.fingerprint))
        result = memberCache.writeToCache(sessionKey, print.fingerprint, member);
        console.log("Result: " + JSON.stringify(result));

        res.set(allowedHeader);
        res.status(200).send();
    } catch (error) {
        console.error("Error:", error);
        res.status(500).send("Internal Server Error");
    }
});

// fügt ein Member einer Session Gruppe hinzu
app.delete('/member', async (req, res) => {
    try {
        const sessionKey = req.query.sessionKey;
        const member = req.query.member;
        const print = req.query.print;

        if (memberCache.hasPermission(sessionKey, print)) {
            console.log("Banne das hier: " + JSON.stringify(print))
            result = memberCache.removeMember(sessionKey, member);
            console.log("Result vom MemeberDelete: " + JSON.stringify(result));

            res.set(allowedHeader);
            res.status(200).send();
        } else {
            res.status(403).send("Sie haben keine Rechte für diese Gruppe");
        }
    } catch (error) {
        console.error("Error:", error);
        res.status(500).send("Internal Server Error");
    }
});

// gibt einem Member Rechte
app.post('/permission', async (req, res) => {
    try {
        const sessionKey = req.query.sessionKey;
        const member = req.query.member;
        const print = req.body;

        console.log("Der permission Member: " + JSON.stringify(member))
        console.log("Der permission print: " + JSON.stringify(print.fingerprint))
        if (memberCache.hasPermission(sessionKey, print.fingerprint)) {
            result = memberCache.addPermission(sessionKey, member);
            console.log("Permission Result: " + JSON.stringify(result));

            res.set(allowedHeader);
            res.status(200).send();
        } else {
            res.status(403).send("Sie haben keine Rechte für diese Gruppe");
        }
    } catch (error) {
        console.error("Error:", error);
        res.status(500).send("Internal Server Error");
    }
});

// entfernt die Rechte eines Members
app.delete('/permission', async (req, res) => {
    try {
        const sessionKey = req.query.sessionKey;
        const member = req.query.member;
        const print = req.query.print;

        console.log("Der permission Member: " + JSON.stringify(member))
        console.log("Der permission print: " + JSON.stringify(print))
        if (memberCache.hasPermission(sessionKey, print)) {
            result = memberCache.removePermission(sessionKey, member);
            console.log("removePermission Result: " + JSON.stringify(result));

            res.set(allowedHeader);
            res.status(200).send();
        } else {
            res.status(403).send("Sie haben keine Rechte für diese Gruppe");
        }
    } catch (error) {
        console.error("Error:", error);
        res.status(500).send("Internal Server Error");
    }
});

app.put('/videoStart', async (req, res) => {
    try {
        const sessionKey = req.query.sessionKey;
        const print = req.query.print;
        const time = req.query.time;

        if (memberCache.hasPermission(sessionKey, print)) {
            cache.writeVideoStart(sessionKey, time);

            res.set(allowedHeader);
            res.status(200).send();
        } else {
            res.status(403).send("Sie haben keine Rechte für diese Gruppe");
        }
    } catch (error) {
        console.error("Error:", error);
        res.status(500).send("Internal Server Error");
    }
});

app.put('/videoPause', async (req, res) => {
    try {
        const sessionKey = req.query.sessionKey;
        const print = req.query.print;

        if (memberCache.hasPermission(sessionKey, print)) {
            cache.writeVideoPause(sessionKey);

            res.set(allowedHeader);
            res.status(200).send();
        } else {
            res.status(403).send("Sie haben keine Rechte für diese Gruppe");
        }
    } catch (error) {
        console.error("Error:", error);
        res.status(500).send("Internal Server Error");
    }
});

app.put('/audioStart', async (req, res) => {
    try {
        const sessionKey = req.query.sessionKey;
        const print = req.query.print;
        const time = req.query.time;

        if (memberCache.hasPermission(sessionKey, print)) {
            cache.writeAudioStart(sessionKey, time);

            res.set(allowedHeader);
            res.status(200).send();
        } else {
            res.status(403).send("Sie haben keine Rechte für diese Gruppe");
        }
    } catch (error) {
        console.error("Error:", error);
        res.status(500).send("Internal Server Error");
    }
});

app.put('/audioPause', async (req, res) => {
    try {
        const sessionKey = req.query.sessionKey;
        const print = req.query.print;

        if (memberCache.hasPermission(sessionKey, print)) {
            cache.writeAudioPause(sessionKey);

            res.set(allowedHeader);
            res.status(200).send();
        } else {
            res.status(403).send("Sie haben keine Rechte für diese Gruppe");
        }
    } catch (error) {
        console.error("Error:", error);
        res.status(500).send("Internal Server Error");
    }
});

//Homepage route
app.get("/index.html", function (req, res) { //root dir
    res.sendFile(path.join(rootPath, 'index.html'));
});

app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});