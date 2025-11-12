import { NextResponse } from 'next/server';

const SLACK_SUCCESS_LOG_WEBHOOK_URL = process.env.SLACK_SUCCESS_LOG_WEBHOOK_URL;

interface SlackPayload {
  text: string;
}

interface SuccessLogPayload {
  message: string;
  endpoint?: string;
  requestPayload?: unknown;
  successResponse?: unknown;
  userEmail?: string | null;
  guestToken?: string | null;
}

export async function POST(request: Request) {
  if (!SLACK_SUCCESS_LOG_WEBHOOK_URL) {
    return NextResponse.json(
      {
        message: 'API call failed, Slack success log skipped (Success Log URL not configured).',
      },
      { status: 500 },
    );
  }

  try {
    const { message, endpoint, requestPayload, successResponse, userEmail, guestToken }: SuccessLogPayload =
      await request.json();

    let detailedText = `✅ Success Alert: ${message}`;

    if (userEmail) {
      detailedText += `\n*User:* ${userEmail}`;
    } else if (guestToken) {
      detailedText += `\n*Guest Token:* ${guestToken}`;
    }

    if (endpoint) {
      detailedText += `\n*Endpoint:* ${endpoint}`;
    }

    if (requestPayload) {
      detailedText += `\n*Request Payload:*\n\`\`\`\n${JSON.stringify(requestPayload, null, 2)}\n\`\`\``;
    }

    if (successResponse) {
      detailedText += `\n*Success Response:*\n\`\`\`\n${JSON.stringify(successResponse, null, 2)}\n\`\`\``;
    }

    const payload: SlackPayload = {
      text: detailedText,
    };

    const slackResponse = await fetch(SLACK_SUCCESS_LOG_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!slackResponse.ok) {
      return NextResponse.json({ message: 'Success log failed to send to Slack' }, { status: 500 });
    }
    return NextResponse.json({ message: 'Success logged to Slack' }, { status: 200 });
  } catch {
    return NextResponse.json({ message: 'Internal server error while processing success log' }, { status: 500 });
  }
}
