// This file is for server-side only

// We dynamically import firebase-admin to avoid issues with webpack
// This code only runs on the server, never in the browser

// Helper function to check if a host:port is reachable
let checkEmulatorConnectivity = async (host: string, port: number): Promise<boolean> => {
  // Only available in Node.js environment
  if (typeof window !== 'undefined') return false;
  
  try {
    const net = await import('net');
    
    return new Promise((resolve) => {
      const socket = new net.Socket();
      
      // Set a timeout for the connection attempt
      socket.setTimeout(1000);
      
      socket.on('connect', () => {
        socket.destroy();
        resolve(true);
      });
      
      socket.on('timeout', () => {
        socket.destroy();
        resolve(false);
      });
      
      socket.on('error', () => {
        socket.destroy();
        resolve(false);
      });
      
      // Attempt to connect
      socket.connect(port, host === 'localhost' ? '127.0.0.1' : host);
    });
  } catch (error) {
    console.error('Error checking emulator connectivity:', error);
    return false;
  }
};

let admin: any = null;
let adminApp: any = null;
let adminDb: any = null;
let adminAuth: any = null;
let adminStorage: any = null;

// We can safely use these imports on the server
if (typeof window === 'undefined') {
  // Dynamically import firebase-admin
  import('firebase-admin').then((firebaseAdmin) => {
    admin = firebaseAdmin;
    
    // Check if an app has already been initialized
    if (!admin.apps.length) {
      try {
        // Parse the service account if it exists
        let serviceAccount;
        try {
          if (process.env.FIREBASE_SERVICE_ACCOUNT) {
            serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
            console.log('Found FIREBASE_SERVICE_ACCOUNT env variable');
          } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
            console.log('Using GOOGLE_APPLICATION_CREDENTIALS from env');
          } else {
            console.warn('No Firebase service account or credentials found in environment variables');
          }
        } catch (e) {
          console.error('Error parsing FIREBASE_SERVICE_ACCOUNT:', e);
        }
          // Initialize Firebase Admin with more robust error handling
        let credentials;
        const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
        const useEmulator = process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === 'true' || 
                           process.env.USE_FIREBASE_EMULATOR === 'true';
        
        try {          if (useEmulator) {
            // For emulator, initialize with a simple app config
            console.log('Using emulator mode for Firebase Admin');
            
            // For emulator, we don't need proper credentials
            adminApp = admin.initializeApp({
              projectId: projectId || 'loopinchat-emulator'
            });
              // Connect to emulators
            const firestoreEmulatorHost = 'localhost:8092'; // Force correct port
            process.env.FIRESTORE_EMULATOR_HOST = firestoreEmulatorHost;
            
            console.log(`🔥 Admin SDK connecting to Firestore emulator at ${firestoreEmulatorHost}`);
            
            adminDb = admin.firestore(adminApp);
            adminAuth = admin.auth(adminApp);
            adminStorage = admin.storage(adminApp);
            
            // Return early since we've already initialized everything
            return;
          } else if (serviceAccount) {
            // Use the provided service account in production
            console.log('Using FIREBASE_SERVICE_ACCOUNT for admin credentials');
            credentials = admin.credential.cert(serviceAccount);
          } else {
            // Try to use Google Cloud default credentials if not in emulator mode
            try {
              console.log('Attempting to use application default credentials');
              credentials = admin.credential.applicationDefault();
            } catch (credError) {
              console.error('Failed to load application default credentials:', credError);
              
              // For development environment, use an empty credential if using emulator
              if (process.env.NODE_ENV !== 'production') {
                console.log('Falling back to emulator mode - no credentials required for local emulator');
                // Create a minimal credential for the emulator
                credentials = admin.credential.cert({
                  projectId: projectId || 'firebase-project-demo',
                  clientEmail: 'fake@example.com',
                  privateKey: 'fake-key'
                });
              } else {
                throw credError;
              }
            }
          }
          
          const adminConfig = {
            credential: credentials,
            projectId: projectId,
            storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
          };
          
          console.log('Initializing Firebase Admin with config:', { 
            projectId: adminConfig.projectId,
            hasCredentials: !!credentials,
            useEmulator
          });
          
          adminApp = admin.initializeApp(adminConfig);
          
          console.log('Firebase Admin initialized successfully');
        } catch (error) {
          console.error('Firebase Admin initialization error:', error);
          // Continue without admin functionality
        }
      } catch (error) {
        console.error('Firebase Admin setup error:', error);
        // Continue without admin functionality
      }
    } else {
      // Get the existing app
      adminApp = admin.app();
    }
      // Initialize admin services if app is available
    if (adminApp) {
      adminDb = adminApp.firestore();
      adminAuth = adminApp.auth();
      adminStorage = adminApp.storage();
      
              // Connect to emulators if configured
        const useEmulator = process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === 'true' || 
                           process.env.USE_FIREBASE_EMULATOR === 'true';
                           if (useEmulator) {
          // Explicitly set the correct Firestore emulator host
          process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8092';
        // Disable IPv6 to avoid connection issues with Firestore emulator
        process.env.NODE_OPTIONS = process.env.NODE_OPTIONS ? 
          `${process.env.NODE_OPTIONS} --dns-result-order=ipv4first` : 
          '--dns-result-order=ipv4first';
          
        // Connect to emulators using an async IIFE
        (async () => {
          try {
                const firestoreHost = process.env.FIRESTORE_EMULATOR_HOST || 'localhost:8092';
          const authHost = process.env.FIREBASE_AUTH_EMULATOR_HOST || 'localhost:9099';
          const storageHost = process.env.FIREBASE_STORAGE_EMULATOR_HOST || 'localhost:9199';
          
          console.log('Connecting Firebase Admin to emulators:', { 
            firestoreHost, 
            authHost,
            storageHost
          });
          
          // Parse connection strings
          const [firestoreHostname, firestorePortStr] = firestoreHost.split(':');
          const firestorePort = parseInt(firestorePortStr, 10);
          const [authHostname, authPortStr] = authHost.split(':');
          const authPort = parseInt(authPortStr, 10);
          const [storageHostname, storagePortStr] = storageHost.split(':');
          const storagePort = parseInt(storagePortStr, 10);
          
          // Always use IPv4 (127.0.0.1) instead of localhost to prevent IPv6 issues
          const ipv4FirestoreHost = firestoreHostname === 'localhost' ? '127.0.0.1' : firestoreHostname;
          const ipv4AuthHost = authHostname === 'localhost' ? '127.0.0.1' : authHostname;
          const ipv4StorageHost = storageHostname === 'localhost' ? '127.0.0.1' : storageHostname;
          
          // Check Firestore connectivity before connecting
          console.log(`Testing connection to Firestore emulator at ${ipv4FirestoreHost}:${firestorePort}...`);
          const isFirestoreReachable = await checkEmulatorConnectivity(ipv4FirestoreHost, firestorePort);
          
          if (isFirestoreReachable) {
            console.log('✓ Successfully connected to Firestore emulator');
            // Connect to Firestore emulator with explicit IPv4 address
            // Only call settings() if it hasn't been called before
            if (adminDb && typeof adminDb._settingsFrozen === 'boolean' && !adminDb._settingsFrozen) {
              adminDb.settings({
                host: ipv4FirestoreHost,
                port: firestorePort,
                ssl: false
              });
            }
          } else {
            console.error('❌ Cannot connect to Firestore emulator! Make sure it is running.');
            console.error('Tip: Run "firebase emulators:start" in a separate terminal window');
          }
          
          // Connect Auth emulator - using environment variable
          const isAuthReachable = await checkEmulatorConnectivity(ipv4AuthHost, authPort);
          if (isAuthReachable) {
            console.log('✓ Successfully connected to Auth emulator');
            process.env.FIREBASE_AUTH_EMULATOR_HOST = `${ipv4AuthHost}:${authPort}`;
          } else {
            console.warn('⚠️ Could not connect to Auth emulator');
          }
          
          // Set up Storage emulator
          const isStorageReachable = await checkEmulatorConnectivity(ipv4StorageHost, storagePort);
          if (isStorageReachable) {
            console.log('✓ Successfully connected to Storage emulator');
            process.env.FIREBASE_STORAGE_EMULATOR_HOST = `${ipv4StorageHost}:${storagePort}`;
          } else {
            console.warn('⚠️ Could not connect to Storage emulator');
          }              } catch (emulatorError) {
                console.error('Error connecting to Firebase emulators:', emulatorError);
              }
            })();
      }
    }
  }).catch(error => {
    console.error('Error importing firebase-admin:', error);
  });
}

// Remove the duplicate settings() call at the bottom
// The settings are now handled in the main initialization block above

export { admin, adminApp, adminDb, adminAuth, adminStorage, checkEmulatorConnectivity };
