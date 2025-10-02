'use client';

import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  itemTitle?: string;
  isDeleting?: boolean;
  isDeleteAll?: boolean;
}

export function DeleteConfirmationModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  itemTitle,
  isDeleting = false,
  isDeleteAll = false
}: DeleteConfirmationModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            <span>Confirm Deletion</span>
          </DialogTitle>
          <DialogDescription>
            {isDeleteAll ? (
              <>
                Are you sure you want to delete <strong>all</strong> your chat history? 
                This action cannot be undone.
              </>
            ) : (
              <>
                Are you sure you want to delete this chat history item?
                This action cannot be undone.
              </>
            )}
          </DialogDescription>
          {!isDeleteAll && itemTitle && (
            <div className="mt-2 p-2 bg-muted rounded text-sm">
              "{itemTitle.length > 100 ? `${itemTitle.substring(0, 100)}...` : itemTitle}"
            </div>
          )}
        </DialogHeader>
        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isDeleting}
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={isDeleting}
            className="w-full sm:w-auto"
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
