import { NextRequest, NextResponse } from 'next/server';
import { chatWithAssistant, type ChatbotInput } from '@/ai/flows/chatbot-flow';

export async function POST(request: NextRequest) {
  try {
    const body: ChatbotInput = await request.json();
    
    if (!body.userInput && !body.attachment) {
      return NextResponse.json(
        { error: 'User input or attachment is required' },
        { status: 400 }
      );
    }

    const result = await chatWithAssistant(body);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error chatting with assistant:', error);
    return NextResponse.json(
      { error: 'Failed to get assistant response' },
      { status: 500 }
    );
  }
} 