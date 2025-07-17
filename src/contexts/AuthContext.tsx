"use client";

import type { ReactNode } from 'react';
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { MockUser } from '@/types';
import { auth } from '@/lib/firebase/client';
import { onAuthStateChanged, type User as FirebaseUser } from 'firebase/auth';
import { getUserProfile, updateUserProfile, createUserProfile } from '@/services/userService';

interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: MockUser | null; // This will be our Firestore profile
  firebaseUser: FirebaseUser | null; // This is the user from Firebase Auth
  updateUser: (updatedUser: Partial<MockUser>) => void;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<MockUser | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const updateUser = useCallback(async (updatedUserInfo: Partial<MockUser>) => {
    if (user) {
        // Special handling for profile image
        if ('profileImage' in updatedUserInfo) {
            console.log("AuthContext: Updating profile image to:", updatedUserInfo.profileImage);
        }
        
        const updatedUser = { ...user, ...updatedUserInfo };
        
        // Persist changes to Firestore
        await updateUserProfile(user.id, updatedUserInfo);
        
        // Update local state after Firestore is updated
        setUser(updatedUser);
        console.log("AuthContext: User state updated with new data");
    }
  }, [user]);

  useEffect(() => {
    console.log("Setting up auth state listener");
    
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      console.log("Auth state changed:", fbUser ? `User: ${fbUser.uid}` : "No user");
      setFirebaseUser(fbUser);
      
      if (fbUser) {
        try {
          // We'll always try to get the user profile regardless of connectivity
          // This allows Firestore's offline cache to work properly
          console.log(`Fetching profile for user: ${fbUser.uid}`);
          let userProfile = null;
          
          // First attempt - try to get the profile directly
          // The updated getUserProfile will try cache when offline
          try {
            userProfile = await getUserProfile(fbUser.uid);
            if (userProfile) {
              console.log("User profile found:", userProfile.username);
              setUser(userProfile);
              setIsLoading(false);
              return; // Exit early if successful
            }
          } catch (error: any) {
            console.warn("Initial profile fetch failed:", error.message);
            // Continue with retry logic
          }
          
          // If we reach here, first attempt failed
          if (!userProfile && navigator.onLine) {
            // Only retry if we're online
            console.log("Initial fetch failed, will retry with backoff");
            let attempts = 1; // Already tried once
            
            while (attempts < 3 && !userProfile) {
              try {
                // Wait with exponential backoff
                const backoffTime = 800 * Math.pow(1.5, attempts);
                console.log(`Waiting ${backoffTime}ms before retry ${attempts}`);
                await new Promise(resolve => setTimeout(resolve, backoffTime));
                
                userProfile = await getUserProfile(fbUser.uid);
                
                if (userProfile) {
                  console.log("User profile found on retry:", userProfile.username);
                  break; // Exit the loop if we found the profile
                } else {
                  console.log(`Profile still not found on attempt ${attempts + 1}`);
                  attempts++;
                }
              } catch (retryError: any) {
                console.warn(`Retry ${attempts} failed:`, retryError.message);
                
                // If we detect we're offline during retry, stop trying
                if (!navigator.onLine || retryError.message?.includes('offline')) {
                  console.warn("Network appears to be offline, stopping retry attempts");
                  break;
                }
                
                attempts++;
              }
            }
          }
          
          if (userProfile) {
            console.log("Setting user profile in state:", userProfile.username);
            setUser(userProfile);
          } else {
            // Only attempt profile creation if we're online
            if (navigator.onLine) {
              console.log("No profile found after attempts, will try to create one");
              
              // Create a default profile as a fallback
              try {
                // Get email from Firebase user
                const email = fbUser.email || '';
                const username = email.split('@')[0];
                console.log("Creating fallback profile with username:", username);
                
                const newProfile = await createUserProfile(fbUser.uid, { 
                  email, 
                  username: `user_${Math.floor(Math.random() * 10000)}` 
                });
                
                setUser(newProfile);
                console.log("Fallback profile created");
              } catch (createError) {
                console.error("Error creating fallback profile:", createError);
              }
            } else {
              console.warn("Cannot create user profile while offline");
              // Show appropriate UI for offline first-time users
            }
          }
        } catch (error) {
          console.error("Error in auth state change handler:", error);
        } finally {
          setIsLoading(false);
        }
      } else {
        // User is signed out
        console.log("User signed out, clearing user state");
        setUser(null);
        setIsLoading(false);
      }
    });

    // Cleanup subscription on unmount
    return () => {
      console.log("Cleaning up auth state listener");
      unsubscribe();
    };
  }, []);

  const value = {
    isAuthenticated: !!user && !!firebaseUser,
    isLoading,
    user,
    firebaseUser,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
