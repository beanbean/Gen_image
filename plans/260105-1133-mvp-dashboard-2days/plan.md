# Kế hoạch MVP Dashboard 2 Ngày

**Ngày tạo:** 05/01/2026 11:33
**Timeline:** 2 ngày (MVP functional)
**Mục tiêu:** Dashboard tối thiểu có thể trigger workflows, import Google Sheets, hiển thị stats

---

## 🎯 MỤC TIÊU MVP

### Scope IN (Must-have)
✅ Trigger 3 workflows n8n từ UI
✅ Import data từ Google Sheets vào bot_queue
✅ Dashboard stats cơ bản (pending/success/error count)
✅ Hiển thị queue status real-time

### Scope OUT (Bỏ qua)
❌ Authentication/Authorization
❌ Complex logging và history tracking
❌ Charts/graphs
❌ Advanced filtering/search
❌ Mobile responsive (desktop-first)
❌ Error retry mechanisms

---

## 🏗️ KIẾN TRÚC ĐƠN GIẢN

```
Next.js App (Vercel)
├── app/
│   ├── page.tsx                    # Dashboard chính
│   ├── api/
│   │   ├── trigger/route.ts        # Trigger workflows
│   │   ├── import/route.ts         # Import Google Sheets
│   │   └── queue/route.ts          # Lấy queue status
│   └── components/
│       ├── WorkflowCard.tsx        # Card với button trigger
│       ├── GoogleSheetsImport.tsx  # Form import
│       └── QueueTable.tsx          # Bảng hiển thị queue
└── lib/
    ├── n8n.ts                      # n8n API client
    ├── sheets.ts                   # Google Sheets API
    └── db.ts                       # Database client
```

---

## 📊 DATABASE (Tối thiểu)

### Sử dụng lại tables hiện có
- ✅ `bot_queue` - Đã tồn tại, không cần thay đổi

### Tables mới (chỉ 1 table)
```sql
-- Tracking executions đơn giản
CREATE TABLE execution_logs (
  id SERIAL PRIMARY KEY,
  workflow_id VARCHAR(50) NOT NULL,
  n8n_execution_id VARCHAR(100),
  status VARCHAR(20), -- running, success, error
  triggered_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  error_message TEXT
);

CREATE INDEX idx_exec_status ON execution_logs(status);
CREATE INDEX idx_exec_triggered ON execution_logs(triggered_at DESC);
```

**Lý do đơn giản:**
- Không cần `workflow_configs` - hardcode 3 workflows trong code
- Không cần `import_history` - chỉ log vào console
- Focus vào functional, không phải data tracking

---

## 🔌 N8N INTEGRATION

### API đã có sẵn
- **URL:** `https://workflow.nexme.vn`
- **API Key:** `eyJhbGc...` (đã có)
- **3 Workflows:**
  - `nxdj3XeZAA4WscYp` - Player Progress
  - `9fD7jTNV9LbMYGJu` - Team Leaderboard
  - `Cxhi6bFhwv0XbUF4` - Zalo Captain

### Implementation
```typescript
// lib/n8n.ts
export async function triggerWorkflow(workflowId: string, data?: any) {
  const res = await fetch(
    `https://workflow.nexme.vn/api/v1/workflows/${workflowId}/execute`,
    {
      method: 'POST',
      headers: {
        'X-N8N-API-KEY': process.env.N8N_API_KEY!,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ data: data || {} }),
    }
  );
  return res.json();
}
```

---

## 📥 GOOGLE SHEETS INTEGRATION

### Sheet info
- **Sheet ID:** `1Z9nU5cQwEDeSKAn-Ba5HFpHUhQQyOoSxukaO7mG5DV4`
- **Format:** In Ảnh? | Vai Trò | Người chơi | Day 0-10 | Đội | zaloID_captain | avatar_url

### Workflow đơn giản
1. User paste Sheet ID + range vào form
2. Click "Import" → Fetch data từ Google Sheets API
3. Transform rows → Insert vào `bot_queue`
4. Hiển thị kết quả (X rows imported)

### Dependencies
```bash
npm install googleapis @google-cloud/local-auth
```

### Pseudo-code
```typescript
// lib/sheets.ts
import { google } from 'googleapis';

