"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Logo } from '@/components/common/Logo';
import { useAlertContext } from '@/components/AlertProvider';
import { Lock, Mail, User } from 'lucide-react';
import { InlineLoader } from '@/components/ui/loader';
import { cn } from '@/lib/utils';
import ShineBorder from '@/components/magicui/shine-border';
import Hyperspeed, { hyperspeedPresets } from '@/components/magicui/Hyperspeed';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase/client';
import { createUserProfile } from '@/services/userService';
import dynamic from 'next/dynamic';

// Dynamically import the Firebase test component with no SSR
const FirebaseTestComponent = dynamic(
  () => import('@/components/common/FirebaseTestComponent'),
  { ssr: false }
);

// TODO: Temporarily commented out Google and Apple login - will implement later
/*
const GoogleIcon = () => (
    <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className="h-5 w-5"><title>Google</title><path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-5.117 2.4-4.333 0-8.283-3.333-8.283-7.72 0-4.387 3.95-7.72 8.283-7.72 2.653 0 4.44.933 5.383 1.82-1.147-1.147-3.067-2.4-5.383-2.4-4.82 0-8.84 3.867-8.84 8.667s4.02 8.667 8.84 8.667c3.04 0 5.237-1.187 6.877-2.887 1.947-1.947 2.628-4.72 2.628-7.373 0-.6-.053-1.2-.153-1.8H12.48z"/></svg>
);

const AppleIcon = () => (
    <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 fill-current"><title>Apple</title><path d="M12.152 6.896c-.948 0-1.896.474-2.844 1.422-1.896 1.896-3.318 4.74-3.318 7.584 0 2.37.948 4.74 1.896 6.192.948 1.422 1.896 2.37 3.318 2.37.948 0 1.896-.474 2.844-1.422 1.896-1.896 3.318-4.74 3.318-7.584 0-2.37-.948-4.74-1.896-6.192-.948-1.422-1.896-2.37-3.318-2.37m4.266 15.636c.474-.474.948-1.422 1.422-2.844.474-1.422.474-2.844 0-4.266-.474.474-.948 1.422-1.422 2.844-.474 1.422-.474 2.844 0 4.266M12.152 0c-.474.048-1.422.522-2.37.996-.948.522-1.896 1.47-2.37 2.418-.474.948-.948 2.37-.948 3.792 0 1.422.474 2.844.948 3.792.474.948 1.422 1.896 2.37 2.37.948.474 1.896.948 2.37.948s1.422-.522 2.37-.996c.948-.522 1.896-1.47 2.37-2.418.474-.948.948-2.37.948-3.792 0-1.422-.474-2.844-.948-3.792-.474-.948-1.422-1.896-2.37-2.37-.948-.474-1.422-.948-2.37-.948"/></svg>
);
*/


