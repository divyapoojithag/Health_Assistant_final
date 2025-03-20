import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [serverStatus, setServerStatus] = useState<string>('');
  const navigate = useNavigate();
  const { login } = useAuth();

  // Test server connection on component mount
  useEffect(() => {
    const testConnection = async () => {
      try {
        const response = await axios.get('http://localhost:8080/health_assistant/ping', {
          withCredentials: true
        });
        console.log('Server connection test:', response.data);
        setServerStatus('Connected to server');
      } catch (err) {
        console.error('Server connection test failed:', err);
        setServerStatus('Failed to connect to server');
      }
    };

    testConnection();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      console.log('Attempting login...');
      const response = await axios.post(
        'http://localhost:8080/health_assistant/validate',
        {
          username,
          password
        },
        {
          withCredentials: true,
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        }
      );

      console.log('Login response:', response.data);

      if (response.data.success) {
        const userData = {
          id: response.data.user.id,
          username: response.data.user.name,
          userType: response.data.user.user_type,
          healthCondition: response.data.health_data?.health_condition || '',
          age: response.data.health_data?.age || 0,
          weight: response.data.health_data?.weight || 0,
          height: response.data.health_data?.height || 0,
          allergies: response.data.health_data?.allergies || '',
          surgicalHistory: response.data.health_data?.surgical_history || '',
          currentMedication: response.data.health_data?.current_medication || '',
          medicinePrescribed: response.data.health_data?.medicine_prescribed || '',
          bloodGroup: response.data.health_data?.blood_group || ''
        };
        console.log('Login successful, user data:', userData);
        login(userData);
        navigate('/dashboard');
      } else {
        console.log('Login failed:', response.data.message);
        setError(response.data.message || 'Login failed. Please try again.');
      }
    } catch (err: any) {
      console.error('Login error:', err);
      if (err.response?.status === 401) {
        setError('Invalid username or password');
      } else if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else if (err.message === 'Network Error') {
        setError('Unable to connect to server. Please check if the server is running.');
        console.error('Network error details:', err);
      } else {
        setError('Login failed. Please try again.');
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative">
      {/* Background Image */}
      <div 
        className="absolute inset-0 z-0" 
        style={{
          backgroundImage: 'url("https://images.unsplash.com/photo-1505751172876-fa1923c5c528?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=2070&q=80")',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: 'brightness(0.9)'
        }}
      />

      <div className="max-w-md w-full space-y-8 p-10 bg-white/95 backdrop-blur-md rounded-xl shadow-2xl relative z-10 mx-4">
        {serverStatus && (
          <div className={`text-sm ${serverStatus.includes('Failed') ? 'text-red-600' : 'text-green-600'}`}>
            {serverStatus}
          </div>
        )}
        {/* Medical Icon */}
        <div className="text-center">
          <div className="mx-auto h-24 w-24 text-teal-600 mb-6">
            {/* Medical Cross Icon SVG */}
            <svg className="h-full w-full" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" fill="currentColor"/>
              <path d="M13 7h-2v4H7v2h4v4h2v-4h4v-2h-4V7z" fill="currentColor"/>
            </svg>
          </div>
          <h2 className="text-4xl font-extrabold text-gray-900 mb-3">
            Health Assistant
          </h2>
          <p className="text-lg text-teal-600 font-medium mb-8">
            Your Personal Health Companion
          </p>
        </div>

        <form className="mt-8 space-y-8" onSubmit={handleSubmit}>
          {error && (
            <div className="rounded-md bg-red-50 p-4 mb-6">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <div className="space-y-6">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-teal-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                </svg>
              </div>
              <input
                type="text"
                required
                className="appearance-none rounded-lg relative block w-full px-3 py-3 pl-10 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 focus:z-10 sm:text-sm transition duration-150 ease-in-out"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-teal-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                </svg>
              </div>
              <input
                type="password"
                required
                className="appearance-none rounded-lg relative block w-full px-3 py-3 pl-10 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 focus:z-10 sm:text-sm transition duration-150 ease-in-out"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 transition duration-150 ease-in-out"
            >
              Sign in
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
