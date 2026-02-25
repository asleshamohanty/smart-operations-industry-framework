#!/usr/bin/env python3
"""
Windows-specific fix for psycopg2 installation issues
"""

import subprocess
import sys
import platform

def run_command(command, description):
    """Run a command and handle errors"""
    print(f"🔧 {description}...")
    try:
        result = subprocess.run(command, shell=True, check=True, capture_output=True, text=True)
        print(f"✅ {description} completed successfully!")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ {description} failed:")
        print(f"Error: {e.stderr}")
        return False

def fix_psycopg2_windows():
    """Fix psycopg2 installation on Windows"""
    print("🪟 Windows psycopg2 Fix")
    print("=" * 40)
    
    # Check if we're on Windows
    if platform.system() != "Windows":
        print("ℹ️  This script is for Windows. On other systems, use: pip install psycopg2-binary")
        return
    
    print("🔍 Detected Windows system")
    
    # Method 1: Uninstall and reinstall psycopg2-binary
    print("\n📦 Method 1: Clean reinstall of psycopg2-binary")
    run_command(f"{sys.executable} -m pip uninstall psycopg2 psycopg2-binary -y", "Uninstalling existing psycopg2")
    run_command(f"{sys.executable} -m pip install psycopg2-binary==2.9.9", "Installing psycopg2-binary")
    
    # Method 2: Try installing from wheel
    print("\n📦 Method 2: Install from wheel")
    run_command(f"{sys.executable} -m pip install --only-binary=all psycopg2-binary", "Installing psycopg2-binary from wheel")
    
    # Method 3: Try different version
    print("\n📦 Method 3: Try different version")
    run_command(f"{sys.executable} -m pip install psycopg2-binary==2.9.7", "Installing psycopg2-binary 2.9.7")
    
    # Test import
    print("\n🧪 Testing psycopg2 import...")
    try:
        import psycopg2
        print("✅ psycopg2 imported successfully!")
        return True
    except ImportError as e:
        print(f"❌ psycopg2 import failed: {e}")
        
        # Method 4: Alternative - use asyncpg only
        print("\n🔄 Method 4: Using asyncpg as alternative")
        run_command(f"{sys.executable} -m pip install asyncpg==0.29.0", "Installing asyncpg")
        
        try:
            import asyncpg
            print("✅ asyncpg imported successfully!")
            print("ℹ️  Note: You may need to update database.py to use asyncpg instead of psycopg2")
            return True
        except ImportError:
            print("❌ asyncpg also failed to import")
            return False

def main():
    """Main fix function"""
    print("🚀 Windows psycopg2 Installation Fix")
    print("=" * 50)
    
    if fix_psycopg2_windows():
        print("\n✅ psycopg2 fix completed!")
        print("\n📋 Next steps:")
        print("1. Try running: python main.py")
        print("2. If still failing, check your .env file has correct Supabase credentials")
    else:
        print("\n❌ psycopg2 fix failed!")
        print("\n🆘 Alternative solutions:")
        print("1. Try: pip install --upgrade pip setuptools wheel")
        print("2. Try: pip install psycopg2-binary --no-cache-dir")
        print("3. Try: conda install psycopg2")
        print("4. Check if you have Visual C++ Build Tools installed")

if __name__ == "__main__":
    main()
