import apiClient from './api';

type pageName = 'login' | 'tasks';

class AnalyticsService {
  async trackPageView(pageName: pageName): Promise<void> {
    try {
      await apiClient.post('/api/views', { pageName });
    } catch (error) {
      console.error('Failed to record page view:', error);
    }
  }
}

export const analyticsService = new AnalyticsService();
