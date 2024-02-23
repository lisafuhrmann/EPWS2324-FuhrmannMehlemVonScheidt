import React, { useRef, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import io from "socket.io-client";

// Container-Komponente für das Layout
const Container = ({ children }) => (
  <div
    style={{ display: "flex", flexDirection: "column", alignItems: "center" }}
  >
    {children}
  </div>
);

//Komponente für die Video-Steuerung
const VideoControls = ({ children }) => (
  <div
    style={{
      display: "flex",
      justifyContent: "center",
      gap: "20px",
      marginTop: "20px",
    }}
  >
    {children}
  </div>
);

//Komponente zur Anzeige des Benutzerstatut
const StatusBox = ({ status }) => (
  <div
    style={{
      marginTop: "20px",
      padding: "10px",
      border: "1px solid #ccc",
      borderRadius: "5px",
    }}
  >
    {status}
  </div>
);

// Komponente 'Room': Verwaltet Videochat-Raum, einschließlich WebRTC-Verbindungen, WebSocket-Kommunikation, Videosteuerung und Nutzerstatus.
const Room = () => {
  const { roomID } = useParams(); // Extrahiert Raum-ID aus URL-Parametern
  const peerRef = useRef(); // Referenz für die WebRTC Peer-Verbindung
  const socketRef = useRef(); // Referenz für die WebSocket-Verbindung
  const otherUsers = useRef([]); // Speichert IDs anderer Nutzer im Raum
  const localVideoPlayer = useRef(); // Referenz für das lokale Video-Element
  const dataChannels = useRef({}); // Speichert Datenkanäle für die Peer-zu-Peer-Kommunikation
  const [userStatus, setUserStatus] = useState("Warte auf Benutzer..."); // Statusanzeige für die Nutzeroberfläche
  const [roomCreator, setRoomCreator] = useState(null); // Speichert die ID des Raum-Erstellers

  const videoSrc = "/videos/sample-video.mp4";

  useEffect(() => {
    // Verbindet mit dem WebSocket-Server, tritt einem Raum bei und setzt den Raum-Ersteller bei Empfang der entsprechenden Nachricht.
    socketRef.current = io.connect("/");
    socketRef.current.emit("join_room", roomID);
    socketRef.current.on("room_creator", (creatorID) => {
      setRoomCreator(creatorID);
    });

    // Event-Handler für verschiedene Szenarien in der WebRTC-Kommunikation und Raummanagement
    socketRef.current.on("users", (users) => {
      // Aktualisiert andere Nutzer und Nutzerstatus bei Veränderungen
      otherUsers.current = users.filter(
        (user) => user !== socketRef.current.id
      );
      setUserStatus(`Benutzer verbunden: ${otherUsers.current.length}`);
      otherUsers.current.forEach(callUser);
    });
    socketRef.current.on("user_joined", (userID) => {
      // Fügt neuen Nutzer hinzu und aktualisiert Status
      otherUsers.current.push(userID);
      setUserStatus(`Benutzer verbunden: ${otherUsers.current.length}`);
      callUser(userID);
    });
    socketRef.current.on("user_disconnected", (userID) => {
      // Entfernt getrennten Nutzer und aktualisiert Status
      const index = otherUsers.current.indexOf(userID);
      if (index !== -1) {
        otherUsers.current.splice(index, 1);
        setUserStatus(`Benutzer verbunden: ${otherUsers.current.length}`);
      }
    });
    socketRef.current.on("offer", handleReceiveCall); // Behandelt eingehende Anrufe
    socketRef.current.on("answer", handleAnswer); // Verarbeitet Antworten auf Anrufe
    socketRef.current.on("ice-candidate", handleNewICECandidateMsg); // Verwaltet ICE-Kandidaten

    return () => {
      socketRef.current?.disconnect(); // Trennt bei Unmount
    };
  }, [roomID]);

  // Initialisiert eine Peer-Verbindung mit STUN- und TURN-Serverkonfigurationen für die WebRTC-Kommunikation
  function createPeer(userID) {
    const peer = new RTCPeerConnection({
      iceServers: [
        { urls: "stun:stun.stunprotocol.org" },
        {
          urls: "turn:numb.viagenie.ca",
          credential: "muazkh",
          username: "webrtc@live.com",
        },
      ],
    });

    peer.onicecandidate = handleICECandidateEvent; // Behandelt ICE-Kandidaten-Events
    peer.onnegotiationneeded = () => handleNegotiationNeededEvent(userID); // Löst Verhandlungen aus, wenn notwendig
    peer.ondatachannel = (event) => {
      dataChannels.current[userID] = event.channel; // Speichert und verwaltet Datenkanäle für Benutzerinteraktion
      dataChannels.current[userID].onmessage = handleDataChannelMessage;
      dataChannels.current[userID].onopen = handleDataChannelOpen;
    };

    return peer;
  }

  // Initiiert einen Anruf mit einem Benutzer, richtet einen Datenkanal ein und konfiguriert Ereignishandler.
  function callUser(userID) {
    if (userID === socketRef.current.id) return;
    peerRef.current = createPeer(userID);
    const dataChannel = peerRef.current.createDataChannel("yourChannelName");
    dataChannels.current[userID] = dataChannel;
    dataChannel.onmessage = handleDataChannelMessage;
    dataChannel.onopen = handleDataChannelOpen;
  }

  // Startet den Verhandlungsprozess mit einem anderen Benutzer durch Erstellen eines WebRTC-Angebots
  function handleNegotiationNeededEvent(userID) {
    peerRef.current
      .createOffer()
      .then((offer) => {
        // Setzt die lokale Beschreibung auf das erstellte Angebot
        return peerRef.current.setLocalDescription(offer);
      })
      .then(() => {
        // Sendet das Angebot an den Zielbenutzer über den WebSocket-Server
        const payload = {
          target: userID,
          caller: socketRef.current.id,
          sdp: peerRef.current.localDescription,
        };
        socketRef.current.emit("offer", payload);
      })
      .catch((e) => console.error(e)); // Fängt mögliche Fehler im Verhandlungsprozess ab
  }

  // Verarbeitet eingehende Anrufe durch Einrichten einer Peer-Verbindung und Erstellen einer Antwort
  function handleReceiveCall(incoming) {
    peerRef.current = createPeer(incoming.caller); // Erstellt eine neue Peer-Verbindung für den Anrufer
    peerRef.current
      .setRemoteDescription(new RTCSessionDescription(incoming.sdp)) // Setzt die entfernte Beschreibung auf die SDP des Anrufers
      .then(() => {
        return peerRef.current.createAnswer(); // Erstellt eine Antwort auf das eingehende Angebot
      })
      .then((answer) => {
        return peerRef.current.setLocalDescription(answer); // Setzt die lokale Beschreibung auf die erstellte Antwort
      })
      .then(() => {
        // Sendet die Antwort zurück an den Anrufer über den WebSocket-Server
        const payload = {
          target: incoming.caller,
          caller: socketRef.current.id,
          sdp: peerRef.current.localDescription,
        };
        socketRef.current.emit("answer", payload);
      });
  }

  function handleAnswer(message) {
    const desc = new RTCSessionDescription(message.sdp);
    // Setzt die Antwort-SDP des entfernten Peers als dessen Remote-Beschreibung
    peerRef.current.setRemoteDescription(desc).catch((e) => console.error(e));
  }

  // Sendet den ICE-Kandidaten an andere Benutzer, wenn einer gefunden wird
  function handleICECandidateEvent(e) {
    if (e.candidate) {
      const payload = {
        target: otherUsers.current,
        candidate: e.candidate,
      };
      socketRef.current.emit("ice-candidate", payload);
    }
  }

  // Fügt den empfangenen ICE-Kandidaten zur PeerConnection hinzu
  function handleNewICECandidateMsg(incoming) {
    const candidate = new RTCIceCandidate(incoming);
    peerRef.current.addIceCandidate(candidate).catch((e) => console.error(e));
  }

  // Verarbeitet Nachrichten vom Datenkanal, um Video-Wiedergabe zu steuern (Play/Pause)
  function handleDataChannelMessage(event) {
    const message = JSON.parse(event.data);
    switch (message.action) {
      case "play":
        // Stellt sicher, dass das Video am korrekten Zeitpunkt startet
        localVideoPlayer.current.currentTime = message.currentTime;
        localVideoPlayer.current.play();
        break;
      case "pause":
        // Stellt sicher, dass das Video am korrekten Zeitpunkt pausiert
        localVideoPlayer.current.currentTime = message.currentTime;
        localVideoPlayer.current.pause();
        break;
    }
  }

  // Wird aufgerufen, wenn der Datenkanal erfolgreich geöffnet ist
  function handleDataChannelOpen() {
    console.log("Datenkanal geöffnet");
  }

  // Steuerung des Videos
  function playVideo() {
    const currentTime = localVideoPlayer.current.currentTime;
    // Lokales Video sofort abspielen
    localVideoPlayer.current.play();
    // Steuerbefehl über den Datenkanal an alle anderen Benutzer senden
    if (socketRef.current.id === roomCreator) {
      broadcastVideoAction("play", currentTime);
    }
  }

  function stopVideo() {
    const currentTime = localVideoPlayer.current.currentTime;
    // Lokales Video sofort anhalten
    localVideoPlayer.current.pause();
    // Steuerbefehl über den Datenkanal an alle anderen Benutzer senden
    if (socketRef.current.id === roomCreator) {
      broadcastVideoAction("pause", currentTime);
    }
  }

  // Funktion zum Senden von Synchronisierungsnachrichten an alle anderen Benutzer im Raum
  function broadcastVideoAction(action, currentTime) {
    const message = JSON.stringify({ action, currentTime }); // Konvertiert Aktion und Zeit in einen String
    otherUsers.current.forEach((user) => {
      if (
        dataChannels.current[user] &&
        dataChannels.current[user].readyState === "open"
      ) {
        dataChannels.current[user].send(message); // Sendet die Nachricht an alle offenen Datenkanäle
      }
    });
  }

  const isRoomCreator =
    socketRef.current && socketRef.current.id === roomCreator; // Überprüfung, ob der Benutzer der Raum-Ersteller ist

  return (
    <Container>
      <video
        ref={localVideoPlayer}
        src={videoSrc}
        style={{ maxWidth: "100%", height: "auto" }}
        controls={isRoomCreator} // Standardsteuerelemente basierend auf dem Raum-Ersteller anzeigen
      />

      {/* Benutzerdefinierte Steuerelemente */}
      <VideoControls>
        {isRoomCreator && (
          <>
            <button onClick={playVideo}>Play Video</button>
            <button onClick={stopVideo}>Stop Video</button>
          </>
        )}
      </VideoControls>
      <StatusBox status={userStatus} />
    </Container>
  );
};

export default Room;
