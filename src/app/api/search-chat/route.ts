import { NextRequest, NextResponse } from 'next/server';
import { searchChat, type SearchChatInput } from '@/ai/flows/search-chat-flow';

export async function POST(request: NextRequest) {
  try {
    const body: SearchChatInput = await request.json();
    
    if (!body.query || !body.messages) {
      return NextResponse.json(
        { error: 'Query and messages are required' },
        { status: 400 }
      );
    }

    const result = await searchChat(body);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error searching chat:', error);
    return NextResponse.json(
      { error: 'Failed to search chat' },
      { status: 500 }
    );
  }
} 