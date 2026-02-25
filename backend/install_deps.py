#!/usr/bin/env python3
"""
Dependency Installation Script for Weather-Aware ESG Digital Twin
This script installs all required dependencies and handles common issues
"""

import subprocess
import sys
import os
from pathlib import Path

def run_command(command, description):
    """Run a command and handle errors"""
    print(f"📦 {description}...")
    try:
        result = subprocess.run(command, shell=True, check=True, capture_output=True, text=True)
        print(f"✅ {description} completed successfully!")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ {description} failed:")
        print(f"Error: {e.stderr}")
        return False

def install_dependencies():
    """Install all required dependencies"""
    print("🚀 Installing Weather-Aware ESG Digital Twin Dependencies")
    print("=" * 60)
    
    # Upgrade pip first
    if not run_command(f"{sys.executable} -m pip install --upgrade pip", "Upgrading pip"):
        print("⚠️  Warning: Could not upgrade pip, continuing anyway...")
    
    # Install core dependencies
    dependencies = [
        "fastapi==0.104.1",
        "uvicorn[standard]==0.24.0", 
        "python-multipart==0.0.6",
        "sqlalchemy==2.0.23",
        "pandas==2.1.4",
        "requests==2.31.0",
        "python-dotenv==1.0.0",
        "pydantic==2.5.0",
        "supabase==2.0.0",
        "postgrest==0.12.0",
        "psycopg2-binary==2.9.9",
        "asyncpg==0.29.0",
        "alembic==1.12.1"
    ]
    
    # Install each dependency
    for dep in dependencies:
        if not run_command(f"{sys.executable} -m pip install {dep}", f"Installing {dep}"):
            print(f"⚠️  Warning: Failed to install {dep}")
    
    print("\n" + "=" * 60)
    print("✅ Dependency installation completed!")
    print("\n📋 Next steps:")
    print("1. Create .env file: cp env.example .env")
    print("2. Edit .env with your Supabase credentials")
    print("3. Start backend: python main.py")

def check_installation():
    """Check if all modules can be imported"""
    print("\n🔍 Checking module imports...")
    
    modules_to_check = [
        "fastapi",
        "uvicorn", 
        "sqlalchemy",
        "pandas",
        "requests",
        "dotenv",
        "pydantic",
        "supabase",
        "psycopg2"
    ]
    
    failed_imports = []
    
    for module in modules_to_check:
        try:
            __import__(module)
            print(f"✅ {module}")
        except ImportError as e:
            print(f"❌ {module}: {e}")
            failed_imports.append(module)
    
    if failed_imports:
        print(f"\n⚠️  Failed to import: {', '.join(failed_imports)}")
        print("Try running: pip install -r requirements.txt --force-reinstall")
    else:
        print("\n🎉 All modules imported successfully!")

def main():
    """Main installation function"""
    # Check if we're in the right directory
    if not Path("main.py").exists():
        print("❌ main.py not found! Please run this script from the backend directory")
        sys.exit(1)
    
    # Install dependencies
    install_dependencies()
    
    # Check installation
    check_installation()

if __name__ == "__main__":
    main()
