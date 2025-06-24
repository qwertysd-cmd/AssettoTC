import React from 'react';
import { Link } from 'react-router-dom';
import './Home.css';

function Home() {
  return (
    <div className="home">
      <section className="hero">
        <h1>Assetto Corsa Replay Analysis Tool</h1>
        <p>Visualize and analyze your race replays to improve your driving.</p>
        <div className="cta-buttons">
          <Link to="/parser" className="cta-button primary">Parse Replay</Link>
          <Link to="/analyzer" className="cta-button secondary">Analyze Telemetry</Link>
        </div>
      </section>

      <section className="features">
        <h2>Features</h2>
        <div className="feature-grid">
          <div className="feature-card">
            <h3>Extract Telemetry</h3>
            <p>Convert .acreplay files to JSON data for analysis</p>
          </div>
          <div className="feature-card">
            <h3>Visualize Laps</h3>
            <p>See your racing line compared to reference laps</p>
          </div>
          <div className="feature-card">
            <h3>Analyze Inputs</h3>
            <p>View throttle, brake, and steering data</p>
          </div>
        </div>
      </section>

      <section className="how-to">
        <h2>How to Use</h2>
        <ol>
          <li>Go to <Link to="/parser">Parse Replay</Link> and upload your .acreplay file</li>
          <li>Select your driver name and download the JSON</li>
          <li>Open the <Link to="/analyzer">Analyzer</Link> and upload your JSON</li>
          <li>Compare your lap with reference data</li>
        </ol>
      </section>
    </div>
  );
}

export default Home;
