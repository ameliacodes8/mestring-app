import axios from 'axios';
import { io, Socket } from 'socket.io-client';
import { useSupabase } from '../auth/SupabaseContext';

export function useApi() {
  const { session } = useSupabase();
  const token = session?.access_token;

  const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001',
    headers: token ? { Authorization: `Bearer ${token}` } : {}
  });

  return api;
}

let socket: Socket | null = null;
export function getSocket() {
  if (!socket) {
    socket = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001', {
      transports: ['websocket']
    });
  }
  return socket;
}