export async function importFromSheet(sheetId: string, range: string) {
  const auth = await authorize(); // Service account
  const sheets = google.sheets({ version: 'v4', auth });

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range: range,
  });

  const rows = response.data.values;
  const transformed = rows.map(row => ({
    bot_type: 'PLAYER', // hoặc TEAM tùy row
    status: 'pending',
    player_name: row[2], // Người chơi column
    team_id: row[9], // Đội column
    // ... map các fields khác
  }));

  await db.insert('bot_queue', transformed);
  return { imported: transformed.length };
}
```

---

## 🎨 UI/UX (Đơn giản)

### Dashboard Layout (1 page duy nhất)

```
┌─────────────────────────────────────────────────┐
│  n8n Dashboard MVP              [Refresh ↻]    │
├─────────────────────────────────────────────────┤
│                                                 │
│  📊 STATS                                       │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐          │
│  │Pending  │ │ Running │ │ Success │          │
│  │   12    │ │    3    │ │   145   │          │
│  └─────────┘ └─────────┘ └─────────┘          │
│                                                 │
│  🚀 WORKFLOWS                                   │
│  ┌───────────────────────────────────────────┐ │
│  │ 1. Render Player Progress                 │ │
│  │    [▶ Trigger]                             │ │
│  ├───────────────────────────────────────────┤ │
│  │ 2. Render Team Leaderboard                │ │
│  │    [▶ Trigger]                             │ │
│  ├───────────────────────────────────────────┤ │
│  │ 3. Send Zalo Captain                      │ │
│  │    [▶ Trigger]                             │ │
│  └───────────────────────────────────────────┘ │
│                                                 │
│  📥 IMPORT GOOGLE SHEETS                        │
│  ┌───────────────────────────────────────────┐ │
│  │ Sheet ID: [1Z9nU5cQwE...____]             │ │
│  │ Range:    [Sheet1!A2:N100]  [Import]      │ │
│  └───────────────────────────────────────────┘ │
│                                                 │
│  📋 QUEUE (bot_queue - latest 10)               │
│  ┌──┬────────┬─────────┬─────────────────────┐│
│  │ID│ Type   │ Status  │ Player/Team         ││
│  ├──┼────────┼─────────┼─────────────────────┤│
│  │45│ PLAYER │ pending │ John Doe            ││
│  │44│ TEAM   │ success │ Team A              ││
│  └──┴────────┴─────────┴─────────────────────┘│
└─────────────────────────────────────────────────┘
```

### Components (shadcn/ui)
- **Card** - Workflow cards, stats cards
- **Button** - Trigger buttons
- **Input** - Sheet ID, range inputs
- **Table** - Queue table
- **Badge** - Status badges

---

## ⏱️ BREAKDOWN 2 NGÀY

### 🗓️ DAY 1 (8 giờ) - Foundation + n8n

**Morning (4h):**
- [x] Setup Next.js 15 project (30m)
  ```bash
  npx create-next-app@latest dashboard --typescript --tailwind --app
  ```
- [x] Install shadcn/ui + components (30m)
  ```bash
  npx shadcn@latest init
  npx shadcn@latest add button card input table badge
  ```
- [x] Setup env variables (15m)
  ```env
  N8N_API_URL=https://workflow.nexme.vn
  N8N_API_KEY=eyJhbGc...
  DATABASE_URL=postgresql://...
  ```
- [x] Create database schema (30m)
  - Migration script cho `execution_logs` table
- [x] Implement n8n API client (1h)
  - `lib/n8n.ts` với `triggerWorkflow()` function
  - Test trigger bằng curl/Postman trước
- [x] Create API route `/api/trigger` (1h)

**Afternoon (4h):**
- [x] Build dashboard layout (1h)
  - Header, container, responsive grid
- [x] Implement WorkflowCard component (1.5h)
  - 3 cards hardcoded
  - Button trigger → call `/api/trigger`
  - Toast notification kết quả
- [x] Implement stats display (1h)
  - Query `execution_logs` để đếm status
  - API route `/api/queue` để lấy stats
- [x] Basic styling với Tailwind (30m)

**Deliverables Day 1:**
- ✅ Dashboard UI cơ bản
- ✅ Trigger workflows hoạt động
- ✅ Stats hiển thị đúng

---

### 🗓️ DAY 2 (8 giờ) - Google Sheets + Polish

**Morning (4h):**
- [x] Setup Google Sheets API (1h)
  - Create Service Account
  - Share sheet với service account email
  - Download credentials JSON
- [x] Implement `lib/sheets.ts` (1.5h)
  - `importFromSheet()` function
  - Data transformation logic
- [x] Create API route `/api/import` (1h)
- [x] Build GoogleSheetsImport component (30m)
  - Input fields + Import button

**Afternoon (4h):**
- [x] Implement QueueTable component (1.5h)
  - Query `bot_queue` table
  - Display latest 10 rows
  - Auto-refresh mỗi 5s
- [x] Connect all pieces (1h)
  - Test full flow: Import → Trigger → View queue
- [x] Error handling cơ bản (30m)
  - Try-catch blocks
  - Toast error messages
- [x] Polish UI (30m)
  - Spacing, colors, loading states
- [x] Deploy to Vercel (30m)
  - `vercel --prod`
  - Add env variables

**Deliverables Day 2:**
- ✅ Google Sheets import hoạt động
- ✅ Queue monitor real-time
- ✅ Dashboard deployed

---

## 🚀 TECH STACK

### Frontend
- **Framework:** Next.js 15 (App Router)
- **UI:** shadcn/ui + Tailwind CSS
- **State:** React Query (optional, có thể dùng useState)
- **Icons:** Lucide React (có sẵn với shadcn)

### Backend
- **API:** Next.js Route Handlers
- **Database:** PostgreSQL (shared với n8n)
- **ORM:** Drizzle ORM hoặc `pg` trực tiếp (nhanh hơn cho MVP)

### External APIs
- **n8n REST API** - Trigger workflows
- **Google Sheets API** - Import data

### Deployment
- **Platform:** Vercel (free tier)

---

## 📝 API ENDPOINTS

### POST /api/trigger
Trigger workflow
```json
Request:
{
  "workflowId": "nxdj3XeZAA4WscYp",
  "data": { "player_id": "123" }
}

