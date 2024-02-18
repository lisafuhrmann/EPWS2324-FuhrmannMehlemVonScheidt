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
  const otherUser = useRef();
  const localVideoPlayer = useRef(); // Lokaler Video-Player
  const dataChannelRef = useRef(null); // WebRTC DataChannel
  const [userStatus, setUserStatus] = useState("Warte auf Benutzer...");

  const videoSrc = "/videos/sample-video.mp4";

  useEffect(() => {
    // Verbindet zum WebSocket-Server
    socketRef.current = io.connect("/");
    socketRef.current.emit("join_room", roomID);

    // Event-Handler
    socketRef.current.on("other_user", (userID) => {
      callUser(userID);
      otherUser.current = userID;
      setUserStatus("Benutzer verbunden");
    });
    socketRef.current.on("user_joined", (userID) => {
      otherUser.current = userID;
      setUserStatus("Benutzer verbunden");
    });
    socketRef.current.on("user_disconnected", (userID) => {
      if (otherUser.current === userID) {
        setUserStatus("Benutzer getrennt");
        otherUser.current = null;
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
      dataChannelRef.current = event.channel;
      dataChannelRef.current.onmessage = handleDataChannelMessage;
      dataChannelRef.current.onopen = handleDataChannelOpen;
    };

    return peer;
  }

  function callUser(userID) {
    peerRef.current = createPeer(userID);
    const dataChannel = peerRef.current.createDataChannel("yourChannelName");
    dataChannelRef.current = dataChannel;
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
    peerRef.current = createPeer();
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
        target: otherUser.current,
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
    // Steuerbefehl über den Datenkanal senden
    if (
      dataChannelRef.current &&
      dataChannelRef.current.readyState === "open"
    ) {
      dataChannelRef.current.send(
        JSON.stringify({ action: "play", currentTime })
      );
    }
  }

  function stopVideo() {
    const currentTime = localVideoPlayer.current.currentTime;
    // Lokales Video sofort anhalten
    localVideoPlayer.current.pause();
    // Steuerbefehl über den Datenkanal senden
    if (
      dataChannelRef.current &&
      dataChannelRef.current.readyState === "open"
    ) {
      dataChannelRef.current.send(
        JSON.stringify({ action: "pause", currentTime })
      );
    }
  }

  return (
    <Container>
      <video
        controls
        ref={localVideoPlayer}
        src={videoSrc}
        style={{ maxWidth: "100%", height: "auto" }}
      />
      <VideoControls>
        <button onClick={playVideo}>Play Video</button>
        <button onClick={stopVideo}>Stop Video</button>
      </VideoControls>
      <StatusBox status={userStatus} />
    </Container>
  );
};

export default Room;
