# ⚡ LifeFlow MCP — Full-Stack Hybrid Model Context Protocol Ecosystem

[![FastMCP](https://img.shields.io/badge/FastMCP-v4.0.11-blue.svg)](https://github.com/jlowin/fastmcp)
[![Python](https://img.shields.io/badge/Python-3.12%2B-brightgreen.svg)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.142-teal.svg)](https://fastapi.tiangolo.com)
[![Protocol](https://img.shields.io/badge/Protocol-JSON--RPC%202.0-orange.svg)](https://modelcontextprotocol.io)

**LifeFlow MCP** is a production-structured implementation of Anthropic's **Model Context Protocol (MCP)**. It bridges the gap between **private, on-device user data** and **live, remote public telemetry** using **FastMCP** across both `stdio` and `SSE` transports.

Built specifically to demonstrate advanced LLM agent architecture, client orchestration, and enterprise protocol standards.

---

## 🌟 Key Architecture Highlights

- **4 Orchestrated MCP Servers**:
  - 🏠 **`LocalExpenseServer` (stdio)**: Sandboxed private financial ledger, summary calculator, and monthly budget alerts.
  - 🏠 **`LocalHabitServer` (stdio)**: Private routine and habit streak engine.
  - 🌐 **`RemoteCurrencyServer` (SSE:8001)**: Real-time public currency exchange conversion and crypto prices.
  - 🌐 **`RemoteCityServer` (SSE:8002)**: Real-time city weather telemetry and cost-of-living indicators.
  - 📦 *Standalone Remote Microservices Repo:* [yashsham/lifeflow-remote-mcp](https://github.com/yashsham/lifeflow-remote-mcp)
- **Custom FastMCP Multi-Server Client**: Connection pooling, unified tool registry aggregation, and round-trip execution latency tracking.
- **Interactive Web Dashboard**: Glassmorphism UI with real-time server health badges, isolated tool test runner, and conversational AI agent.
- **Live JSON-RPC 2.0 Protocol Inspector**: Inspect raw incoming and outgoing MCP frames (`tools/list`, `tools/call`, responses, and error handling) in real time.

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
┌─────────────────────────┐  ┌────────────────┴────────┐  ┌───────────────────────┐  ┌──────────────────────┐
│   LocalExpenseServer    │  │     LocalHabitServer    │  │ RemoteCurrencyServer  │  │   RemoteCityServer   │
│       [stdio]           │  │         [stdio]         │  │     [SSE: 8001]       │  │     [SSE: 8002]      │
│  - add_expense          │  │  - log_habit            │  │  - convert_currency   │  │  - get_city_weather  │
│  - get_monthly_summary  │  │  - get_habit_streaks    │  │  - get_crypto_price   │  │  - get_living_tips   │
│  - check_budget_status  │  │  - add_journal_entry    │  │                       │  │                      │
└─────────────────────────┘  └─────────────────────────┘  └───────────────────────┘  └──────────────────────┘
```

---

## 🚀 Quickstart

### Prerequisites
- Python 3.12+ (or [uv](https://github.com/astral-sh/uv))

### Installation
Clone the repository and install dependencies:
```bash
git clone https://github.com/your-username/lifeflow-mcp.git
cd lifeflow-mcp

# Using uv (recommended)
uv sync

# Or using standard pip
pip install -e .
```

### Run Everything in One Command
```bash
python run.py
```
Open **`http://localhost:8000`** in your browser.

---

## 🧪 Testing the Dual-Server Agent

Try typing queries into the chat to see cross-server orchestration:

1. **Log Expense & Habit (Both Local Servers):**
   > *"I spent ₹500 on dinner in Bangalore and also completed morning workout. Log both and tell me how my budget looks!"*
   
2. **Convert Currency & Check Local Budget (Remote + Local Server):**
   > *"Convert 100 USD to INR and check current budget status."*

3. **Check City Weather & Living Advice (Remote Server):**
   > *"What is the weather and living cost guide for Bangalore?"*

Watch the **Protocol Inspector** panel on the right side of the dashboard to observe the live JSON-RPC 2.0 messages being exchanged across transports!

---

## 📚 Interview Preparation

Check out [INTERVIEW_GUIDE.md](INTERVIEW_GUIDE.md) for:
- Detailed breakdown of **Why**, **What**, and **How**
- Deep dive on **`stdio` vs `SSE`** transport mechanics
- 10 senior-level interview questions and model answers
