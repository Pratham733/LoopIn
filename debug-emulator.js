/**
 * Firebase Emulator Debug Tool
 * 
 * This script helps diagnose issues with Firebase emulator connections.
 * Run it with: node debug-emulator.js
 */

const http = require('http');
const net = require('net');

console.log('======================================================');
console.log('FIREBASE EMULATOR CONNECTION DIAGNOSTICS');
console.log('======================================================');

// Set up environment variables for testing
process.env.USE_FIREBASE_EMULATOR = 'true';
process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR = 'true';
process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080';
process.env.FIREBASE_AUTH_EMULATOR_HOST = '127.0.0.1:9099';
process.env.FIREBASE_STORAGE_EMULATOR_HOST = '127.0.0.1:9199';

// Check TCP connection to a port
async function checkPort(host, port) {
    return new Promise((resolve) => {
        const socket = new net.Socket();

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

        socket.connect(port, host);
    });
}

// Make a simple HTTP request to check if the server is responding
async function checkHttpEndpoint(host, port, path = '/') {
    return new Promise((resolve) => {
        const options = {
            hostname: host,
            port: port,
            path: path,
            method: 'GET',
            timeout: 2000
        };

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                resolve({
                    status: res.statusCode,
                    headers: res.headers,
                    body: data.substring(0, 100) // Just get the first 100 chars
                });
            });
        });

        req.on('error', (error) => {
            resolve({ error: error.message });
        });

        req.on('timeout', () => {
            req.destroy();
            resolve({ error: 'Request timed out' });
        });

        req.end();
    });
}

// Run all tests
async function runTests() {
    console.log('TESTING TCP CONNECTIVITY:');
    console.log('------------------------');

    // Test Firestore emulator
    const firestorePort = 8080;
    const firestoreReachable = await checkPort('127.0.0.1', firestorePort);
    console.log(`Firestore (127.0.0.1:${firestorePort}): ${firestoreReachable ? 'REACHABLE ✓' : 'UNREACHABLE ❌'}`);

    // Test Auth emulator
    const authPort = 9099;
    const authReachable = await checkPort('127.0.0.1', authPort);
    console.log(`Auth (127.0.0.1:${authPort}): ${authReachable ? 'REACHABLE ✓' : 'UNREACHABLE ❌'}`);

    // Test Storage emulator
    const storagePort = 9199;
    const storageReachable = await checkPort('127.0.0.1', storagePort);
    console.log(`Storage (127.0.0.1:${storagePort}): ${storageReachable ? 'REACHABLE ✓' : 'UNREACHABLE ❌'}`);

    console.log('\nTESTING HTTP ENDPOINTS:');
    console.log('------------------------');

    // Test Firestore HTTP endpoint
    if (firestoreReachable) {
        const firestoreResponse = await checkHttpEndpoint('127.0.0.1', firestorePort);
        console.log(`Firestore HTTP: ${firestoreResponse.error ? 'ERROR: ' + firestoreResponse.error : 'OK (' + firestoreResponse.status + ')'}`);
    }

    // Test Auth HTTP endpoint
    if (authReachable) {
        const authResponse = await checkHttpEndpoint('127.0.0.1', authPort);
        console.log(`Auth HTTP: ${authResponse.error ? 'ERROR: ' + authResponse.error : 'OK (' + authResponse.status + ')'}`);
    }

    // Test Storage HTTP endpoint
    if (storageReachable) {
        const storageResponse = await checkHttpEndpoint('127.0.0.1', storagePort);
        console.log(`Storage HTTP: ${storageResponse.error ? 'ERROR: ' + storageResponse.error : 'OK (' + storageResponse.status + ')'}`);
    }

    console.log('\nDIAGNOSTIC SUMMARY:');
    console.log('------------------------');
    const allReachable = firestoreReachable && authReachable && storageReachable;

    if (allReachable) {
        console.log('✓ All Firebase emulators appear to be running correctly');
        console.log('✓ TCP ports are open and accessible');
    } else {
        console.log('❌ Some Firebase emulators appear to be unreachable');
        console.log('  Missing emulators:');
        if (!firestoreReachable) console.log('  - Firestore (port 8080)');
        if (!authReachable) console.log('  - Auth (port 9099)');
        if (!storageReachable) console.log('  - Storage (port 9199)');

        console.log('\nTROUBLESHOOTING STEPS:');
        console.log('1. Make sure Firebase emulators are running with "firebase emulators:start"');
        console.log('2. Check if another process is using the same ports');
        console.log('   - Run "netstat -ano | findstr 8080" to check Firestore port');
        console.log('3. Try binding explicitly to IPv4 with "firebase emulators:start --host 127.0.0.1"');
        console.log('4. Ensure firewall is not blocking these ports');
    }

    console.log('\nNEXT STEPS:');
    console.log('1. If diagnostics show all emulators running, but Next.js still has issues:');
    console.log('   - Set NEXT_PUBLIC_FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 explicitly');
    console.log('   - Ensure Next.js is using IPv4: NODE_OPTIONS=--dns-result-order=ipv4first');
    console.log('   - Try restarting your development server');
    console.log('2. To test connectivity from your browser, visit:');
    console.log('   - http://localhost:3000/test-emulators');
    console.log('======================================================');
}

runTests();
