"""
LifeFlow Agent Engine with NVIDIA NIM Integration
Model: nvidia/nemotron-3.5-lightning-30b-a3b
Orchestrates autonomous tool calling across 4 FastMCP servers (2 Local + 2 Remote).
"""

import json
import asyncio
from typing import Dict, Any, List
from mcp_client.client_manager import client_manager
from mcp_client.llm_config import get_nvidia_client, NVIDIA_MODEL


class LifeFlowAgent:
    """Intelligent agent powered by NVIDIA NIM Nemotron-3.5-lightning that queries MCP servers."""

    def __init__(self):
        self.llm = get_nvidia_client()
        self.model = NVIDIA_MODEL

    def _build_tools_schema(self, tools: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Format MCP tools into standard OpenAI / NVIDIA function calling schema."""
        formatted_tools = []
        for t in tools:
            # Normalize schema
            params = t.get("parameters", {})
            if not isinstance(params, dict) or not params.get("properties"):
                params = {
                    "type": "object",
                    "properties": {},
                    "required": []
                }
            
            tool_spec = {
                "type": "function",
                "function": {
                    "name": t["name"],
                    "description": t.get("description", "MCP tool"),
                    "parameters": params
                }
            }
            formatted_tools.append(tool_spec)
        return formatted_tools

    async def run(self, user_prompt: str) -> Dict[str, Any]:
        """Process user message, query NVIDIA NIM for function calling or synthesis, execute MCP tools."""
        # 1. Fetch live tool registry
        tools = await client_manager.discover_all_tools()
        tools_schema = self._build_tools_schema(tools)

        system_instruction = (
            "You are LifeFlow AI, an intelligent personal finance & daily routine agent powered by the Model Context Protocol (MCP).\n"
            "You have access to 4 connected MCP servers:\n"
            "1. LocalExpenseServer (Local stdio): add_expense, get_monthly_summary, check_budget_status, get_expenses_by_date_range, delete_expense, update_financial_rules.\n"
            "2. LocalHabitServer (Local stdio): log_habit, get_habit_streaks, add_journal_entry.\n"
            "3. RemoteCurrencyServer (Remote SSE): convert_currency, get_crypto_price.\n"
            "4. RemoteCityServer (Remote SSE): get_city_weather, get_city_living_tips.\n\n"
            "INSTRUCTIONS:\n"
            "- Always use the appropriate tool when the user asks about expenses, habits, currency conversion, crypto, or city info.\n"
            "- If a user mentions multiple actions (e.g. log expense AND convert currency), call the tools or answer clearly.\n"
            "- Provide concise, encouraging, and structured responses."
        )

        messages = [
            {"role": "system", "content": system_instruction},
            {"role": "user", "content": user_prompt}
        ]

        tool_executions: List[Dict[str, Any]] = []

        try:
            # Call NVIDIA NIM (Fast mode: disable long reasoning loops for instantaneous tool calling)
            loop = asyncio.get_event_loop()
            response = await loop.run_in_executor(
                None,
                lambda: self.llm.chat.completions.create(
                    model=self.model,
                    messages=messages,
                    tools=tools_schema if tools_schema else None,
                    tool_choice="auto" if tools_schema else None,
                    max_tokens=300,
                    temperature=0.1,
                    extra_body={
                        "chat_template_kwargs": {"enable_thinking": False}
                    }
                )
            )

            msg = response.choices[0].message

            # Check if model chose to invoke tools
            if getattr(msg, "tool_calls", None) and msg.tool_calls:
                for tool_call in msg.tool_calls:
                    fn_name = tool_call.function.name
                    try:
                        fn_args = json.loads(tool_call.function.arguments or "{}")
                    except Exception:
                        fn_args = {}

                    # Execute tool via MCP Client Manager
                    exec_res = await client_manager.execute_tool(fn_name, fn_args)
                    tool_executions.append(exec_res)

                # Return synthesized response directly from MCP tool executions (instant 0ms synthesis!)
                lines = []
                for te in tool_executions:
                    if te.get("success"):
                        lines.append(f"**[{te.get('server')}]**: {te.get('result')}")
                    else:
                        lines.append(f"⚠️ *Error ({te.get('tool')})*: {te.get('error')}")
                final_answer = "\n\n".join(lines) if lines else "Action completed successfully."

            else:
                final_answer = msg.content or "I have processed your request."

        except Exception as e:
            # Fallback heuristic if API timeout or formatting occurs
            from mcp_client.agent_fallback import fallback_execute
            return await fallback_execute(user_prompt)

        return {
            "answer": final_answer,
            "tool_calls": tool_executions,
            "llm": f"NVIDIA NIM ({self.model})"
        }


agent = LifeFlowAgent()
