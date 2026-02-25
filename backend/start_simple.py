#!/usr/bin/env python3
"""
Simple startup script for Smart Ops Platform
"""

import subprocess
import sys
import os

def install_dependencies():
    """Install basic dependencies"""
    print("📦 Installing dependencies...")
    try:
        subprocess.run([sys.executable, "-m", "pip", "install", "-r", "requirements.txt"], 
                      check=True)
        print("✅ Dependencies installed!")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ Failed to install dependencies: {e}")
        return False

def start_backend():
    """Start the backend server"""
    print("🚀 Starting Smart Ops Platform Backend...")
    print("📍 Backend: http://localhost:8000")
    print("📚 API Docs: http://localhost:8000/docs")
    print("❤️  Health: http://localhost:8000/health")
    print("\n" + "="*50)
    
    try:
        subprocess.run([sys.executable, "main.py"], check=True)
    except KeyboardInterrupt:
        print("\n👋 Backend stopped")
    except subprocess.CalledProcessError as e:
        print(f"❌ Backend failed: {e}")

def main():
    """Main function"""
    print("🌐 Smart Ops Platform - Backend Startup")
    print("=" * 40)
    
    # Check if we're in the right directory
    if not os.path.exists("main.py"):
        print("❌ main.py not found! Run this from the backend directory")
        return
    
    # Check for .env file
    if not os.path.exists(".env"):
        print("⚠️  .env file not found!")
        print("📝 Please create a .env file with your Supabase credentials:")
        print("   SUPABASE_URL=https://your-project.supabase.co")
        print("   SUPABASE_KEY=your-supabase-anon-key")
        print("\n💡 Copy env.example to .env and fill in your values")
        return
    
    # Install dependencies
    if not install_dependencies():
        return
    
    # Start backend
    start_backend()

if __name__ == "__main__":
    main()
