"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { SIDEBAR_LINKS } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { getUnreadNotificationsCount } from '@/services/notificationService';
import { getUnreadMessagesCount } from '@/services/chatService';
import { getPendingFriendRequests } from '@/services/friendRequestService';
import {
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar,
} from '@/components/ui/sidebar';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '../ui/button';
import { Settings, SidebarClose } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Logo } from '../common/Logo'; 

// Initialize badge data state
const initialBadgeData = {
  unreadConversations: 0,
  unreadNotifications: 0,
  pendingRequests: 0,
};

export default function AppSidebarContent() {
  const { user, isLoading } = useAuth();
  const pathname = usePathname();
  const { isMobile, toggleSidebar } = useSidebar();
  const [badgeData, setBadgeData] = useState(initialBadgeData);
  // const [isPlayerOpen, setIsPlayerOpen] = useState(false);

  // Fetch badge counts when user changes
  useEffect(() => {
    async function fetchBadgeCounts() {
      if (user) {
        try {
          // Fetch all counts in parallel
          const [unreadMessages, unreadNotifications, pendingRequestsData] = await Promise.all([
            getUnreadMessagesCount(user.id),
            getUnreadNotificationsCount(user.id),
            getPendingFriendRequests(user.id)
          ]);
          
          setBadgeData({
            unreadConversations: unreadMessages,
            unreadNotifications: unreadNotifications,
            pendingRequests: pendingRequestsData.length
          });
          
          console.log("Badge counts updated:", { 
            unreadMessages, 
            unreadNotifications, 
            pendingRequests: pendingRequestsData.length 
          });
        } catch (error) {
          console.error("Error fetching badge counts:", error);
          // Reset to zero on error
          setBadgeData(initialBadgeData);
        }
      } else {
        // Reset when user is null
        setBadgeData(initialBadgeData);
      }
    }
    
    fetchBadgeCounts();
    
    // Set up a refresh interval (every 60 seconds)
    const intervalId = setInterval(fetchBadgeCounts, 60000);
    
    return () => clearInterval(intervalId);
  }, [user]); 


  return (
    <>
       <SidebarHeader>
        <div className="relative w-full h-full flex items-center justify-center group-hover/main-sidebar:justify-start">
          <span className="sidebar-logo-icon-style">
            <Logo size="small" iconOnly={true} />
          </span>
           <span className={cn(
            "sidebar-logo-title-style font-headline font-bold text-primary text-xl"
          )}>
            LoopIn
          </span>
        </div>
        {isMobile && (
            <Button variant="ghost" size="icon" onClick={toggleSidebar} className="absolute top-2 right-2 z-50">
                <SidebarClose className="h-6 w-6" />
                <span className="sr-only">Close sidebar</span>
            </Button>
        )}
      </SidebarHeader>
      
      <SidebarContent>
        {isLoading ? (
          <div className="space-y-2">
            {[...Array(7)].map((_, i) => (
               <Skeleton key={i} className="h-[50px] w-full rounded-md" />
            ))}
          </div>
        ) : user && (
          <SidebarMenu>
            {SIDEBAR_LINKS.map((link) => {
              let isActive = pathname === link.href || (link.href !== "/chat" && pathname.startsWith(link.href) && link.href !== "/chat/profile");
              
              if (link.label === "Profile" && user?.id) { 
                if (pathname === `/chat/profile/${user.id}` || pathname === "/chat/profile") {
                    isActive = true;
                } else if (pathname.startsWith("/chat/profile/")) {
                    isActive = false; 
                }
              }

              let badgeCount = 0;
              if (link.badgeKey) {
                  badgeCount = badgeData[link.badgeKey as keyof typeof badgeData] || 0;
              }
              
              let currentLinkHref = link.href;
              if (link.label === "Profile" && user?.id) {
                currentLinkHref = `/chat/profile/${user.id}`; 
              }

              return (
                <SidebarMenuItem key={link.label}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive}
                    tooltip={link.label} 
                    className={cn(isActive && "bg-sidebar-accent")}
                  >
                    <Link href={currentLinkHref}>
                      <span className="link-icon-style">
                        <link.icon className={cn("h-6 w-6", isActive && "stroke-[2.5px]")} />
                      </span>
                      <span className="link-title-style">
                        {link.label}
                      </span>
                      {badgeCount > 0 && (
                        <Badge variant="default" className="link-badge-style">
                          {badgeCount}
                        </Badge>
                      )}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
             <SidebarMenuItem>
                <SidebarMenuButton
                    asChild
                    isActive={pathname === '/chat/settings'}
                    tooltip="Settings"
                    className={cn(pathname === '/chat/settings' && "bg-sidebar-accent")}
                >
                    <Link href="/chat/settings">
                       <span className="link-icon-style">
                          <Settings className={cn("h-6 w-6", pathname === '/chat/settings' && "stroke-[2.5px]")} />
                       </span>
                       <span className="link-title-style">Settings</span>
                    </Link>
                </SidebarMenuButton>
            </SidebarMenuItem>
            {/* <SidebarMenuItem className="mt-auto pt-2 border-t border-sidebar-border">
              <div className="w-full flex flex-col gap-2">
                <SpotifyButton onClick={() => setIsPlayerOpen(true)} />
                <NewsButton />
              </div>
            </SidebarMenuItem> */}
          </SidebarMenu>
        )}
      </SidebarContent>
      {/* <SpotifyPlayerModal isOpen={isPlayerOpen} onOpenChange={setIsPlayerOpen} /> */}
    </>
  );
}
