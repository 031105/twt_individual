#!/bin/bash

# Stock Analysis Web Application Startup Script
# This script ensures the correct Node.js version is used

echo "🚀 Starting Stock Analysis Web Application..."

# Set PATH to prioritize Homebrew Node.js
export PATH="/opt/homebrew/bin:$PATH"

# Check Node.js version
NODE_VERSION=$(node --version)
echo "📌 Using Node.js version: $NODE_VERSION"

# Verify it's the correct version (v24.x.x)
if [[ $NODE_VERSION == v24* ]]; then
    echo "✅ Node.js version is correct"
else
    echo "❌ Warning: Node.js version might be incompatible"
    echo "💡 Expected: v24.x.x, Found: $NODE_VERSION"
fi

# Check if dependencies are installed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Start the application
echo "🌟 Starting server on http://localhost:3000"
echo "🔗 Open your browser and navigate to: http://localhost:3000"
echo "⏹️  Press Ctrl+C to stop the server"
echo ""

node server.js 