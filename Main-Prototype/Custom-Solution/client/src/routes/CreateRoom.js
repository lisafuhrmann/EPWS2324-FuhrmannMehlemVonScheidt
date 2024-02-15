// Importiert React, Navigations-Hook und UUID-Generator
import React from "react";
import { useNavigate } from "react-router-dom";
import { v1 as uuid } from "uuid";

const CreateRoom = () => {
  const navigate = useNavigate();

  // Erstellt einen neuen Raum und navigiert dorthin
  function create() {
    const id = uuid(); // Generiert eine einzigartige Raum-ID
    navigate(`/room/${id}`); // Leitet zum neuen Raum weiter
  }

  return <button onClick={create}>Create Room</button>; // Button zum Erstellen des Raums
};

export default CreateRoom;
