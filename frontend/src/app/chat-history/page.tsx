'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAtom } from 'jotai';
import { authAtom } from '@/stores/auth.store';
import { useChatHistory } from '@/hooks/use-chat-history';
import { ChatHistoryItemComponent } from '@/components/chat-history/chat-history-item';
import { ResultPopup } from '@/components/chat-history/result-popup';
import { DeleteConfirmationModal } from '@/components/chat-history/delete-confirmation-modal';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { ArrowLeft, History, Trash2, RefreshCw } from 'lucide-react';
import { ChatHistoryItem } from '@/services/chat-history.service';
import { AuthProvider } from '@/components/auth/auth-provider';

function ChatHistoryContent() {
  const [authState] = useAtom(authAtom);
  const router = useRouter();
  const { 
    chatHistory, 
    isLoading, 
    error, 
    hasFetched, 
    fetchChatHistory, 
    refreshChatHistory,
    deleteHistoryItem, 
    deleteAllHistory
  } = useChatHistory();

  const [selectedItem, setSelectedItem] = useState<ChatHistoryItem | null>(null);
  const [showResultPopup, setShowResultPopup] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDeleteAllModal, setShowDeleteAllModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Only redirect to login if we're sure the user is not authenticated
  // Wait for loading to complete and ensure we've checked localStorage
  useEffect(() => {
    if (!authState.isLoading && !authState.isAuthenticated) {
      router.push('/login');
    }
  }, [authState.isAuthenticated, authState.isLoading, router]);

  if (authState.isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading authentication...</p>
        </div>
      </div>
    );
  }

  const handleViewDetails = (item: ChatHistoryItem) => {
    setSelectedItem(item);
    setShowResultPopup(true);
  };

  const handleDelete = (itemId: string) => {
    setItemToDelete(itemId);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    
    setIsDeleting(true);
    try {
      await deleteHistoryItem(itemToDelete);
      setShowDeleteModal(false);
      setItemToDelete(null);
    } catch (error) {
      console.error('Failed to delete item:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteAll = () => {
    setShowDeleteAllModal(true);
  };

  const handleConfirmDeleteAll = async () => {
    setIsDeleting(true);
    try {
      await deleteAllHistory();
      setShowDeleteAllModal(false);
    } catch (error) {
      console.error('Failed to delete all history:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleRefresh = () => {
    refreshChatHistory();
  };




  // Only show content if user is authenticated
  if (!authState.isAuthenticated) {
    return null; // Will redirect via useEffect
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        {/* Mobile Header */}
        <div className="block md:hidden">
          <div className="flex items-center justify-between mb-4">
            <Button variant="ghost" onClick={() => router.back()} className="h-8 px-2">
              <ArrowLeft className="h-4 w-4" />
              <span className="ml-1">Back</span>
            </Button>
            <ThemeToggle />
          </div>
          <div className="mb-4">
            <h1 className="text-2xl font-bold flex items-center space-x-2">
              <History className="h-6 w-6" />
              <span>Chat History</span>
            </h1>
            <p className="text-sm text-muted-foreground">
              View and manage your AI model comparison history
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" onClick={handleRefresh} disabled={isLoading} className="h-8 px-2">
              <RefreshCw className={`h-3 w-3 ${isLoading ? 'animate-spin' : ''}`} />
              <span className="ml-1">Refresh</span>
            </Button>
            {chatHistory.length > 0 && (
              <Button variant="destructive" onClick={handleDeleteAll} className="h-8 px-2">
                <Trash2 className="h-3 w-3" />
                <span className="ml-1">Delete All</span>
              </Button>
            )}
          </div>
        </div>

        {/* Desktop Header */}
        <div className="hidden md:flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold flex items-center space-x-2">
                <History className="h-8 w-8" />
                <span>Chat History</span>
              </h1>
              <p className="text-muted-foreground">
                View and manage your AI model comparison history
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <ThemeToggle />
            <Button variant="outline" onClick={handleRefresh} disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            {chatHistory.length > 0 && (
              <Button variant="destructive" onClick={handleDeleteAll}>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete All
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <Card className="mb-6 border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-red-700">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading chat history...</p>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && chatHistory.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <History className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Chat History</h3>
            <p className="text-muted-foreground mb-4">
              You haven't made any AI model comparisons yet.
            </p>
            <Button onClick={() => router.push('/')}>
              Start Comparing Models
            </Button>
          </CardContent>
        </Card>
      )}

      {/* History List */}
      {!isLoading && chatHistory.length > 0 && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {chatHistory.length} comparison{chatHistory.length !== 1 ? 's' : ''} found
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {chatHistory.map((item) => (
              <ChatHistoryItemComponent
                key={item.id}
                item={item}
                onViewDetails={handleViewDetails}
                onDelete={handleDelete}
              />
            ))}
          </div>
        </div>
      )}

      {/* Result Popup */}
      <ResultPopup
        isOpen={showResultPopup}
        onClose={() => setShowResultPopup(false)}
        historyItem={selectedItem}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setItemToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        itemTitle={itemToDelete ? chatHistory.find(item => item.id === itemToDelete)?.prompt : undefined}
        isDeleting={isDeleting}
      />

      {/* Delete All Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={showDeleteAllModal}
        onClose={() => setShowDeleteAllModal(false)}
        onConfirm={handleConfirmDeleteAll}
        isDeleting={isDeleting}
        isDeleteAll={true}
      />
    </div>
  );
}

export default function ChatHistoryPage() {
  return (
    <AuthProvider>
      <ChatHistoryContent />
    </AuthProvider>
  );
}
