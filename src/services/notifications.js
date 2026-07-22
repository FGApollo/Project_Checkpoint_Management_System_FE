import api from './api';

const notificationService = {
  async getLatest(take = 20) {
    const response = await api.get('/notifications', { params: { take } });
    return response.data;
  },

  async markRead(notificationId) {
    await api.patch(`/notifications/${notificationId}/read`);
  },

  async markAllRead() {
    const response = await api.patch('/notifications/read-all');
    return response.data;
  },
};

export default notificationService;
