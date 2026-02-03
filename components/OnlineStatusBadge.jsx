// components/OnlineStatusBadge.jsx
import React from 'react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

export default function OnlineStatusBadge({ className = '' }) {
  const { isOnline, lastChangedAt } = useOnlineStatus();

  return (
    <div
      className={`inline-flex items-center gap-2 px-3 py-1 text-sm rounded-full border select-none ${className}
        ${isOnline ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}
      `}
      title={`Stato rete: ${isOnline ? 'Online' : 'Offline'} — ${lastChangedAt.toLocaleString()}`}
    >
      <span className="relative flex h-3 w-3">
        {/* anima il ping quando OFFLINE */}
        {!isOnline && (
          <span className="absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping bg-red-400"></span>
        )}

        <span
          className={`relative inline-flex h-3 w-3 rounded-full ${
            isOnline ? 'bg-green-500' : 'bg-red-500'
          }`}
        ></span>
      </span>

      <span className={`font-medium ${isOnline ? 'text-green-700' : 'text-red-700'}`}>
        {isOnline ? 'Online' : 'Offline'}
      </span>
    </div>
  );
}

