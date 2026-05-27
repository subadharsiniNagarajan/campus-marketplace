import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import ProductDetails from './pages/ProductDetails';
import BuyPage from './pages/BuyPage';
import './styles/App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/"           element={<Navigate to="/login" replace />} />
          <Route path="/login"      element={<Login />} />
          <Route path="/signup"     element={<Signup />} />
          <Route path="/dashboard"  element={<Dashboard />} />
          <Route path="/items/:id"  element={<ProductDetails />} />
          <Route path="/buy/:id"    element={<BuyPage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
