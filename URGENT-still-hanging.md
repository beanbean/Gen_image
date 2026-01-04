# 🚨 TÌM THẤY NGUYÊN NHÂN TREO MÁY!

**Thời gian phát hiện:** 2026-01-04 06:35 AM

---

## ⚠️ VẤN ĐỀ THẬT SỰ

Mặc dù đã fix wait time, timeout, batch size... **NHƯNG VẪN BỊ ERROR** khi schedule triggers chạy!

### 📊 EXECUTIONS BỊ ERROR SAU KHI FIX:

**Workflow 1 (Personal Progress):**
```
ID: 284061
Status: ERROR ❌
Mode: trigger (schedule tự động chạy)
Time: 05:58:16 → 06:00:32
Duration: 2 phút 16 giây
```

**Workflow 2 (Team Leaderboard):**
```
ID: 284056
Status: ERROR ❌
Mode: trigger (schedule tự động chạy)
Time: 05:54:14 → 05:57:46
Duration: 3 phút 32 giây
```

---

## 🔍 PHÂN TÍCH NGUYÊN NHÂN

### Tại Sao Manual Test OK Nhưng Schedule Trigger Lại ERROR?

**Khả năng 1: Schedule Time Sai**
- WF2 schedule: 12:46 PM
- Execution time: 05:54 AM ⚠️
- → Schedule đang chạy sai giờ?

**Khả năng 2: Data Error**
- Schedule trigger chạy với TOÀN BỘ 18 rows
- Có thể 1 số rows bị lỗi data:
  - Missing fields
  - Invalid weight values
  - Null captain ID
  - Template render error

**Khả năng 3: External Service Timeout**
- Google Sheets API slow
- Render API (render.nexme.vn) timeout
- Supabase queue full

**Khả năng 4: Memory/CPU Overload**
- Nhiều workflows chạy cùng lúc:
  - WF1: Personal (18 items)
  - WF2: Team (3 items)
  - WF3: Sender (mỗi phút)
  - WF_unknown: OA trigger
  - WF_token: Check token mỗi giờ
- → VPS overload

---

## 🎯 HÀNH ĐỘNG KHẨN CẤP

### BƯỚC 1: TẮT SCHEDULE TRIGGERS TẠM THỜI (NGAY)

**Tại sao:** Đang chạy tự động và bị error → tốn tài nguyên

1. Vào WF1: https://workflow.nexme.vn/workflow/nxdj3XeZAA4WscYp
2. Xóa hoặc disable node **"Schedule Trigger"**
3. Giữ lại Manual Trigger để test
4. Save

5. Vào WF2: https://workflow.nexme.vn/workflow/9fD7jTNV9LbMYGJu
6. Xóa hoặc disable node **"Schedule Trigger"**
7. Save

### BƯỚC 2: KIỂM TRA ERROR LOGS

Cần vào n8n UI xem execution details để biết lỗi chính xác:

1. Vào: https://workflow.nexme.vn/executions/284061
2. Xem node nào bị error
3. Xem error message

Hoặc:

1. Vào Executions list
2. Click vào execution 284061
3. Xem visualization → node màu đỏ
4. Click vào node đỏ → xem error

### BƯỚC 3: FIX DỰA TRÊN ERROR

**Nếu lỗi Google Sheets:**
```
- Check API quota
- Check sheet permissions
- Check data format
```

**Nếu lỗi Render API:**
```
- Check render.nexme.vn status
- Check API key còn valid không
- Check template exists
```

**Nếu lỗi Data:**
```
- Check có row nào thiếu data không
- Check weight format (phải là số)
- Check captain ID format
```

**Nếu lỗi Timeout:**
```
- Giảm batch size: 3 → 2
- Tăng timeout: 300s → 600s
- Thêm retry mechanism
```

---

## 📋 CHECKLIST DEBUG

### Làm Theo Thứ Tự:

- [ ] 1. TẮT schedule triggers (ngay)
- [ ] 2. Xem error log của execution 284061
- [ ] 3. Xem error log của execution 284056
- [ ] 4. Test manual với 3 rows trước
- [ ] 5. Nếu manual OK → check schedule time
- [ ] 6. Nếu manual cũng error → fix data/code
- [ ] 7. Clear crashed executions
- [ ] 8. Test lại manual với 18 rows
- [ ] 9. Nếu OK → bật lại schedule
- [ ] 10. Monitor 24h

---

## 🔧 TEMPORARY FIX - CHẠY MANUAL THAY VÌ SCHEDULE

Trong khi debug, dùng cách này:

1. TẮT tất cả schedule triggers
2. Mỗi ngày 8 PM, BẠN CLICK MANUAL để chạy
3. Monitor execution → nếu error → stop ngay
4. Check logs → fix → retry

---

## 🚨 TẠI SAO VẪN TREO MÁY?

**Giả thuyết:**

```
1. Schedule trigger chạy tự động
2. Process 18 rows
3. Gặp lỗi ở row thứ X (data issue)
4. Workflow bị stuck ở error state
5. Không release memory
6. Schedule trigger chạy lại (nếu retry)
7. → Tích lũy executions bị stuck
8. → VPS RAM đầy
9. → Treo máy
```

**Kiểm chứng:**

- Check có bao nhiêu executions đang "waiting" hoặc "running"
- Check VPS memory usage
- Check n8n container logs

---

## 📞 CẦN THÔNG TIN TỪ BẠN

1. **Error message là gì?**
   - Vào execution 284061 → xem error

2. **Máy treo khi nào?**
   - Sau khi schedule trigger chạy?
   - Hay random?

3. **VPS resources:**
   - RAM usage bao nhiêu %?
   - CPU usage bao nhiêu %?
   - Disk space?

4. **Có access SSH không?**
   - Nếu có → check n8n logs
   - `docker logs n8n_container --tail 100`

---

## 🎯 NEXT STEPS

**URGENT - Làm ngay (2 phút):**
1. TẮT schedule triggers của WF1 & WF2
2. Check execution error logs

**IMPORTANT - Trong 30 phút:**
3. Share error message với tôi
4. Test manual với 3 rows
5. Fix based on error

**MONITOR:**
6. Check VPS không còn treo
7. Monitor memory/CPU

---

**Created:** 2026-01-04 06:35 AM
**Priority:** 🔴 CRITICAL
**Impact:** HIGH - VPS đang bị treo
