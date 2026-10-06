"""
LifeFlow Agent Engine
Integrates user query processing with autonomous tool selection and execution.
Works with zero API keys required (built-in intelligent heuristic engine) or OpenAI/Gemini if configured.
"""

import re
from typing import Dict, Any, List
from mcp_client.client_manager import client_manager


class LifeFlowAgent:
    """Agent that bridges natural language queries to MCP tool calls across local and remote servers."""

    async def run(self, user_prompt: str) -> Dict[str, Any]:
        """Analyze prompt, decide required MCP tools, execute them, and formulate response."""
        p_lower = user_prompt.lower()
        tool_executions: List[Dict[str, Any]] = []

        # 1. Check for Currency Conversion intent
        # e.g., "convert $50 to INR" or "convert 100 USD to INR"
        curr_match = re.search(r'(\$|€|£)?\s*(\d+(\.\d+)?)\s*([a-zA-Z]{3})?\s*(?:to|in|into)\s*([a-zA-Z]{3})?', user_prompt)
        if any(w in p_lower for w in ["convert", "currency", "usd", "inr", "eur", "exchange rate", "dollar"]):
            amt = 50.0
            from_c = "USD"
            to_c = "INR"
            
            # Extract numbers if present
            num_match = re.search(r'(\d+(?:\.\d+)?)', user_prompt)
            if num_match:
                amt = float(num_match.group(1))
            
            if "eur" in p_lower:
                from_c = "EUR"
            elif "gbp" in p_lower:
                from_c = "GBP"
            elif "aed" in p_lower:
                from_c = "AED"
            elif "usd" in p_lower or "$" in user_prompt:
                from_c = "USD"

            if "inr" in p_lower or "rupee" in p_lower or "rs" in p_lower:
                to_c = "INR"
            elif "usd" in p_lower and from_c != "USD":
                to_c = "USD"

            res = await client_manager.execute_tool("convert_currency", {"amount": amt, "from_curr": from_c, "to_curr": to_c})
            tool_executions.append(res)

        # 2. Check for Crypto prices
        if any(w in p_lower for w in ["crypto", "bitcoin", "btc", "ethereum", "eth", "solana", "sol"]):
            coin = "bitcoin"
            if "ethereum" in p_lower or "eth" in p_lower:
                coin = "ethereum"
            elif "solana" in p_lower or "sol" in p_lower:
                coin = "solana"
            res = await client_manager.execute_tool("get_crypto_price", {"coin": coin})
            tool_executions.append(res)

        # 3. Check for Expense logging or checking
        if any(w in p_lower for w in ["expense", "kharcha", "spend", "spent", "budget", "cost", "bought", "purchase", "dinner", "food", "bills"]):
            if any(w in p_lower for w in ["add", "log", "record", "spent", "kharch"]):
                # Determine amount
                amt = 250.0
                num_match = re.search(r'(\d+(?:\.\d+)?)', user_prompt)
                if num_match:
                    amt = float(num_match.group(1))
                
                cat = "Food"
                if any(w in p_lower for w in ["travel", "cab", "uber", "flight", "metro"]):
                    cat = "Travel"
                elif any(w in p_lower for w in ["bill", "recharge", "wifi", "rent"]):
                    cat = "Bills"
                elif any(w in p_lower for w in ["shopping", "cloth", "amazon"]):
                    cat = "Shopping"

                res = await client_manager.execute_tool("add_expense", {
                    "category": cat,
                    "amount": amt,
                    "note": user_prompt,
                    "currency": "INR"
                })
                tool_executions.append(res)
            
            # Always get status/summary when expense is mentioned
            res_sum = await client_manager.execute_tool("check_budget_status", {})
            tool_executions.append(res_sum)

        # 4. Check for Habit logging / routine
        if any(w in p_lower for w in ["habit", "gym", "workout", "streak", "read", "coding", "routine"]):
            h_name = "Morning Workout"
            if "read" in p_lower:
                h_name = "Read 20 pages"
            elif "coding" in p_lower or "code" in p_lower:
                h_name = "Coding practice"

            if any(w in p_lower for w in ["log", "did", "went", "done", "completed"]):
                res_habit = await client_manager.execute_tool("log_habit", {"habit_name": h_name, "completed": True})
                tool_executions.append(res_habit)
            else:
                res_habit = await client_manager.execute_tool("get_habit_streaks", {})
                tool_executions.append(res_habit)

        # 5. Check for City Weather or Living cost tips
        cities = ["delhi", "mumbai", "bangalore", "pune", "hyderabad", "new york", "london"]
        found_city = None
        for c in cities:
            if c in p_lower:
                found_city = c
                break

        if any(w in p_lower for w in ["weather", "temperature", "mausam"]) or (found_city and "weather" in p_lower):
            city_target = found_city if found_city else "Delhi"
            res_w = await client_manager.execute_tool("get_city_weather", {"city": city_target})
            tool_executions.append(res_w)

        if any(w in p_lower for w in ["living cost", "living guide", "tips for", "rent in"]) or (found_city and "tips" in p_lower):
            city_target = found_city if found_city else "Delhi"
            res_c = await client_manager.execute_tool("get_city_living_tips", {"city": city_target})
            tool_executions.append(res_c)

        # If no specific rule triggered, execute summary of both local servers
        if not tool_executions:
            res1 = await client_manager.execute_tool("get_monthly_summary", {})
            res2 = await client_manager.execute_tool("get_habit_streaks", {})
            tool_executions.extend([res1, res2])

        # Synthesize friendly markdown answer
        synthesis_lines = [
            f"Here is what I gathered and performed across your **Local & Remote MCP Servers**:\n"
        ]
        for execution in tool_executions:
            if execution.get("success"):
                srv = execution.get("server", "MCP")
                srv_type = execution.get("server_type", "Standard")
                res_text = execution.get("result", "")
                synthesis_lines.append(f"**From `{srv}` ({srv_type})**:")
                synthesis_lines.append(f"> {res_text.replace(chr(10), chr(10) + '> ')}\n")
            else:
                synthesis_lines.append(f"⚠️ Error executing `{execution.get('tool')}`: {execution.get('error')}\n")

        return {
            "answer": "\n".join(synthesis_lines),
            "tool_calls": tool_executions
        }


agent = LifeFlowAgent()
