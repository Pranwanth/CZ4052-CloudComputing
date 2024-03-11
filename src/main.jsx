import React from 'react';
import { createRoot } from 'react-dom/client'; // Changed import here
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './components/Home'; // This is your home page component after login
import NavBar from './components/NavBar';
import Welcome from './components/Welcome';
import Login from './components/Login';
import Register from './components/Register';

// Get the div with the id of 'root' from index.html
const container = document.getElementById('root');

// Create a root for your app
const root = createRoot(container); // createRoot(container!) if you're using TypeScript

// Initial render: Render the app to the root
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <NavBar />
      <Routes>
        <Route path="/" element={<Welcome />} />
        <Route path="/home" element={<Home />} /> {/* Ensure the user is authenticated */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
