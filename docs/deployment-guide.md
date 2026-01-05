# 🚀 Deployment Guide - MVP Dashboard V2

Hướng dẫn deploy dashboard lên Vercel từng bước.

## 📋 Checklist Trước Khi Deploy

- [ ] Database migration đã chạy trên Supabase
- [ ] Code đã push lên GitHub
- [ ] Vercel CLI đã cài đặt
- [ ] Đã login Vercel CLI

---

## Bước 1: Chạy Database Migration

### 1.1. Truy cập Supabase Dashboard
1. Đi đến: https://app.supabase.com
2. Chọn project: `vkhqqybnvnoagxqglnkn`
3. Vào **SQL Editor**

### 1.2. Chạy Migration
Copy toàn bộ nội dung file `dashboard/db/full-migration.sql` và paste vào SQL Editor.

Click **Run** để thực thi.

**Expected Output:**
```
✅ Migration completed successfully!
Tables created: user, session, account, verification, teams, captains, players, daily_weights, execution_logs
```

### 1.3. Verify Tables
Chạy query kiểm tra:
```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
```

**Phải thấy các tables:**
- `user` (Better Auth)
- `session` (Better Auth)
- `account` (Better Auth)
- `verification` (Better Auth)
- `teams`
- `captains`
- `players`
- `daily_weights`
- `execution_logs`
- `bot_queue` (đã có từ trước)

---

## Bước 2: Deploy lên Vercel

### Option A: Deploy qua Vercel CLI (Recommended)

#### 2.1. Install Vercel CLI (nếu chưa có)
```bash
npm install -g vercel
```

#### 2.2. Login Vercel
```bash
vercel login
```

#### 2.3. Navigate to Dashboard Directory
```bash
cd dashboard
```

#### 2.4. Deploy (First Time)
```bash
vercel
```

**Trả lời các câu hỏi:**
- Set up and deploy? → **Yes**
- Which scope? → Chọn account của bạn
- Link to existing project? → **No**
- What's your project's name? → `marathon-dashboard` (hoặc tên khác)
- In which directory is your code located? → `.` (press Enter)
- Want to override settings? → **No**

Vercel sẽ:
1. Upload code
2. Build project
3. Deploy lên preview URL

#### 2.5. Set Environment Variables

**Cách 1: Dùng Script (Nhanh)**
```bash
cd ..
./scripts/setup-vercel-env.sh
```

**Cách 2: Manual qua CLI**
```bash
vercel env add N8N_API_URL production
# Paste value, press Enter
# Repeat cho tất cả env vars
```

**Cách 3: Copy-Paste vào Vercel Dashboard**
```bash
./scripts/generate-vercel-env.sh
# Copy output và paste vào Vercel Dashboard
```

#### 2.6. Update App URLs
Sau khi deploy, bạn sẽ có URL dạng: `https://marathon-dashboard-xxx.vercel.app`

Update 2 env vars:
```bash
vercel env add BETTER_AUTH_URL production
# Paste: https://marathon-dashboard-xxx.vercel.app

vercel env add NEXT_PUBLIC_APP_URL production
# Paste: https://marathon-dashboard-xxx.vercel.app
```

#### 2.7. Deploy Production
```bash
vercel --prod
```

---

### Option B: Deploy qua Vercel Dashboard (Easier)

#### 2.1. Import Repository
1. Đi đến: https://vercel.com/new
2. Click **Import Git Repository**
3. Chọn repo: `beanbean/Gen_image`
4. Click **Import**

#### 2.2. Configure Project
- **Framework Preset:** Next.js
- **Root Directory:** `dashboard`
- **Build Command:** `npm run build`
- **Output Directory:** `.next`

#### 2.3. Add Environment Variables
Click **Environment Variables** tab.

Chạy script để get list:
```bash
./scripts/generate-vercel-env.sh
```

Copy từng dòng vào Vercel UI (Key = Value format).

**Environments:** Chọn tất cả (Production, Preview, Development)

#### 2.4. Deploy
Click **Deploy**

Vercel sẽ build và deploy. Đợi khoảng 2-3 phút.

#### 2.5. Update App URLs
Sau khi deploy xong, copy Production URL (e.g., `marathon-dashboard.vercel.app`)

Vào **Settings → Environment Variables**, update:
- `BETTER_AUTH_URL` = `https://your-app.vercel.app`
- `NEXT_PUBLIC_APP_URL` = `https://your-app.vercel.app`

Click **Redeploy** để apply changes.

---

## Bước 3: Test Production

### 3.1. Access App
Mở URL production: `https://your-app.vercel.app`

Phải redirect đến `/login`

### 3.2. Test Registration Flow
1. Click **Đăng ký ngay**
2. Fill form:
   - Username: `test_captain`
   - Email: `test@example.com`
   - Password: `test1234`
   - Team Name: `Đội Test`
   - Zalo ID: `0123456789`
3. Click **Đăng ký**
4. Phải redirect về `/login`

### 3.3. Test Login
1. Login với credentials vừa tạo
2. Phải vào được `/dashboard`
3. Thấy thông tin team

### 3.4. Test Add Player
1. Click **+ Thêm thành viên**
2. Nhập tên: `Nguyễn Văn A`
3. Upload avatar (optional)
4. Click **Thêm thành viên**
5. Phải thấy player trong danh sách

### 3.5. Test Weight Input
1. Chọn Day 0
2. Nhập cân nặng cho player: `70.5`
3. Click **Lưu cân nặng**
4. Toast hiển thị success

### 3.6. Test Image Generator
1. Check ✓ Player Progress
2. Check ✓ Team Leaderboard
3. Click **Tạo và gửi (2)**
4. Toast hiển thị success
5. Verify workflows triggered (check n8n dashboard)

---

## 🔧 Troubleshooting

### Build Failed: "Module not found: 'pg'"
**Fix:** Add `@types/pg` to dependencies (đã có trong package.json)

### Database Connection Error
**Check:**
1. `DATABASE_URL` env var đúng chưa?
2. Supabase database có running không?
3. Migration đã chạy chưa?

### Better Auth Error: "Failed to initialize database adapter"
**Fix:**
1. Run `db/full-migration.sql` trên Supabase
2. Verify `user`, `session` tables exist

### Sharp Build Error
**Fix:** Sharp đã được config để chỉ chạy server-side (API routes), không có issue này nữa.

### R2 Upload Failed
**Check:**
1. R2 credentials đúng chưa?
2. Bucket `marathon-images` đã tạo chưa?
3. Public URL đã config chưa?

---

## 📊 Monitoring

### Vercel Logs
```bash
vercel logs --prod
```

### Database Queries
Vào Supabase Dashboard → Database → Query Performance

### n8n Workflows
Check executions tại: https://workflow.nexme.vn

---

## ✅ Success Criteria

Deploy thành công khi:

- ✅ App accessible tại production URL
- ✅ Login/Register flow hoạt động
- ✅ Thêm player với avatar upload
- ✅ Nhập cân nặng thành công
- ✅ Trigger workflows thành công
- ✅ Không có errors trong Vercel logs

---

## 🎯 Next Steps After Deploy

1. **Custom Domain** (optional):
   - Vercel Dashboard → Settings → Domains
   - Add your custom domain

2. **Analytics** (optional):
   - Vercel Dashboard → Analytics
   - Enable Web Analytics

3. **Monitoring**:
   - Setup error tracking (Sentry, LogRocket)
   - Monitor database queries

4. **Testing**:
   - Test với real data
   - Invite đội trưởng thật để test

---

**Deployment Owner:** @beanbean
**Last Updated:** 2026-01-05
**Status:** Ready for Production ✅
