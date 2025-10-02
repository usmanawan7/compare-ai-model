'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChatHistoryItem } from '@/services/chat-history.service';
import { Eye, Trash2, Clock, Hash, Zap, DollarSign } from 'lucide-react';

interface ChatHistoryItemProps {
  item: ChatHistoryItem;
  onViewDetails: (item: ChatHistoryItem) => void;
  onDelete: (itemId: string) => void;
}

export function ChatHistoryItemComponent({ item, onViewDetails, onDelete }: ChatHistoryItemProps) {
  const handleViewDetails = () => {
    onViewDetails(item);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(item.id);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getModelBadges = () => {
    const models = item.models.slice(0, 3);
    const remaining = item.models.length - 3;
    
    return (
      <div className="flex flex-wrap gap-1">
        {models.map((model) => (
          <Badge key={model} variant="secondary" className="text-xs">
            {model}
          </Badge>
        ))}
        {remaining > 0 && (
          <Badge variant="outline" className="text-xs">
            +{remaining} more
          </Badge>
        )}
      </div>
    );
  };

  return (
    <Card 
      className="transition-all duration-200 cursor-pointer hover:shadow-lg hover:border-primary/50 h-full flex flex-col"
      onClick={handleViewDetails}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <CardTitle className="text-sm line-clamp-3 leading-relaxed">
            {item.prompt}
          </CardTitle>
          <div className="flex space-x-1 ml-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleViewDetails}
              className="h-7 w-7 p-0 hover:bg-primary/10"
            >
              <Eye className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDelete}
              className="h-7 w-7 p-0 hover:bg-destructive/10 hover:text-destructive"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0 flex-1 flex flex-col justify-between">
        <div className="space-y-3">
          {/* Model badges */}
          {getModelBadges()}
          
          {/* Stats */}
          <div className="space-y-2">
            <div className="flex items-center space-x-4 text-xs text-muted-foreground">
              <div className="flex items-center space-x-1">
                <Hash className="h-3 w-3" />
                <span>{item.modelCount} models</span>
              </div>
              <div className="flex items-center space-x-1">
                <Clock className="h-3 w-3" />
                <span>{formatDate(item.createdAt)}</span>
              </div>
            </div>
            
            {/* Token and Cost Information */}
            {(item.totalTokens || item.totalCost) && (
              <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                {item.totalTokens && item.totalTokens > 0 && (
                  <div className="flex items-center space-x-1">
                    <Zap className="h-3 w-3" />
                    <span>{item.totalTokens.toLocaleString()} tokens</span>
                  </div>
                )}
                {item.totalCost && item.totalCost > 0 && (
                  <div className="flex items-center space-x-1">
                    <DollarSign className="h-3 w-3" />
                    <span>${item.totalCost.toFixed(4)}</span>
                  </div>
                )}
                {item.averageResponseTime && item.averageResponseTime > 0 && (
                  <div className="flex items-center space-x-1">
                    <Clock className="h-3 w-3" />
                    <span>{(item.averageResponseTime / 1000).toFixed(1)}s avg</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
