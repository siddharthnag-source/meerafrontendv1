import { NextResponse } from 'next/server';

const SLACK_ERROR_LOG_WEBHOOK_URL = process.env.SLACK_ERROR_LOG_WEBHOOK_URL;

interface SlackPayload {
  text: string;
}

interface ErrorLogPayload {
  message?: string;
  endpoint?: string;
  requestPayload?: unknown;
  errorResponse?: unknown;
  status?: number;
  userEmail?: string | null;
  guestToken?: string | null;
}

export async function POST(request: Request) {
  if (!SLACK_ERROR_LOG_WEBHOOK_URL) {
    return NextResponse.json(
      {
        message: 'API call failed, Slack error log skipped (Error Log URL not configured).',
      },
      { status: 500 },
    );
  }

  try {
    const { message, endpoint, requestPayload, errorResponse, status, userEmail, guestToken }: ErrorLogPayload =
      await request.json();

    let detailedText = 'API Error Report:';

    if (message) {
      detailedText += `\n*Message:* ${message}`;
    }

    if (userEmail) {
      detailedText += `\n*User:* ${userEmail}`;
    } else if (guestToken) {
      detailedText += `\n*Guest Token:* ${guestToken}`;
    }

    if (endpoint) {
      detailedText += `\n*Endpoint:* ${endpoint}`;
    }

    if (status) {
      detailedText += `\n*Status Code:* ${status}`;
    }

    if (requestPayload) {
      detailedText += `\n*Request Payload:*\n\`\`\`\n${JSON.stringify(requestPayload, null, 2)}\n\`\`\``;
    }

    if (errorResponse) {
      try {
        // errorResponse is a JSON string, parse it first
        const parsedError = JSON.parse(errorResponse as string);
        if (parsedError.lastChunk) {
          detailedText += `\n*Last Chunk Received:*\n\`\`\`\n${JSON.stringify(parsedError.lastChunk, null, 2)}\n\`\`\``;
        } else {
          // Fallback for other types of errors
          detailedText += `\n*Backend Response:*\n\`\`\`\n${JSON.stringify(parsedError, null, 2)}\n\`\`\``;
        }
      } catch {

        // If parsing fails, it might be a simple string error
        detailedText += `\n*Backend Response:*\n\`\`\`\n${errorResponse}\n\`\`\``;
      }
    }

    const payload: SlackPayload = {
      text: detailedText,
    };

    const slackResponse = await fetch(SLACK_ERROR_LOG_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!slackResponse.ok) {
      return NextResponse.json({ message: 'Error logged, but failed to send to Slack' }, { status: 500 });
    }
    return NextResponse.json({ message: 'Error logged to Slack' }, { status: 200 });
  } catch {
    return NextResponse.json({ message: 'Internal server error while processing error log' }, { status: 500 });
  }
}
