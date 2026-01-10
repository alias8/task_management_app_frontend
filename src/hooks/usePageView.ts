import { useEffect } from 'react';
import axios from 'axios';

export const usePageView = () => {
  useEffect(() => {
    const recordPageView = async () => {
      try {
        const token = localStorage.getItem('token'); // or however you store JWT
        const headers = token ? { Authorization: `Bearer ${token}` } : {};

        await axios.post('http://your-backend-url/api/views', {}, { headers });
      } catch (error) {
        console.error('Failed to record page view:', error);
      }
    };

    void recordPageView();
  }, []);
};
