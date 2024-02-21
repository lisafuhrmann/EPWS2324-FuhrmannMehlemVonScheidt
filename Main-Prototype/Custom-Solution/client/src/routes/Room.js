import React, { useRef, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import io from "socket.io-client";

// Layout-Komponenten
const Container = ({ children }) => (
  <div
    style={{ display: "flex", flexDirection: "column", alignItems: "center" }}
  >
    {children}
  </div>
);
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

const Room = () => {
  const { roomID } = useParams();
  const peerRef = useRef();
  const socketRef = useRef();
  const otherUsers = useRef([]);
  const localVideoPlayer = useRef(); // Lokaler Video-Player
  const dataChannels = useRef({}); // Datenkanäle für jeden Benutzer
  const [userStatus, setUserStatus] = useState("Warte auf Benutzer...");
  const [roomCreator, setRoomCreator] = useState(null); // Raum-Ersteller
  const [currentTime, setCurrentTime] = useState(0); // Zustand für die aktuelle Zeit des Videos

  const videoSrc = "/videos/sample-video.mp4";

  useEffect(() => {
    // Verbindet zum WebSocket-Server
    socketRef.current = io.connect("/");
    socketRef.current.emit("join_room", roomID);
    socketRef.current.on("room_creator", (creatorID) => {
      // Empfange und setze den Raum-Ersteller
      setRoomCreator(creatorID);
    });

    // Event-Handler
    socketRef.current.on("users", (users) => {
      otherUsers.current = users.filter(
        (user) => user !== socketRef.current.id
      );
      setUserStatus(`Benutzer verbunden: ${otherUsers.current.length}`);
      otherUsers.current.forEach(callUser);
    });
    socketRef.current.on("user_joined", (userID) => {
      otherUsers.current.push(userID);
      setUserStatus(`Benutzer verbunden: ${otherUsers.current.length}`);
      callUser(userID);
    });
    socketRef.current.on("user_disconnected", (userID) => {
      const index = otherUsers.current.indexOf(userID);
      if (index !== -1) {
        otherUsers.current.splice(index, 1);
        setUserStatus(`Benutzer verbunden: ${otherUsers.current.length}`);
      }
    });
    socketRef.current.on("offer", handleReceiveCall);
    socketRef.current.on("answer", handleAnswer);
    socketRef.current.on("ice-candidate", handleNewICECandidateMsg);

    return () => {
      socketRef.current?.disconnect(); // Trennt bei Cleanup
    };
  }, [roomID]);

  // Funktionen zum Verwalten von WebRTC und WebSocket-Ereignissen
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

    peer.onicecandidate = handleICECandidateEvent;
    peer.onnegotiationneeded = () => handleNegotiationNeededEvent(userID);
    peer.ondatachannel = (event) => {
      dataChannels.current[userID] = event.channel;
      dataChannels.current[userID].onmessage = handleDataChannelMessage;
      dataChannels.current[userID].onopen = handleDataChannelOpen;
    };

    return peer;
  }

  function callUser(userID) {
    if (userID === socketRef.current.id) return;
    peerRef.current = createPeer(userID);
    const dataChannel = peerRef.current.createDataChannel("yourChannelName");
    dataChannels.current[userID] = dataChannel;
    dataChannel.onmessage = handleDataChannelMessage;
    dataChannel.onopen = handleDataChannelOpen;
  }

  function handleNegotiationNeededEvent(userID) {
    peerRef.current
      .createOffer()
      .then((offer) => {
        return peerRef.current.setLocalDescription(offer);
      })
      .then(() => {
        const payload = {
          target: userID,
          caller: socketRef.current.id,
          sdp: peerRef.current.localDescription,
        };
        socketRef.current.emit("offer", payload);
      })
      .catch((e) => console.error(e));
  }

  function handleReceiveCall(incoming) {
    peerRef.current = createPeer(incoming.caller);
    peerRef.current
      .setRemoteDescription(new RTCSessionDescription(incoming.sdp))
      .then(() => {
        return peerRef.current.createAnswer();
      })
      .then((answer) => {
        return peerRef.current.setLocalDescription(answer);
      })
      .then(() => {
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
    peerRef.current.setRemoteDescription(desc).catch((e) => console.error(e));
  }

  function handleICECandidateEvent(e) {
    if (e.candidate) {
      const payload = {
        target: otherUsers.current,
        candidate: e.candidate,
      };
      socketRef.current.emit("ice-candidate", payload);
    }
  }

  function handleNewICECandidateMsg(incoming) {
    const candidate = new RTCIceCandidate(incoming);
    peerRef.current.addIceCandidate(candidate).catch((e) => console.error(e));
  }

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
    const message = JSON.stringify({ action, currentTime });
    otherUsers.current.forEach((user) => {
      if (
        dataChannels.current[user] &&
        dataChannels.current[user].readyState === "open"
      ) {
        dataChannels.current[user].send(message);
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
