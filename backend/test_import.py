#!/usr/bin/env python
"""Test if main.py can be imported"""
import sys
import traceback

try:
    print("Attempting to import main...")
    import main
    print("✅ Main imported successfully!")
    print(f"app = {main.app}")
except Exception as e:
    print(f"❌ Import failed: {e}")
    traceback.print_exc()
