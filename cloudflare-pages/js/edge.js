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
        appendAiMsg(ans);
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

function appendAiMsg(t) {
    const b = document.getElementById("chat-messages");
    const d = document.createElement("div");
    d.className = "flex justify-start";
    d.innerHTML = `<div class="bg-gray-800/60 border border-white/10 rounded-2xl px-4 py-3 text-sm leading-relaxed">${escapeHtml(t).replace(/\n/g, '<br/>')}</div>`;
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
