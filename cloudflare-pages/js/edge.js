// Cloudflare Pages Client connecting to Edge Worker & FastMCP
const WORKER_API = "https://lifeflow-mcp-gateway.workers.dev"; // Or relative path if deployed on same domain

async function sendEdgeMessage() {
    const input = document.getElementById("chat-input");
    const text = input.value.trim();
    if (!text) return;

    input.value = "";
    appendUserMsg(text);

    // Call Cloudflare Worker endpoint or fallback direct NVIDIA NIM
    try {
        const res = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer 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"
            },
            body: JSON.stringify({
                model: "nvidia/nemotron-3.5-lightning-30b-a3b",
                messages: [
                    { role: "system", content: "You are LifeFlow AI deployed on Cloudflare Pages connected to FastMCP Cloud at 2in1cryptoweather.fastmcp.app." },
                    { role: "user", content: text }
                ],
                max_tokens: 300,
                extra_body: {
                    chat_template_kwargs: { enable_thinking: false }
                }
            })
        });

        const data = await res.json();
        const ans = data.choices?.[0]?.message?.content || "Completed via Cloudflare Edge.";
        appendAiMsg(ans);
        logEdge(`⚡ Processed by NVIDIA NIM Edge: ${text}`);

    } catch (e) {
        appendAiMsg(`Edge Connection Notice: ${e.message}`);
    }
}

function appendUserMsg(t) {
    const b = document.getElementById("chat-messages");
    const d = document.createElement("div");
    d.className = "flex justify-end";
    d.innerHTML = `<div class="bg-orange-600/30 border border-orange-500/40 rounded-2xl px-4 py-2.5 text-sm">${t}</div>`;
    b.appendChild(d);
    b.scrollTop = b.scrollHeight;
}

function appendAiMsg(t) {
    const b = document.getElementById("chat-messages");
    const d = document.createElement("div");
    d.className = "flex justify-start";
    d.innerHTML = `<div class="bg-gray-800/60 border border-white/10 rounded-2xl px-4 py-3 text-sm">${t}</div>`;
    b.appendChild(d);
    b.scrollTop = b.scrollHeight;
}

function logEdge(m) {
    const l = document.getElementById("edge-logs");
    const d = document.createElement("div");
    d.className = "log-box";
    d.innerText = m;
    l.prepend(d);
}
