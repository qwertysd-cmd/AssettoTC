import React from 'react';
import ReactDOM from 'react-dom/client';
import './App.css';
import App from './App'; // This now imports the new App with routing

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
