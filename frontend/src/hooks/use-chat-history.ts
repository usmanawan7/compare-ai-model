import { useEffect } from 'react';
import { useAtom } from 'jotai';
import { authAtom } from '@/stores/auth.store';
import { 
  chatHistoryAtom, 
  setChatHistoryItemsAtom, 
  setChatHistoryLoadingAtom, 
  setChatHistoryErrorAtom,
  removeChatHistoryItemAtom,
  clearChatHistoryAtom
} from '@/stores/chat-history.store';
import { chatHistoryService, ChatHistoryItem } from '@/services/chat-history.service';

export function useChatHistory() {
  const [authState] = useAtom(authAtom);
  const [chatHistoryState, setChatHistoryState] = useAtom(chatHistoryAtom);
  const [, setChatHistoryItems] = useAtom(setChatHistoryItemsAtom);
  const [, setChatHistoryLoading] = useAtom(setChatHistoryLoadingAtom);
  const [, setChatHistoryError] = useAtom(setChatHistoryErrorAtom);
  const [, removeChatHistoryItem] = useAtom(removeChatHistoryItemAtom);
  const [, clearChatHistory] = useAtom(clearChatHistoryAtom);

  const fetchChatHistory = async () => {
    if (chatHistoryState.isLoading) return;
    
    // Check if user is authenticated
    const token = chatHistoryService.getToken();
    if (!token) {
      setChatHistoryError('User not authenticated');
      setChatHistoryLoading(false);
      return;
    }
    
    setChatHistoryLoading(true);
    setChatHistoryError(null);

    try {
      const items = await chatHistoryService.getHistory();
      setChatHistoryItems(items);
    } catch (error) {
      setChatHistoryError(error instanceof Error ? error.message : 'Failed to fetch chat history');
    } finally {
      setChatHistoryLoading(false);
    }
  };

  const deleteHistoryItem = async (itemId: string) => {
    try {
      await chatHistoryService.deleteHistoryItem(itemId);
      removeChatHistoryItem(itemId);
    } catch (error) {
      console.error('Failed to delete history item:', error);
      setChatHistoryError(error instanceof Error ? error.message : 'Failed to delete history item');
      throw error;
    }
  };

  const deleteAllHistory = async () => {
    try {
      await chatHistoryService.deleteAllHistory();
      clearChatHistory();
    } catch (error) {
      console.error('Failed to delete all history:', error);
      setChatHistoryError(error instanceof Error ? error.message : 'Failed to delete all history');
      throw error;
    }
  };

  const refreshChatHistory = async () => {
    // Clear existing data and fetch fresh data
    setChatHistoryItems([]);
    await fetchChatHistory();
  };

  const getHistoryItem = async (itemId: string): Promise<ChatHistoryItem> => {
    try {
      return await chatHistoryService.getHistoryItem(itemId);
    } catch (error) {
      console.error('Failed to fetch history item:', error);
      setChatHistoryError(error instanceof Error ? error.message : 'Failed to fetch history item');
      throw error;
    }
  };

  // Update token when auth state changes
  useEffect(() => {
    chatHistoryService.updateToken(authState.token);
  }, [authState.token]);

  // Auto-fetch on mount - always fetch fresh data when page is visited
  useEffect(() => {
    if (!chatHistoryState.isLoading && authState.isAuthenticated) {
      fetchChatHistory();
    }
  }, [authState.isAuthenticated]);

  return {
    chatHistory: chatHistoryState.items,
    isLoading: chatHistoryState.isLoading,
    error: chatHistoryState.error,
    hasFetched: chatHistoryState.hasFetched,
    fetchChatHistory,
    refreshChatHistory,
    deleteHistoryItem,
    deleteAllHistory,
    getHistoryItem,
  };
}
