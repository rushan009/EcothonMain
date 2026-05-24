import { io } from 'socket.io-client';
import { baseURL } from './client';
import { getAccessToken } from '../features/auth/authStorage';

let pickupSocket = null;
let pickupSocketPromise = null;

export async function connectPickupSocket() {
  if (pickupSocket?.connected) {
    return pickupSocket;
  }

  if (pickupSocketPromise) {
    return pickupSocketPromise;
  }

  pickupSocketPromise = (async () => {
    const token = await getAccessToken();

    if (!token) {
      pickupSocketPromise = null;
      return null;
    }

    pickupSocket = io(baseURL, {
      transports: ['websocket'],
      auth: { token },
      reconnection: true,
      reconnectionAttempts: 5,
    });

    if (pickupSocket.connected) {
      pickupSocketPromise = null;
      return pickupSocket;
    }

    try {
      await new Promise((resolve, reject) => {
        const onConnect = () => {
          cleanup();
          resolve();
        };
        const onError = (error) => {
          cleanup();
          reject(error);
        };
        const cleanup = () => {
          pickupSocket.off('connect', onConnect);
          pickupSocket.off('connect_error', onError);
        };

        pickupSocket.once('connect', onConnect);
        pickupSocket.once('connect_error', onError);
      });

      pickupSocketPromise = null;
      return pickupSocket;
    } catch (error) {
      pickupSocketPromise = null;
      pickupSocket = null;
      return null;
    }
  })();

  return pickupSocketPromise;
}

export function disconnectPickupSocket() {
  if (pickupSocket) {
    pickupSocket.disconnect();
    pickupSocket = null;
  }

  pickupSocketPromise = null;
}
