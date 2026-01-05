# Kế hoạch Xây dựng Dashboard Quản lý n8n Workflows

**Ngày:** 05/01/2026
**Dự án:** Gen_image - n8n Workflow Management Dashboard

---

## 1. TỔNG QUAN DỰ ÁN

### 1.1 Mục tiêu
Xây dựng web dashboard để:
- Kích hoạt workflows n8n thông qua API/Webhook
- Quản lý và giám sát trạng thái workflows
- Nhập dữ liệu từ Google Sheets
- Hiển thị logs và kết quả thực thi

### 1.2 Workflows hiện tại
1. **1.Render_image_progress_player.json** - Render tiến độ cá nhân
2. **2.Render_team_leaderboard.json** - Render bảng xếp hạng đội
3. **3.send_image_zalo_captain.json** - Gửi ảnh qua Zalo

### 1.3 Yêu cầu chức năng
- ✅ Trigger workflows từ UI
- ✅ Xem trạng thái workflow (pending/running/success/error)
- ✅ Import data từ Google Sheets
- ✅ Hiển thị logs real-time
- ✅ Quản lý queue (bot_queue table)
- ✅ Dashboard monitoring tổng quan

---

## 2. KIẾN TRÚC HỆ THỐNG

### 2.1 Tech Stack

#### Frontend
- **Framework:** Next.js 15 (App Router)
- **UI Library:** shadcn/ui + Tailwind CSS
- **State Management:** React Query (TanStack Query)
- **Icons:** RemixIcon
- **Charts:** Recharts hoặc Chart.js

#### Backend
- **Runtime:** Next.js API Routes (serverless)
- **Database:** PostgreSQL (sử dụng chung DB với n8n)
- **ORM:** Drizzle ORM hoặc Prisma
- **API Client:** Axios/Fetch

#### Infrastructure
- **Deployment:** Vercel (Frontend) + VPS hiện tại (Backend/n8n)
- **Authentication:** Better Auth (optional cho giai đoạn sau)

### 2.2 Sơ đồ kiến trúc

```
┌─────────────────────────────────────────────────────────┐
│                  WEB DASHBOARD (Next.js)                │
├─────────────────────────────────────────────────────────┤
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────┐ │
│  │ Workflow │  │  Queue   │  │  Logs   │  │ Settings││
│  │ Triggers │  │ Monitor  │  │ Viewer  │  │ Config  ││
│  └──────────┘  └──────────┘  └──────────┘  └─────────┘ │
└────────────┬────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────┐
│              API LAYER (Next.js API Routes)             │
├─────────────────────────────────────────────────────────┤
│  • Workflow Trigger API                                 │
│  • Google Sheets Import API                             │
│  • Queue Management API                                 │
│  • Status Polling API                                   │
└────────────┬────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────┐
│                    n8n INSTANCE (VPS)                   │
├─────────────────────────────────────────────────────────┤
│  • Webhook endpoints                                    │
│  • REST API (https://docs.n8n.io/api/)                  │
│  • Workflow execution engine                            │
└────────────┬────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────┐
│              POSTGRESQL DATABASE (Shared)               │
├─────────────────────────────────────────────────────────┤
│  • bot_queue (n8n workflows)                            │
│  • execution_logs (custom table)                        │
│  • workflow_configs (custom table)                      │
└─────────────────────────────────────────────────────────┘
```

---

## 3. DATABASE SCHEMA

### 3.1 Tables mở rộng (thêm vào DB hiện tại)

