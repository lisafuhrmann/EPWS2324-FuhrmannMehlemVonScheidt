// Importiert React-Hooks, Router-Hook und Socket.io-Client
import React, { useRef, useEffect } from "react";
import { useParams } from "react-router-dom";
import io from "socket.io-client";

const Room = () => {
  // Zugriff auf Raum-ID aus URL-Parameter
  const { roomID } = useParams();
  // Referenzen für Videoelemente und WebRTC/Socket-Instanzen
  const userVideo = useRef();
  const partnerVideo = useRef();
  const peerRef = useRef();
  const socketRef = useRef();
  const otherUser = useRef();
  const userStream = useRef();

  useEffect(() => {
    // Asynchrone Funktion zum Einrichten von Medien und Socket-Verbindungen
    const setupMedia = async () => {
      try {
        // Anfordern des Zugriffs auf Kamera und Mikrofon
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: true,
        });
        userVideo.current.srcObject = stream;
        userStream.current = stream;

        // Socket.io-Verbindung zum Server
        socketRef.current = io.connect("/");
        socketRef.current.emit("join_room", roomID);

        // Socket-Ereignishandler
        socketRef.current.on("other_user", (userID) => {
          callUser(userID);
          otherUser.current = userID;
        });
        socketRef.current.on("user_joined", (userID) => {
          otherUser.current = userID;
        });
        socketRef.current.on("offer", handleReceiveCall);
        socketRef.current.on("answer", handleAnswer);
        socketRef.current.on("ice-candidate", handleNewICECandidateMsg);
      } catch (error) {
        console.error("Error accessing media devices.", error);
      }
    };

    setupMedia();

    // Bereinigung bei Komponentenzerstörung
    return () => {
      userStream.current?.getTracks().forEach((track) => track.stop());
      socketRef.current?.disconnect();
    };
  }, [roomID]);

  // Initiieren eines Anrufs
  function callUser(userID) {
    peerRef.current = createPeer(userID);
    userStream.current
      .getTracks()
      .forEach((track) => peerRef.current.addTrack(track, userStream.current));
  }

  // Erstellen einer Peer-Verbindung
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

    // Ereignishandler für Peer-Verbindung
    peer.onicecandidate = handleICECandidateEvent;
    peer.ontrack = handleTrackEvent;
    peer.onnegotiationneeded = () => handleNegotiationNeededEvent(userID);

    return peer;
  }

  // Behandelt das Ereignis, wenn eine Verhandlung erforderlich ist
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
      .catch((e) => console.log(e));
  }

  // Empfangen eines Anrufs
  function handleReceiveCall(incoming) {
    peerRef.current = createPeer();
    const desc = new RTCSessionDescription(incoming.sdp);
    peerRef.current
      .setRemoteDescription(desc)
      .then(() => {
        userStream.current
          .getTracks()
          .forEach((track) =>
            peerRef.current.addTrack(track, userStream.current)
          );
      })
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

  // Verarbeitet die Antwort des Anrufs
  function handleAnswer(message) {
    const desc = new RTCSessionDescription(message.sdp);
    peerRef.current.setRemoteDescription(desc).catch((e) => console.log(e));
  }

  // Verarbeitet ICE-Kandidaten-Ereignisse
  function handleICECandidateEvent(e) {
    if (e.candidate) {
      const payload = { target: otherUser.current, candidate: e.candidate };
      socketRef.current.emit("ice-candidate", payload);
    }
  }

  // Verarbeitet neue ICE-Kandidaten-Nachrichten
  function handleNewICECandidateMsg(incoming) {
    const candidate = new RTCIceCandidate(incoming);
    peerRef.current.addIceCandidate(candidate).catch((e) => console.log(e));
  }

  // Verarbeitet Track-Ereignisse
  function handleTrackEvent(e) {
    partnerVideo.current.srcObject = e.streams[0];
  }

  // Rendert die Videoelemente für Benutzer und Partner
  return (
    <div>
      <video autoPlay muted ref={userVideo} />
      <video autoPlay ref={partnerVideo} />
    </div>
  );
};

export default Room;
