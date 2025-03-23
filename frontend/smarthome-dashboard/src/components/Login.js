import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';

function Login({ setAuth }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    console.log('Attempting login with:', { username, password });
    try {
      const response = await api.post('/api/Auth/login', {
        username,
        passwordHash: password,
      });
      console.log('Login response:', response.data);
      localStorage.setItem('token', response.data.token);
      setAuth(true);
      setMessage('Login successful');
      navigate('/'); // Only navigate on success
    } catch (err) {
      console.error('Login error:', err.response?.data || err.message);
      const errorMessage = err.response?.data?.message || 
                          err.response?.data?.title || 
                          err.message || 
                          'Login failed';
      setMessage(errorMessage);
      localStorage.removeItem('token'); // Clear token on failure
      setAuth(false);
    }
  };

  return (
    <div className="card p-4 mt-5 mx-auto" style={{ maxWidth: '400px' }}>
      <h2>Login</h2>
      <form onSubmit={handleLogin}>
        <div className="mb-3">
          <input
            type="text"
            className="form-control"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        </div>
        <div className="mb-3">
          <input
            type="password"
            className="form-control"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <button type="submit" className="btn btn-primary">Login</button>
      </form>
      <p className="mt-2">
        Don't have an account? <a href="/register">Register</a>
      </p>
      {message && <div className="mt-3 alert alert-info">{message}</div>}
    </div>
  );
}

export default Login;