
"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import type { MockUser, Conversation } from "@/types";
import Link from 'next/link';
import { UserPlus, UserCheck, MessageSquare, MoreVertical, Crown, Shield, UserX, UserCircle } from 'lucide-react';
import { cn } from "@/lib/utils";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Badge } from "../ui/badge";
import UserAvatar from '@/components/common/UserAvatar';

interface UserListModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  title: string;
  users: MockUser[];
  currentUser: MockUser | null;
  conversation?: Conversation | null;
  onFollowToggle: (targetUserId: string) => void;
  onRemoveUser?: (targetUserId: string) => void;
  onUpdateRole?: (targetUserId: string, newRole: 'admin' | 'coAdmin' | 'member') => void;
  onAddUsers?: () => void;
}

export function UserListModal({ 
  isOpen, 
  onOpenChange, 
  title, 
  users, 
  currentUser, 
  conversation,
  onFollowToggle,
  onRemoveUser,
  onUpdateRole,
  onAddUsers
}: UserListModalProps) {
  if (!currentUser) return null;

  const isGroup = !!conversation?.isGroup;
  const isAdmin = isGroup && !!conversation?.adminIds?.includes(currentUser.id);
  const isCoAdmin = isGroup && !!conversation?.coAdminIds?.includes(currentUser.id);
  
  const getUserRole = (userId: string): 'admin' | 'coAdmin' | 'member' => {
    if (!isGroup) return 'member';
    if (conversation?.adminIds?.includes(userId)) return 'admin';
    if (conversation?.coAdminIds?.includes(userId)) return 'coAdmin';
    return 'member';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] md:max-w-md max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-xl">{title}</DialogTitle>
          {users.length === 0 && <DialogDescription className="pt-2">No users to display.</DialogDescription>}
        </DialogHeader>
        {users.length > 0 && (
          <ScrollArea className="flex-grow pr-2 -mr-2">
            <div className="space-y-3 py-2">
              {users.map((user) => {
                const isFollowingThisUser = currentUser.following.includes(user.id);
                const isSelf = user.id === currentUser.id;
                const userRole = getUserRole(user.id);

                return (
                  <div key={user.id} className="flex items-center gap-3 p-2 rounded-md hover:bg-muted/50">
                    <Link href={`/chat/profile/${user.id}`} className="flex items-center gap-3 flex-grow" onClick={() => onOpenChange(false)}>
                      <UserAvatar user={user} size={40} className="h-10 w-10" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold truncate text-sm">{user.username}</p>
                          {userRole === 'admin' && <Badge variant="destructive" className="px-1.5 py-0 text-[0.6rem] h-auto"><Crown className="h-3 w-3 mr-1" />Admin</Badge>}
                          {userRole === 'coAdmin' && <Badge variant="secondary" className="px-1.5 py-0 text-[0.6rem] h-auto"><Shield className="h-3 w-3 mr-1" />Co-admin</Badge>}
                        </div>
                        <p className="text-xs text-muted-foreground truncate">{user.fullName || user.email}</p>
                      </div>
                    </Link>
                    <div className="flex items-center gap-1 shrink-0">
                      {!isSelf && (
                        <Button
                          variant={isFollowingThisUser ? "outline" : "default"}
                          size="sm"
                          onClick={() => onFollowToggle(user.id)}
                          className="px-2.5 py-1 h-auto text-xs"
                        >
                          {isFollowingThisUser ? <UserCheck className="mr-1 h-3.5 w-3.5" /> : <UserPlus className="mr-1 h-3.5 w-3.5" />}
                          {isFollowingThisUser ? "Following" : "Follow"}
                        </Button>
                      )}
                      
                      {isAdmin && !isSelf && onRemoveUser && onUpdateRole && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                             <Button variant="ghost" size="icon" className="h-7 w-7">
                                <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => onUpdateRole(user.id, userRole === 'admin' ? 'member' : 'admin')}>
                               <Crown className="mr-2 h-4 w-4"/> {userRole === 'admin' ? "Dismiss as Admin" : "Make Admin"}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onUpdateRole(user.id, userRole === 'coAdmin' ? 'member' : 'coAdmin')}>
                               <Shield className="mr-2 h-4 w-4"/> {userRole === 'coAdmin' ? "Dismiss as Co-admin" : "Make Co-admin"}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                             <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => onRemoveUser(user.id)}>
                                <UserX className="mr-2 h-4 w-4"/> Remove from Group
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}

                      {!isSelf && !isAdmin && (
                         <Button asChild variant="ghost" size="icon" className="h-7 w-7" onClick={() => onOpenChange(false)}>
                            <Link href={`/chat/conversations/new?userId=${user.id}`} aria-label={`Message ${user.username}`}>
                                <MessageSquare className="h-4 w-4 text-primary" />
                            </Link>
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}
         {(isAdmin || isCoAdmin) && onAddUsers && (
            <Button variant="outline" onClick={onAddUsers} className="mt-4">
              <UserPlus className="mr-2 h-4 w-4" /> Add Users
            </Button>
         )}
         <Button variant="outline" onClick={() => onOpenChange(false)} className="mt-2">
            Close
        </Button>
      </DialogContent>
    </Dialog>
  );
}
