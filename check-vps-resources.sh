#!/bin/bash

# Script kiểm tra VPS resources
# Chạy trên VPS: bash check-vps-resources.sh

echo "========================================="
echo "🔍 VPS RESOURCE CHECK"
echo "Time: $(date '+%Y-%m-%d %H:%M:%S')"
echo "========================================="
echo ""

echo "📊 1. RAM USAGE:"
echo "-----------------------------------------"
free -h
echo ""

echo "📈 2. CPU & MEMORY (TOP 10 PROCESSES):"
echo "-----------------------------------------"
ps aux --sort=-%mem | head -n 11
echo ""

echo "🐳 3. DOCKER CONTAINER STATS:"
echo "-----------------------------------------"
docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.MemPerc}}"
echo ""

echo "💾 4. DISK USAGE:"
echo "-----------------------------------------"
df -h | grep -E '^/dev/'
echo ""

echo "🔥 5. N8N CONTAINER LOGS (LAST 20 LINES):"
echo "-----------------------------------------"
n8n_container=$(docker ps --filter "name=n8n" --format "{{.Names}}" | head -n 1)
if [ -n "$n8n_container" ]; then
    echo "Container: $n8n_container"
    docker logs "$n8n_container" --tail 20
else
    echo "⚠️ No n8n container found"
    echo "All containers:"
    docker ps -a
fi
echo ""

echo "🔄 6. N8N CONTAINER RESTART COUNT:"
echo "-----------------------------------------"
docker inspect "$n8n_container" 2>/dev/null | grep -A 5 "RestartCount" || echo "Could not get restart count"
echo ""

echo "🌐 7. NETWORK CONNECTIONS:"
echo "-----------------------------------------"
netstat -tunlp | grep -E '(n8n|node|docker)' | head -n 10
echo ""

echo "⚡ 8. SYSTEM LOAD AVERAGE:"
echo "-----------------------------------------"
uptime
echo ""

echo "========================================="
echo "✅ Check completed!"
echo "========================================="
