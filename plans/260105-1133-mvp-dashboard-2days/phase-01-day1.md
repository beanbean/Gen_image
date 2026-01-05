# Phase 01 - Day 1: Foundation + n8n Integration

**Thời lượng:** 8 giờ
**Mục tiêu:** Setup project + Trigger workflows hoạt động + Dashboard UI cơ bản

---

## 🎯 DELIVERABLES

- ✅ Next.js 15 project với TypeScript + Tailwind
- ✅ shadcn/ui components setup
- ✅ n8n API integration working
- ✅ Dashboard UI với 3 workflow trigger buttons
- ✅ Stats display (pending/running/success counts)
- ✅ Database schema deployed

---

## ⏰ TIMELINE BREAKDOWN

### MORNING SESSION (4 giờ)

#### 1. Project Setup (30 phút)
```bash
# Tạo Next.js project
npx create-next-app@latest dashboard \
  --typescript \
  --tailwind \
  --app \
  --src-dir \
  --import-alias "@/*"

cd dashboard

# Cài thêm dependencies
npm install @radix-ui/react-icons
npm install pg                  # PostgreSQL client
npm install drizzle-orm         # ORM (optional, có thể dùng pg trực tiếp)
```

**Checklist:**
- [ ] Project created successfully
- [ ] Dependencies installed
- [ ] Dev server chạy được (`npm run dev`)

---

#### 2. shadcn/ui Setup (30 phút)
```bash
# Init shadcn/ui
npx shadcn@latest init

# Chọn options:
# - Style: Default
# - Base color: Slate
# - CSS variables: Yes

# Add components cần thiết
npx shadcn@latest add button
npx shadcn@latest add card
npx shadcn@latest add input
npx shadcn@latest add table
npx shadcn@latest add badge
npx shadcn@latest add toast
```

**Checklist:**
- [ ] shadcn/ui config created (`components.json`)
- [ ] Components installed vào `@/components/ui/`
- [ ] Test render 1 button trong page.tsx

---

#### 3. Environment Variables (15 phút)
Tạo `.env.local`:
```env
# n8n Configuration
N8N_API_URL=https://workflow.nexme.vn
N8N_API_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJiNjFmZmIxYy00ODNjLTQ3YjUtOTg5ZC1iYzJiNWQ1YjM3NzYiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzY3MjQ2NTA1fQ.wRd6jgQh73FXPWeW_Rn7b1UXXI_L8PGU_3JO6GcQOTg

# Database (shared với n8n)
DATABASE_URL=postgresql://user:password@host:5432/dbname

# Next.js
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**Checklist:**
- [ ] `.env.local` created
- [ ] Add `.env.local` vào `.gitignore`
- [ ] Test load env variables trong API route

---

#### 4. Database Schema (30 phút)
Tạo migration script `db/migration.sql`:
```sql
-- Bảng tracking executions
CREATE TABLE IF NOT EXISTS execution_logs (
  id SERIAL PRIMARY KEY,
  workflow_id VARCHAR(50) NOT NULL,
  n8n_execution_id VARCHAR(100),
  status VARCHAR(20) NOT NULL, -- 'running', 'success', 'error'
  triggered_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  error_message TEXT
);

-- Indexes cho performance
CREATE INDEX IF NOT EXISTS idx_exec_status
  ON execution_logs(status);
CREATE INDEX IF NOT EXISTS idx_exec_triggered
  ON execution_logs(triggered_at DESC);

-- Verify bot_queue table tồn tại
-- (Không cần tạo vì đã có sẵn từ n8n)
```

Chạy migration:
```bash
# Option 1: psql command
psql $DATABASE_URL < db/migration.sql

# Option 2: Node script (nếu cần)
node scripts/migrate.js
```

**Checklist:**
- [ ] `execution_logs` table created
- [ ] Indexes created
- [ ] Verify `bot_queue` table exists
- [ ] Test query từ psql

---

#### 5. n8n API Client (1 giờ)
Tạo `lib/n8n.ts`:
```typescript
const N8N_API_URL = process.env.N8N_API_URL!;
const N8N_API_KEY = process.env.N8N_API_KEY!;

