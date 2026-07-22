import * as signalR from '@microsoft/signalr';
import { PRESENCE_HUB_URL } from '../config/environment';
import { uniquePresenceMembers } from './presenceUtils.js';

const hasUsableAccessToken = (token) => {
  if (!token) return false;
  try {
    const payload = JSON.parse(atob(token.split('.')[1].replaceAll('-', '+').replaceAll('_', '/')));
    return !payload.exp || payload.exp * 1000 > Date.now() + 5000;
  } catch {
    return false;
  }
};

class PresenceService {
  connection = null;
  listeners = new Set();

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('auth:token-refreshed', () => this.start());
      window.addEventListener('auth:unauthorized', () => this.stop());
    }
  }

  subscribe(listener) { this.listeners.add(listener); return () => this.listeners.delete(listener); }
  emit(members) {
    const uniqueMembers = uniquePresenceMembers(members);
    this.listeners.forEach((listener) => listener(uniqueMembers));
  }

  async start() {
    if (this.connection?.state === signalR.HubConnectionState.Connected) return;
    const accessToken = localStorage.getItem('cpms_access_token');
    // Do not negotiate with an expired token. The API interceptor will refresh
    // it through an authenticated request and emit auth:token-refreshed.
    if (!hasUsableAccessToken(accessToken)) return;
    this.connection = new signalR.HubConnectionBuilder()
      .withUrl(PRESENCE_HUB_URL, { accessTokenFactory: () => localStorage.getItem('cpms_access_token') || '' })
      .withAutomaticReconnect([0, 2000, 5000, 10000])
      .configureLogging(signalR.LogLevel.Error)
      .build();
    this.connection.on('presenceSnapshot', (members) => { this.currentMembers = members || []; this.emit(this.currentMembers); });
    this.connection.on('presenceChanged', ({ type, member }) => {
      const current = this.currentMembers || [];
      const next = type === 'joined'
        ? [...current.filter((item) => item.connectionId !== member.connectionId), member]
        : current.filter((item) => item.connectionId !== member.connectionId);
      this.currentMembers = next;
      this.emit(next);
    });
    this.connection.onclose(() => { this.currentMembers = []; this.emit([]); });
    try { await this.connection.start(); } catch { this.connection = null; this.emit([]); }
  }

  async stop() {
    if (this.connection) await this.connection.stop().catch(() => {});
    this.connection = null; this.currentMembers = []; this.emit([]);
  }
}

export default new PresenceService();