export default function AuthPage() {
    const router = useRouter();
    const { success, error, warning } = useAlertContext();
    const [isLoading, setIsLoading] = useState(false);
    const [activeTab, setActiveTab] = useState("login");

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [username, setUsername] = useState('');

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            console.log("Attempting login with email:", email);
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            
            console.log("Login successful, refreshing token...");
            // Force refresh the token to ensure onAuthStateChanged fires with latest data
            await userCredential.user.getIdToken(true);
            
            // Wait a moment for auth state to propagate
            console.log("Waiting for auth state to propagate...");
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            success("Login Successful!", "Redirecting you to the app...");
            
            // Hard redirect for a clean state
            window.location.href = '/chat';
        } catch (error: any) {
            console.error("Login failed", error);
            error("Login Failed", error.message || "Please check your credentials and try again.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            // First check if username is taken
            const response = await fetch(`/api/users/check-username?username=${encodeURIComponent(username)}`);
            const { isTaken } = await response.json();
            
            if (isTaken) {
                error("Username already taken", "Please choose a different username.");
                setIsLoading(false);
                return;
            }
            
            console.log("Creating Firebase auth user...");
            // Create the Firebase auth user
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            
            if (userCredential.user) {
                const uid = userCredential.user.uid;
                console.log(`Firebase user created with UID: ${uid}`);
                
                try {
                    // Create the user profile in Firestore
                    console.log("Creating user profile in Firestore...");
                    const userProfile = await createUserProfile(uid, { email, username });
                    console.log("User profile created:", userProfile);
                    
                    // Force trigger onAuthStateChanged by refreshing the token
                    console.log("Refreshing auth token...");
                    await userCredential.user.getIdToken(true);
                    
                    // Create user in API too (to ensure consistency)
                    console.log("Ensuring user exists in backend API...");
                    const apiResponse = await fetch("/api/users", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ 
                            uid,
                            email, 
                            username,
                            profile: userProfile
                        })
                    });
                    
                    if (!apiResponse.ok) {
                        console.warn("API user creation response:", await apiResponse.text());
                    }
                    
                    // Send welcome email to the user
                    console.log("Sending welcome email...");
                    try {
                        const emailResponse = await fetch("/api/send-welcome-email", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ 
                                userEmail: email, 
                                username 
                            })
                        });
                        
                        if (emailResponse.ok) {
                            console.log("Welcome email sent successfully");
                        } else {
                            console.warn("Failed to send welcome email:", await emailResponse.text());
                        }
                    } catch (emailError) {
                        console.warn("Error sending welcome email:", emailError);
                        // Don't fail the signup if email fails
                    }
                    
                    // Sign out the user after registration to force a clean login
                    console.log("Sign-up complete, logging out to enable clean login...");
                    await signOut(auth);
                    
                    success("Signup Successful!", "Account created! Please log in to continue.");
                    
                    // Keep the email but clear the password for security
                    const registeredEmail = email;
                    setPassword("");
                    
                    // Switch to login tab
                    setActiveTab("login");
                    setIsLoading(false);
                } catch (profileError: any) {
                    console.error("Error creating user profile:", profileError);
                    // Clean up by deleting the auth user if profile creation failed
                    await userCredential.user.delete();
                    throw new Error(`Failed to create profile: ${profileError.message}`);
                }
            }
        } catch (error: any) {
            console.error("Signup failed", error);
            error("Signup Failed", error.message || "Please try again.");
            // In case of error, sign out the user if they were partially created
            try {
                await signOut(auth);
            } catch (e) {
                console.warn("Error during cleanup signout:", e);
            }
            
            // Remove any partial user data if necessary
            if (error.code === "auth/email-already-in-use") {
                warning("Email Already in Use", "Try logging in instead, or use a different email address.");
                // Keep the email but clear password
                setPassword("");
                setActiveTab("login");
            }
        } finally {
            setIsLoading(false);
        }
    }


    return (
        <div className="relative h-screen w-screen overflow-hidden bg-background">
            <Hyperspeed effectOptions={hyperspeedPresets.one} />
            <div className="relative z-10 flex h-full w-full items-center justify-center p-4">
                <div className="w-full max-w-md animate-fade-in-up">
                    <ShineBorder
                        borderRadius={12}
                        borderWidth={1}
                        duration={7}
                        color="hsl(var(--primary))"
                    >
                        <Card className="w-full bg-card/80 dark:bg-card/70 backdrop-blur-sm">
                            <CardHeader className="text-center">
                                <div className="mx-auto mb-4">
                                    <Logo size="large" />
                                </div>
                                <CardTitle className="text-2xl sm:text-3xl font-bold">
                                     {activeTab === 'login' ? "Welcome Back" : "Create an Account"}
                                </CardTitle>
                                <CardDescription>
                                    {activeTab === 'login' ? "Sign in to continue to LoopIn" : "Join the loop to start connecting"}
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                                    <TabsList className="grid w-full grid-cols-2">
                                        <TabsTrigger value="login">Login</TabsTrigger>
                                        <TabsTrigger value="signup">Sign Up</TabsTrigger>
                                    </TabsList>
                                    <TabsContent value="login" className="space-y-4 pt-4">
                                        <form onSubmit={handleLogin} className="space-y-4">
                                            <div className="relative">
                                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                                <Input required type="email" placeholder="email@example.com" className="pl-10" disabled={isLoading} value={email} onChange={e => setEmail(e.target.value)} />
                                            </div>
                                            <div className="relative">
                                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                                <PasswordInput required placeholder="Password" className="pl-10" disabled={isLoading} value={password} onChange={e => setPassword(e.target.value)}/>
                                            </div>
                                            <Button type="submit" className="w-full" disabled={isLoading}>
                                                {isLoading && <InlineLoader size="sm" className="mr-2" />}
                                                Log In
                                            </Button>
                                        </form>
                                    </TabsContent>
                                    <TabsContent value="signup" className="space-y-4 pt-4">
                                        <form onSubmit={handleSignup} className="space-y-4">
                                            <div className="relative">
                                                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                                <Input required placeholder="Username" className="pl-10" disabled={isLoading} value={username} onChange={e => setUsername(e.target.value)} />
                                            </div>
                                            <div className="relative">
                                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                                <Input required type="email" placeholder="Email" className="pl-10" disabled={isLoading} value={email} onChange={e => setEmail(e.target.value)} />
                                            </div>
                                            <div className="relative">
                                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                                <PasswordInput required placeholder="Password" className="pl-10" disabled={isLoading} value={password} onChange={e => setPassword(e.target.value)} />
                                            </div>
                                            <Button type="submit" className="w-full" disabled={isLoading}>
                                                {isLoading && <InlineLoader size="sm" className="mr-2" />}
                                                Create Account
                                            </Button>
                                        </form>
                                    </TabsContent>
                                </Tabs>

                                {/* TODO: Temporarily commented out social login - will implement later */}
                                {/*
                                <div className="relative my-4">
                                    <div className="absolute inset-0 flex items-center">
                                        <span className="w-full border-t" />
                                    </div>
                                    <div className="relative flex justify-center text-xs uppercase">
                                        <span className="bg-card px-2 text-muted-foreground">
                                            Or continue with
                                        </span>
                                    </div>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-4">
                                    <Button variant="outline" disabled={isLoading}>
                                        <GoogleIcon />
                                        <span className="ml-2">Google</span>
                                    </Button>
                                    <Button variant="outline" disabled={isLoading}>
                                        <AppleIcon />
                                        <span className="ml-2">Apple</span>
                                    </Button>
                                </div>
                                */}
                            </CardContent>
                        </Card>
                    </ShineBorder>
                </div>
            </div>

            {/* Firebase test component - only renders on client side */}
            <div className="hidden md:block mt-8 w-full max-w-[500px]">
                <FirebaseTestComponent />
            </div>
        </div>
    );
}
