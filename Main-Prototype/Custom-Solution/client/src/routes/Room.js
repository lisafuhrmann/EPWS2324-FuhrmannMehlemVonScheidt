import React, { useRef, useEffect } from "react";
import { useParams } from "react-router-dom";
import io from "socket.io-client";

// Einfache Container für Layout-Zwecke
const Container = ({ children }) => <div>{children}</div>;
const LeftRow = ({ children }) => <div>{children}</div>;
const RightRow = ({ children }) => <div>{children}</div>;

const Room = () => {
  const { roomID } = useParams(); //Raum-ID aus URL
  //Referenzen für DOM-Elemente und Objekte
  const userVideo = useRef();
  const partnerVideo = useRef();
  const peerRef = useRef();
  const socketRef = useRef();
  const otherUser = useRef();
  const userStream = useRef();
  const localVideoPlayer = useRef();
  const dataChannelRef = useRef(null);

  const videoSrc = "/videos/sample-video.mp4";

  useEffect(() => {
    const setupMedia = async () => {
      try {
        // Zugriff auf Kamera/Mikrofon und Einrichtung der Socket-Verbindung
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: true,
        });
        userVideo.current.srcObject = stream;
        userStream.current = stream;

        socketRef.current = io.connect("/");
        socketRef.current.emit("join_room", roomID); // Beitritt zu einem Raum

        // Ereignishandler für Socket-Kommunikation
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

    // Bereinigt Ressourcen bei Komponenten-Unmount
    return () => {
      userStream.current?.getTracks().forEach((track) => track.stop());
      socketRef.current?.disconnect();
    };
  }, [roomID]);

  // Funktionen zur Verwaltung von WebRTC-Verbindungen und DataChannel

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

    // Erstellen eines Datenkanals (wenn dies die Seite ist, die den Anruf tätigt)
    const dataChannel = peer.createDataChannel("yourChannelName");
    dataChannelRef.current = dataChannel;
    dataChannel.onopen = handleDataChannelOpen;
    dataChannel.onmessage = handleDataChannelMessage;

    // Ereignishandler für Peer-Verbindung
    peer.onicecandidate = handleICECandidateEvent;
    peer.ontrack = handleTrackEvent;
    peer.onnegotiationneeded = () => handleNegotiationNeededEvent(userID);

    // Um auf den Datenkanal auf der anderen Seite zu reagieren:
    peer.ondatachannel = (event) => {
      const dataChannel = event.channel;
      dataChannelRef.current = dataChannel;
      dataChannel.onmessage = handleDataChannelMessage;
      dataChannel.onopen = handleDataChannelOpen;
      // Weitere Ereignishandler hier
    };

    return peer;
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
  // Rendert die Videoelemente für Benutzer und Partner
  return (
    <Container>
      <LeftRow>
        <video autoPlay muted ref={userVideo} />
        <video autoPlay ref={partnerVideo} />
      </LeftRow>
      <RightRow>
        <video controls ref={localVideoPlayer} src={videoSrc} />
        <button onClick={stopVideo}>Stop Video</button>
        <button onClick={playVideo}>Play Video</button>
      </RightRow>
    </Container>
  );
};

export default Room;
