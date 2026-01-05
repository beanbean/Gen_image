import { NextRequest, NextResponse } from 'next/server';
import { triggerWorkflow } from '@/lib/n8n';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { workflowId, data } = body;

    if (!workflowId) {
      return NextResponse.json(
        { error: 'workflowId is required' },
        { status: 400 }
      );
    }

    // Trigger workflow via n8n API
    const result = await triggerWorkflow({ workflowId, data });

    // Log execution vào database
    try {
      await db.query(
        `INSERT INTO execution_logs
         (workflow_id, n8n_execution_id, status)
         VALUES ($1, $2, $3)`,
        [workflowId, result.executionId, 'running']
      );
    } catch (dbError: any) {
      console.error('Failed to log execution:', dbError);
      // Don't fail the request if logging fails
    }

    return NextResponse.json({
      success: true,
      executionId: result.executionId,
      message: result.message || 'Workflow triggered successfully',
    });
  } catch (error: any) {
    console.error('Trigger workflow error:', error);
    return NextResponse.json(
      {
        error: error.message || 'Failed to trigger workflow',
        details: error.stack,
      },
      { status: 500 }
    );
  }
}
