#!/usr/bin/env python
"""Direct backend startup - bypasses uvicorn import issues"""
import sys
import os

# Ensure backend is in path
backend_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, backend_dir)

if __name__ == "__main__":
    import uvicorn
    from main import app
    
    print(f"Starting CreditSight backend from: {backend_dir}")
    print(f"GROQ_API_KEY loaded: {'✓' if os.environ.get('GROQ_API_KEY') else '✗'}")
    
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=False)
