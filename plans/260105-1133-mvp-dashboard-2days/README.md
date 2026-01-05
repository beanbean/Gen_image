# Tóm tắt Kế hoạch MVP Dashboard 2 Ngày

📅 **Ngày:** 05/01/2026
⏱️ **Timeline:** 2 ngày (16 giờ làm việc)
✅ **Trạng thái:** Sẵn sàng thực hiện

---

## 🎯 MỤC TIÊU

Xây dựng MVP dashboard trong **2 ngày** với 3 tính năng chính:
1. ✅ Trigger 3 workflows n8n từ UI
2. ✅ Import data từ Google Sheets vào bot_queue
3. ✅ Dashboard stats + queue monitor real-time

---

## 📊 SCOPE

### Làm gì (Must-have)
- ✅ Next.js 15 dashboard với shadcn/ui
- ✅ 3 workflow cards với trigger buttons
- ✅ Google Sheets import form
- ✅ Queue table real-time
- ✅ Stats counters (pending/running/success/error)
- ✅ Deploy to Vercel

### KHÔNG làm gì (Out of scope)
- ❌ Authentication/Authorization
- ❌ Complex logging/history tracking
- ❌ Charts/graphs
- ❌ Advanced filtering/search
- ❌ Mobile responsive
- ❌ Retry mechanisms

---

## 🗓️ BREAKDOWN

### Day 1 (8h) - Foundation + n8n
**Morning (4h):**
- Setup Next.js 15 + shadcn/ui (1h)
- Database schema (30m)
- n8n API client (1h)
- API route `/api/trigger` (1h)
- Test trigger với curl (30m)

**Afternoon (4h):**
- Dashboard layout (1h)
- WorkflowCard component (1.5h)
- StatsDisplay component (1h)
- Basic styling (30m)

**Deliverables:**
- ✅ Dashboard UI cơ bản
- ✅ Trigger workflows hoạt động
- ✅ Stats hiển thị đúng

---

### Day 2 (8h) - Google Sheets + Deploy
**Morning (4h):**
- Google Sheets API setup (1h)
- `lib/sheets.ts` implementation (1.5h)
- API route `/api/import` (1h)
- GoogleSheetsImport component (30m)

**Afternoon (4h):**
- QueueTable component (1.5h)
- Integration testing (1h)
- Error handling (30m)
- UI polish (30m)
- Deploy to Vercel (30m)
- Documentation (30m)

**Deliverables:**
- ✅ Google Sheets import working
- ✅ Queue monitor real-time
- ✅ Dashboard deployed

---

## 🏗️ KIẾN TRÚC

```
Next.js App (Vercel)
├── app/
│   ├── page.tsx                    # Dashboard chính (1 page)
│   └── api/
│       ├── trigger/route.ts        # Trigger workflows
│       ├── import/route.ts         # Import Google Sheets
│       └── queue/route.ts          # Stats + queue data
├── components/
│   ├── WorkflowCard.tsx            # 3 workflow cards
│   ├── StatsDisplay.tsx            # Stats counters
│   ├── GoogleSheetsImport.tsx      # Import form
│   └── QueueTable.tsx              # Queue monitor
└── lib/
    ├── n8n.ts                      # n8n API client
    ├── sheets.ts                   # Google Sheets API
    └── db.ts                       # PostgreSQL client
```

---

## 📊 DATABASE

### Table mới (chỉ 1 table)
```sql
CREATE TABLE execution_logs (
  id SERIAL PRIMARY KEY,
  workflow_id VARCHAR(50) NOT NULL,
  n8n_execution_id VARCHAR(100),
  status VARCHAR(20),
  triggered_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  error_message TEXT
);
```

### Sử dụng lại
- ✅ `bot_queue` - Đã tồn tại

---

## 🔌 INTEGRATIONS

### n8n REST API
- **URL:** `https://workflow.nexme.vn`
- **Workflows:**
  - `nxdj3XeZAA4WscYp` - Player Progress
  - `9fD7jTNV9LbMYGJu` - Team Leaderboard
  - `Cxhi6bFhwv0XbUF4` - Zalo Captain

### Google Sheets
- **Sheet ID:** `1Z9nU5cQwEDeSKAn-Ba5HFpHUhQQyOoSxukaO7mG5DV4`
- **Auth:** Service Account
- **Columns:** In Ảnh? | Vai Trò | Người chơi | Day 0-10 | Đội | zaloID_captain

---

## 🚀 TECH STACK

| Layer | Tech |
|-------|------|
| Framework | Next.js 15 (App Router) |
| UI | shadcn/ui + Tailwind CSS |
| Database | PostgreSQL (shared) |
| ORM | pg client (no ORM) |
| Deployment | Vercel |
| APIs | n8n REST + Google Sheets |

---

## ✅ SUCCESS CRITERIA

MVP thành công khi:
1. ✅ Admin click button → workflow chạy
2. ✅ Admin paste Sheet ID → data import vào DB
3. ✅ Dashboard hiển thị stats real-time
4. ✅ Queue table update tự động
5. ✅ Deployed và accessible từ internet

---

## 📚 FILES CREATED

```
plans/260105-1133-mvp-dashboard-2days/
├── plan.md              # Kế hoạch tổng quan (14KB)
├── phase-01-day1.md     # Chi tiết Day 1 (15KB)
├── phase-02-day2.md     # Chi tiết Day 2 (19KB)
└── README.md            # File này
```

---

## 🎬 NEXT STEPS

1. **Review kế hoạch** (5 phút)
   - Đọc [plan.md](./plan.md)
   - Xác nhận scope đúng yêu cầu

2. **Chuẩn bị môi trường** (15 phút)
   - Verify database credentials
   - Test n8n API key
   - Tạo Google Service Account

3. **Bắt đầu Day 1** (8 giờ)
   - Theo [phase-01-day1.md](./phase-01-day1.md)
   - Checklist từng bước
   - Commit code sau mỗi section

4. **Tiếp tục Day 2** (8 giờ)
   - Theo [phase-02-day2.md](./phase-02-day2.md)
   - Test integration
   - Deploy to Vercel

---

## 🚨 RISKS

| Risk | Impact | Mitigation |
|------|--------|------------|
| Google Sheets API setup phức tạp | High | Dùng Service Account (đơn giản) |
| Database connection issues | High | Test connection sớm |
| Timeline không đủ | Medium | Bỏ nice-to-haves, focus core |
| n8n API auth fail | High | Verify API key trước |

---

## 📞 SUPPORT

Nếu gặp vấn đề:
- 🔍 Check [plan.md](./plan.md) section tương ứng
- 📖 Đọc phase guides chi tiết
- 🐛 Debug với test scripts
- 💬 Ask questions nếu cần clarify

---

**Kế hoạch tạo:** 05/01/2026 11:33
**Timeline:** 2 ngày (vs 4 tuần kế hoạch cũ)
**Trạng thái:** ✅ Ready to start Day 1

🚀 **LET'S BUILD!**
