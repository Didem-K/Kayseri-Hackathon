#!/bin/bash

echo "🚀 TaskMesh Setup Script Starting..."

# 1. NODE KONTROL
echo "🔍 Checking Node.js..."
if ! command -v node &> /dev/null
then
    echo "❌ Node.js bulunamadı!"
    echo "👉 Lütfen indir: https://nodejs.org (LTS version)"
    exit 1
else
    echo "✅ Node bulundu: $(node -v)"
fi

# 2. NPM KONTROL
echo "🔍 Checking npm..."
if ! command -v npm &> /dev/null
then
    echo "❌ npm bulunamadı!"
    exit 1
else
    echo "✅ npm bulundu: $(npm -v)"
fi

# 3. PROJE OLUŞTUR
echo "📦 Creating Next.js project..."

npx create-next-app@latest taskmesh-frontend <<EOF
n
y
n
n
EOF

# 4. KLASÖRE GİR
cd taskmesh-frontend

# 5. PROJEYİ BAŞLAT
echo "🚀 Starting project..."
npm run dev