```sql
-- Bảng lưu cấu hình workflows
CREATE TABLE workflow_configs (
  id SERIAL PRIMARY KEY,
  workflow_id VARCHAR(255) UNIQUE NOT NULL,
  workflow_name VARCHAR(255) NOT NULL,
  workflow_type VARCHAR(50) NOT NULL, -- PLAYER, TEAM, ZALO
  n8n_webhook_url TEXT,
  n8n_workflow_id VARCHAR(255),
  is_active BOOLEAN DEFAULT true,
  config JSONB, -- Lưu config động
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Bảng lưu execution history
CREATE TABLE execution_logs (
  id SERIAL PRIMARY KEY,
  workflow_id VARCHAR(255) NOT NULL,
  execution_id VARCHAR(255), -- n8n execution ID
  status VARCHAR(50), -- pending, running, success, error
  input_data JSONB,
  output_data JSONB,
  error_message TEXT,
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  duration_ms INTEGER,
  FOREIGN KEY (workflow_id) REFERENCES workflow_configs(workflow_id)
);

-- Bảng import history từ Google Sheets
CREATE TABLE import_history (
  id SERIAL PRIMARY KEY,
  sheet_id VARCHAR(255),
  sheet_name VARCHAR(255),
  rows_imported INTEGER,
  import_status VARCHAR(50),
  imported_by VARCHAR(255),
  imported_at TIMESTAMP DEFAULT NOW(),
  data_snapshot JSONB
);

-- Index cho performance
CREATE INDEX idx_execution_logs_workflow ON execution_logs(workflow_id);
CREATE INDEX idx_execution_logs_status ON execution_logs(status);
CREATE INDEX idx_execution_logs_created ON execution_logs(started_at DESC);
```

### 3.2 Seed data

```sql
INSERT INTO workflow_configs (workflow_id, workflow_name, workflow_type, n8n_workflow_id) VALUES
('render-player-progress', '1.Render_image_progress_player', 'PLAYER', '<n8n_id_1>'),
('render-team-leaderboard', '2.Render_team_leaderboard', 'TEAM', '<n8n_id_2>'),
('send-zalo-captain', '3.send_image_zalo_captain', 'ZALO', '<n8n_id_3>');
```

---

## 4. n8n API INTEGRATION

### 4.1 n8n REST API Endpoints

Tài liệu: https://docs.n8n.io/api/

**Authentication:**
```bash
Headers:
  X-N8N-API-KEY: <your-api-key>
```

**Key endpoints:**

1. **Trigger workflow:**
```bash
POST /api/v1/workflows/{workflowId}/execute
Body: { "data": {...} }
```

2. **Get execution status:**
```bash
GET /api/v1/executions/{executionId}
```

3. **List executions:**
```bash
GET /api/v1/executions?workflowId={id}&status=success
```

4. **Webhook trigger (alternative):**
```bash
POST https://{n8n-domain}/webhook/{webhook-path}
```

### 4.2 Integration Strategy

**Option 1: REST API** (Recommended)
- ✅ Có quyền kiểm soát đầy đủ
- ✅ Lấy execution status real-time
- ✅ Retry mechanism tốt hơn
- ❌ Cần API key management

**Option 2: Webhook**
- ✅ Đơn giản, không cần auth
- ✅ Trigger nhanh
- ❌ Không track được execution ID
- ❌ Khó debug

**Quyết định:** Dùng REST API cho control tốt hơn

---

## 5. GOOGLE SHEETS INTEGRATION

### 5.1 Google Sheets API Setup

```bash
# Dependencies
npm install googleapis @google-cloud/local-auth
```

### 5.2 Authentication Flow

1. Tạo Service Account tại Google Cloud Console
2. Share Google Sheet với Service Account email
3. Sử dụng credentials JSON để authenticate

### 5.3 Data Import Flow

```typescript
// Pseudo-code
async function importFromSheet(sheetId: string, range: string) {
  // 1. Authenticate
  const auth = await authorize();

  // 2. Fetch data
  const sheets = google.sheets({version: 'v4', auth});
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range: range,
  });

  // 3. Transform data
  const rows = response.data.values;
  const transformedData = transformToQueueFormat(rows);

  // 4. Insert to bot_queue
  await db.insert('bot_queue', transformedData);

  // 5. Log import history
  await db.insert('import_history', {...});

  return { imported: transformedData.length };
}
```

