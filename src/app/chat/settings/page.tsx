"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Palette, BellRing, UserCog, ShieldAlert, Trash2, LogOut } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { ChangePasswordForm } from '@/components/settings/ChangePasswordForm';


export default function SettingsPage() {
  const { user: authUser, updateUser: updateAuthUser } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [showPlaying, setShowPlaying] = useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  
  useEffect(() => {
    if (authUser) {
        setShowPlaying(authUser.showCurrentlyPlaying ?? true);
    }
  }, [authUser]);

  const handleShowPlayingToggle = (checked: boolean) => {
    if (!authUser) return;
    setShowPlaying(checked);
    // updateAuthUser now handles persisting the change to the backend
    updateAuthUser({ showCurrentlyPlaying: checked });
    toast({
        title: "Profile Updated",
        description: `Currently playing status is now ${checked ? 'visible' : 'hidden'} on your profile.`
    });
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast({
        title: "Logging Out",
        description: "You have been successfully logged out.",
      });
      // The AuthContext will automatically handle state changes and redirects
      router.push('/');
    } catch (error) {
       toast({
        title: "Logout Failed",
        description: "Something went wrong while logging out.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteAccount = () => {
    toast({
      title: "Account Deletion Requested",
      description: "This is a mock action. Your account has not been deleted.",
      variant: "destructive"
    });
  };

  return (
    <div className="flex flex-col h-full max-w-3xl mx-auto p-2 sm:p-4 md:p-6 relative z-10">
      <div className="space-y-6 sm:space-y-8">
        <h1 className="font-headline text-2xl sm:text-3xl font-bold flex items-center">
          <UserCog className="mr-2 sm:mr-3 h-6 w-6 sm:h-8 sm:w-8 text-primary" /> Application Settings
        </h1>

        {/* <Card className="shadow-lg transition-all duration-200 ease-in-out hover:shadow-xl bg-card/80 dark:bg-card/70 backdrop-blur-sm">
          <CardHeader className="p-3 sm:p-4 md:p-6">
            <CardTitle className="flex items-center text-lg sm:text-xl"><Palette className="mr-2 h-4 w-4 sm:h-5 sm:w-5" /> Appearance</CardTitle>
            <CardDescription className="text-xs sm:text-sm">Customize the look and feel of the application.</CardDescription>
          </CardHeader>
          <CardContent className="p-3 sm:p-4 md:p-6 pt-0 space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="theme-toggle" className="text-sm sm:text-base">Dark/Light Mode</Label>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1 sm:mt-2">
              Choose between light, dark, or system default theme.
            </p>
          </CardContent>
        </Card> */}
        
        {/* <Card className="shadow-lg transition-all duration-200 ease-in-out hover:shadow-xl bg-card/80 dark:bg-card/70 backdrop-blur-sm">
            <CardHeader className="p-3 sm:p-4 md:p-6">
                <CardTitle className="flex items-center text-lg sm:text-xl"><UserCog className="mr-2 h-4 w-4 sm:h-5 sm:w-5" /> Profile Settings</CardTitle>
                <CardDescription className="text-xs sm:text-sm">Control what other users see on your profile.</CardDescription>
            </CardHeader>
            <CardContent className="p-3 sm:p-4 md:p-6 pt-0 space-y-4">
                {/* Show Currently Playing option removed */}
            {/* </CardContent>
        </Card> */}

        <Card className="shadow-lg transition-all duration-200 ease-in-out hover:shadow-xl bg-card/80 dark:bg-card/70 backdrop-blur-sm">
          <CardHeader className="p-3 sm:p-4 md:p-6">
            <CardTitle className="flex items-center text-lg sm:text-xl"><BellRing className="mr-2 h-4 w-4 sm:h-5 sm:w-5" /> Notification Preferences</CardTitle>
            <CardDescription className="text-xs sm:text-sm">Manage how you receive notifications.</CardDescription>
          </CardHeader>
          <CardContent className="p-3 sm:p-4 md:p-6 pt-0 space-y-4 sm:space-y-6">
            <div className="flex items-center justify-between">
              <Label htmlFor="email-notifications" className="text-sm sm:text-base">Email Notifications</Label>
              <Switch
                id="email-notifications"
                checked={emailNotifications}
                onCheckedChange={setEmailNotifications}
                aria-label="Toggle email notifications"
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="push-notifications" className="text-sm sm:text-base">Push Notifications</Label>
              <Switch
                id="push-notifications"
                checked={pushNotifications}
                onCheckedChange={setPushNotifications}
                aria-label="Toggle push notifications"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg transition-all duration-200 ease-in-out hover:shadow-xl bg-card/80 dark:bg-card/70 backdrop-blur-sm">
          <CardHeader className="p-3 sm:p-4 md:p-6">
            <CardTitle className="flex items-center text-lg sm:text-xl"><ShieldAlert className="mr-2 h-4 w-4 sm:h-5 sm:w-5" /> Account Management</CardTitle>
            <CardDescription className="text-xs sm:text-sm">Manage your account settings and data.</CardDescription>
          </CardHeader>
          <CardContent className="p-3 sm:p-4 md:p-6 pt-0 space-y-3 sm:space-y-4">
            <Button variant="outline" className="w-full sm:w-auto justify-start text-sm sm:text-base" onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" /> Log Out
            </Button>
            <p className="text-xs sm:text-sm text-muted-foreground">
              You will be returned to the login screen.
            </p>
            <Separator />
            <Button variant="outline" className="w-full sm:w-auto justify-start text-sm sm:text-base" onClick={() => setIsChangePasswordOpen(true)}>Change Password</Button>
            <p className="text-xs sm:text-sm text-muted-foreground">
              It's a good practice to use a strong, unique password.
            </p>
            <Separator />
            <AlertDialog open={isChangePasswordOpen} onOpenChange={setIsChangePasswordOpen}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Change Password</AlertDialogTitle>
                  <AlertDialogDescription>
                    Enter your current password and a new password to update your account password.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <ChangePasswordForm />
                <AlertDialogFooter>
                  <AlertDialogCancel onClick={() => setIsChangePasswordOpen(false)}>Cancel</AlertDialogCancel>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="w-full sm:w-auto justify-start text-sm sm:text-base">
                  <Trash2 className="mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" /> Delete Account
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete your
                    account and remove your data from our servers (mock action).
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDeleteAccount} className="bg-destructive hover:bg-destructive/90">
                    Yes, delete account
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Permanently delete your account and all associated data. This action is irreversible.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
