
"use client";

import Link from 'next/link';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { LogOut, Menu, Settings, UserCircle, Users } from 'lucide-react'; 
import { Logo } from '@/components/common/Logo';

import { useAuth } from '@/contexts/AuthContext';
import { USER_DROPDOWN_LINKS as staticUserDropdownLinks } from '@/lib/constants';
import { useSidebar, SidebarTrigger } from '@/components/ui/sidebar'; 
import { SearchInput } from '@/components/common/SearchInput';
import { NotificationBanner } from '@/components/common/NotificationBanner';

export default function AppHeader() {
  const { user } = useAuth();
  const { isMobile } = useSidebar(); 
  const [headerSearchTerm, setHeaderSearchTerm] = useState("");

  const userDropdownLinks = user 
    ? staticUserDropdownLinks.map(link => {
        if (link.label === "Profile") {
          return { ...link, href: `/chat/profile/${user.id}` };
        }
        return link;
      })
    : staticUserDropdownLinks;

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2">
          {isMobile && <SidebarTrigger asChild><Button variant="ghost" size="icon"><Menu /></Button></SidebarTrigger>}
          {!isMobile && <Logo />}
        </div>

        {isMobile && <div className="absolute left-1/2 -translate-x-1/2"><Logo size="small"/></div>}

        {!isMobile && (
          <div className="flex-1 max-w-md mx-4">
            <SearchInput
              value={headerSearchTerm}
              onChange={setHeaderSearchTerm}
              placeholder="Search..."
              inputClassName="h-9"
            />
          </div>
        )}

        <div className="flex items-center gap-2 sm:gap-4">
          <NotificationBanner />
          {user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                  <UserCircle className="h-9 w-9 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user.username}</p>
                    <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {userDropdownLinks.map((item) => (
                  <DropdownMenuItem key={item.label} asChild>
                    <Link href={item.href} className="flex items-center gap-2">
                      <item.icon className="h-4 w-4" />
                      {item.label}
                    </Link>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </header>
  );
}
