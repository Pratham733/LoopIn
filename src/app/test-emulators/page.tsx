'use client';

import { useState, useEffect } from 'react';
import testClientEmulators from '@/lib/firebase/emulatorTest';

export default function TestEmulatorsPage() {
  const [results, setResults] = useState<any>(null);
  const [serverResults, setServerResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Run tests when button is clicked
  const runClientTests = async () => {
    setLoading(true);
    setError(null);
    try {
      const testResults = await testClientEmulators();
      setResults(testResults);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  // Run server tests when button is clicked
  const runServerTests = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/test-emulators');
      const data = await response.json();
      if (data.error) {
        throw new Error(data.message || data.error);
      }
      setServerResults(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Firebase Emulator Connection Tests</h1>
      
      <div className="bg-amber-50 border border-amber-200 rounded p-4 mb-6">
        <p className="font-semibold text-amber-700">
          This page tests connectivity to Firebase emulators from both client and server.
        </p>
        <p className="mt-2 text-amber-600">
          Make sure emulators are running with <code>firebase emulators:start</code> before testing.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-6">
        <div className="border rounded p-4">
          <h2 className="text-lg font-bold mb-2">Client-side Tests</h2>
          <p className="text-sm mb-4">
            Tests browser connectivity to Firestore, Storage, and Auth emulators
          </p>
          <button
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            onClick={runClientTests}
            disabled={loading}
          >
            {loading ? 'Running Tests...' : 'Run Client Tests'}
          </button>
        </div>

        <div className="border rounded p-4">
          <h2 className="text-lg font-bold mb-2">Server-side Tests</h2>
          <p className="text-sm mb-4">
            Tests Next.js server connectivity to Firestore, Storage, and Auth emulators
          </p>
          <button
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
            onClick={runServerTests}
            disabled={loading}
          >
            {loading ? 'Running Tests...' : 'Run Server Tests'}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-300 text-red-700 rounded p-4 mb-6">
          <p className="font-bold">Error:</p>
          <p>{error}</p>
        </div>
      )}

      {results && (
        <div className="mb-6">
          <h2 className="text-lg font-bold mb-2">Client Test Results:</h2>
          <div className="bg-gray-50 border rounded p-4">
            <div className="grid grid-cols-2 gap-2">
              <div>Firestore Read:</div>
              <div>{results.firestoreRead ? '✅ PASS' : '❌ FAIL'}</div>
              <div>Firestore Write:</div>
              <div>{results.firestoreWrite ? '✅ PASS' : '❌ FAIL'}</div>
              <div>Storage Upload:</div>
              <div>{results.storageUpload ? '✅ PASS' : '❌ FAIL'}</div>
              <div>Auth Anonymous:</div>
              <div>{results.authAnonymous ? '✅ PASS' : '❌ FAIL'}</div>
            </div>
          </div>
        </div>
      )}

      {serverResults && (
        <div className="mb-6">
          <h2 className="text-lg font-bold mb-2">Server Test Results:</h2>
          <div className="bg-gray-50 border rounded p-4">
            <div className="grid grid-cols-2 gap-2">
              <div>Firestore Reachable:</div>
              <div>{serverResults.serverEmulators?.firestoreReachable ? '✅ PASS' : '❌ FAIL'}</div>
              <div>Auth Reachable:</div>
              <div>{serverResults.serverEmulators?.authReachable ? '✅ PASS' : '❌ FAIL'}</div>
              <div>Storage Reachable:</div>
              <div>{serverResults.serverEmulators?.storageReachable ? '✅ PASS' : '❌ FAIL'}</div>
            </div>
            <p className="mt-4 text-sm text-gray-600">
              Check the server console for more detailed test results.
            </p>
          </div>
        </div>
      )}

      <div className="bg-gray-50 border rounded p-4">
        <h2 className="text-lg font-bold mb-2">Environment:</h2>
        <pre className="text-xs overflow-auto">
          {JSON.stringify(
            {
              NEXT_PUBLIC_USE_FIREBASE_EMULATOR: process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR,
              NEXT_PUBLIC_FIRESTORE_EMULATOR_HOST: process.env.NEXT_PUBLIC_FIRESTORE_EMULATOR_HOST,
              NEXT_PUBLIC_FIREBASE_STORAGE_EMULATOR_HOST: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_EMULATOR_HOST,
              NEXT_PUBLIC_FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
            },
            null,
            2
          )}
        </pre>
      </div>
    </div>
  );
}
