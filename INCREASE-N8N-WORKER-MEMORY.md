# 🔧 TĂNG MEMORY CHO N8N WORKER

**Vấn đề:** n8n worker đang dùng 97% memory limit (248MB/256MB)

**Giải pháp:** Tăng memory limit lên 512MB

---

## CÁCH 1: Via Dokploy UI (Dễ nhất - Recommended)

1. Vào https://dashboard.nexme.vn/
2. Tìm application **"n8nvps-n8n-vwfk9r"**
3. Click vào application
4. Tìm service **"n8n-worker"**
5. Click **"Settings"** hoặc **"Edit"**
6. Tìm **"Resources"** hoặc **"Memory Limit"**
7. Đổi từ `256m` → `512m`
8. Click **"Save"** và **"Redeploy"**

---

## CÁCH 2: Via Docker Compose (Nếu dùng docker-compose)

### Bước 1: Tìm docker-compose file

```bash
# Tìm file docker-compose của n8n
find /opt -name "docker-compose.yml" -path "*n8n*" 2>/dev/null

# Hoặc
cd /opt/dokploy/applications/
ls -la
# Tìm folder có tên chứa "n8n"
```

### Bước 2: Sửa file docker-compose.yml

```bash
# Giả sử file ở /opt/dokploy/applications/xxx/n8nvps-n8n-vwfk9r/docker-compose.yml
nano /path/to/docker-compose.yml
```

Tìm section `n8n-worker` và sửa:

```yaml
services:
  n8n-worker:
    image: n8nio/n8n:1.120.4
    deploy:
      resources:
        limits:
          memory: 512m  # Đổi từ 256m
        reservations:
          memory: 256m  # Tăng từ 128m
```

### Bước 3: Apply changes

```bash
# Reload docker-compose
docker-compose -f /path/to/docker-compose.yml up -d n8n-worker

# Hoặc qua Docker stack (nếu dùng swarm)
docker stack deploy -c /path/to/docker-compose.yml n8nvps
```

---

## CÁCH 3: Via Docker Update (Nhanh nhất nhưng tạm thời)

⚠️ **Lưu ý:** Cách này chỉ tác dụng cho đến khi container restart. Khi redeploy sẽ mất.

```bash
# Update memory limit trực tiếp
docker update --memory="512m" --memory-swap="1g" bf7944c143f7

# Restart để apply
docker restart bf7944c143f7

# Verify
docker stats --no-stream | grep worker
```

---

## CÁCH 4: Via Docker Service Update (Nếu dùng Docker Swarm)

```bash
# Tìm service name
docker service ls | grep n8n

# Update memory limit
docker service update \
  --limit-memory 512m \
  --reserve-memory 256m \
  n8nvps-n8n-vwfk9r_n8n-worker

# Verify
docker service inspect n8nvps-n8n-vwfk9r_n8n-worker --pretty
```

---

## 🎯 RECOMMENDED: CÁCH 1 (Via Dokploy UI)

Tại vì bạn đang dùng Dokploy để manage, nên cách tốt nhất là:

1. Vào Dokploy dashboard
2. Edit application settings
3. Tăng worker memory limit lên 512MB
4. Redeploy

→ **Thay đổi sẽ persist** (không mất khi restart)

---

## ✅ VERIFICATION

Sau khi tăng memory, chạy:

```bash
docker stats --no-stream | grep worker
```

**Expected:**
```
n8n-worker    248MB / 512MB    48.5%    ← Tốt rồi!
```

---

## 📊 TẠI SAO CẦN 512MB?

n8n worker cần memory để:
- Process workflows (mỗi execution cần ~50-100MB)
- Cache data
- Handle concurrent executions
- Image processing (nếu có)

**256MB quá ít** khi:
- Có nhiều workflows chạy cùng lúc
- Workflows xử lý hình ảnh
- Batch processing với nhiều items

**512MB là mức an toàn** cho:
- 3-5 workflows chạy đồng thời
- Image processing
- Batch size 3-5 items

---

**Next:** Sau khi tăng memory, monitor lại với `docker stats`.
