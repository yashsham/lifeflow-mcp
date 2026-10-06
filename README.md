# ⚡ LifeFlow MCP — Full-Stack Hybrid Model Context Protocol Ecosystem

[![FastMCP](https://img.shields.io/badge/FastMCP-v4.0.11-blue.svg)](https://github.com/jlowin/fastmcp)
[![Python](https://img.shields.io/badge/Python-3.12%2B-brightgreen.svg)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.142-teal.svg)](https://fastapi.tiangolo.com)
[![Cloudflare](https://img.shields.io/badge/Cloudflare-Edge%20Live-F38020.svg)](https://lifeflow-mcp.aspect-ratio---video-resolution-calculator.workers.dev)
[![Protocol](https://img.shields.io/badge/Protocol-JSON--RPC%202.0-orange.svg)](https://modelcontextprotocol.io)
[![NVIDIA NIM](https://img.shields.io/badge/NVIDIA%20NIM-Nemotron--3.5--Lightning-76b900.svg)](https://build.nvidia.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

**🌐 Live Cloudflare Edge URL:** [https://lifeflow-mcp.aspect-ratio---video-resolution-calculator.workers.dev](https://lifeflow-mcp.aspect-ratio---video-resolution-calculator.workers.dev)

**LifeFlow MCP** is a production-structured implementation of Anthropic's **Model Context Protocol (MCP)**. It bridges the gap between **private, on-device user data** and **live, remote public telemetry** using **FastMCP** across both `stdio` and `SSE` transports.

Powered by **NVIDIA NIM Nemotron-3.5-Lightning (`nvidia/nemotron-3.5-lightning-30b-a3b`)** for real-time function calling and multi-server MCP orchestration.

---

## 🌟 Ecosystem Architecture

This project is part of a decoupled 3-repository MCP architecture:

| Repository | Role | Transport | Purpose |
|---|---|---|---|
| ⚡ **[lifeflow-mcp](https://github.com/yashsham/lifeflow-mcp)** | **Full-Stack Orchestrator** | Custom Client + Web UI | Connects all servers, NVIDIA NIM AI Brain, Glassmorphism Dashboard, Protocol Inspector |
| 🌐 **[lifeflow-remote-mcp](https://github.com/yashsham/lifeflow-remote-mcp)** | **Standalone Remote Microservices** | `SSE / HTTP` | Global cloud-deployable Forex, Crypto, Weather, and City living guides |
| 🏠 **[lifeflow-local-mcp](https://github.com/yashsham/lifeflow-local-mcp)** | **Standalone Local Microservices** | `stdio` | Air-gapped on-device privacy-first personal finance and habit tracking |

---

## 🏗️ Architecture Diagram

```
                        ┌──────────────────────────────────────────────┐
                        │              Modern Web UI                   │
                        │    (FastAPI + Tailwind Glassmorphism UI)     │
                        └──────────────────────┬───────────────────────┘
                                               │
                                               ▼
                        ┌──────────────────────────────────────────────┐
                        │          Custom FastMCP Client Core          │
                        │       (Connection Pooling & Registry)        │
                        └──────┬──────────────┬──────────────┬─────────┘
                               │              │              │
           ┌───────────────────┴──────┐       │              └────────────────────────┐
           │ Stdio (In-Process/Local) │       │                                       │ SSE (HTTP Network)
           ▼                          ▼       │                                       ▼
┌─────────────────────────┐  ┌────────────────┴────────┐  ┌──────────────────────────────────────────────────┐
│   LocalExpenseServer    │  │     LocalHabitServer    │  │       LifeFlowCloudIntelligence (Remote Hub)     │
│       [stdio]           │  │         [stdio]         │  │                     [SSE: 8001]                  │
│  - add_expense          │  │  - log_habit            │  │  - convert_currency    - get_city_weather        │
│  - get_monthly_summary  │  │  - get_habit_streaks    │  │  - get_crypto_price    - get_city_living_tips    │
│  - check_budget_status  │  │  - add_journal_entry    │  │                                                  │
└─────────────────────────┘  └─────────────────────────┘  └──────────────────────────────────────────────────┘
                                                                 ▲
                                                                 │ FastMCP Cloud / Remote Microservice
                                                  [https://2in1cryptoweather.fastmcp.app/mcp]
```

---

## 🧠 AI Brain: NVIDIA NIM Integration
- **Model:** `nvidia/nemotron-3.5-lightning-30b-a3b`
- **Inference Gateway:** `https://integrate.api.nvidia.com/v1`
- **Dynamic Tool Schema:** Translates FastMCP typed docstrings into OpenAI-compatible JSON function definitions on the fly.
- **Latency Optimization:** Reasoning loops tuned for lightning-fast sub-second tool dispatch.

---

## 🚀 Quickstart

### Prerequisites
- Python 3.12+ (or [uv](https://github.com/astral-sh/uv))

### Installation
```bash
git clone https://github.com/yashsham/lifeflow-mcp.git
cd lifeflow-mcp

# Using uv (recommended)
uv sync

# Or using pip
pip install -e .
```

### Run Everything in One Command
```bash
python run.py
```
Open **`http://localhost:8000`** in your browser.

---

## 🧪 Real-World Agent Scenarios

Try typing queries into the chat to see cross-server orchestration in action:

1. **Log Expense & Habit (Both Local Servers via `stdio`):**
   > *"I spent ₹500 on dinner in Bangalore and also completed morning workout. Log both and tell me how my budget looks!"*
   
2. **Convert Currency & Check Local Budget (Remote SSE + Local `stdio`):**
   > *"Convert 100 USD to INR and check current budget status."*

3. **Check City Weather & Living Advice (Remote Cloud Server via SSE):**
   > *"What is the weather and living cost guide for Bangalore?"*

Watch the **Protocol Inspector** panel on the right side of the dashboard to observe the live JSON-RPC 2.0 messages being exchanged across transports in real time!

---

## 📚 Interview Preparation

Check out [INTERVIEW_GUIDE.md](INTERVIEW_GUIDE.md) for:
- Detailed breakdown of **Why**, **What**, and **How**
- Deep dive on **`stdio` vs `SSE`** transport mechanics
- 10 senior-level interview questions and model answers

---

## 📄 License
Released under the [MIT License](LICENSE).
