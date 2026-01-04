# 🔧 HƯỚNG DẪN DEBUG VPS TREO MÁY

**Thời gian:** 2026-01-04 06:45 AM
**Mục đích:** Kiểm tra tại sao VPS treo khi n8n workflows chạy

---

## 🚀 CÁCH 1: CHẠY SCRIPT TỰ ĐỘNG (RECOMMENDED)

### Bước 1: Upload script lên VPS

```bash
# Trên máy local
scp -P 2018 check-vps-resources.sh root@103.97.127.74:/root/
```

### Bước 2: SSH vào VPS và chạy

```bash
ssh -p 2018 root@103.97.127.74

# Trên VPS
chmod +x check-vps-resources.sh
bash check-vps-resources.sh
```

### Bước 3: Gửi kết quả cho tôi

Copy toàn bộ output và gửi cho tôi để phân tích.

---

## 🔍 CÁCH 2: CHẠY TỪNG LỆNH MANUAL

Nếu script không chạy được, chạy từng lệnh sau:

### 1. Kiểm tra RAM:

```bash
free -h
```

**Cần chú ý:**
- `Mem: used` > 80% → VPS đang quá tải RAM
- `Swap: used` > 0 → RAM đã đầy, đang dùng swap (rất chậm)

### 2. Kiểm tra CPU:

```bash
top -bn1 | head -n 20
```

**Cần chú ý:**
- `%Cpu(s)` > 80% → CPU quá tải
- Process nào chiếm nhiều nhất (cột `%CPU`)

### 3. Kiểm tra Docker containers:

```bash
docker stats --no-stream
```

**Cần chú ý:**
- n8n container: `MEM %` và `CPU %`
- Nếu > 80% → container đang overload

### 4. Kiểm tra n8n logs:

```bash
docker logs n8n --tail 50
```

**Tìm kiếm:**
- Error messages
- "out of memory"
- "timeout"
- "crashed"

### 5. Kiểm tra executions đang chạy:

```bash
docker exec n8n sh -c "ls -lah /home/node/.n8n/executions/ | tail -n 20"
```

hoặc

```bash
# Kiểm tra database nếu dùng PostgreSQL/MySQL
docker exec n8n sh -c "n8n execute --id=list"
```

---

## 🎯 NHỮNG GÌ CẦN TÌM

### Dấu hiệu VPS bị treo do n8n:

1. **RAM đầy:**
   ```
   Mem: 7.8G total, 7.5G used, 300M free
   ```
   → n8n đang leak memory hoặc stuck executions

2. **CPU 100%:**
   ```
   %Cpu(s): 98.5 us
   ```
   → Workflow đang loop vô hạn

3. **n8n container restart liên tục:**
   ```
   docker ps -a
   STATUS: Restarting (1) 2 minutes ago
   ```
   → Container crash và restart

4. **Nhiều execution files tồn đọng:**
   ```bash
   ls /home/node/.n8n/executions/ | wc -l
   # Nếu > 100 files → có vấn đề
   ```

5. **Error logs:**
   ```
   Error: Execution timed out
   Error: Cannot allocate memory
   Error: Maximum call stack size exceeded
   ```

---

## 🚨 HÀNH ĐỘNG KHẨN CẤP

### Nếu VPS đang treo NGAY BÂY GIỜ:

```bash
# 1. Restart n8n container
docker restart n8n

# 2. Nếu không được, force stop và start lại
docker stop n8n
docker start n8n

# 3. Nếu vẫn không được, restart toàn bộ Docker
systemctl restart docker

# 4. Cuối cùng: Reboot VPS (chỉ khi thật sự cần thiết)
reboot
```

### Sau khi restart:

