# Kế hoạch Implementation - Dashboard Quản lý n8n Workflows

📅 **Ngày tạo:** 05/01/2026
✅ **Trạng thái:** Sẵn sàng implementation

---

## 🎯 Mục tiêu

Xây dựng web dashboard để:
- Kích hoạt workflows n8n qua API
- Quản lý và monitor workflows
- Import dữ liệu từ Google Sheets
- Tự động tạo ảnh khi admin tick checkbox

---

## 🏗️ Kiến trúc

### Tech Stack
- **Frontend:** Next.js 15 + shadcn/ui + Tailwind CSS
- **Backend:** Next.js API Routes + PostgreSQL
- **Integration:** n8n REST API + Google Sheets API
- **Deployment:** Vercel

### n8n Workflows
| Workflow ID | Tên | Chức năng |
|------------|-----|-----------|
| `nxdj3XeZAA4WscYp` | 1.Render_image_progress_player | Render tiến độ cá nhân |
| `9fD7jTNV9LbMYGJu` | 2.Render_team_leaderboard | Render bảng xếp hạng đội |
| `Cxhi6bFhwv0XbUF4` | 3.send_image_zalo_captain | Gửi ảnh qua Zalo |

### Google Sheets
- **Sheet ID:** `1Z9nU5cQwEDeSKAn-Ba5HFpHUhQQyOoSxukaO7mG5DV4`
- **Data:** In Ảnh?, Vai Trò, Người chơi, Day 0-10, Đội, zaloID_captain, avatar_url

---

## 📊 Database Schema

### Tables mới
```sql
-- Cấu hình workflows
CREATE TABLE workflow_configs (
  id SERIAL PRIMARY KEY,
  workflow_id VARCHAR(255) UNIQUE NOT NULL,
  workflow_name VARCHAR(255) NOT NULL,
  workflow_type VARCHAR(50) NOT NULL,
  n8n_workflow_id VARCHAR(255),
  is_active BOOLEAN DEFAULT true,
  config JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Logs execution
CREATE TABLE execution_logs (
  id SERIAL PRIMARY KEY,
  workflow_id VARCHAR(255) NOT NULL,
  execution_id VARCHAR(255),
  status VARCHAR(50),
  input_data JSONB,
  output_data JSONB,
  started_at TIMESTAMP,
  completed_at TIMESTAMP
);

-- Import history
CREATE TABLE import_history (
  id SERIAL PRIMARY KEY,
  sheet_id VARCHAR(255),
  rows_imported INTEGER,
  import_status VARCHAR(50),
  imported_at TIMESTAMP DEFAULT NOW(),
  data_snapshot JSONB
);
```

---

## 🗺️ Roadmap

### Phase 1: Foundation (Week 1)
- [ ] Setup Next.js 15 project
- [ ] Configure Tailwind + shadcn/ui
- [ ] Setup database (Drizzle ORM)
- [ ] Test n8n REST API
- [ ] Implement basic workflow trigger

### Phase 2: Core Features (Week 2)
- [ ] Build dashboard layout
- [ ] Workflow list & trigger UI
- [ ] Queue monitor (bot_queue)
- [ ] Real-time status polling
- [ ] Execution logs viewer

### Phase 3: Google Sheets (Week 3)
- [ ] Setup Google Sheets API
- [ ] Implement sheet reader
- [ ] Build import UI
- [ ] Data transformation
- [ ] Import history tracking

### Phase 4: Polish & Deploy (Week 4)
- [ ] Add charts/graphs
- [ ] Filters & search
- [ ] Error handling
- [ ] Toast notifications
- [ ] Responsive design
- [ ] Deploy to Vercel

---

## 🔑 Tính năng chính

### Dashboard Overview
```
┌─────────────────────────────────────────┐
│  📊 Statistics                          │
│  Active: 3 | Pending: 12 | Success: 145│
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│  🚀 Workflows                           │
│  • Render Player Progress   [▶ Trigger]│
│  • Render Team Leaderboard  [▶ Trigger]│
│  • Send Zalo Captain        [▶ Trigger]│
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│  📥 Import Google Sheets                │
│  [Sheet URL] [Range] [Import Button]   │
│  ☑ Auto-trigger workflows after import │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│  📋 Queue Monitor                       │
│  ID | Type   | Status  | Created       │
│  45 | PLAYER | pending | 2m ago        │
│  44 | TEAM   | success | 5m ago        │
└─────────────────────────────────────────┘
```

---

## 📚 Tài liệu

Chi tiết kế hoạch:
- 📄 [Kế hoạch chi tiết](./260105-n8n-dashboard-implementation-plan.md)
- 🔧 [n8n Workflows Config](../docs/n8n-workflows-config.md)
- 📊 [Google Sheets Integration](../docs/google-sheets-integration.md)

---

## ⚡ Quick Start

### Environment Setup
```bash
# .env.local
N8N_API_URL=https://workflow.nexme.vn
N8N_API_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
DATABASE_URL=postgresql://user:pass@localhost:5432/db
GOOGLE_SHEETS_CREDENTIALS={"type":"service_account",...}
```

### Development
```bash
# Clone project
git clone <repo-url>

# Install dependencies
npm install

# Setup database
npm run db:push

# Start dev server
npm run dev
```

---

## 🎬 User Flow

```
1. Admin nhập data vào Google Sheet
   ↓
2. Admin mở Dashboard → Import từ Google Sheets
   ↓
3. Dashboard fetch data, preview trước khi import
   ↓
4. Admin tick "In Ảnh?" hoặc bấm "Tạo Ảnh"
   ↓
5. Dashboard trigger n8n workflows
   ↓
6. n8n render ảnh + gửi qua Zalo
   ↓
7. Dashboard hiển thị logs & status real-time
```

---

## 📞 API Endpoints

### Trigger Workflow
```bash
POST /api/workflows/trigger
{
  "workflowId": "nxdj3XeZAA4WscYp",
  "data": { "player_id": "123" }
}
```

### Import Google Sheets
```bash
POST /api/import/google-sheets
{
  "sheetId": "1Z9nU5cQwEDeSKAn-Ba5HFpHUhQQyOoSxukaO7mG5DV4",
  "range": "Sheet1!A1:Z100",
  "autoTrigger": true
}
```

### Get Queue Status
```bash
GET /api/queue?status=pending&limit=50
```

---

## ✅ Ready to Implement

Kế hoạch đã hoàn chỉnh với:
- ✅ Tech stack đã chọn
- ✅ n8n workflows đã identify
- ✅ Google Sheets structure đã rõ
- ✅ Database schema thiết kế xong
- ✅ API endpoints spec sẵn sàng
- ✅ UI/UX mockup hoàn chỉnh

**Bắt đầu Phase 1?** 🚀
