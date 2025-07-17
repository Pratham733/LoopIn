'use client';

import dynamic from 'next/dynamic';

// Dynamically import status components
const EmulatorStatus = dynamic(
  () => import('@/components/common/EmulatorStatus'),
  { ssr: false }
);

const FirebaseStatus = dynamic(
  () => import('@/components/common/FirebaseStatus'),
  { ssr: false }
);

export default function StatusComponents() {
  // Only render in development or test environments
  if (process.env.NODE_ENV === 'production') {
    return null;
  }
  
  return (
    <div id="emulator-status-container">
      <EmulatorStatus />
      <FirebaseStatus />
    </div>
  );
}