```bash
# 1. Deactivate tất cả workflows
curl -X PATCH "https://workflow.nexme.vn/api/v1/workflows/nxdj3XeZAA4WscYp" \
  -H "X-N8N-API-KEY: n8n_api_4a4fc207e1f9535e7f0d7f3b0d0e3f3b9c9f6e8a5b2c1d3e4f5a6b7c8d9e0f1a2" \
  -H "Content-Type: application/json" \
  -d '{"active": false}'

# 2. Clear crashed executions (qua UI)
# Vào: https://workflow.nexme.vn/executions
# Filter: status = crashed/error
# Delete all

# 3. Monitor resources
watch -n 5 'free -h && echo "" && docker stats --no-stream'
```

---

## 📊 GHI NHẬN KẾT QUẢ

Sau khi chạy các lệnh, ghi lại:

### Template báo cáo:

```
=== VPS RESOURCE REPORT ===
Date: 2026-01-04 06:45

1. RAM Usage:
   Total:
   Used:
   Free:
   Swap Used:

2. CPU Usage:
   Overall:
   Top process:

3. Docker n8n:
   CPU:
   MEM:
   Status:

4. n8n Logs (errors):
   [paste errors here]

5. Executions status:
   Running:
   Crashed:
   Total files:

6. Tình trạng hiện tại:
   [ ] VPS đang chạy bình thường
   [ ] VPS đang chậm
   [ ] VPS đang treo
   [ ] VPS không truy cập được
```

---

## 🔄 MONITORING LIÊN TỤC

### Setup monitoring script (chạy mỗi 5 phút):

```bash
# Tạo file monitor.sh
cat > /root/monitor-n8n.sh << 'EOF'
#!/bin/bash
LOG_FILE="/var/log/n8n-monitor.log"
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

# Get metrics
MEM_USED=$(free -m | awk 'NR==2{printf "%.0f", $3*100/$2}')
CPU_LOAD=$(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | cut -d'%' -f1)
DOCKER_MEM=$(docker stats --no-stream --format "{{.MemPerc}}" n8n 2>/dev/null | cut -d'%' -f1)

# Alert if > 80%
if (( $(echo "$MEM_USED > 80" | bc -l) )) || (( $(echo "$CPU_LOAD > 80" | bc -l) )); then
    echo "$TIMESTAMP | ALERT: MEM=$MEM_USED% CPU=$CPU_LOAD% DOCKER_MEM=$DOCKER_MEM%" >> "$LOG_FILE"

    # Restart n8n if needed
    if (( $(echo "$DOCKER_MEM > 90" | bc -l) )); then
        echo "$TIMESTAMP | Auto-restarting n8n due to high memory" >> "$LOG_FILE"
        docker restart n8n
    fi
else
    echo "$TIMESTAMP | OK: MEM=$MEM_USED% CPU=$CPU_LOAD% DOCKER_MEM=$DOCKER_MEM%" >> "$LOG_FILE"
fi
EOF

chmod +x /root/monitor-n8n.sh

# Add to crontab (chạy mỗi 5 phút)
echo "*/5 * * * * /root/monitor-n8n.sh" | crontab -

# Xem logs
tail -f /var/log/n8n-monitor.log
```

---

## 🎯 CHECKLIST DEBUG

- [ ] 1. SSH vào VPS thành công
- [ ] 2. Chạy script check-vps-resources.sh
- [ ] 3. Ghi nhận RAM usage
- [ ] 4. Ghi nhận CPU usage
- [ ] 5. Kiểm tra docker stats
- [ ] 6. Đọc n8n logs (50 dòng cuối)
- [ ] 7. Kiểm tra execution files
- [ ] 8. Gửi kết quả cho Claude để phân tích
- [ ] 9. Thực hiện fix theo khuyến nghị
- [ ] 10. Setup monitoring liên tục

---

**Sau khi có kết quả, tôi sẽ:**
1. Phân tích root cause chính xác
2. Đưa ra giải pháp cụ thể
3. Hướng dẫn fix từng bước
4. Setup monitoring để tránh tái diễn

---

**Questions?**
Nếu có vấn đề khi chạy bất kỳ lệnh nào, copy error message và gửi cho tôi.
