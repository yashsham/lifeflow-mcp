const API_BASE = "";

// State
let allTools = [];
let logsInterval = null;

// Initial Load
document.addEventListener("DOMContentLoaded", () => {
    fetchServers();
    fetchTools();
    fetchLogs();
    
    // Auto-poll logs every 2 seconds for live protocol inspection
    logsInterval = setInterval(fetchLogs, 2000);
});

// Fetch Server Statuses
async function fetchServers() {
    try {
        const res = await fetch(`${API_BASE}/api/servers`);
        const data = await res.json();
        const container = document.getElementById("server-cards-container");
        container.innerHTML = "";

        for (const [key, srv] of Object.entries(data.servers)) {
            const isLocal = srv.type.includes("Local");
            const badgeClass = isLocal ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-cyan-500/10 text-cyan-400 border-cyan-500/20";
            const dotClass = isLocal ? "dot-green" : "dot-blue";

            const card = document.createElement("div");
            card.className = "glass-panel p-3 flex flex-col gap-2 hover:border-blue-500/40 transition";
            card.innerHTML = `
                <div class="flex items-center justify-between">
                    <div class="flex items-center gap-2">
                        <span class="dot ${dotClass}"></span>
                        <h4 class="font-semibold text-sm text-gray-200">${srv.name}</h4>
                    </div>
                    <span class="text-xs px-2 py-0.5 rounded border ${badgeClass}">${srv.type}</span>
                </div>
                <p class="text-xs text-gray-400">${srv.description}</p>
                <div class="flex items-center justify-between mt-1 text-[11px] text-gray-500 font-mono">
                    <span>${srv.endpoint}</span>
                    <span class="text-emerald-400">${srv.status || 'Active'}</span>
                </div>
            `;
            container.appendChild(card);
        }
    } catch (e) {
        console.error("Failed to load servers", e);
    }
}

// Fetch Tools
async function fetchTools() {
    try {
        const res = await fetch(`${API_BASE}/api/tools`);
        const data = await res.json();
        allTools = data.tools || [];
        
        document.getElementById("tool-count").innerText = `${allTools.length} Tools`;
        const container = document.getElementById("tool-list-container");
        container.innerHTML = "";

        allTools.forEach(tool => {
            const el = document.createElement("div");
            el.className = "p-3 rounded-lg bg-gray-900/60 border border-white/5 hover:border-blue-500/30 transition flex flex-col gap-1.5 cursor-pointer";
            el.onclick = () => quickExecuteTool(tool.name);
            el.innerHTML = `
                <div class="flex items-center justify-between">
                    <span class="font-mono text-xs text-blue-400 font-medium">⚡ ${tool.name}</span>
                    <span class="text-[10px] text-gray-500">${tool.server}</span>
                </div>
                <p class="text-xs text-gray-400 line-clamp-2">${tool.description}</p>
                <div class="flex justify-end pt-1">
                    <span class="text-[11px] text-blue-400 hover:text-blue-300 font-mono">Run Test ➔</span>
                </div>
            `;
            container.appendChild(el);
        });
    } catch (e) {
        console.error("Failed to fetch tools", e);
    }
}

// Quick execute single tool
async function quickExecuteTool(toolName) {
    appendUserMessage(`[Direct Tool Test]: Run ${toolName}`);
    showTypingIndicator();

    try {
        let args = {};
        if (toolName === "convert_currency") args = { amount: 100, from_curr: "USD", to_curr: "INR" };
        if (toolName === "get_city_weather") args = { city: "Delhi" };
        if (toolName === "get_city_living_tips") args = { city: "Bangalore" };
        if (toolName === "get_crypto_price") args = { coin: "bitcoin" };
        if (toolName === "add_expense") args = { category: "Food", amount: 350, note: "Test Lunch", currency: "INR" };
        if (toolName === "log_habit") args = { habit_name: "Morning Workout", completed: true };

        const res = await fetch(`${API_BASE}/api/tools/execute`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ tool_name: toolName, arguments: args })
        });
        const data = await res.json();
        removeTypingIndicator();

        let formatted = `**Executed MCP Tool:** \`${toolName}\` on **${data.server}** (${data.elapsed_ms}ms)\n\n`;
        if (data.success) {
            formatted += `\`\`\`\n${data.result}\n\`\`\``;
        } else {
            formatted += `⚠️ **Error:** ${data.error}`;
        }
        appendAssistantMessage(formatted);
        fetchLogs();
    } catch (e) {
        removeTypingIndicator();
        appendAssistantMessage(`Failed to execute: ${e.message}`);
    }
}

