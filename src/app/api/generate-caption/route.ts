import { NextRequest, NextResponse } from 'next/server';
import { generatePostCaption, type GenerateCaptionInput } from '@/ai/flows/generate-caption-flow';

export async function POST(request: NextRequest) {
  try {
    const body: GenerateCaptionInput = await request.json();
    
    if (!body.media || body.media.length === 0) {
      return NextResponse.json(
        { error: 'Media is required' },
        { status: 400 }
      );
    }

    const result = await generatePostCaption(body);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error generating caption:', error);
    return NextResponse.json(
      { error: 'Failed to generate caption' },
      { status: 500 }
    );
  }
} 