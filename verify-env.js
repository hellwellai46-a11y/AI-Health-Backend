#!/usr/bin/env node
/**
 * Environment Variables Verification Script
 * 
 * This script checks if all required environment variables are properly configured.
 * Run this before starting the server to catch configuration issues early.
 * 
 * Usage: node verify-env.js
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config();

console.log('🔍 Verifying environment configuration...\n');

// Required environment variables
const requiredVars = [
  { name: 'MONGO_URI', description: 'MongoDB connection string' },
  { name: 'GEMINI_API_KEY', description: 'Google Gemini API key' },
  { name: 'JWT_SECRET', description: 'JWT secret for token signing' }
];

// Optional but recommended environment variables
const optionalVars = [
  { name: 'PORT', description: 'Server port', default: '5000' },
  { name: 'NODE_ENV', description: 'Environment mode', default: 'development' },
  { name: 'YOUTUBE_API_KEY', description: 'YouTube Data API key (for video features)' },
  { name: 'SMTP_USER', description: 'SMTP email address (for email features)' },
  { name: 'SMTP_PASS', description: 'SMTP password (for email features)' },
  { name: 'ML_API_URL', description: 'ML API endpoint', default: 'http://localhost:8000' },
  { name: 'FRONTEND_URL', description: 'Frontend URL for CORS', default: 'http://localhost:5173' }
];

let hasErrors = false;
let hasWarnings = false;

// Check if .env file exists
const envPath = join(__dirname, '.env');
if (!existsSync(envPath)) {
  console.error('❌ .env file not found!');
  console.error('   Please create a .env file by copying .env.example:');
  console.error('   cp .env.example .env\n');
  process.exit(1);
}

console.log('✅ .env file exists\n');

// Check required variables
console.log('📋 Required Variables:');
console.log('─'.repeat(60));
for (const { name, description } of requiredVars) {
  const value = process.env[name];
  if (!value) {
    console.error(`❌ ${name}: MISSING`);
    console.error(`   ${description}`);
    hasErrors = true;
  } else if (value.includes('your_') || value.includes('your-')) {
    console.warn(`⚠️  ${name}: Using placeholder value`);
    console.warn(`   Please update with actual ${description}`);
    hasWarnings = true;
  } else {
    // Mask all values consistently to avoid exposing sensitive data
    const maskedValue = value.length > 20 
      ? `${value.substring(0, 4)}...${value.substring(value.length - 3)}`
      : '****';
    console.log(`✅ ${name}: ${maskedValue}`);
  }
}

console.log('\n📋 Optional Variables:');
console.log('─'.repeat(60));
for (const { name, description, default: defaultValue } of optionalVars) {
  const value = process.env[name];
  if (!value) {
    if (defaultValue) {
      console.log(`ℹ️  ${name}: Using default (${defaultValue})`);
    } else {
      console.log(`⚪ ${name}: Not configured (${description})`);
    }
  } else if (value.includes('your_') || value.includes('your-')) {
    console.warn(`⚠️  ${name}: Using placeholder value`);
    hasWarnings = true;
  } else {
    // Mask all values consistently to avoid exposing sensitive data
    const maskedValue = value.length > 20 
      ? `${value.substring(0, 4)}...${value.substring(value.length - 3)}`
      : '****';
    console.log(`✅ ${name}: ${maskedValue}`);
  }
}

console.log('\n' + '─'.repeat(60));

// Final summary
if (hasErrors) {
  console.error('\n❌ Configuration check FAILED');
  console.error('   Missing required environment variables.');
  console.error('   See ENV_SETUP.md for setup instructions.\n');
  process.exit(1);
} else if (hasWarnings) {
  console.warn('\n⚠️  Configuration check PASSED with warnings');
  console.warn('   Some variables are using placeholder values.');
  console.warn('   Update them with actual credentials before running in production.\n');
  process.exit(0);
} else {
  console.log('\n✅ Configuration check PASSED');
  console.log('   All required environment variables are configured.\n');
  process.exit(0);
}