// Send chat message
async function sendMessage() {
    const input = document.getElementById("chat-input");
    const query = input.value.trim();
    if (!query) return;

    input.value = "";
    appendUserMessage(query);
    showTypingIndicator();

    try {
        const res = await fetch(`${API_BASE}/api/chat`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message: query })
        });
        const data = await res.json();
        removeTypingIndicator();
        appendAssistantMessage(data.answer);
        fetchLogs();
    } catch (e) {
        removeTypingIndicator();
        appendAssistantMessage(`Error connecting to agent: ${e.message}`);
    }
}

// UI Message Renderers
function appendUserMessage(text) {
    const box = document.getElementById("chat-messages");
    const div = document.createElement("div");
    div.className = "flex justify-end";
    div.innerHTML = `
        <div class="max-w-[80%] bg-blue-600/30 border border-blue-500/40 rounded-2xl rounded-tr-sm px-4 py-2.5 text-sm text-gray-100 shadow-md">
            ${escapeHtml(text)}
        </div>
    `;
    box.appendChild(div);
    box.scrollTop = box.scrollHeight;
}

function appendAssistantMessage(markdownText) {
    const box = document.getElementById("chat-messages");
    const div = document.createElement("div");
    div.className = "flex justify-start";
    
    // Convert basic markdown to html safely
    let html = markdownText
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/`([^`]+)`/g, '<code class="bg-gray-800 text-cyan-300 px-1 py-0.5 rounded font-mono text-xs">$1</code>')
        .replace(/```([\s\S]*?)```/g, '<pre class="bg-black/50 p-2.5 rounded my-1.5 font-mono text-xs text-emerald-400 overflow-x-auto">$1</pre>')
        .replace(/\n/g, '<br/>');

    div.innerHTML = `
        <div class="max-w-[85%] bg-gray-800/60 border border-white/10 rounded-2xl rounded-tl-sm px-4 py-3 text-sm text-gray-200 leading-relaxed shadow-md">
            ${html}
        </div>
    `;
    box.appendChild(div);
    box.scrollTop = box.scrollHeight;
}

function showTypingIndicator() {
    const box = document.getElementById("chat-messages");
    const div = document.createElement("div");
    div.id = "typing-indicator";
    div.className = "flex justify-start";
    div.innerHTML = `
        <div class="bg-gray-800/40 border border-white/5 rounded-2xl px-4 py-2 text-xs text-gray-400 flex items-center gap-2">
            <span class="animate-spin text-cyan-400">⚙️</span> Orchestrating MCP Servers...
        </div>
    `;
    box.appendChild(div);
    box.scrollTop = box.scrollHeight;
}

function removeTypingIndicator() {
    const el = document.getElementById("typing-indicator");
    if (el) el.remove();
}

// Fetch JSON-RPC Protocol Logs
async function fetchLogs() {
    try {
        const res = await fetch(`${API_BASE}/api/logs`);
        const data = await res.json();
        const container = document.getElementById("protocol-logs-container");
        if (!container) return;
        
        container.innerHTML = "";
        (data.logs || []).forEach(log => {
            const isOut = log.direction.includes("OUTGOING");
            const badgeClass = isOut ? "log-badge-out" : "log-badge-in";
            const dirArrow = isOut ? "➔" : "⬅";

            const el = document.createElement("div");
            el.className = "log-box mb-2";
            el.innerHTML = `
                <div class="flex items-center justify-between mb-1">
                    <span class="${badgeClass} font-semibold">${dirArrow} ${log.direction}</span>
                    <span class="text-gray-500 text-[10px]">${log.timestamp}</span>
                </div>
                <div class="text-gray-300 font-medium mb-1">[${log.server}] <span class="text-cyan-400">${log.method}</span></div>
                <pre class="text-[11px] text-gray-400 overflow-x-auto">${escapeHtml(JSON.stringify(log.data, null, 2))}</pre>
            `;
            container.appendChild(el);
        });
    } catch (e) {
        // silent fail on poller
    }
}

function escapeHtml(str) {
    if (typeof str !== 'string') return str;
    return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
