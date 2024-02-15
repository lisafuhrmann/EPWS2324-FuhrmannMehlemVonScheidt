// Importiert React-Komponenten und -Hooks, Routing-Module und CSS
import React, { Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./App.css";

// Lazy lädt die Komponenten für effizientes Bundling und asynchrones Laden
const CreateRoom = lazy(() => import("./routes/CreateRoom"));
const Room = lazy(() => import("./routes/Room"));
const NotFound = lazy(() => import("./routes/NotFound"));

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        {/* Suspense hält die Darstellung zurück, bis das Laden abgeschlossen ist */}
        <Suspense fallback={<div>Loading...</div>}>
          <Routes>
            {/* Definiert Routen und weist Komponenten zu */}
            <Route path="/" element={<CreateRoom />} />{" "}
            {/* Startseite bzw. Raum erstellen */}
            <Route path="/room/:roomID" element={<Room />} />{" "}
            {/* Einzelraum-Seite */}
            <Route path="*" element={<NotFound />} />{" "}
            {/* Fängt alle nicht definierten Routen ab */}
          </Routes>
        </Suspense>
      </BrowserRouter>
    </div>
  );
}

export default App;
