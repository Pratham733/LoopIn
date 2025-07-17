'use client';

import { useState, useEffect } from 'react';
import { getEmulatorStatusInfo, resetFirebaseConnection } from '@/lib/firebase/emulatorUtils';
import { networkStatus } from '@/lib/network';

export default function EmulatorStatus() {
  const [status, setStatus] = useState(() => getEmulatorStatusInfo());
  const [isResetting, setIsResetting] = useState(false);
  
  // Update status when network status changes
  useEffect(() => {
    const unsubscribe = networkStatus.subscribe(() => {
      setStatus(getEmulatorStatusInfo());
    });
    
    return () => unsubscribe();
  }, []);
  
  // Reset Firebase connection
  const handleReset = async () => {
    if (isResetting) return;
    
    setIsResetting(true);
    try {
      const { resetFirebaseConnection } = await import('@/lib/firebase/emulatorUtils');
      await resetFirebaseConnection();
      // Status will be updated via the networkStatus subscription
    } catch (error) {
      console.error('Error resetting connection:', error);
    } finally {
      setIsResetting(false);
    }
  };
  
  // Don't show anything in production mode
  if (!status.isEmulator && process.env.NODE_ENV === 'production') {
    return null;
  }
  
  // Get color classes based on status
  const colorClass = {
    green: 'bg-green-100 border-green-500 text-green-700',
    red: 'bg-red-100 border-red-500 text-red-700',
    orange: 'bg-orange-100 border-orange-500 text-orange-700',
    blue: 'bg-blue-100 border-blue-500 text-blue-700',
    gray: 'bg-gray-100 border-gray-500 text-gray-700',
  }[status.statusColor];
  
  return (
    <div className={`fixed bottom-4 right-4 z-50 px-3 py-1 text-xs rounded-full border ${colorClass} flex items-center gap-2`}>
      <span className={`w-2 h-2 rounded-full bg-${status.statusColor}-500`}></span>
      <span>{status.statusText}</span>
      {status.isEmulator && (
        <button 
          onClick={handleReset} 
          disabled={isResetting}
          className="ml-2 opacity-70 hover:opacity-100"
          title="Reset Firebase connection"
        >
          {isResetting ? '⟳' : '↻'}
        </button>
      )}
    </div>
  );
}
