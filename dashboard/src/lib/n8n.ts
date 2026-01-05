const N8N_API_URL = process.env.N8N_API_URL!;
const N8N_API_KEY = process.env.N8N_API_KEY!;

if (!N8N_API_URL || !N8N_API_KEY) {
  throw new Error('N8N_API_URL and N8N_API_KEY must be set in environment variables');
}

export interface TriggerWorkflowParams {
  workflowId: string;
  data?: Record<string, any>;
}

export interface WorkflowExecutionResult {
  success: boolean;
  executionId: string;
  status: string;
  message?: string;
}

export interface ExecutionStatus {
  status: 'running' | 'success' | 'error' | 'waiting';
  startedAt?: string;
  finishedAt?: string;
  mode?: string;
}

/**
 * Trigger a workflow execution via n8n REST API
 */
export async function triggerWorkflow({
  workflowId,
  data = {},
}: TriggerWorkflowParams): Promise<WorkflowExecutionResult> {
  try {
    const response = await fetch(
      `${N8N_API_URL}/api/v1/workflows/${workflowId}/execute`,
      {
        method: 'POST',
        headers: {
          'X-N8N-API-KEY': N8N_API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ data }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `n8n API error (${response.status}): ${errorText || response.statusText}`
      );
    }

    const result = await response.json();

    // n8n returns different formats, normalize it
    const executionId = result.data?.executionId || result.data?.id || 'unknown';

    return {
      success: true,
      executionId,
      status: 'triggered',
      message: 'Workflow triggered successfully',
    };
  } catch (error: any) {
    console.error('Failed to trigger workflow:', error);
    throw new Error(`Failed to trigger workflow: ${error.message}`);
  }
}

/**
 * Get execution status from n8n
 */
export async function getExecutionStatus(
  executionId: string
): Promise<ExecutionStatus> {
  try {
    const response = await fetch(
      `${N8N_API_URL}/api/v1/executions/${executionId}`,
      {
        headers: {
          'X-N8N-API-KEY': N8N_API_KEY,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to get execution status: ${response.statusText}`);
    }

    const result = await response.json();
    const execution = result.data;

    return {
      status: execution.status as ExecutionStatus['status'],
      startedAt: execution.startedAt,
      finishedAt: execution.finishedAt,
      mode: execution.mode,
    };
  } catch (error: any) {
    console.error('Failed to get execution status:', error);
    throw new Error(`Failed to get execution status: ${error.message}`);
  }
}

/**
 * Hardcoded workflow configurations
 * No need for database table for MVP
 */
export const WORKFLOWS = [
  {
    id: 'nxdj3XeZAA4WscYp',
    name: 'Render Player Progress',
    description: 'Tạo ảnh tiến độ cá nhân',
    type: 'PLAYER' as const,
  },
  {
    id: '9fD7jTNV9LbMYGJu',
    name: 'Render Team Leaderboard',
    description: 'Tạo ảnh bảng xếp hạng đội',
    type: 'TEAM' as const,
  },
  {
    id: 'Cxhi6bFhwv0XbUF4',
    name: 'Send Zalo Captain',
    description: 'Gửi ảnh qua Zalo cho đội trưởng',
    type: 'ZALO' as const,
  },
] as const;

export type WorkflowType = (typeof WORKFLOWS)[number]['type'];
