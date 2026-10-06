// Edge Client connecting to lifeflow-edge-api worker
const API_URL = "https://lifeflow-edge-api.aspect-ratio---video-resolution-calculator.workers.dev/api/chat";

async function sendEdgeMessage() {
    const input = document.getElementById("chat-input");
    const text = input.value.trim();
    if (!text) return;

    input.value = "";
    appendUserMsg(text);
    showTyping();

    try {
        logEdge(`📤 Request: "${text}" dispatched to Cloudflare Edge Worker`);

        const res = await fetch(API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ message: text })
        });

        const data = await res.json();
        removeTyping();

        const ans = data.answer || "Processed successfully by Cloudflare Edge.";
        appendAiMsg(ans, data.provider || "LifeFlow Edge Agent");
        logEdge(`📥 Received 200 OK from ${data.provider || 'Cloudflare Edge'}`);

    } catch (e) {
        removeTyping();
        appendAiMsg(`⚠️ Edge Connection Notice: ${e.message}`);
        logEdge(`❌ Error: ${e.message}`);
    }
}

function appendUserMsg(t) {
    const b = document.getElementById("chat-messages");
    const d = document.createElement("div");
    d.className = "flex justify-end";
    d.innerHTML = `<div class="bg-orange-600/30 border border-orange-500/40 rounded-2xl px-4 py-2.5 text-sm">${escapeHtml(t)}</div>`;
    b.appendChild(d);
    b.scrollTop = b.scrollHeight;
}

function appendAiMsg(t, provider = "LifeFlow Edge Agent") {
    const b = document.getElementById("chat-messages");
    const d = document.createElement("div");
    d.className = "flex justify-start w-full";
    
    // Convert markdown (including tables, lists, bold) via marked if available
    let parsedHtml = "";
    if (window.marked && typeof window.marked.parse === "function") {
        parsedHtml = window.marked.parse(t);
    } else {
        parsedHtml = escapeHtml(t).replace(/\n/g, '<br/>');
    }

    d.innerHTML = `
        <div class="max-w-[92%] sm:max-w-[85%] bg-slate-900/90 border border-slate-700/60 rounded-2xl px-5 py-3.5 shadow-xl shadow-black/30">
            <div class="flex items-center justify-between pb-2 mb-2 border-b border-white/5">
                <span class="text-[11px] font-semibold text-orange-400 font-mono flex items-center gap-1.5">
                    <span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                    ${escapeHtml(provider)}
                </span>
                <span class="text-[10px] text-slate-400 font-mono">${new Date().toLocaleTimeString()}</span>
            </div>
            <div class="markdown-body overflow-x-auto">
                ${parsedHtml}
            </div>
        </div>
    `;
    b.appendChild(d);
    b.scrollTop = b.scrollHeight;
}

function showTyping() {
    const b = document.getElementById("chat-messages");
    const d = document.createElement("div");
    d.id = "typing-pill";
    d.className = "flex justify-start";
    d.innerHTML = `<div class="bg-gray-800/40 border border-white/5 rounded-2xl px-3 py-1.5 text-xs text-orange-400 animate-pulse">⚡ Edge Routing via NVIDIA NIM...</div>`;
    b.appendChild(d);
    b.scrollTop = b.scrollHeight;
}

function removeTyping() {
    const el = document.getElementById("typing-pill");
    if (el) el.remove();
}

function logEdge(m) {
    const l = document.getElementById("edge-logs");
    if (!l) return;
    const d = document.createElement("div");
    d.className = "log-box mb-1.5";
    d.innerText = `[${new Date().toLocaleTimeString()}] ${m}`;
    l.prepend(d);
}

function escapeHtml(s) {
    return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
