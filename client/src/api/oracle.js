import axiosInstance from './axiosInstance.js';

/**
 * Creates a streaming response from the Oracle chat endpoint.
 * Uses fetch with ReadableStream since EventSource doesn't support POST.
 *
 * @param {{ message: string, history: Array, sessionId: string }} params
 * @returns {Promise<Response>} Raw fetch Response for the caller to stream
 */
export const createOracleEventSource = ({ message, history, sessionId }) => {
  return fetch('/api/oracle/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ message, history, sessionId }),
  });
};

export const saveOracleChat = async (sessionId, messages) => {
  const response = await axiosInstance.post('/oracle/save', { sessionId, messages });
  return response.data;
};