---

## 6. FRONTEND UI/UX DESIGN

### 6.1 Pages Structure

```
app/
├── (dashboard)/
│   ├── layout.tsx              # Main dashboard layout
│   ├── page.tsx                # Overview/Home
│   ├── workflows/
│   │   ├── page.tsx            # Workflow list & trigger
│   │   └── [id]/
│   │       └── page.tsx        # Workflow detail & logs
│   ├── queue/
│   │   └── page.tsx            # Queue monitor (bot_queue)
│   ├── import/
│   │   └── page.tsx            # Google Sheets import
│   └── settings/
│       └── page.tsx            # Config n8n API, webhooks
└── api/
    ├── workflows/
    │   ├── trigger/route.ts
    │   └── status/route.ts
    ├── queue/route.ts
    ├── import/route.ts
    └── logs/route.ts
```

### 6.2 Key Components

```tsx
// 1. WorkflowCard.tsx - Trigger workflow
<WorkflowCard
  id="render-player-progress"
  name="Render Player Progress"
  status="active"
  lastRun={timestamp}
  onTrigger={handleTrigger}
/>

// 2. QueueTable.tsx - Monitor bot_queue
<QueueTable
  data={queueItems}
  columns={['id', 'bot_type', 'status', 'created_at']}
  onRefresh={fetchQueue}
/>

// 3. ExecutionLogViewer.tsx - Real-time logs
<ExecutionLogViewer
  executionId={id}
  status="running"
  logs={streamedLogs}
/>

// 4. GoogleSheetsImporter.tsx
<GoogleSheetsImporter
  onImport={handleImport}
  sheetUrl={url}
  range="Sheet1!A1:Z100"
/>
```

### 6.3 UI Mockup (Text-based)

