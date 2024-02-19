const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

const rootPath = path.join(__dirname, '');
app.use('/public/src', express.static(path.join(__dirname, 'public/src')));

app.use(express.static('public'));

io.on('connection', (socket) => {
    console.log('A user connected');

    socket.on('play', () => {
        // Broadcast play event to all clients
        socket.broadcast.emit('play');
    });

    socket.on('pause', () => {
        // Broadcast pause event to all clients
        socket.broadcast.emit('pause');
    });

    // Handle disconnect
    socket.on('disconnect', () => {
        console.log('User disconnected');
    });
});

app.get('/', (req, res) => {
    res.redirect('index.html');
});

//Homepage route
app.get("/index.html", function (req, res) { //root dir
    res.sendFile(path.join(rootPath, 'index.html'));
});

// Start the server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
