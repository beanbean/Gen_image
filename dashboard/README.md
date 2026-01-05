# n8n Dashboard MVP

Dashboard để quản lý n8n workflows cho dự án Gen_image.

## 🎯 Features

- ✅ Trigger 3 workflows n8n từ UI
- ✅ Monitor queue status real-time (bot_queue)
- ✅ View execution stats (pending/running/success/error)
- ⏳ Import data từ Google Sheets (Day 2)

## 🏗️ Tech Stack

- **Framework:** Next.js 15 (App Router) + TypeScript
- **UI:** shadcn/ui + Tailwind CSS
- **Database:** PostgreSQL (Supabase - shared với n8n)
- **APIs:** n8n REST API
- **Deployment:** Vercel (planned)

## 📦 Installation

```bash
# Install dependencies
npm install

# Setup environment variables
cp .env.example .env.local
# Edit .env.local với credentials

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## 🔑 Environment Variables

```env
# n8n Configuration
N8N_API_URL=https://workflow.nexme.vn
N8N_API_KEY=your_n8n_api_key

# Database
DATABASE_URL=postgresql://user:pass@host:5432/db

# Supabase (optional)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key
```

## 📊 Database Setup

```bash
# Run migration (creates execution_logs table)
psql $DATABASE_URL < db/migration.sql
```

## 🚀 Usage

### Trigger Workflow
1. Click "▶ Trigger" button on workflow card
2. Toast notification confirms success
3. Execution tracked in database

### Monitor Queue
- Stats auto-refresh every 5s
- Queue table shows latest 10 items

## 📁 Project Structure

```
dashboard/
├── src/app/
│   ├── page.tsx              # Main dashboard
│   └── api/
│       ├── trigger/route.ts  # Trigger workflow
│       └── queue/route.ts    # Fetch stats + queue
├── src/components/
│   ├── WorkflowCard.tsx
│   ├── StatsDisplay.tsx
│   └── QueueTable.tsx
├── src/lib/
│   ├── n8n.ts               # n8n API client
│   └── db.ts                # PostgreSQL client
└── db/migration.sql
```

## 🔌 n8n Workflows

| ID | Name | Type |
|----|------|------|
| `nxdj3XeZAA4WscYp` | Render Player Progress | PLAYER |
| `9fD7jTNV9LbMYGJu` | Render Team Leaderboard | TEAM |
| `Cxhi6bFhwv0XbUF4` | Send Zalo Captain | ZALO |

## 🧪 Testing

```bash
# Test build
npm run build

# Test DB connection
npx tsx test-db.ts
```

## 📝 Day 1 Progress

✅ **Completed:**
- Next.js project setup
- n8n API integration
- Database schema + client
- Dashboard UI components
- Workflow trigger functionality
- Stats + queue monitoring
- Dev server running

## 📝 Day 2 Tasks

⏳ **Pending:**
- Google Sheets API integration
- Import form component
- Deploy to Vercel
- Documentation updates

---

**Status:** Day 1 Complete ✅ | Day 2 Pending ⏳
