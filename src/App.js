import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import HomePage from './pages/HomePage';
import TelemetryAnalyzer from './pages/TelemetryAnalyzer';
import JsonGenerator from './pages/JsonGenerator';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <div className="container">
        <header className="app-header">
          <Link to="/" className="header-title-link">
            <h1>AC Telemetry Suite</h1>
          </Link>
          <nav>
            <Link to="/analyze">Analyze</Link>
            <Link to="/generate">Parse Replay</Link>
            {/* Demo link removed as requested */}
          </nav>
        </header>

        <main>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/analyze" element={<TelemetryAnalyzer />} />
            <Route path="/generate" element={<JsonGenerator />} />
            {/* Demo route removed as requested */}
          </Routes>
          {/* TrackSelector and TrackViewer components removed from here */}
        </main>

        <footer>
          <p>&copy; 2023 Assetto Corsa Track Viewer</p>
        </footer>
      </div>
    </BrowserRouter>
  );
}

export default App;
