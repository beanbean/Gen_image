# 🚨 BÁO CÁO KHẨN CẤP - n8n Workflows Đang Crash Liên Tục

**Thời gian:** 2026-01-04 05:20 AM
**Mức độ:** 🔴 CRITICAL

---

## 📊 TÌNH HÌNH HIỆN TẠI

### ✅ PHẦN TỐT:
- Queue Supabase hoạt động bình thường
- Tất cả messages đã được gửi (status: "sent")
- Không có pending items tồn đọng
- Workflow 3 vẫn chạy schedule mỗi phút

### 🚨 PHẦN XẤU:
- **10 EXECUTIONS BỊ CRASHED/ERROR** trong 3 giờ qua
- Workflows crash sau 4 phút → timeout
- Mỗi lần crash chiếm tài nguyên VPS trong 4 phút

---

## 📋 CHI TIẾT CRASHED EXECUTIONS

### BATCH 1: Từ 02:40 - 02:46 (5 crashes)
| ID | Workflow | Mode | Start | End | Duration |
|---|---|---|---|---|---|
| 283853 | WF3 (Sender) | trigger | 02:40:09 | 02:46:24 | 6m15s |
| 283854 | WF3 (Sender) | trigger | 02:40:09 | 02:46:24 | 6m15s |
| 283855 | WF3 (Sender) | trigger | 02:41:00 | 02:46:24 | 5m24s |
| 283856 | WF3 (Sender) | trigger | 02:42:00 | 02:46:24 | 4m24s |
| 283857 | WF2 (Team) | **manual** | 02:42:48 | 02:46:24 | 3m36s |

### BATCH 2: 03:58 (1 crash)
| ID | Workflow | Mode | Start | End | Duration |
|---|---|---|---|---|---|
| 283934 | WF3 (Sender) | trigger | 03:58:00 | 03:58:00 | ~instant |

### BATCH 3: 04:10 - 04:14 (1 error)
| ID | Workflow | Mode | Start | End | Duration |
|---|---|---|---|---|---|
| 283946 | WF1 (Personal) | **manual** | 04:10:31 | 04:14:34 | 4m03s |

### BATCH 4: 05:14 - 05:18 (3 crashes) ⚠️ GẦN ĐÂY NHẤT
| ID | Workflow | Mode | Start | End | Duration |
|---|---|---|---|---|---|
| 284016 | WF2 (Team) | **manual** | 05:14:35 | 05:18:34 | 3m59s |
| 284017 | WF3 (Sender) | trigger | 05:14:06 | 05:18:03 | 3m57s |
| 284018 | WF3 (Sender) | trigger | 05:14:05 | 05:18:03 | 3m58s |

---

## 🔍 PHÂN TÍCH NGUYÊN NHÂN

### 1. **Workflow 3 (Sender) - BỊ CRASH NHIỀU NHẤT (7/10 crashes)**

**Vấn đề:**
- Schedule trigger mỗi phút
- Nếu queue có nhiều items → loop lâu
- Chạy quá 4 phút → n8n timeout/crash

**Nguyên nhân:**
```
RPC: Pop Queue (10 items)
  → Loop Over Items
    → Parse payload
    → Gửi Zalo (có thể bị slow/timeout)
    → Update status
  → Nếu có 10 items * 20s/item = 200s (3.3 phút)
```

**Giải pháp:**
- ✅ Giảm batch size: 10 → 3 items
- ✅ Thêm timeout cho Zalo node: 10s
- ✅ Thêm execution timeout: 180s (3 phút)

### 2. **Workflow 1 & 2 (Manual) - CRASH KHI CÓ NHIỀU DATA**

**Vấn đề:**
- Ai đó click "Execute Workflow" manual
- Google Sheets có nhiều rows
- Loop qua tất cả + Wait 10s/item
- 20 rows * 10s = 200s → timeout

**Giải pháp:**
- ⚠️ **ĐỪNG CHẠY MANUAL KHI CÓ > 5 ROWS**
- ✅ Test với 3-5 rows trước
- ✅ Thêm schedule trigger thay vì manual
- ✅ Giảm wait time: 10s → 3s

---

## 🎯 HÀNH ĐỘNG KHẨN CẤP (LÀM NGAY)

### BƯỚC 1: Stop Workflows Ngay (5 phút)

1. Vào n8n UI: https://workflow.nexme.vn/
2. **Deactivate Workflow 3** tạm thời:
   - Vào WF3: https://workflow.nexme.vn/workflow/Cxhi6bFhwv0XbUF4
   - Click "Active" → OFF
