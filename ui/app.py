"""
LifeFlow MCP Web Dashboard & Protocol Inspector Backend
FastAPI server serving the UI and handling JSON-RPC event broadcasting.
"""

import asyncio
from typing import Dict, Any, List
from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from pydantic import BaseModel

from mcp_client.client_manager import client_manager, PROTOCOL_LOGS
from mcp_client.agent import agent

app = FastAPI(title="LifeFlow MCP Dashboard", version="1.0.0")

templates = Jinja2Templates(directory="ui/templates")
app.mount("/static", StaticFiles(directory="ui/static"), name="static")


class ToolExecuteRequest(BaseModel):
    tool_name: str
    arguments: Dict[str, Any] = {}


class ChatRequest(BaseModel):
    message: str


@app.get("/", response_class=HTMLResponse)
async def serve_dashboard(request: Request):
    """Serve main interactive dashboard."""
    return templates.TemplateResponse(request=request, name="index.html")


@app.get("/api/servers")
async def get_servers_status():
    """Return live status of the 4 MCP servers."""
    return JSONResponse({
        "servers": client_manager.servers
    })


@app.get("/api/tools")
async def get_tools():
    """Discover and return all registered tools across servers."""
    tools = await client_manager.discover_all_tools()
    return JSONResponse({
        "count": len(tools),
        "tools": tools
    })


@app.post("/api/tools/execute")
async def execute_tool(req: ToolExecuteRequest):
    """Directly trigger a specific MCP tool."""
    res = await client_manager.execute_tool(req.tool_name, req.arguments)
    return JSONResponse(res)


@app.post("/api/chat")
async def chat_with_agent(req: ChatRequest):
    """Agent conversational query processing with multi-server tool calling."""
    response = await agent.run(req.message)
    return JSONResponse(response)


@app.get("/api/logs")
async def get_logs():
    """Fetch raw MCP JSON-RPC protocol activity logs."""
    return JSONResponse({
        "logs": list(reversed(PROTOCOL_LOGS[-50:]))
    })


@app.on_event("startup")
async def startup_event():
    """Discover tools on application initialization."""
    asyncio.create_task(client_manager.discover_all_tools())