export interface TriggerWorkflowParams {
  workflowId: string;
  data?: Record<string, any>;
}

export interface WorkflowExecutionResult {
  success: boolean;
  executionId: string;
  status: string;
}

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
      throw new Error(`n8n API error: ${response.statusText}`);
    }

    const result = await response.json();

    return {
      success: true,
      executionId: result.data?.executionId || result.data?.id,
      status: 'triggered',
    };
  } catch (error) {
    console.error('Failed to trigger workflow:', error);
    throw error;
  }
}

export async function getExecutionStatus(executionId: string) {
  const response = await fetch(
    `${N8N_API_URL}/api/v1/executions/${executionId}`,
    {
      headers: {
        'X-N8N-API-KEY': N8N_API_KEY,
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to get execution status`);
  }

  const result = await response.json();
  return {
    status: result.data.status, // 'running', 'success', 'error'
    startedAt: result.data.startedAt,
    finishedAt: result.data.finishedAt,
  };
}
```

**Test với curl trước:**
```bash
curl -X POST https://workflow.nexme.vn/api/v1/workflows/nxdj3XeZAA4WscYp/execute \
  -H "X-N8N-API-KEY: eyJhbGc..." \
  -H "Content-Type: application/json" \
  -d '{"data":{}}'
```

**Checklist:**
- [ ] `lib/n8n.ts` created
- [ ] Test trigger với curl thành công
- [ ] `triggerWorkflow()` function working
- [ ] `getExecutionStatus()` function working

---

#### 6. API Route `/api/trigger` (1 giờ)
Tạo `app/api/trigger/route.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { triggerWorkflow } from '@/lib/n8n';
import { db } from '@/lib/db'; // Giả sử có db client

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

    // Trigger workflow
    const result = await triggerWorkflow({ workflowId, data });

    // Log vào database
    await db.query(
      `INSERT INTO execution_logs
       (workflow_id, n8n_execution_id, status)
       VALUES ($1, $2, $3)`,
      [workflowId, result.executionId, 'running']
    );

    return NextResponse.json({
      success: true,
      executionId: result.executionId,
      message: 'Workflow triggered successfully',
    });
  } catch (error: any) {
    console.error('Trigger workflow error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to trigger workflow' },
      { status: 500 }
    );
  }
}
```

Tạo `lib/db.ts`:
```typescript
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export const db = {
  query: (text: string, params?: any[]) => pool.query(text, params),
};
```

**Checklist:**
- [ ] `app/api/trigger/route.ts` created
- [ ] `lib/db.ts` created
- [ ] Test POST request với Postman/curl
- [ ] Verify log vào `execution_logs` table

---

### AFTERNOON SESSION (4 giờ)

#### 7. Dashboard Layout (1 giờ)
Tạo `app/page.tsx`:
```typescript
import { WorkflowCard } from '@/components/WorkflowCard';
import { StatsDisplay } from '@/components/StatsDisplay';
import { QueueTable } from '@/components/QueueTable';

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold">n8n Dashboard MVP</h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        {/* Stats */}
        <StatsDisplay />

        {/* Workflows */}
        <section>
          <h2 className="text-xl font-semibold mb-4">🚀 Workflows</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <WorkflowCard
              id="nxdj3XeZAA4WscYp"
              name="Render Player Progress"
              description="Tạo ảnh tiến độ cá nhân"
            />
            <WorkflowCard
              id="9fD7jTNV9LbMYGJu"
              name="Render Team Leaderboard"
              description="Tạo ảnh bảng xếp hạng đội"
            />
            <WorkflowCard
              id="Cxhi6bFhwv0XbUF4"
              name="Send Zalo Captain"
              description="Gửi ảnh qua Zalo"
            />
          </div>
        </section>

        {/* Queue Table */}
        <section>
          <h2 className="text-xl font-semibold mb-4">📋 Queue Status</h2>
          <QueueTable />
        </section>
      </main>
    </div>
  );
}
```

**Checklist:**
- [ ] Layout structure created
- [ ] Header + main sections
- [ ] Responsive grid setup

---

#### 8. WorkflowCard Component (1.5 giờ)
Tạo `components/WorkflowCard.tsx`:
```typescript
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';

interface WorkflowCardProps {
  id: string;
  name: string;
  description: string;
}

export function WorkflowCard({ id, name, description }: WorkflowCardProps) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

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
        toast({
          title: 'Success',
          description: `Workflow triggered: ${result.executionId}`,
        });
      } else {
        throw new Error(result.error);
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{name}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <Button
          onClick={handleTrigger}
          disabled={loading}
          className="w-full"
        >
          {loading ? 'Triggering...' : '▶ Trigger'}
        </Button>
      </CardContent>
    </Card>
  );
}
```

**Checklist:**
- [ ] Component created
- [ ] Click button → Call API
- [ ] Toast notification working
- [ ] Loading state working

---

#### 9. Stats Display (1 giờ)
Tạo `app/api/queue/route.ts`:
```typescript
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    // Get stats từ execution_logs
    const statsResult = await db.query(`
      SELECT
        status,
        COUNT(*) as count
      FROM execution_logs
      GROUP BY status
    `);

    const stats = {
      pending: 0,
      running: 0,
      success: 0,
      error: 0,
    };

    statsResult.rows.forEach((row) => {
      stats[row.status as keyof typeof stats] = parseInt(row.count);
    });

    // Get latest queue items
    const queueResult = await db.query(`
      SELECT * FROM bot_queue
      ORDER BY created_at DESC
      LIMIT 10
    `);

    return NextResponse.json({
      stats,
      queue: queueResult.rows,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
```

Tạo `components/StatsDisplay.tsx`:
```typescript
'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function StatsDisplay() {
  const [stats, setStats] = useState({
    pending: 0,
    running: 0,
    success: 0,
    error: 0,
  });

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 5000); // Refresh mỗi 5s
    return () => clearInterval(interval);
  }, []);

  const fetchStats = async () => {
    const response = await fetch('/api/queue');
    const data = await response.json();
    setStats(data.stats);
  };

  return (
    <div className="grid grid-cols-4 gap-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Pending</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold">{stats.pending}</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Running</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold">{stats.running}</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Success</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold text-green-600">{stats.success}</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Error</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold text-red-600">{stats.error}</p>
        </CardContent>
      </Card>
    </div>
  );
}
```

**Checklist:**
- [ ] `/api/queue` endpoint created
- [ ] Stats component created
- [ ] Auto-refresh mỗi 5s
- [ ] Display correct counts

---

#### 10. Basic Styling (30 phút)
- [ ] Adjust spacing và colors
- [ ] Add hover effects cho buttons
- [ ] Responsive layout test
- [ ] Dark mode support (optional)

---

## ✅ END OF DAY 1 CHECKLIST

### Functional Requirements
- [ ] Dashboard accessible tại `http://localhost:3000`
- [ ] Click "Trigger" button → n8n workflow chạy
- [ ] Toast notification hiển thị thành công/lỗi
- [ ] Stats cards hiển thị đúng số liệu
- [ ] Execution log vào database

### Technical Requirements
- [ ] Next.js project structure clean
- [ ] TypeScript no errors
- [ ] Environment variables configured
- [ ] Database schema deployed
- [ ] API endpoints working

### Code Quality
- [ ] Components organized trong `components/`
- [ ] API routes trong `app/api/`
- [ ] Utility functions trong `lib/`
- [ ] No hardcoded secrets in code

---

## 🚨 POTENTIAL BLOCKERS

| Issue | Solution |
|-------|----------|
| Database connection fail | Verify `DATABASE_URL`, check VPS firewall |
| n8n API authentication error | Double-check API key, test với curl |
| shadcn/ui components không render | Check Tailwind config, run `npm run dev` lại |
| TypeScript errors | Run `npm run build` để catch errors sớm |

---

## 📝 NOTES

- Hardcode 3 workflow IDs trong code (không cần database table)
- Focus functional over beautiful UI
- Manual testing đủ, không cần viết tests
- Git commit sau mỗi section hoàn thành

---

**Next:** [Phase 02 - Day 2](./phase-02-day2.md)
