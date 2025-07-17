"use client";
import { Providers } from '@/components/Providers';
import { Toaster } from '@/components/ui/toaster';
import StatusComponents from '@/components/common/StatusComponents';
import dynamic from 'next/dynamic';
import React, { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { flushOfflineQueue, getOfflineQueue } from '@/lib/offlineQueue';
import { useToast } from '@/hooks/use-toast';
import { sendMessage, createConversation } from '@/services/conversationService';

const ParticlesPortal = dynamic(() => import('@/components/ParticlesPortal'), { ssr: false });

// Dual-ring loader component
function GlobalRouteLoader({ loading }: { loading: boolean }) {
  if (!loading) return null;
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/30 pointer-events-none transition-opacity duration-300">
      <div className="flex-col gap-4 w-full flex items-center justify-center">
        <div
          className="w-20 h-20 border-4 border-transparent text-blue-400 text-4xl animate-spin flex items-center justify-center border-t-blue-400 rounded-full"
        >
          <div
            className="w-16 h-16 border-4 border-transparent text-red-400 text-2xl animate-spin flex items-center justify-center border-t-red-400 rounded-full"
          ></div>
        </div>
      </div>
    </div>
  );
}

export default function ClientRoot({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const pathname = usePathname();
  const { toast } = useToast();

  // Track route changes
  useEffect(() => {
    if (!mounted) return;
    setLoading(true);
    // Simulate a short delay to show loader (replace with actual loading detection if possible)
    const timeout = setTimeout(() => setLoading(false), 600);
    return () => clearTimeout(timeout);
  }, [pathname, mounted]);

  useEffect(() => setMounted(true), []);

  // Flush offline queue when back online
  useEffect(() => {
    const handleOnline = () => {
      flushOfflineQueue({
        sendMessage: async (payload) => {
          await sendMessage(
            payload.conversationId,
            payload.senderId,
            payload.content,
            payload.messageType
          );
          toast({
            title: 'Message Sent',
            description: 'Your offline message was sent.',
          });
        },
        createConversation: async (payload) => {
          await createConversation(
            payload.participantIds || payload.participants,
            payload.isGroup || payload.type === 'group',
            payload.groupName || payload.name
          );
          toast({
            title: 'Conversation Created',
            description: 'Your offline conversation was created.',
          });
        },
      });
    };
    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [toast]);

  // Show toast if there are queued messages
  useEffect(() => {
    const queue = getOfflineQueue();
    if (queue.length > 0) {
      toast({
        title: 'Offline',
        description: 'Some messages or conversations are queued and will be sent when you are back online.',
        variant: 'default',
        duration: 5000,
      });
    }
  }, [toast]);

  return (
    <>
      <GlobalRouteLoader loading={loading} />
      {mounted && <ParticlesPortal />}
      <div style={{ position: 'relative', zIndex: 1, minHeight: '100vh' }}>
        <Providers>
          {children}
          <Toaster />
          {/* Add emulator status indicator */}
          <StatusComponents />
        </Providers>
      </div>
    </>
  );
} 