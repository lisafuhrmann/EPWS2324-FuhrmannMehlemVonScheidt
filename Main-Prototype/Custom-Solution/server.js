// Lädt Umgebungsvariablen
require("dotenv").config();

const express = require("express");
const http = require("http");
const socket = require("socket.io");

const app = express();
const server = http.createServer(app);

// Konfiguriert Socket.io mit CORS-Erlaubnis
const io = socket(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
  pingInterval: 10000,
  pingTimeout: 5000,
});

const userRooms = {}; // Zuordnung Benutzer:Raum

// Neue Verbindung
io.on("connection", (socket) => {
  console.log(`User connected: ${socket.id}`);

  // Beitreten zu einem Raum
  socket.on("join_room", (roomID) => {
    userRooms[socket.id] = roomID;
    socket.join(roomID);
    console.log(`User with ID: ${socket.id} joined room: ${roomID}`);

    // Informiert Benutzer über andere im Raum
    const room = io.sockets.adapter.rooms.get(roomID);
    const otherUser = [...room].find((id) => id !== socket.id);
    if (otherUser) {
      socket.emit("other_user", otherUser);
      socket.to(otherUser).emit("user_joined", socket.id);
    }

    // Prüfen, ob dieser Benutzer der erste im Raum ist (Raum-Ersteller)
    const isFirstUser = [...room].length === 1;
    if (isFirstUser) {
      // Der erste Benutzer wird als Raum-Ersteller festgelegt
      socket.emit("room_creator", socket.id);
    }
  });

  // Weiterleiten von WebRTC-Signalen
  socket.on("offer", (payload) => io.to(payload.target).emit("offer", payload));
  socket.on("answer", (payload) =>
    io.to(payload.target).emit("answer", payload)
  );
  socket.on("ice-candidate", (incoming) =>
    io.to(incoming.target).emit("ice-candidate", incoming.candidate)
  );

  // Bei Trennung
  socket.on("disconnect", () => {
    const roomID = userRooms[socket.id];
    if (roomID) {
      socket.to(roomID).emit("user_disconnected", socket.id);
      console.log(`User disconnected: ${socket.id} from room: ${roomID}`);
      delete userRooms[socket.id];
    }
  });
});

// Startet den Server
const port = process.env.PORT || 8000;
server.listen(port, () => console.log(`Server is running on port ${port}`));
