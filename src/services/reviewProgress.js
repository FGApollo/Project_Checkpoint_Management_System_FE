import * as signalR from '@microsoft/signalr';
import { REVIEW_PROGRESS_HUB_URL } from '../config/environment';

class ReviewProgressService {
  connection = null;
  startPromise = null;
  room = null;
  commentListeners = new Set();
  statusListeners = new Set();

  subscribe(listener) {
    this.commentListeners.add(listener);
    return () => this.commentListeners.delete(listener);
  }

  subscribeStatus(listener) {
    this.statusListeners.add(listener);
    listener(this.connection?.state === signalR.HubConnectionState.Connected ? 'connected' : 'offline');
    return () => this.statusListeners.delete(listener);
  }

  emitStatus(status) {
    this.statusListeners.forEach((listener) => listener(status));
  }

  async ensureConnected() {
    if (this.connection?.state === signalR.HubConnectionState.Connected) return;
    if (this.startPromise) return this.startPromise;

    const token = localStorage.getItem('cpms_access_token');
    if (!token) throw new Error('Missing access token.');

    if (!this.connection) {
      this.connection = new signalR.HubConnectionBuilder()
        .withUrl(REVIEW_PROGRESS_HUB_URL, {
          accessTokenFactory: () => localStorage.getItem('cpms_access_token') || ''
        })
        .withAutomaticReconnect([0, 2000, 5000, 10000])
        .configureLogging(signalR.LogLevel.Error)
        .build();

      this.connection.on('reviewProgressCommentAdded', (comment) => {
        this.commentListeners.forEach((listener) => listener(comment));
      });
      this.connection.onreconnecting(() => this.emitStatus('connecting'));
      this.connection.onreconnected(async () => {
        this.emitStatus('connected');
        if (this.room) {
          await this.connection.invoke('JoinReviewProgress', this.room.sessionId, this.room.groupId)
            .catch(() => this.emitStatus('offline'));
        }
      });
      this.connection.onclose(() => this.emitStatus('offline'));
    }

    if (this.connection.state !== signalR.HubConnectionState.Disconnected) {
      throw new Error('Review progress connection is reconnecting.');
    }
    this.emitStatus('connecting');
    this.startPromise = this.connection.start()
      .then(() => this.emitStatus('connected'))
      .finally(() => { this.startPromise = null; });
    return this.startPromise;
  }

  async join(sessionId, groupId) {
    const nextRoom = { sessionId: Number(sessionId), groupId: Number(groupId) };
    const previousRoom = this.room;
    this.room = nextRoom;
    await this.ensureConnected();

    if (previousRoom &&
        (previousRoom.sessionId !== nextRoom.sessionId || previousRoom.groupId !== nextRoom.groupId)) {
      await this.connection.invoke(
        'LeaveReviewProgress', previousRoom.sessionId, previousRoom.groupId
      ).catch(() => {});
    }

    await this.connection.invoke('JoinReviewProgress', nextRoom.sessionId, nextRoom.groupId);
    this.emitStatus('connected');
  }

  async leave(sessionId, groupId) {
    const room = { sessionId: Number(sessionId), groupId: Number(groupId) };
    if (this.connection?.state === signalR.HubConnectionState.Connected) {
      await this.connection.invoke('LeaveReviewProgress', room.sessionId, room.groupId).catch(() => {});
    }
    if (this.room?.sessionId === room.sessionId && this.room?.groupId === room.groupId) {
      this.room = null;
    }
  }

  async stop() {
    this.room = null;
    if (this.connection) await this.connection.stop().catch(() => {});
    this.connection = null;
    this.startPromise = null;
    this.emitStatus('offline');
  }
}

export default new ReviewProgressService();
