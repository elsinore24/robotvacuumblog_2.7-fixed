import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';

// Detailed logging utility
const createLoggingPlugin = () => {
  return {
    name: 'comprehensive-debug-plugin',
    configResolved(config) {
      console.log('🔍 Vite Configuration:');
      console.log('Mode:', config.mode);
      console.log('Command:', config.command);
      console.log('Base URL:', config.base);
    },
    configureServer(server) {
      // Middleware for request logging
      server.middlewares.use((req, res, next) => {
        console.log(`
🌐 Request Intercepted:
  Method: ${req.method}
  URL: ${req.url}
  Headers: ${JSON.stringify(req.headers, null, 2)}
`);
        next();
      });
    },
    resolveId(source, importer) {
      // Module resolution logging
      console.log(`
📦 Module Resolution:
  Source: ${source}
  Importer: ${importer}
`);
    }
  };
};

// Environment Variable Validation
const validateEnvVariables = () => {
  const requiredVars = [
    'VITE_SUPABASE_URL',
    'VITE_SUPABASE_ANON_KEY'
  ];

  const missingVars = requiredVars.filter(varName => !import.meta.env[varName]);
  
  if (missingVars.length > 0) {
    console.error('❌ Missing Environment Variables:', missingVars);
    throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
  }
};

// Comprehensive Error Tracking Plugin
const errorTrackingPlugin = () => {
  return {
    name: 'error-tracking-plugin',
    buildStart() {
      console.log('🚀 Build Started');
    },
    buildEnd(err) {
      if (err) {
        console.error('❌ Build Failed:', err);
        
        // Optional: Write error to a log file
        fs.writeFileSync('build-error.log', JSON.stringify(err, null, 2));
      } else {
        console.log('✅ Build Completed Successfully');
      }
    }
  };
};

export default defineConfig({
  // Enable source maps for better debugging
  build: {
    sourcemap: true
  },
  
  // Resolve path aliases
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@utils': path.resolve(__dirname, './src/utils'),
      '@lib': path.resolve(__dirname, './src/lib')
    }
  },
  
  // Plugins for comprehensive debugging
  plugins: [
    // React plugin
    react(),
    
    // Custom logging plugin
    createLoggingPlugin(),
    
    // Error tracking plugin
    errorTrackingPlugin(),
    
    // Environment variable validation plugin
    {
      name: 'env-validator',
      buildStart() {
        validateEnvVariables();
      }
    }
  ],
  
  // Optimize dependencies
  optimizeDeps: {
    include: [
      'react', 
      'react-dom', 
      'react-router-dom',
      '@supabase/supabase-js',
      'marked', 
      'dompurify',
      'front-matter'
    ],
    // Force pre-bundling of problematic modules
    force: true
  },
  
  // Server configuration
  server: {
    // Enable CORS for local development
    cors: true,
    
    // Detailed error overlay
    overlay: {
      warnings: true,
      errors: true
    },
    
    // Headers to prevent caching during development
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    }
  }
});

// Supabase Connection Diagnostic Script
export const supabaseDiagnostics = async () => {
  try {
    const { createClient } = await import('@supabase/supabase-js');
    
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    console.log('🔍 Supabase Diagnostic Started');
    console.log('URL:', supabaseUrl);
    console.log('Anon Key Present:', !!supabaseAnonKey);
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    // Test authentication
    const { data: authData, error: authError } = await supabase.auth.getSession();
    console.log('Authentication Session:', authData);
    if (authError) console.error('Auth Error:', authError);
    
    // Test table access
    const { data: tableData, error: tableError } = await supabase
      .from('blog_posts')
      .select('*')
      .limit(1);
    
    console.log('Table Query Result:', tableData);
    if (tableError) console.error('Table Query Error:', tableError);
    
  } catch (err) {
    console.error('🚨 Supabase Diagnostic Failed:', err);
  }
};

// Markdown Processing Diagnostic
export const markdownDiagnostics = async () => {
  try {
    const frontMatter = await import('front-matter');
    const { marked } = await import('marked');
    const DOMPurify = await import('dompurify');
    
    console.log('🔍 Markdown Diagnostic Started');
    
    // Test front matter parsing
    const sampleMarkdown = `---
title: Test Post
date: 2024-01-01
---

# Hello World

This is a test post.`;

    const parsed = frontMatter.default(sampleMarkdown);
    console.log('Front Matter Parsing:', parsed);
    
    // Test markdown parsing
    const htmlContent = marked.parse(parsed.body);
    console.log('Marked Parsing:', htmlContent);
    
    // Test sanitization
    const sanitizedContent = DOMPurify.sanitize(htmlContent);
    console.log('Sanitized Content:', sanitizedContent);
    
  } catch (err) {
    console.error('🚨 Markdown Diagnostic Failed:', err);
  }
};

// Run diagnostics on import
if (import.meta.env.DEV) {
  supabaseDiagnostics();
  markdownDiagnostics();
}
