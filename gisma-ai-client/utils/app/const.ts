export const DEFAULT_SYSTEM_PROMPT =
  process.env.DEFAULT_SYSTEM_PROMPT || "You are a helpful AI assistant with access to a knowledge base. Use the available information to provide accurate and helpful responses. Follow the user's instructions carefully. Respond using markdown.";

export const GISMA_COPILOT_HOST =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
