import subprocess
import sys
import time
import os
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent
BACKEND_DIR = ROOT_DIR / "backend"
FRONTEND_DIR = ROOT_DIR / "frontend"

def main():
    print("=" * 60)
    print("      MEDPARSE · CLINICAL DOCUMENT INTELLIGENCE SYSTEM")
    print("=" * 60)
    print(f"Project Directory: {ROOT_DIR}")
    print("Starting FastAPI Backend (Port 8000)...")

    # Start FastAPI Backend
    backend_proc = subprocess.Popen(
        [sys.executable, "run.py"],
        cwd=str(BACKEND_DIR)
    )

    time.sleep(2)
    print("Starting Next.js Frontend (Port 3000)...")

    # Start Next.js Frontend
    frontend_proc = subprocess.Popen(
        "npm run dev",
        cwd=str(FRONTEND_DIR),
        shell=True
    )

    print("\n✓ MedParse Services Online:")
    print("  - Web Interface:   http://localhost:3000")
    print("  - API & Swagger:   http://127.0.0.1:8000/docs")
    print("\nPress Ctrl+C to terminate both services.\n")

    try:
        backend_proc.wait()
        frontend_proc.wait()
    except KeyboardInterrupt:
        print("\nShutting down MedParse services...")
        backend_proc.terminate()
        frontend_proc.terminate()

if __name__ == "__main__":
    main()
