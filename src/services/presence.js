import * as signalR from '@microsoft/signalr';
import { PRESENCE_HUB_URL } from '../config/environment';
import { uniquePresenceMembers } from './presenceUtils.js';

class PresenceService {
  connection = null;
  listeners = new Set();

  subscribe(listener) { this.listeners.add(listener); return () => this.listeners.delete(listener); }
  emit(members) {
    const uniqueMembers = uniquePresenceMembers(members);
    this.listeners.forEach((listener) => listener(uniqueMembers));
  }

  async start() {
    if (this.connection?.state === signalR.HubConnectionState.Connected) return;
    if (!localStorage.getItem('cpms_access_token')) return;
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
