import React from 'react'; // Removed useState, useEffect, useRef
import { Link } from 'react-router-dom';
// Removed gapi related imports/logic
import '../App.css'; // Adjust path if needed

function HomePage() {
    // Removed user state, refs, and useEffect for gapi

    // Removed onSignIn, handleSignOut, renderSignInButton functions

    return (
        <div className="homepage">
            <h2>Welcome to the Assetto Corsa Telemetry Suite</h2>
            <p>Analyze your driving data or generate compatible JSON files from replays.</p>

            <div className="homepage-actions">
                <Link to="/analyze" className="action-button analyze-button">
                    Analyse Your Telemetry
                </Link>
                <Link to="/generate" className="action-button generate-button">
                    Parse Replay
                </Link>
                {/* Demo button removed */}
            </div>
        </div>
    );
}

export default HomePage;