3. Clear crashed executions:
   - Vào Executions: https://workflow.nexme.vn/executions
   - Filter: status = "crashed" hoặc "error"
   - Select all → Delete

### BƯỚC 2: Fix Workflow 3 (10 phút)

**A. Giảm Batch Size:**
1. Vào node **"RPC: Pop Queue"**
2. Tìm parameter `p_limit`
3. Đổi từ **10** → **3**

**B. Thêm Timeout cho Zalo Node:**
1. Click node **"Zalo: Gửi Ảnh"**
2. Settings → Advanced
3. Add timeout: **10000** ms (10 giây)

**C. Thêm Execution Timeout:**
1. Workflow Settings (bánh răng)
2. Execution Timeout: **180** (3 phút)
3. Save

**D. Activate lại:**
- Click "Active" → ON

### BƯỚC 3: Fix Workflow 1 & 2 (10 phút)

**Cho cả 2 workflows:**

1. Tìm node **"Wait"**
2. Đổi `amount` từ **10** → **3**

3. Tìm node **"Loop Over Items"**
4. Set batch size = **3**

5. Workflow Settings:
   - Execution Timeout: **300** (5 phút)

6. **QUAN TRỌNG:**
   - ❌ ĐỪNG click "Execute Workflow" nữa
   - ✅ Thêm Schedule Trigger (daily 8PM)
   - ✅ Hoặc test với MAX 3 rows trong Google Sheet

---

## 📊 MONITORING SAU KHI FIX

### Kiểm tra mỗi 30 phút:

1. **Check Executions:**
   ```
   https://workflow.nexme.vn/executions
   ```
   - Xem có crashes mới không
   - Average time < 60s là OK

2. **Check Queue:**
   ```sql
   SELECT COUNT(*) FROM bot_queue WHERE status = 'pending';
   ```
   - Nếu > 20 items → có vấn đề

3. **Check Workflow 3 Success Rate:**
   - Vào WF3 executions
   - Success rate phải > 95%
   - Average time < 30s

---

## 🔐 NGUYÊN TẮC ĐỂ TRÁNH CRASH

### ❌ ĐỪNG BAO GIỜ:
1. Click "Execute Workflow" manual khi Google Sheet > 5 rows
2. Chạy 2 workflows cùng lúc
3. Để queue pending > 50 items
4. Tăng wait time > 5s

### ✅ NÊN LÀM:
1. Dùng Schedule Trigger (tự động)
2. Test với 3 rows trước
3. Monitor executions thường xuyên
4. Clear crashed executions hàng ngày

---

## 📞 HỖ TRỢ KHẨN CẤP

### Nếu VẪN bị crash sau khi fix:

**Option 1: Restart n8n (Via Nexme Dashboard)**
1. Vào https://dashboard.nexme.vn/
2. Tìm service `n8n`
3. Click "Restart"
4. Đợi 2 phút

**Option 2: Clear Queue**
```sql
-- Vào Supabase SQL Editor
UPDATE bot_queue
SET status = 'cancelled',
    last_error = 'Manual clear due to system overload'
WHERE status = 'pending';
```

**Option 3: Scale Down (Tạm thời)**
- Deactivate tất cả workflows
- Clear queue
- Activate lại từng workflow một
- Monitor từng workflow riêng

---

## 📈 METRICS GHI NHẬN

- **Total crashes (3h):** 10
- **Workflow 3 crashes:** 7 (70%)
- **Manual trigger crashes:** 3 (30%)
- **Average crash time:** ~4 phút
- **Queue status:** ✅ Healthy (all sent)
- **Impact:** VPS bị chiếm tài nguyên 40+ phút tổng

---

## 🎯 KẾT LUẬN

**Tình trạng:** 🔴 CRITICAL - Cần fix ngay

**Nguyên nhân chính:**
1. Workflow 3 process quá nhiều items (10) → timeout
2. Workflow 1 & 2 chạy manual với data lớn → crash
3. Wait time quá cao (10s)

**Giải pháp:**
1. ✅ Giảm batch size: 10 → 3
2. ✅ Giảm wait time: 10s → 3s
3. ✅ Thêm timeout cho tất cả workflows
4. ⚠️ STOP chạy manual với data lớn

**Ưu tiên:**
1. Fix Workflow 3 NGAY (đang crash nhiều nhất)
2. Deactivate WF1 & WF2 tạm thời
3. Monitor 24h sau khi fix

---

**Last Updated:** 2026-01-04 05:20 AM
**Next Check:** Sau 30 phút fix xong
