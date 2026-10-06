"""
Multi-Server MCP Client Manager
Connects to both Local (stdio/in-process) and Remote (SSE/HTTP) servers using FastMCP Client.
Captures JSON-RPC protocol activity logs for the visual Inspector.
"""

import asyncio
from datetime import datetime
from typing import Dict, List, Any, Optional
from fastmcp import Client
from servers.local_expense import mcp as local_expense_mcp
from servers.local_habit import mcp as local_habit_mcp

# Global activity log queue for the real-time MCP Inspector
PROTOCOL_LOGS: List[Dict[str, Any]] = []


def record_log(direction: str, server: str, method: str, data: Any):
    """Log MCP JSON-RPC protocol activity for the frontend inspector."""
    log_entry = {
        "id": len(PROTOCOL_LOGS) + 1,
        "timestamp": datetime.now().strftime("%H:%M:%S.%f")[:-3],
        "direction": direction,  # "OUTGOING (Client -> Server)" or "INCOMING (Server -> Client)"
        "server": server,
        "method": method,
        "data": data
    }
    PROTOCOL_LOGS.append(log_entry)
    # Keep last 150 entries to conserve memory
    if len(PROTOCOL_LOGS) > 150:
        PROTOCOL_LOGS.pop(0)


class MCPClientManager:
    def __init__(self):
        # Server definitions
        self.servers = {
            "local_expense": {
                "name": "LocalExpenseServer",
                "type": "Local (stdio)",
                "description": "Private expense tracking, ledger summaries, and budget caps",
                "mcp_obj": local_expense_mcp,
                "status": "Ready",
                "endpoint": "stdio:internal"
            },
            "local_habit": {
                "name": "LocalHabitServer",
                "type": "Local (stdio)",
                "description": "Private habits, streaks, and daily reflections",
                "mcp_obj": local_habit_mcp,
                "status": "Ready",
                "endpoint": "stdio:internal"
            },
            "remote_currency": {
                "name": "RemoteCurrencyServer",
                "type": "Remote (SSE / HTTP)",
                "description": "Live global forex exchange rates and crypto market valuations",
                "endpoint": "http://127.0.0.1:8001/sse",
                "status": "Ready"
            },
            "remote_city": {
                "name": "RemoteCityServer",
                "type": "Remote (SSE / HTTP)",
                "description": "Live weather telemetry and city living cost indicators",
                "endpoint": "http://127.0.0.1:8002/sse",
                "status": "Ready"
            }
        }
        self.tool_registry: Dict[str, Dict[str, Any]] = {}

    def _get_client_for_server(self, server_key: str) -> Client:
        cfg = self.servers[server_key]
        if "mcp_obj" in cfg:
            # In-process FastMCP client
            return Client(cfg["mcp_obj"])
        else:
            # Remote SSE / HTTP FastMCP client
            return Client(cfg["endpoint"])

    async def discover_all_tools(self, force_refresh: bool = False) -> List[Dict[str, Any]]:
        """Query each MCP server via `tools/list` and assemble an aggregated registry (cached)."""
        if not force_refresh and self.tool_registry:
            return [v["meta"] for v in self.tool_registry.values()]

        all_tools = []
        
        for server_key, cfg in self.servers.items():
            record_log(
                direction="OUTGOING",
                server=cfg["name"],
                method="tools/list",
                data={"params": {}}
            )
            try:
                # FastMCP Client instance
                if "mcp_obj" in cfg:
                    async with Client(cfg["mcp_obj"]) as client:
                        tools = await client.list_tools()
                else:
                    async with Client(cfg["endpoint"]) as client:
                        tools = await client.list_tools()

                tool_dicts = []
                for t in tools:
                    # Support both input_schema (v2) and inputSchema (v1)
                    schema = getattr(t, "input_schema", None) or getattr(t, "inputSchema", None) or {}
                    t_info = {
                        "name": t.name,
                        "description": t.description or "No description provided",
                        "server": cfg["name"],
                        "server_key": server_key,
                        "server_type": cfg["type"],
                        "parameters": schema
                    }
                    tool_dicts.append(t_info)
                    self.tool_registry[t.name] = {
                        "server_key": server_key,
                        "meta": t_info
                    }
                    all_tools.append(t_info)

                cfg["status"] = f"Connected ({len(tool_dicts)} tools)"
                record_log(
                    direction="INCOMING",
                    server=cfg["name"],
                    method="tools/list.response",
                    data={"tools_count": len(tool_dicts), "tools": [t["name"] for t in tool_dicts]}
                )

            except Exception as e:
                # If remote server isn't running yet, record diagnostic
                cfg["status"] = f"Offline ({str(e)[:35]}...)"
                record_log(
                    direction="INCOMING",
                    server=cfg["name"],
                    method="tools/list.error",
                    data={"error": str(e)}
                )

        return all_tools

    async def execute_tool(self, tool_name: str, arguments: Dict[str, Any]) -> Dict[str, Any]:
        """Dispatch a `tools/call` JSON-RPC message to the specific owning server."""
        if tool_name not in self.tool_registry:
            # Refresh if missing
            await self.discover_all_tools()

        if tool_name not in self.tool_registry:
            return {
                "success": False,
                "error": f"Tool '{tool_name}' not found in any registered MCP server."
            }

        server_key = self.tool_registry[tool_name]["server_key"]
        server_cfg = self.servers[server_key]

        record_log(
            direction="OUTGOING",
            server=server_cfg["name"],
            method="tools/call",
            data={"name": tool_name, "arguments": arguments}
        )

        start_time = datetime.now()
        try:
            if "mcp_obj" in server_cfg:
                async with Client(server_cfg["mcp_obj"]) as client:
                    result = await client.call_tool(tool_name, arguments)
            else:
                async with Client(server_cfg["endpoint"]) as client:
                    result = await client.call_tool(tool_name, arguments)

            elapsed_ms = int((datetime.now() - start_time).total_seconds() * 1000)

            # Format result content
            content_str = ""
            if hasattr(result, "content") and result.content:
                for block in result.content:
                    if hasattr(block, "text"):
                        content_str += block.text + "\n"
                    else:
                        content_str += str(block) + "\n"
            else:
                content_str = str(result)

            record_log(
                direction="INCOMING",
                server=server_cfg["name"],
                method="tools/call.response",
                data={"result": content_str.strip()[:200] + ("..." if len(content_str) > 200 else "")}
            )

            return {
                "success": True,
                "server": server_cfg["name"],
                "server_type": server_cfg["type"],
                "tool": tool_name,
                "elapsed_ms": elapsed_ms,
                "result": content_str.strip()
            }

        except Exception as e:
            elapsed_ms = int((datetime.now() - start_time).total_seconds() * 1000)
            record_log(
                direction="INCOMING",
                server=server_cfg["name"],
                method="tools/call.error",
                data={"error": str(e)}
            )
            return {
                "success": False,
                "server": server_cfg["name"],
                "tool": tool_name,
                "elapsed_ms": elapsed_ms,
                "error": str(e)
            }


# Singleton client manager
client_manager = MCPClientManager()
