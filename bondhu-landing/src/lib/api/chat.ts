/**
 * Chat API Client for Bondhu AI
 * Handles communication with the FastAPI backend for chat functionality
 */

// Resolve API base URL with a fallback that works both server- and client-side.
// If NEXT_PUBLIC_API_URL is provided (recommended), use it. Otherwise, when
// running in the browser derive the host from window.location and assume the
// backend is exposed on port 8000 (the common docker-compose mapping). On the
// server (build/SSG) fall back to localhost:8000.
const API_BASE_URL = (() => {
  if (process.env.NEXT_PUBLIC_API_URL) return process.env.NEXT_PUBLIC_API_URL;
  if (typeof window !== 'undefined') {
    // Derive origin from current host and assume API on port 8000.
    const port = 8000;
    return `${window.location.protocol}//${window.location.hostname}:${port}`;
  }
  return 'http://localhost:8000';
})();

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  id?: string;
}

export interface ChatRequest {
  user_id: string;
  message: string;
  session_id?: string; // Optional session ID for conversation continuity
}

export interface ChatResponse {
  response: string;
  has_personality_context: boolean;
  timestamp: string;
  message_id?: string;
}

export interface ChatHistoryItem {
  id: string;
  message: string;
  response: string;
  has_personality_context: boolean;
  created_at: string;
}

export interface ChatHistoryResponse {
  messages: ChatHistoryItem[];
  total: number;
  user_id: string;
}

/**
 * Generate a new session ID for a chat conversation
 */
export function generateSessionId(): string {
  return crypto.randomUUID();
}

/**
 * Chat API service
 */
export const chatApi = {
  /**
   * Send a chat message and get AI response
   */
  sendMessage: async (userId: string, message: string, sessionId?: string): Promise<ChatResponse> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/chat/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId,
          message: message,
          session_id: sessionId, // Include session_id for conversation continuity
        } as ChatRequest),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
        throw new Error(error.detail || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data: ChatResponse = await response.json();
      return data;
    } catch (error) {
      console.error('Chat API Error:', error);
      throw error;
    }
  },

  /**
   * Get chat history for a user
   */
  getChatHistory: async (
    userId: string,
    limit: number = 20,
    offset: number = 0,
    bustCache: boolean = false
  ): Promise<ChatHistoryResponse> => {
    try {
      // Add timestamp to bust cache after sending new messages
      const cacheBuster = bustCache ? `&_t=${Date.now()}` : '';
      const response = await fetch(
        `${API_BASE_URL}/api/v1/chat/history/${userId}?limit=${limit}&offset=${offset}${cacheBuster}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch chat history: ${response.statusText}`);
      }

      const data: ChatHistoryResponse = await response.json();
      return data;
    } catch (error) {
      console.error('Chat History API Error:', error);
      throw error;
    }
  },

  /**
   * Clear all chat history for a user
   */
  clearChatHistory: async (userId: string): Promise<void> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/chat/history/${userId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to clear chat history: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Clear Chat History API Error:', error);
      throw error;
    }
  },

  /**
   * Search chat history for a user
   */
  searchChatHistory: async (
    userId: string,
    query: string,
    limit: number = 20
  ): Promise<ChatHistoryResponse> => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/v1/chat/search/${userId}?q=${encodeURIComponent(query)}&limit=${limit}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to search chat history: ${response.statusText}`);
      }

      const data: ChatHistoryResponse = await response.json();
      return data;
    } catch (error) {
      console.error('Search Chat History API Error:', error);
      throw error;
    }
  },

  /**
   * Check chat service health
   */
  healthCheck: async (): Promise<{ status: string; service: string; model: string }> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/chat/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Chat service unhealthy');
      }

      return await response.json();
    } catch (error) {
      console.error('Chat Health Check Error:', error);
      throw error;
    }
  },

  /**
   * Convert ChatHistoryItem to ChatMessage format
   */
  convertHistoryToMessages: (history: ChatHistoryItem[]): ChatMessage[] => {
    const messages: ChatMessage[] = [];

    history.forEach((item) => {
      // User message
      messages.push({
        role: 'user',
        content: item.message,
        timestamp: new Date(item.created_at),
        id: `${item.id}-user`,
      });

      // Assistant response
      messages.push({
        role: 'assistant',
        content: item.response,
        timestamp: new Date(item.created_at),
        id: `${item.id}-assistant`,
      });
    });

    return messages;
  },
};

/**
 * Error types for better error handling
 */
export class ChatAPIError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public details?: any
  ) {
    super(message);
    this.name = 'ChatAPIError';
  }
}
