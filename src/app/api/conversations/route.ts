import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase/client';
import { collection, query, where, getDocs, orderBy, doc, setDoc } from 'firebase/firestore';
import ensureFirebaseAdmin from '@/lib/firebase/ensure-admin';

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }
      // Query Firestore for conversations
    const conversationsRef = collection(db, 'conversations');
    const q = query(
      conversationsRef, 
      where('participantIds', 'array-contains', userId),
      orderBy('updatedAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const conversations: Array<{id: string; [key: string]: any}> = [];
    
    querySnapshot.forEach((doc) => {
      conversations.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return NextResponse.json(conversations, { status: 200 });
  } catch (error) {
    console.error('Error fetching conversations:', error);
    return NextResponse.json({ error: 'Failed to fetch conversations' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { participantIds, type, name, avatar, createdBy } = body;
    
    if (!participantIds || !Array.isArray(participantIds) || participantIds.length === 0) {
      return NextResponse.json({ error: 'Participant IDs are required' }, { status: 400 });
    }
    
    if (!type || !['direct', 'group'].includes(type)) {
      return NextResponse.json({ error: 'Valid type (direct or group) is required' }, { status: 400 });
    }
    
    if (type === 'group' && !name) {
      return NextResponse.json({ error: 'Name is required for group conversations' }, { status: 400 });
    }
    
    // For direct conversations, check if one already exists
    if (type === 'direct' && participantIds.length === 2) {
      // Query for existing direct conversation between these participants
      const conversationsRef = collection(db, 'conversations');
      const q1 = query(
        conversationsRef,
        where('type', '==', 'direct'),
        where('participantIds', 'array-contains', participantIds[0])
      );
      
      const querySnapshot = await getDocs(q1);
      let existingConvo: { id: string; [key: string]: any } | null = null;
      
      // Manually check for both participants since Firestore can't do multiple array-contains queries
      querySnapshot.forEach((doc) => {
        const convo = doc.data();
        if (convo.participantIds.includes(participantIds[1])) {
          existingConvo = { id: doc.id, ...convo };
        }
      });
      
      if (existingConvo) {
        return NextResponse.json(existingConvo, { status: 200 });
      }
    }
    
    // Create new conversation document
    const newConversationRef = doc(collection(db, 'conversations'));
    const conversationData = {
      type,
      participantIds,
      name: type === 'group' ? name : undefined,
      avatar: type === 'group' ? avatar : undefined,
      createdBy: createdBy || participantIds[0],
      admins: type === 'group' ? [createdBy || participantIds[0]] : [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    await setDoc(newConversationRef, conversationData);
    
    const newConversation = {
      id: newConversationRef.id,
      ...conversationData
    };
    
    return NextResponse.json(newConversation, { status: 201 });
  } catch (error) {
    console.error('Error creating conversation:', error);
    return NextResponse.json({ error: 'Failed to create conversation' }, { status: 500 });
  }
}
