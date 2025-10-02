import { useAtom } from 'jotai';
import { useEffect } from 'react';
import { 
  analyticsAtom, 
  setAnalyticsLoadingAtom, 
  setAnalyticsDataAtom, 
  setAnalyticsErrorAtom,
  clearAnalyticsAtom,
  AnalyticsData 
} from '../stores/analytics.store';
import { analyticsService } from '../services/analytics.service';
import { authAtom } from '../stores/auth.store';

export function useAnalytics() {
  const [analyticsState, setAnalyticsState] = useAtom(analyticsAtom);
  const [, setLoading] = useAtom(setAnalyticsLoadingAtom);
  const [, setData] = useAtom(setAnalyticsDataAtom);
  const [, setError] = useAtom(setAnalyticsErrorAtom);
  const [, clearAnalytics] = useAtom(clearAnalyticsAtom);
  const [authState] = useAtom(authAtom);

  const fetchAnalytics = async () => {
    if (!authState.isAuthenticated || !authState.token) {
      console.log('Not authenticated, skipping analytics fetch');
      return;
    }

    try {
      setLoading(true);
      console.log('Fetching analytics data...');
      
      // Update token in service
      analyticsService.setToken(authState.token);
      
      const response = await analyticsService.getAnalytics();
      
      if (response.success && response.data) {
        console.log('Analytics data fetched successfully:', response.data);
        setData(response.data);
      } else {
        throw new Error(response.error || 'Failed to fetch analytics');
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch analytics');
    }
  };

  const refreshAnalytics = async () => {
    // Clear existing data and fetch fresh data
    clearAnalytics();
    await fetchAnalytics();
  };

  const testConnection = async () => {
    if (!authState.isAuthenticated || !authState.token) {
      throw new Error('Not authenticated');
    }

    try {
      analyticsService.setToken(authState.token);
      const response = await analyticsService.debugData();
      return response;
    } catch (error) {
      console.error('Error testing analytics connection:', error);
      throw error;
    }
  };

  // Auto-fetch analytics when authenticated - always fetch fresh data on visit
  useEffect(() => {
    if (authState.isAuthenticated && authState.token) {
      // Always fetch fresh data when the page is visited
      fetchAnalytics();
    }
  }, [authState.isAuthenticated, authState.token]);

  return {
    analyticsData: analyticsState.data,
    loading: analyticsState.loading,
    error: analyticsState.error,
    fetchAnalytics,
    refreshAnalytics,
    testConnection,
    hasFetchedAnalytics: !!analyticsState.data,
    lastFetched: analyticsState.lastFetched,
  };
}
