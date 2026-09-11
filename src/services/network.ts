import { NetworkStatus as AppNetworkStatus } from '../types/inspection';
import { Network } from '@capacitor/network';
import { Capacitor } from '@capacitor/core';

export type NetworkStatusCallback = (status: AppNetworkStatus) => void;

let listeners: Set<NetworkStatusCallback> = new Set();
let isOnline = navigator.onLine;

export async function initNetworkListener(): Promise<void> {
  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);

  if (Capacitor.isNativePlatform()) {
    const status = await Network.getStatus();
    isOnline = status.connected;
    Network.addListener('networkStatusChange', status => {
      isOnline = status.connected;
      notifyListeners(status.connectionType);
    });
  }
}

export function removeNetworkListener(): void {
  window.removeEventListener('online', handleOnline);
  window.removeEventListener('offline', handleOffline);
  if (Capacitor.isNativePlatform()) {
    Network.removeAllListeners();
  }
}

function handleOnline(): void {
  isOnline = true;
  notifyListeners();
}

function handleOffline(): void {
  isOnline = false;
  notifyListeners();
}

function notifyListeners(connectionType: string = 'unknown'): void {
  const status: AppNetworkStatus = {
    connected: isOnline,
    connectionType,
  };
  listeners.forEach((callback) => callback(status));
}

export function getNetworkStatus(): AppNetworkStatus {
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