```
┌─────────────────────────────────────────────────────────┐
│  n8n Workflow Dashboard          [Settings] [Refresh]  │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  📊 Overview                                            │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐               │
│  │  Active  │ │ Pending  │ │ Success  │               │
│  │    3     │ │    12    │ │   145    │               │
│  └──────────┘ └──────────┘ └──────────┘               │
│                                                         │
│  🚀 Workflows                                           │
│  ┌─────────────────────────────────────────────────┐   │
│  │ 1. Render Player Progress    [▶ Trigger] ●     │   │
│  │    Last run: 2 mins ago | Status: Success       │   │
│  ├─────────────────────────────────────────────────┤   │
│  │ 2. Render Team Leaderboard   [▶ Trigger] ●     │   │
│  │    Last run: 5 mins ago | Status: Success       │   │
│  ├─────────────────────────────────────────────────┤   │
│  │ 3. Send Zalo Captain         [▶ Trigger] ○     │   │
│  │    Last run: 1 hour ago | Status: Idle          │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  📥 Import from Google Sheets                           │
│  ┌─────────────────────────────────────────────────┐   │
│  │ Sheet URL: [____________________________]       │   │
│  │ Range:     [Sheet1!A1:Z100___]  [Import]        │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  📋 Queue Status (bot_queue)                            │
│  ┌──┬───────┬─────────┬──────────┬────────────────┐   │
│  │ID│ Type  │ Status  │ Player   │ Created        │   │
│  ├──┼───────┼─────────┼──────────┼────────────────┤   │
│  │45│PLAYER │pending  │John Doe  │2m ago          │   │
│  │44│TEAM   │success  │Team A    │5m ago          │   │
│  │43│ZALO   │running  │Captain X │10m ago         │   │
│  └──┴───────┴─────────┴──────────┴────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

---

## 7. IMPLEMENTATION ROADMAP

### Phase 1: Foundation (Week 1)
**Mục tiêu:** Setup project & n8n integration

- [ ] Setup Next.js 15 project với TypeScript
- [ ] Cấu hình Tailwind + shadcn/ui
- [ ] Setup database schema (Drizzle ORM)
- [ ] Tạo migrations cho tables mới
- [ ] Test n8n REST API connection
- [ ] Implement basic workflow trigger API

**Deliverables:**
- Project boilerplate
- Database setup hoàn chỉnh
- API trigger workflows thành công

---

### Phase 2: Core Features (Week 2)
**Mục tiêu:** Build dashboard UI & workflow management

- [ ] Build dashboard layout (sidebar, header)
- [ ] Implement Workflow List page
- [ ] Implement Workflow Trigger functionality
- [ ] Build Queue Monitor (bot_queue table)
- [ ] Implement real-time status polling
- [ ] Add execution logs viewer

**Deliverables:**
- Functional dashboard UI
- Workflow trigger & monitoring hoạt động

---

### Phase 3: Google Sheets Integration (Week 3)
**Mục tiêu:** Import data từ Google Sheets

- [ ] Setup Google Sheets API credentials
- [ ] Implement Google Sheets reader
- [ ] Build import UI component
- [ ] Data transformation logic (Sheets → bot_queue)
- [ ] Validate & error handling
- [ ] Import history tracking

**Deliverables:**
- Google Sheets import hoàn chỉnh
- Data validation & logging

---

### Phase 4: Enhancement & Polish (Week 4)
**Mục tiêu:** Optimize UX & deployment

- [ ] Add charts/graphs (execution trends)
- [ ] Implement filters & search
- [ ] Error handling & retry mechanisms
- [ ] Toast notifications & feedback
- [ ] Responsive design (mobile-friendly)
- [ ] Performance optimization
- [ ] Deployment setup (Vercel)
- [ ] Documentation & testing

**Deliverables:**
- Production-ready dashboard
- Deployed to Vercel
- User documentation

---

## 8. API ENDPOINTS SPECIFICATION

### 8.1 Workflow APIs

#### POST /api/workflows/trigger
Trigger workflow execution

**Request:**
```json
{
  "workflowId": "render-player-progress",
  "data": {
    "player_id": "123",
    "team_id": "team-a"
  }
}
```

**Response:**
```json
{
  "success": true,
  "executionId": "exec_abc123",
  "status": "running",
  "message": "Workflow triggered successfully"
}
```

---

#### GET /api/workflows/status/{executionId}
Get execution status

**Response:**
```json
{
  "executionId": "exec_abc123",
  "workflowId": "render-player-progress",
  "status": "success",
  "startedAt": "2026-01-05T10:00:00Z",
  "completedAt": "2026-01-05T10:02:30Z",
  "duration": 150000,
  "data": {...}
}
```

---

### 8.2 Queue APIs

#### GET /api/queue
Lấy danh sách bot_queue

**Query params:**
- `status`: pending | running | success | error
- `bot_type`: PLAYER | TEAM | ZALO
- `limit`: number (default 50)
- `offset`: number (default 0)

**Response:**
```json
{
  "items": [
    {
      "id": 45,
      "bot_type": "PLAYER",
      "status": "pending",
      "player_name": "John Doe",
      "created_at": "2026-01-05T10:00:00Z"
    }
  ],
  "total": 145,
  "limit": 50,
  "offset": 0
}
```

---

### 8.3 Import APIs

#### POST /api/import/google-sheets
Import data từ Google Sheets

**Request:**
```json
{
  "sheetId": "1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms",
  "range": "Sheet1!A1:Z100",
  "targetQueue": "bot_queue"
}
```

**Response:**
```json
{
  "success": true,
  "imported": 42,
  "failed": 2,
  "errors": [...],
  "importId": "imp_xyz789"
}
```

---

## 9. SECURITY & BEST PRACTICES

### 9.1 Environment Variables

```env
# n8n Configuration
N8N_API_URL=https://your-n8n-instance.com
N8N_API_KEY=n8n_api_xxxxxxxxxx

# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/dbname

# Google Sheets
GOOGLE_SHEETS_CREDENTIALS={"type":"service_account",...}

