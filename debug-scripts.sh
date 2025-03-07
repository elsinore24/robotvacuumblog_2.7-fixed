#!/bin/bash

# Debugging and Diagnostic Script

# Check Node.js and npm versions
echo "🔍 Node.js and npm Versions:"
node --version
npm --version

# Check Vite configuration
echo "\n🔍 Vite Configuration:"
npm run vite info

# Run dependency checks
echo "\n🔍 Dependency Checks:"
npm ls @supabase/supabase-js
npm ls marked
npm ls dompurify
npm ls front-matter

# Check environment variables
echo "\n🔍 Environment Variables:"
printenv | grep VITE_

# Run type checking
echo "\n🔍 TypeScript Type Checking:"
npm run typecheck

# Optional: Run linting
echo "\n🔍 ESLint Checks:"
npm run lint

# Verbose npm install to diagnose package issues
echo "\n🔍 Verbose Package Installation:"
npm install --verbose
