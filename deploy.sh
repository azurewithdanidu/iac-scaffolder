#!/bin/bash

# Deployment script for Azure App Service

echo "Starting deployment..."

# Install dependencies
echo "Installing dependencies..."
npm ci --production=false

# Build Next.js application
echo "Building Next.js application..."
npm run build

# Clean up dev dependencies (optional)
# npm prune --production

echo "Deployment completed successfully!"
