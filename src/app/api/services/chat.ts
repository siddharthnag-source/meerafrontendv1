import {
  ChatHistoryResponse,
  ChatMessageFromServer,
  ChatMessageResponse,
  SaveInteractionPayload,
} from '@/types/chat';
import { api } from '../client';
import { API_ENDPOINTS } from '../config';

// Supabase Edge Function endpoint for the `chat` function
const SUPABASE_CHAT_URL =
  process.env.NEXT_PUBLIC_SUPABASE_CHAT_URL ??
  'https://xilapyewazpzlvqbbtgl.supabase.co/functions/v1/chat';

export class SessionExpiredError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SessionExpiredError';
  }
}

export class ApiError extends Error {
  status: number;
  body: { detail?: string; error?: string };

  constructor(message: string, status: number, body: { detail?: string; error?: string }) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.body = body;
  }
}

// Small helper to build a ChatMessageResponse in the exact shape the UI expects
function buildAssistantResponse(text: string): ChatMessageResponse {
  const assistantMessage: ChatMessageFromServer = {
    message_id: crypto.randomUUID(),
    content_type: 'assistant',
    content: text,
    timestamp: new Date().toISOString(),
    attachments: [],
    is_call: false,
    failed: false,
  };

  const chatResponse: ChatMessageResponse = {
    message: 'ok',
    data: {
      // `response` + single `message` object; matches ChatMessageResponseData
      response: text,
      message: assistantMessage,
    } as ChatMessageResponse['data'],
  };

  return chatResponse;
}

export const chatService = {
  // Stub chat history so UI can render without backend history API
  async getChatHistory(page: number = 1): Promise<ChatHistoryResponse> {
    void page; // avoid unused-var lint

    const emptyHistory: ChatHistoryResponse = {
      message: 'ok',
      data: [],
    };

    return emptyHistory;
  },

  // Non-streaming sendMessage that calls Supabase Edge Function
  async sendMessage(formData: FormData): Promise<ChatMessageResponse> {
    const message = (formData.get('message') as string) || '';

    // If somehow we don't have a message, still reply gracefully
    if (!message.trim()) {
      return buildAssistantResponse('Meera heard an empty message.');
    }

    try {
      const response = await fetch(SUPABASE_CHAT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message }),
      });

      if (!response.ok) {
        // Try to read error body, but never throw up to the UI
        const errorBody = (await response.json().catch(() => ({}))) as {
          error?: string;
          detail?: string;
        };

        console.error('Supabase chat error:', response.status, errorBody);

        const text =
          errorBody.error ||
          errorBody.detail ||
          'Meera could not reach the backend right now. Please try again.';

        return buildAssistantResponse(text);
      }

      const body = (await response.json().catch(() => ({}))) as { reply?: string };

      const replyText = body.reply || 'Meera heard you, but the reply was empty.';
      return buildAssistantResponse(replyText);
    } catch (error) {
      console.error('Error in sendMessage (network / CORS / unknown):', error);

      // Final safety net: never throw, always return a graceful message
      return buildAssistantResponse(
        'Meera ran into a technical issue while replying. Please try again in a moment.',
      );
    }
  },
};

export const saveInteraction = (payload: SaveInteractionPayload) => {
  return api.post(API_ENDPOINTS.CALL.SAVE_INTERACTION, payload);
};
