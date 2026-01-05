#!/bin/bash

# Setup Vercel Environment Variables from .env.local
# Usage: ./setup-vercel-env.sh

set -e

echo "🔧 Setting up Vercel Environment Variables..."
echo ""

# Check if vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI not found. Installing..."
    npm install -g vercel
fi

# Navigate to dashboard directory
cd "$(dirname "$0")/../dashboard"

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
    echo "❌ .env.local not found in dashboard/"
    exit 1
fi

echo "📦 Found .env.local file"
echo ""

# Read .env.local and set each variable
while IFS='=' read -r key value; do
    # Skip comments and empty lines
    if [[ $key =~ ^#.*$ ]] || [ -z "$key" ]; then
        continue
    fi

    # Remove leading/trailing whitespace
    key=$(echo "$key" | xargs)
    value=$(echo "$value" | xargs)

    # Skip empty values
    if [ -z "$value" ]; then
        continue
    fi

    echo "✅ Setting: $key"
    vercel env add "$key" production <<< "$value" 2>/dev/null || true
    vercel env add "$key" preview <<< "$value" 2>/dev/null || true
    vercel env add "$key" development <<< "$value" 2>/dev/null || true
done < .env.local

echo ""
echo "✅ Environment variables set successfully!"
echo ""
echo "🚀 Next steps:"
echo "1. Run database migration on Supabase (db/full-migration.sql)"
echo "2. Deploy with: vercel --prod"
