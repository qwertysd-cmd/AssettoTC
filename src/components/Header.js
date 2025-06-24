import React from 'react';
import { Link } from 'react-router-dom';
import './Header.css';

function Header() {
  return (
    <header className="header">
      <div className="logo">
        <Link to="/">
          <h1>AC Replay Tool</h1>
        </Link>
      </div>
      <nav className="nav">
        <ul className="nav-list">
          <li className="nav-item">
            <Link to="/" className="nav-link">Home</Link>
          </li>
          <li className="nav-item">
            <Link to="/parser" className="nav-link">Parse Replay</Link>
          </li>
          <li className="nav-item">
            <Link to="/analyzer" className="nav-link">Analyze</Link>
          </li>
        </ul>
      </nav>
    </header>
  );
}

export default Header;
