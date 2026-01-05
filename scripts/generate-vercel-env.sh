#!/bin/bash

# Generate Vercel Environment Variables for Copy-Paste
# This script outputs all env vars from .env.local in Vercel-compatible format
# Usage: ./generate-vercel-env.sh

set -e

cd "$(dirname "$0")/../dashboard"

if [ ! -f ".env.local" ]; then
    echo "❌ .env.local not found"
    exit 1
fi

echo "# ============================================"
echo "# VERCEL ENVIRONMENT VARIABLES"
echo "# Copy and paste these into Vercel Dashboard:"
echo "# Project Settings → Environment Variables"
echo "# ============================================"
echo ""

while IFS='=' read -r key value; do
    # Skip comments and empty lines
    if [[ $key =~ ^#.*$ ]] || [ -z "$key" ]; then
        continue
    fi

    key=$(echo "$key" | xargs)
    value=$(echo "$value" | xargs)

    if [ -z "$value" ]; then
        continue
    fi

    echo "$key=$value"
done < .env.local

echo ""
echo "# ============================================"
echo "# IMPORTANT: Update BETTER_AUTH_URL and NEXT_PUBLIC_APP_URL"
echo "# after getting your Vercel deployment URL!"
echo "# ============================================"