Response:
{
  "success": true,
  "executionId": "exec_abc123",
  "message": "Workflow triggered"
}
```

### POST /api/import
Import Google Sheets
```json
Request:
{
  "sheetId": "1Z9nU5cQwE...",
  "range": "Sheet1!A2:N100"
}

Response:
{
  "success": true,
  "imported": 42,
  "errors": []
}
```

### GET /api/queue
Lấy queue + stats
```json
Response:
{
  "stats": {
    "pending": 12,
    "running": 3,
    "success": 145,
    "error": 2
  },
  "queue": [
    {
      "id": 45,
      "bot_type": "PLAYER",
      "status": "pending",
      "player_name": "John Doe",
      "created_at": "2026-01-05T10:00:00Z"
    }
  ]
}
```

---

## 🔒 SECURITY (Tối thiểu)

- ✅ N8N API key trong `.env.local` (không commit)
- ✅ Google credentials JSON trong env variable
- ✅ CORS configuration (chỉ allow own domain)
- ❌ Bỏ qua: Authentication, rate limiting (cho MVP)

---

## 🧪 TESTING (Manual testing chủ yếu)

### Test Cases
1. **Trigger workflow:**
   - Click button → Check toast notification
   - Check n8n dashboard → Execution xuất hiện

2. **Import Google Sheets:**
   - Paste Sheet ID + range → Click Import
   - Check database → Rows được insert vào `bot_queue`

3. **View queue:**
   - Refresh page → Table hiển thị latest entries
   - Stats counters update đúng

---

## 📦 DELIVERABLES

### End of Day 1
- [ ] Next.js project setup hoàn chỉnh
- [ ] n8n trigger hoạt động (test với 1 workflow)
- [ ] Dashboard UI cơ bản (3 workflow cards + stats)
- [ ] Database schema deployed

### End of Day 2
- [ ] Google Sheets import functional
- [ ] Queue table hiển thị data real-time
- [ ] Dashboard deployed on Vercel
- [ ] Documentation: README với setup instructions

---

## 🎯 SUCCESS CRITERIA

MVP được coi là thành công khi:
1. ✅ Admin có thể trigger 3 workflows từ UI
2. ✅ Admin có thể import data từ Google Sheets
3. ✅ Dashboard hiển thị stats và queue status
4. ✅ Deployed và accessible từ internet

---

## 🚨 RISKS & MITIGATIONS

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Google Sheets API setup phức tạp | Medium | High | Dùng Service Account (đơn giản hơn OAuth) |
| Database connection issues | Low | High | Test kết nối sớm trong Day 1 |
| n8n API authentication fail | Low | High | Verify API key ngay từ đầu |
| Timeline không đủ | Medium | Medium | Bỏ qua nice-to-haves, focus core |

---

## 📚 REFERENCES

- [Next.js 15 Docs](https://nextjs.org/docs)
- [shadcn/ui Components](https://ui.shadcn.com/docs)
- [n8n REST API](https://docs.n8n.io/api/)
- [Google Sheets API](https://developers.google.com/sheets/api)
- [Drizzle ORM](https://orm.drizzle.team/docs)

---

## 📌 NEXT STEPS

1. ✅ Review kế hoạch với user
2. ⏳ Setup development environment
3. ⏳ Start Day 1 implementation
4. ⏳ Daily check-in để adjust scope nếu cần

---

**Kế hoạch tạo:** 05/01/2026 11:33
**Người lập:** Claude Code
**Trạng thái:** ✅ Ready for implementation
