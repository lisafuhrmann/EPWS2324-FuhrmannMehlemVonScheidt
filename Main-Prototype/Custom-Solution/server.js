// Lädt Umgebungsvariablen
require("dotenv").config();

// Einrichtung des Express- und HTTP-Servers sowie Socket.io für Echtzeitkommunikation
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
});

// Behandelt neue Verbindungen
io.on("connection", (socket) => {
  console.log(`User connected: ${socket.id}`);

  // Verwaltet Raumbeitritte
  socket.on("join_room", (roomID) => {
    socket.join(roomID);
    console.log(`User with ID: ${socket.id} joined room: ${roomID}`);

    // Informiert Benutzer über andere im Raum
    const room = io.sockets.adapter.rooms.get(roomID);
    const otherUser = [...room].find((id) => id !== socket.id);
    if (otherUser) {
      socket.emit("other_user", otherUser);
      socket.to(otherUser).emit("user_joined", socket.id);
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

  // Loggt bei Trennung
  socket.on("disconnect", () => console.log(`User disconnected: ${socket.id}`));
});

// Startet den Server
const port = process.env.PORT || 8000;
server.listen(port, () => console.log(`Server is running on port ${port}`));
