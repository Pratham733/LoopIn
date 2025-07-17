import { NextRequest, NextResponse } from 'next/server';
import { sendWelcomeEmail, sendAdminNotification } from '@/services/emailService';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userEmail, username } = body;

    if (!userEmail || !username) {
      return NextResponse.json(
        { error: 'Missing required fields: userEmail and username' },
        { status: 400 }
      );
    }

    // Send welcome email to the user
    const welcomeEmailSent = await sendWelcomeEmail(userEmail, username);
    
    // Send admin notification
    const adminNotificationSent = await sendAdminNotification(userEmail, username);

    if (welcomeEmailSent) {
      console.log(`Welcome email sent successfully to ${userEmail}`);
    } else {
      console.warn(`Failed to send welcome email to ${userEmail}`);
    }

    if (adminNotificationSent) {
      console.log('Admin notification sent successfully');
    } else {
      console.warn('Failed to send admin notification');
    }

    return NextResponse.json({
      success: true,
      welcomeEmailSent,
      adminNotificationSent,
      message: 'Email processing completed'
    });

  } catch (error) {
    console.error('Error sending welcome email:', error);
    return NextResponse.json(
      { error: 'Failed to send welcome email' },
      { status: 500 }
    );
  }
} 