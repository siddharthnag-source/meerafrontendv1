import {
  ChatHistoryResponse,
  ChatMessageResponse,
  SaveInteractionPayload,
  ChatMessageFromServer,
} from '@/types/chat';
import { api } from '../client';
import { API_ENDPOINTS } from '../config';

// Supabase Edge Function endpoint for the `chat` function
const SUPABASE_CHAT_URL =
  'https://xilapyewazpzlvqbbtgl.supabase.co/functions/v1/chat';

export class SessionExpiredError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SessionExpiredError';
  }
}

export class ApiError extends Error {
  status: number;
  body: { detail?: string };

  constructor(message: string, status: number, body: { detail?: string }) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.body = body;
  }
}

export const chatService = {
  /**
   * TEMP: no backend history yet, so just return an empty list.
   * This avoids hitting `localhost:8000` and breaking the UI.
   */
  async getChatHistory(page: number = 1): Promise<ChatHistoryResponse> {
    const emptyHistory = {
      message: 'ok',
      data: [],
    } as unknown as ChatHistoryResponse;

    return emptyHistory;
  },

  /**
   * Non-streaming sendMessage that calls the Supabase Edge Function
   * and adapts the reply into the shape the UI expects.
   */
  async sendMessage(
    formData: FormData,
  ): Promise<ChatMessageResponse | Response> {
    const message = (formData.get('message') as string) || '';

    try {
      const response = await fetch(SUPABASE_CHAT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message }),
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({ error: '' }));
        throw new ApiError(
          errorBody.error || 'Failed to get reply from Meera',
          response.status,
          errorBody,
        );
      }

      const body = (await response.json()) as { reply: string };

      // One assistant message in the format used by the UI
      const assistantMessage: ChatMessageFromServer = {
        message_id: crypto.randomUUID(),
        content_type: 'assistant',
        content: body.reply,
        timestamp: new Date().toISOString(),
        attachments: [],
        is_call: false,
        failed: false,
      };

      // Adapt to the ChatMessageResponse type that the UI uses
      const chatResponse = {
        message: 'ok',
        data: {
          // Most UI code reads `data.response` as ChatMessageFromServer[]
          response: [assistantMessage],
        },
      } as unknown as ChatMessageResponse;

      return chatResponse;
    } catch (error) {
      console.error('Error in sendMessage:', error);
      throw error;
    }
  },
};

export const saveInteraction = (payload: SaveInteractionPayload) => {
  // This still points to the old backend; it is only used for call sessions.
  // If you don’t use calls yet, this will simply never be hit.
  return api.post(API_ENDPOINTS.CALL.SAVE_INTERACTION, payload);
};
