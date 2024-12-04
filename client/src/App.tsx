import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import MainPage from './pages/MainPage';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [userId, setUserId] = useState<string | null>(null);


  useEffect(() => {

    const checkAuthCookie = async () => {
      try {
          const response = await fetch('http://localhost:5000/api/users/protected', {
          method: 'GET',
          credentials: 'include', // Include cookies
      });

        console.log("app.tsx ")
        console.log(response)
        console.log(response.ok)
        if (response.ok) {
            const data = await response.json();
            console.log(data)
            setUserId(data.userId); 
            setIsAuthenticated(true);
          } 

        else {
            setIsAuthenticated(false);
        }

      } catch (error) {
        setIsAuthenticated(false);
} };

  checkAuthCookie();

}, []);


  if (isAuthenticated === null) return <p>Loading...</p>;

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/user/:id"
          element={
            <ProtectedRoute isAuthenticated={isAuthenticated}>
              <MainPage />
            </ProtectedRoute>
          }
        />
        {/* Redirect based on authentication status */}
        <Route
          path="/"
          element={
            isAuthenticated ? (
              <Navigate to={`/user/${userId}`} />
            ) : (
              <Navigate to="/signup" />
            )
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;