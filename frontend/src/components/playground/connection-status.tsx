'use client';

import React, { useState, useEffect } from 'react';
import { Badge } from '../ui/badge';
import { webSocketService } from '../../services/websocket.service';
import { Wifi, WifiOff, AlertCircle } from 'lucide-react';

export function ConnectionStatus() {
  const [status, setStatus] = useState(webSocketService.getConnectionStatus());

  useEffect(() => {
    const updateStatus = () => {
      setStatus(webSocketService.getConnectionStatus());
    };

    // Update status every second
    const interval = setInterval(updateStatus, 1000);

    return () => clearInterval(interval);
  }, []);

  const getStatusBadge = () => {
    if (status.connected) {
      return (
        <Badge variant="default" className="flex items-center gap-1">
          <Wifi className="w-3 h-3" />
          Connected
        </Badge>
      );
    }

    if (status.reconnectAttempts > 0) {
      return (
        <Badge variant="secondary" className="flex items-center gap-1">
          <AlertCircle className="w-3 h-3" />
          Reconnecting... ({status.reconnectAttempts})
        </Badge>
      );
    }

    return (
      <Badge variant="destructive" className="flex items-center gap-1">
        <WifiOff className="w-3 h-3" />
        Disconnected
      </Badge>
    );
  };

  return (
    <div className="flex justify-center">
      {getStatusBadge()}
    </div>
  );
}
