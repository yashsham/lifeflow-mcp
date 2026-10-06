"""
LifeFlow Master Runner
Starts both remote FastMCP SSE servers and the FastAPI web dashboard simultaneously.
"""

import sys
import time
import subprocess
from pathlib import Path

PYTHON_EXE = sys.executable
BASE_DIR = Path(__file__).resolve().parent

def main():
    print("=" * 60)
    print("Starting LifeFlow MCP Platform Ecosystem")
    print("=" * 60)
    
    # 1. Start Remote Currency Server on port 8001
    print("[1/3] Launching RemoteCurrencyServer (SSE) on http://127.0.0.1:8001/sse ...")
    p_currency = subprocess.Popen(
        [PYTHON_EXE, "-m", "servers.remote_currency"],
        cwd=str(BASE_DIR)
    )

    # 2. Start Remote City Server on port 8002
    print("[2/3] Launching RemoteCityServer (SSE) on http://127.0.0.1:8002/sse ...")
    p_city = subprocess.Popen(
        [PYTHON_EXE, "-m", "servers.remote_city"],
        cwd=str(BASE_DIR)
    )

    # Allow servers 2 seconds to bind ports
    time.sleep(2)

    # 3. Start FastAPI Dashboard on port 8000
    print("[3/3] Launching LifeFlow Web UI & MCP Client on http://127.0.0.1:8000 ...")
    print("\nAll systems online!")
    print("Open your browser at: http://127.0.0.1:8000")
    print("=" * 60)

    try:
        subprocess.run(
            [PYTHON_EXE, "-m", "uvicorn", "ui.app:app", "--host", "127.0.0.1", "--port", "8000"],
            cwd=str(BASE_DIR)
        )
    except KeyboardInterrupt:
        print("\nShutting down LifeFlow MCP processes...")
    finally:
        p_currency.terminate()
        p_city.terminate()
        print("Servers stopped cleanly.")

if __name__ == "__main__":
    main()
