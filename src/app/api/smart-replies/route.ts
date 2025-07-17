import { NextRequest, NextResponse } from 'next/server';
import { generateSmartReplies, type SmartReplyInput } from '@/ai/flows/smart-reply-suggestions';

export async function POST(request: NextRequest) {
  try {
    const body: SmartReplyInput = await request.json();
    
    if (!body.message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    const result = await generateSmartReplies(body);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error generating smart replies:', error);
    return NextResponse.json(
      { error: 'Failed to generate smart replies' },
      { status: 500 }
    );
  }
} 