'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase/client';
import { collection, getDocs, limit, query } from 'firebase/firestore';
import { checkFirebaseConnectivity, toggleFirebaseNetwork, networkStatus } from '@/lib/network';

export default function FirebaseTestComponent() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Connecting to Firebase...');
  const [networkEnabled, setNetworkEnabled] = useState(true);
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);

  // Check connection status
  useEffect(() => {
    async function testFirebase() {
      try {
        // Test client-side Firebase
        const usersRef = collection(db, 'users');
        const q = query(usersRef, limit(1));
        await getDocs(q);
        
        setStatus('success');
        setMessage('Firebase client SDK connected successfully!');
        
        // Test server-side Firebase Admin
        const response = await fetch('/api/test-firebase');
        const data = await response.json();
        setMessage((prev) => `${prev}\n\nServer API response: ${JSON.stringify(data, null, 2)}`);
      } catch (error) {
        setStatus('error');
        setMessage(`Firebase connection error: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
    
    testFirebase();
    
    // Set up online/offline listeners
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Handle toggling Firebase network
  const handleToggleNetwork = async () => {
    try {
      await toggleFirebaseNetwork(!networkEnabled);
      setNetworkEnabled(!networkEnabled);
      
      // Test connection after toggle
      const isConnected = await checkFirebaseConnectivity();
      setStatus(isConnected ? 'success' : 'error');
      setMessage(`Firebase network ${!networkEnabled ? 'enabled' : 'disabled'} successfully. Connection status: ${isConnected ? 'Connected' : 'Disconnected'}`);
    } catch (error) {
      setStatus('error');
      setMessage(`Error toggling network: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  // Test Firebase connection
  const handleTestConnection = async () => {
    setStatus('loading');
    setMessage('Testing Firebase connection...');
    
    try {
      const isConnected = await checkFirebaseConnectivity();
      const usersRef = collection(db, 'users');
      const q = query(usersRef, limit(1));
      const querySnapshot = await getDocs(q);
      
      setStatus(isConnected ? 'success' : 'error');
      setMessage(`Connection test: ${isConnected ? 'Connected' : 'Disconnected'}\n${querySnapshot.size} users found in cache or network.`);
    } catch (error) {
      setStatus('error');
      setMessage(`Connection test error: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  return (
    <div className="p-4 border rounded-lg">
      <h2 className="text-xl font-bold mb-2">Firebase Connection Status</h2>
      
      <div className="flex items-center gap-2 mb-4">
        <div className={`w-3 h-3 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`}></div>
        <span>Browser: {isOnline ? 'Online' : 'Offline'}</span>
      </div>
      
      <div 
        className={`p-3 rounded mb-4 ${
          status === 'loading' ? 'bg-yellow-100 text-yellow-800' : 
          status === 'success' ? 'bg-green-100 text-green-800' : 
          'bg-red-100 text-red-800'
        }`}
      >
        <p className="font-medium">{status === 'loading' ? 'Loading...' : status === 'success' ? 'Connected!' : 'Error!'}</p>
        <pre className="mt-2 whitespace-pre-wrap text-sm">{message}</pre>
      </div>
      
      <div className="flex flex-col sm:flex-row gap-2">
        <button 
          onClick={handleToggleNetwork}
          className={`px-4 py-2 rounded font-medium ${networkEnabled ? 'bg-red-500 text-white' : 'bg-green-500 text-white'}`}
        >
          {networkEnabled ? 'Disable Firebase Network' : 'Enable Firebase Network'}
        </button>
        
        <button
          onClick={handleTestConnection}
          className="px-4 py-2 rounded bg-blue-500 text-white font-medium"
        >
          Test Connection
        </button>
      </div>
      
      <div className="mt-4 text-sm text-gray-600">
        <p>Use these controls to test the app's behavior in online and offline modes.</p>
        <p className="mt-1">When disabled, the app will use cached data if available.</p>
      </div>
    </div>
  );
}
