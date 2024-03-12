import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext'; // Import AuthProvider
import Home from './components/Home';
import NavBar from './components/NavBar';
import Welcome from './components/Welcome';
import Login from './components/Login';
import Register from './components/Register';

const container = document.getElementById('root');
const root = createRoot(container);

root.render(
  <React.StrictMode>
    <AuthProvider> {/* Wrap your components with AuthProvider */}
      <BrowserRouter>
        <NavBar />
        <Routes>
          <Route path="/" element={<Welcome />} />
          <Route path="/home" element={<Home />} /> {/* Ensure the user is authenticated */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  </React.StrictMode>
);
