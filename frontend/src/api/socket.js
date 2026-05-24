import { io } from 'socket.io-client';
import { baseURL } from './client';
import { getAccessToken } from '../features/auth/authStorage';

let pickupSocket = null;

export async function connectPickupSocket() {
  if (pickupSocket?.connected) {
    return pickupSocket;
  }

  const token = await getAccessToken();

  if (!token) {
    return null;
  }

  pickupSocket = io(baseURL, {
    transports: ['websocket'],
    auth: { token },
    reconnection: true,
    reconnectionAttempts: 5,
  });

  return pickupSocket;
}

export function disconnectPickupSocket() {
  if (pickupSocket) {
    pickupSocket.disconnect();
    pickupSocket = null;
  }
}
