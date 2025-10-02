class AnalyticsService {
  private baseUrl: string;
  private token: string | null = null;

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    // Only access localStorage on client side
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('auth_token');
      console.log('Analytics service initialized with token:', this.token ? 'Present' : 'Not found');
    } else {
      this.token = null;
      console.log('Analytics service initialized on server side');
    }
  }

  setToken(token: string) {
    console.log('Analytics service setToken called with:', token ? 'Token present' : 'No token');
    this.token = token;
    // Only access localStorage on client side
    if (typeof window !== 'undefined') {
      localStorage.setItem('auth_token', token);
      console.log('Analytics service token updated');
    }
  }

  private getHeaders(): HeadersInit {
    console.log('Analytics service getHeaders called, token:', this.token ? 'Present' : 'Not found');
    if (!this.token) {
      throw new Error('No authentication token available');
    }

    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.token}`,
    };
  }

  async getAnalytics() {
    try {
      console.log('Fetching analytics data from:', `${this.baseUrl}/analytics`);
      const response = await fetch(`${this.baseUrl}/analytics`, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      console.log('Analytics response status:', response.status);
      console.log('Analytics response headers:', response.headers);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Analytics API error response:', errorText);
        throw new Error(`HTTP error! status: ${response.status}, response: ${errorText}`);
      }

      const data = await response.json();
      console.log('Analytics data received:', data);
      return data;
    } catch (error) {
      console.error('Error fetching analytics:', error);
      throw error;
    }
  }

  async testConnection() {
    try {
      console.log('Testing analytics connection...');
      const response = await fetch(`${this.baseUrl}/analytics/test`, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Analytics test response:', data);
      return data;
    } catch (error) {
      console.error('Error testing analytics connection:', error);
      throw error;
    }
  }

  async debugData() {
    try {
      console.log('Fetching debug data...');
      const response = await fetch(`${this.baseUrl}/analytics/debug`, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Analytics debug response:', data);
      return data;
    } catch (error) {
      console.error('Error fetching debug data:', error);
      throw error;
    }
  }
}

export const analyticsService = new AnalyticsService();
