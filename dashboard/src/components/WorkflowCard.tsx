'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import { toast } from 'sonner';

interface WorkflowCardProps {
  id: string;
  name: string;
  description: string;
}

export function WorkflowCard({ id, name, description }: WorkflowCardProps) {
  const [loading, setLoading] = useState(false);

  const handleTrigger = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workflowId: id }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Success!', {
          description: `Workflow triggered: ${result.executionId}`,
        });
      } else {
        throw new Error(result.error || 'Failed to trigger workflow');
      }
    } catch (error: any) {
      toast.error('Error!', {
        description: error.message || 'Failed to trigger workflow',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{name}</CardTitle>
        <CardDescription className="text-sm">{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <Button
          onClick={handleTrigger}
          disabled={loading}
          className="w-full"
          size="sm"
        >
          {loading ? 'Triggering...' : '▶ Trigger'}
        </Button>
      </CardContent>
    </Card>
  );
}
