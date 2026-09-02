import { NetworkStatus } from '../types/inspection';

export type NetworkStatusCallback = (status: NetworkStatus) => void;

let listeners: Set<NetworkStatusCallback> = new Set();
let isOnline = navigator.onLine;

export function initNetworkListener(): void {
  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);
}

export function removeNetworkListener(): void {
  window.removeEventListener('online', handleOnline);
  window.removeEventListener('offline', handleOffline);
}

function handleOnline(): void {
  isOnline = true;
  notifyListeners();
}

function handleOffline(): void {
  isOnline = false;
  notifyListeners();
}

function notifyListeners(): void {
  const status: NetworkStatus = {
    connected: isOnline,
    connectionType: 'unknown',
  };
  listeners.forEach((callback) => callback(status));
}

export function getNetworkStatus(): NetworkStatus {
  return {
    connected: isOnline,
    connectionType: 'unknown',
  };
}

export function onNetworkStatusChange(callback: NetworkStatusCallback): () => void {
  listeners.add(callback);
  return () => {
    listeners.delete(callback);
  };
}

export function isNetworkConnected(): boolean {
  return isOnline;
}
