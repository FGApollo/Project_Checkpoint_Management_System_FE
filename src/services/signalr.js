import * as signalR from '@microsoft/signalr';
import { DEFENSE_HUB_URL } from '../config/environment';

export const REALTIME_REQUEST_TIMEOUT_MS = 30_000;

const withDeadline = (promise, message) => new Promise((resolve, reject) => {
  const timer = window.setTimeout(
    () => reject(new Error(message)),
    REALTIME_REQUEST_TIMEOUT_MS,
  );
  promise.then(resolve, reject).finally(() => window.clearTimeout(timer));
});

class SignalRService {
  connection = null;

  callbacks = {
    memberJoined: [],
    defenseSessionStarted: [],
    defenseSessionClosed: [],
    scoreSubmitted: [],
    defenseSessionState: [],
  };

  async startConnection() {
    if (this.connection && this.connection.state === signalR.HubConnectionState.Connected) {
      return this.connection;
    }

    const token = localStorage.getItem('cpms_access_token');
    if (!token) {
      throw new Error('Authentication required to connect to defense scoring hub.');
    }

    this.connection = new signalR.HubConnectionBuilder()
      .withUrl(DEFENSE_HUB_URL, {
        accessTokenFactory: () => localStorage.getItem('cpms_access_token') || '',
        skipNegotiation: false,
        transport: signalR.HttpTransportType.WebSockets | signalR.HttpTransportType.LongPolling,
        timeout: REALTIME_REQUEST_TIMEOUT_MS,
      })
      .withAutomaticReconnect([0, 2000, 5000, 10000])
      .configureLogging(signalR.LogLevel.Warning)
      .build();

    // Register Hub event listeners
    this.connection.on('memberJoined', (data) => {
      this.callbacks.memberJoined.forEach((cb) => cb(data));
    });

    this.connection.on('defenseSessionStarted', (data) => {
      this.callbacks.defenseSessionStarted.forEach((cb) => cb(data));
    });

    this.connection.on('defenseSessionClosed', (data) => {
      this.callbacks.defenseSessionClosed.forEach((cb) => cb(data));
    });

    this.connection.on('scoreSubmitted', (data) => {
      this.callbacks.scoreSubmitted.forEach((cb) => cb(data));
    });

    this.connection.on('defenseSessionState', (data) => {
      this.callbacks.defenseSessionState.forEach((cb) => cb(data));
    });

    try {
      await withDeadline(
        this.connection.start(),
        'Defense scoring connection timed out.',
      );
      console.log('Connected to Defense Scoring Hub successfully.');
      return this.connection;
    } catch (err) {
      await this.connection?.stop().catch(() => {});
      this.connection = null;
      console.error('Error connecting to Defense Scoring Hub:', err);
      throw err;
    }
  }

  async joinSession(sessionId) {
    if (!this.connection || this.connection.state !== signalR.HubConnectionState.Connected) {
      await this.startConnection();
    }
    await withDeadline(
      this.connection.invoke('JoinDefenseSession', Number(sessionId)),
      'Joining the defense session timed out.',
    );
  }

  on(event, callback) {
    if (this.callbacks[event]) {
      this.callbacks[event].push(callback);
    }
  }

  off(event, callback) {
    if (this.callbacks[event]) {
      this.callbacks[event] = this.callbacks[event].filter((cb) => cb !== callback);
    }
  }

  async stopConnection() {
    if (this.connection) {
      try {
        await this.connection.stop();
        console.log('Disconnected from Defense Scoring Hub.');
      } catch (err) {
        console.error('Error stopping SignalR connection:', err);
      } finally {
        this.connection = null;
      }
    }
  }
}

const signalRService = new SignalRService();
export default signalRService;
