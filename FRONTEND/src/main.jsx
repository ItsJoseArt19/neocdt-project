import React from 'react';
import ReactDOM from 'react-dom/client';
import './styles/index.css';
import App from './App.jsx';
import {initializeStorage} from "./utils/localStorageUtils.js";

// Se inicia el localStorage al cargar el aplicativo
initializeStorage();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
