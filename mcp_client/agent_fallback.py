"""
Fallback engine if remote LLM rate limit or network glitch occurs.
Ensures zero-downtime reliability during live interviews and demos.
"""

import re
from typing import Dict, Any, List
from mcp_client.client_manager import client_manager


async def fallback_execute(user_prompt: str) -> Dict[str, Any]:
    p_lower = user_prompt.lower()
    tool_executions: List[Dict[str, Any]] = []

    # Currency
    if any(w in p_lower for w in ["convert", "currency", "usd", "inr", "eur", "rate"]):
        amt = 50.0
        num = re.search(r'(\d+(?:\.\d+)?)', user_prompt)
        if num:
            amt = float(num.group(1))
        from_c = "EUR" if "eur" in p_lower else "USD"
        res = await client_manager.execute_tool("convert_currency", {"amount": amt, "from_curr": from_c, "to_curr": "INR"})
        tool_executions.append(res)

    # Crypto
    if any(w in p_lower for w in ["crypto", "bitcoin", "btc", "ethereum", "solana"]):
        coin = "ethereum" if "eth" in p_lower else "bitcoin"
        res = await client_manager.execute_tool("get_crypto_price", {"coin": coin})
        tool_executions.append(res)

    # Expense
    if any(w in p_lower for w in ["expense", "spend", "spent", "budget", "food", "dinner"]):
        amt = 250.0
        num = re.search(r'(\d+(?:\.\d+)?)', user_prompt)
        if num:
            amt = float(num.group(1))
        res = await client_manager.execute_tool("add_expense", {"category": "Food", "amount": amt, "note": user_prompt, "currency": "INR"})
        tool_executions.append(res)
        res_b = await client_manager.execute_tool("check_budget_status", {})
        tool_executions.append(res_b)

    # Habit
    if any(w in p_lower for w in ["habit", "gym", "workout", "streak"]):
        res = await client_manager.execute_tool("log_habit", {"habit_name": "Morning Workout", "completed": True})
        tool_executions.append(res)

    # Weather
    if any(w in p_lower for w in ["weather", "mausam"]):
        res = await client_manager.execute_tool("get_city_weather", {"city": "Bangalore" if "bangalore" in p_lower else "Delhi"})
        tool_executions.append(res)

    lines = ["**Executed via MCP Servers:**\n"]
    for t in tool_executions:
        if t.get("success"):
            lines.append(f"> **[{t.get('server')}]**: {t.get('result')}\n")

    return {
        "answer": "\n".join(lines) if lines else "Request processed successfully.",
        "tool_calls": tool_executions,
        "llm": "Autonomous Rule-Based Dispatcher (Fallback)"
    }
