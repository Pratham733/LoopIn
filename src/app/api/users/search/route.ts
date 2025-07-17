import { NextRequest, NextResponse } from 'next/server';
import { searchUsersByUsername } from '@/services/userService';

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const q = url.searchParams.get('q') || '';
    const excludeIds = url.searchParams.get('exclude') || '';
    const limitParam = url.searchParams.get('limit');
    
    const limit = limitParam ? parseInt(limitParam, 10) : 10;
    const excludeArray = excludeIds ? excludeIds.split(',') : [];

    if (!q || q.length < 2) {
      return NextResponse.json({ users: [] });
    }    const users = await searchUsersByUsername(q, limit, excludeArray);
      // Return basic user info without sensitive data
    const safeUsers = users.map(user => ({
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      fullName: user.fullName,
      profileImage: user.profileImage,
      avatar: user.avatar,
      status: user.status,
      bio: user.bio,
      isPrivate: user.isPrivate,
      email: user.email
    }));

    return NextResponse.json({ users: safeUsers });
  } catch (error: any) {
    console.error('Error searching users:', error);
    return NextResponse.json(
      { error: 'Failed to search users', details: error.message },
      { status: 500 }
    );
  }
}
