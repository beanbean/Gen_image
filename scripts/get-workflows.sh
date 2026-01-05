#!/bin/bash

# Script lấy danh sách workflows từ n8n API

API_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJiNjFmZmIxYy00ODNjLTQ3YjUtOTg5ZC1iYzJiNWQ1YjM3NzYiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzY3MjQ2NTA1fQ.wRd6jgQh73FXPWeW_Rn7b1UXXI_L8PGU_3JO6GcQOTg"
N8N_URL="https://workflow.nexme.vn"

curl -s -X GET "${N8N_URL}/api/v1/workflows" \
  -H "X-N8N-API-KEY: ${API_KEY}" \
  -H "Content-Type: application/json"