# Next.js
NEXT_PUBLIC_APP_URL=https://dashboard.yourdomain.com
```

### 9.2 Security Checklist

- [ ] n8n API key stored in env variables
- [ ] Database connection using SSL
- [ ] Input validation cho all API endpoints
- [ ] Rate limiting cho trigger APIs
- [ ] CORS configuration
- [ ] CSP headers
- [ ] Authentication (Better Auth) cho production

### 9.3 Error Handling Strategy

```typescript
// Centralized error handler
class WorkflowError extends Error {
  constructor(
    public code: string,
    public statusCode: number,
    message: string
  ) {
    super(message);
  }
}

// Usage
try {
  await triggerWorkflow(id);
} catch (error) {
  if (error instanceof WorkflowError) {
    // Handle gracefully
    return NextResponse.json(
      { error: error.message },
      { status: error.statusCode }
    );
  }
  // Log unknown errors
  logger.error(error);
}
```

---

## 10. TESTING STRATEGY

### 10.1 Unit Tests
- API route handlers
- Data transformation functions
- Google Sheets parser

### 10.2 Integration Tests
- n8n API integration
- Database operations
- End-to-end workflow trigger

### 10.3 E2E Tests (Playwright)
- Workflow trigger flow
- Queue monitoring
- Google Sheets import flow

---

## 11. MONITORING & LOGGING

### 11.1 Application Logs

```typescript
// Structured logging
import pino from 'pino';

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
});

logger.info({ workflowId, executionId }, 'Workflow triggered');
logger.error({ error, context }, 'Workflow execution failed');
```

### 11.2 Metrics to Track

- Workflow execution success rate
- Average execution duration
- Queue size trends
- Import success/failure rates
- API response times

---

## 12. DEPLOYMENT

### 12.1 Vercel Deployment

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

### 12.2 Environment Setup

1. Add environment variables trong Vercel dashboard
2. Configure database connection pool
3. Setup custom domain (optional)

### 12.3 CI/CD Pipeline (Optional)

```yaml
# .github/workflows/deploy.yml
name: Deploy to Vercel
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to Vercel
        run: vercel --prod --token=${{ secrets.VERCEL_TOKEN }}
```

---

## 13. THÔNG TIN CẤU HÌNH ✅

### 13.1 n8n Configuration
- ✅ **n8n instance URL:** https://workflow.nexme.vn/
- ✅ **API key:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJiNjFmZmIxYy00ODNjLTQ3YjUtOTg5ZC1iYzJiNWQ1YjM3NzYiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzY3MjQ2NTA1fQ.wRd6jgQh73FXPWeW_Rn7b1UXXI_L8PGU_3JO6GcQOTg`
- ⏳ **Workflows webhook URLs:** Chưa có, cần tạo (xem Section 13.5)

### 13.2 Google Sheets
- ✅ **Sheet URL:** https://docs.google.com/spreadsheets/d/1Z9nU5cQwEDeSKAn-Ba5HFpHUhQQyOoSxukaO7mG5DV4/edit?gid=345514191
- ✅ **Sheet ID:** `1Z9nU5cQwEDeSKAn-Ba5HFpHUhQQyOoSxukaO7mG5DV4`
- ✅ **Tab ID:** `345514191`
- ✅ **Format data:**
  ```
  Columns: In Ảnh? | Vai Trò | Người chơi | Day 0 | Day 1 | ... | Day 10 |
           Đội | Vòng | Thời Gian | Đội trưởng | zaloID_captain | avatar_url
  ```
- ✅ **Workflow:** Admin import từ dashboard vào Google Sheet → Tick/Button để tạo ảnh

### 13.3 Authentication
- ✅ **Dashboard authentication:** Không cần
- ✅ **Public access:** Dashboard public, không cần login

### 13.4 Hosting
- ✅ **Deploy platform:** Vercel
- ✅ **Database:** Sử dụng chung PostgreSQL với n8n

