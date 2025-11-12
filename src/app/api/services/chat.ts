import { sendErrorToSlack } from '@/lib/slackService';
import { ChatHistoryResponse, ChatMessageResponse, SaveInteractionPayload } from '@/types/chat';
import { getSession, signOut } from 'next-auth/react';
import { api } from '../client';
import { API_BASE_URL, API_ENDPOINTS } from '../config';

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
  async getChatHistory(page: number = 1): Promise<ChatHistoryResponse> {
    try {
      return await api.get<ChatHistoryResponse>(`${API_ENDPOINTS.CHAT.HISTORY}?page=${page}`);
    } catch (error) {
      console.error('Error in getChatHistory:', error);
      throw error;
    }
  },

  async sendMessage(formData: FormData): Promise<ChatMessageResponse | Response> {
    const session = await getSession();
    const guest_token = localStorage.getItem('guest_token');

    if (session?.error === 'RefreshAccessTokenError') {
      localStorage.clear();
      signOut({ redirect: true, callbackUrl: '/sign-in' });
      throw new SessionExpiredError('Session expired. Please sign in again.');
    }

    try {
      const token = guest_token || session?.access_token;

      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.CHAT.MESSAGE}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        // If unauthorized, handle session expiration
        if (response.status === 401) {
          localStorage.clear();
          signOut({ redirect: true, callbackUrl: '/sign-in' });
          throw new SessionExpiredError('Session expired. Please sign in again.');
        }

        if (formData.get('streaming') === 'true' && response.body) {
          return response;
        }

        const errorBody = await response.json().catch(() => ({ detail: '' }));
        throw new ApiError(errorBody.detail || '', response.status, errorBody);
      }

      if (formData.get('streaming') === 'true' && response.body) {
        return response;
      }

      const data: ChatMessageResponse = await response.json();
      return data;
    } catch (error) {
      console.error('Error in sendMessage:', error);
      if (error instanceof TypeError && error.message === 'Failed to fetch') {
        const networkError = new Error('Network error. Please check your internet connection and try again.');
        networkError.name = 'NetworkError';
        throw networkError;
      }

      // Don't send 401 errors to Slack
      if (error instanceof ApiError && error.status === 401) {
        throw error;
      }

      // Don't send SessionExpiredError to Slack
      if (error instanceof SessionExpiredError) {
        throw error;
      }

      // Send the whole error object to Slack for other errors
      sendErrorToSlack({
        message: 'Error in sendMessage',
        endpoint: API_ENDPOINTS.CHAT.MESSAGE,
        errorResponse: error instanceof ApiError ? error.body : error,
        requestPayload: formData,
        status: error instanceof ApiError ? error.status : undefined,
        userEmail: session?.user?.email,
        guestToken: guest_token,
      });
      throw error;
    }
  },
};

export const saveInteraction = (payload: SaveInteractionPayload) => {
  return api.post(API_ENDPOINTS.CALL.SAVE_INTERACTION, payload);
};
