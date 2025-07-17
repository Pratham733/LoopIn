// Helper function to check if emulators are running
export async function checkEmulatorsRunning(): Promise<{
  auth: boolean;
  firestore: boolean;
  storage: boolean;
}> {
  const results = {
    auth: false,
    firestore: false,
    storage: false
  };

  // Check Auth emulator
  try {
    const response = await fetch('http://127.0.0.1:9090/', { method: 'GET' });
    results.auth = response.ok || response.status === 404; // 404 is also OK for emulator
  } catch (error) {
    console.warn('Auth emulator not reachable');
  }

  // Check Firestore emulator
  try {
    const response = await fetch('http://127.0.0.1:8092/', { method: 'GET' });
    results.firestore = response.ok || response.status === 404;
  } catch (error) {
    console.warn('Firestore emulator not reachable');
  }

  // Check Storage emulator
  try {
    const response = await fetch('http://127.0.0.1:9190/', { method: 'GET' });
    results.storage = response.ok || response.status === 404;
  } catch (error) {
    console.warn('Storage emulator not reachable');
  }

  return results;
}

// Show emulator status
export function showEmulatorStatus() {
  if (typeof window !== 'undefined') {
    checkEmulatorsRunning().then(status => {
      console.log('🔧 Emulator Status:', status);
      if (!status.auth || !status.firestore || !status.storage) {
        console.warn('⚠️  Some emulators are not running. Please run: start-emulators.bat');
      }
    });
  }
}
