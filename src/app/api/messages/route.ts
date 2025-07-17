import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase/client';
import { collection, query, where, getDocs, doc, getDoc, orderBy, limit, setDoc, updateDoc } from 'firebase/firestore';
import ensureFirebaseAdmin from '@/lib/firebase/ensure-admin';

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const conversationId = url.searchParams.get('conversationId');
    const limitParam = parseInt(url.searchParams.get('limit') || '50');
    const before = url.searchParams.get('before');
    
    if (!conversationId) {
      return NextResponse.json({ error: 'Conversation ID is required' }, { status: 400 });
    }
    
    // Build query
    const messagesRef = collection(db, 'messages');
    let q;
    
    if (before) {
      const beforeMessageRef = doc(db, 'messages', before);
      const beforeMessageSnap = await getDoc(beforeMessageRef);
      
      if (beforeMessageSnap.exists()) {
        const beforeMessageData = beforeMessageSnap.data();
        
        q = query(
          messagesRef,
          where('conversationId', '==', conversationId),
          where('createdAt', '<', beforeMessageData.createdAt),
          orderBy('createdAt', 'desc'),
          limit(limitParam)
        );
      } else {
        q = query(
          messagesRef,
          where('conversationId', '==', conversationId),
          orderBy('createdAt', 'desc'),
          limit(limitParam)
        );
      }
    } else {
      q = query(
        messagesRef,
        where('conversationId', '==', conversationId),
        orderBy('createdAt', 'desc'),
        limit(limitParam)
      );
    }
    
    // Get messages
    const messagesSnapshot = await getDocs(q);
    const messages: Array<{id: string; sender?: any; [key: string]: any}> = [];
    
    messagesSnapshot.forEach(doc => {
      messages.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    // Get sender details for each message
    const populatedMessages = await Promise.all(
      messages.map(async (message) => {
        if (message.senderId) {
          const senderDoc = await getDoc(doc(db, 'users', message.senderId));
          if (senderDoc.exists()) {
            message.sender = {
              id: senderDoc.id,
              ...senderDoc.data()
            };
          }
        }
        return message;
      })
    );
    
    return NextResponse.json(populatedMessages.reverse(), { status: 200 });
  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { conversationId, senderId, content, attachments, replyTo } = body;
    
    if (!conversationId) {
      return NextResponse.json({ error: 'Conversation ID is required' }, { status: 400 });
    }
    
    if (!senderId) {
      return NextResponse.json({ error: 'Sender ID is required' }, { status: 400 });
    }
    
    if (!content && (!attachments || attachments.length === 0)) {
      return NextResponse.json({ error: 'Message must have content or attachments' }, { status: 400 });
    }
    
    // Check if conversation exists and user is a participant
    const conversationRef = doc(db, 'conversations', conversationId);
    const conversationSnap = await getDoc(conversationRef);
    
    if (!conversationSnap.exists()) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }
    
    const conversation = conversationSnap.data();
    if (!conversation.participantIds.includes(senderId)) {
      return NextResponse.json({ error: 'User is not a participant in this conversation' }, { status: 403 });
    }
    
    // Create message
    const newMessageRef = doc(collection(db, 'messages'));
    const now = new Date().toISOString();
    
    const messageData = {
      conversationId,
      senderId,
      content: content || '',
      attachments,
      replyTo,
      readBy: [senderId], // Mark as read by the sender
      createdAt: now,
      updatedAt: now
    };
    
    await setDoc(newMessageRef, messageData);
    
    // Update conversation with last message and timestamp
    await updateDoc(conversationRef, {
      lastMessage: newMessageRef.id,
      updatedAt: now
    });
    
    // Get sender info to include in response
    const senderRef = doc(db, 'users', senderId);
    const senderSnap = await getDoc(senderRef);
    let sender = null;
    
    if (senderSnap.exists()) {
      sender = {
        id: senderSnap.id,
        ...senderSnap.data()
      };
    }
    
    const populatedMessage = {
      id: newMessageRef.id,
      ...messageData,
      sender
    };
    
    return NextResponse.json(populatedMessage, { status: 201 });
  } catch (error) {
    console.error('Error creating message:', error);
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
  }
}
