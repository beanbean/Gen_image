'use client';

import { useEffect, useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

interface QueueItem {
  id: number;
  bot_type: string;
  status: string;
  player_name?: string;
  team_id?: string;
  created_at: string;
}

export function QueueTable() {
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchQueue();
    // Auto-refresh mỗi 5 giây
    const interval = setInterval(fetchQueue, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchQueue = async () => {
    try {
      const response = await fetch('/api/queue');
      const data = await response.json();
      setQueue(data.queue || []);
    } catch (error) {
      console.error('Failed to fetch queue:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'pending':
        return 'default';
      case 'running':
        return 'secondary';
      case 'success':
        return 'outline';
      case 'error':
        return 'destructive';
      default:
        return 'default';
    }
  };

  if (loading) {
    return <div className="text-sm text-muted-foreground">Loading queue...</div>;
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[80px]">ID</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Player/Team</TableHead>
            <TableHead className="text-right">Created</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {queue.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={5}
                className="h-24 text-center text-muted-foreground"
              >
                No items in queue
              </TableCell>
            </TableRow>
          ) : (
            queue.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium">{item.id}</TableCell>
                <TableCell>
                  <span className="text-xs font-mono">{item.bot_type}</span>
                </TableCell>
                <TableCell>
                  <Badge variant={getStatusColor(item.status)}>
                    {item.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  {item.player_name || item.team_id || '-'}
                </TableCell>
                <TableCell className="text-right text-xs text-muted-foreground">
                  {new Date(item.created_at).toLocaleString()}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