### 13.5 Hướng dẫn tạo Webhook URLs cho n8n Workflows

#### Cách 1: Thêm Webhook Trigger node vào workflow

1. **Mở workflow trong n8n:**
   - Truy cập https://workflow.nexme.vn/
   - Mở workflow `1.Render_image_progress_player`

2. **Thêm Webhook node:**
   - Click "Add node" → Search "Webhook"
   - Chọn "Webhook" trigger node

3. **Cấu hình Webhook:**
   ```
   HTTP Method: POST
   Path: render-player-progress
   Authentication: None (hoặc Header Auth nếu cần bảo mật)
   Response Mode: When Last Node Finishes
   Response Data: Last Node
   ```

4. **Lấy Webhook URL:**
   - Sau khi save, n8n sẽ generate URL dạng:
   - Test URL: `https://workflow.nexme.vn/webhook-test/render-player-progress`
   - Production URL: `https://workflow.nexme.vn/webhook/render-player-progress`

5. **Kích hoạt workflow:**
   - Click "Activate" để workflow luôn chạy
   - Test bằng cách gửi POST request đến webhook URL

6. **Lặp lại cho các workflows khác:**
   - `2.Render_team_leaderboard` → path: `render-team-leaderboard`
   - `3.send_image_zalo_captain` → path: `send-zalo-captain`

#### Cách 2: Sử dụng n8n REST API (Recommended cho dashboard)

Dashboard sẽ trigger workflows bằng REST API thay vì webhook:

```bash
POST https://workflow.nexme.vn/api/v1/workflows/{workflowId}/execute
Headers:
  X-N8N-API-KEY: eyJhbGci...
  Content-Type: application/json
Body:
  {
    "data": {
      "player_name": "John Doe",
      "team_id": "team-a"
    }
  }
```

**Lấy workflowId:**
```bash
curl -X GET https://workflow.nexme.vn/api/v1/workflows \
  -H "X-N8N-API-KEY: eyJhbGci..."
```

Kết quả trả về list workflows với `id` của từng workflow.

---

## 14. TỔNG KẾT

### 14.1 Tech Stack Summary
- **Frontend:** Next.js 15 + shadcn/ui + Tailwind
- **Backend:** Next.js API Routes + PostgreSQL
- **Integration:** n8n REST API + Google Sheets API
- **Deployment:** Vercel (recommended)

### 14.2 Timeline Estimate
- **Phase 1:** 1 week - Foundation
- **Phase 2:** 1 week - Core features
- **Phase 3:** 1 week - Google Sheets
- **Phase 4:** 1 week - Polish & deploy
**Total:** ~4 weeks (có thể nhanh hơn nếu fulltime)

### 14.3 Workflows Identified ✅
- `nxdj3XeZAA4WscYp` - 1.Render_image_progress_player
- `9fD7jTNV9LbMYGJu` - 2.Render_team_leaderboard
- `Cxhi6bFhwv0XbUF4` - 3.send_image_zalo_captain

### 14.4 Documentation Created ✅
- ✅ [docs/n8n-workflows-config.md](../docs/n8n-workflows-config.md) - Chi tiết workflows & API
- ✅ [docs/google-sheets-integration.md](../docs/google-sheets-integration.md) - Hướng dẫn Google Sheets
- ✅ [scripts/get-workflows.sh](../scripts/get-workflows.sh) - Script lấy workflows
- ✅ [scripts/filter-workflows.py](../scripts/filter-workflows.py) - Script filter workflows

### 14.5 Next Steps
1. ✅ Review kế hoạch
2. ✅ Trả lời câu hỏi về n8n & Google Sheets (Section 13)
3. ✅ Identify workflows từ n8n API
4. ⏳ Setup development environment
5. ⏳ Bắt đầu Phase 1 implementation

---

**Kế hoạch được tạo:** 05/01/2026
**Người lập kế hoạch:** Claude Code
**Trạng thái:** ✅ Sẵn sàng implementation
