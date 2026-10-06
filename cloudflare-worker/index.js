/**
 * LifeFlow MCP Gateway - Cloudflare Worker
 * Built with Cloudflare AI Gateway & Edge Architecture
 * Orchestrates MCP tool calls at the Edge to FastMCP Cloud and NVIDIA NIM!
 */

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // Enable CORS for web UI
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    // Health check
    if (url.pathname === "/health") {
      return new Response(JSON.stringify({ status: "healthy", edge: "Cloudflare Workers + AI Gateway" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // Proxy tools call to FastMCP Cloud
    if (url.pathname === "/api/remote-tools" && request.method === "POST") {
      try {
        const body = await request.json();
        // Forward request directly to live FastMCP Cloud server!
        const fastmcpRes = await fetch("https://2in1cryptoweather.fastmcp.app/mcp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body)
        });
        const data = await fastmcpRes.text();
        return new Response(data, {
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
    }

    // Edge Agent Chat endpoint routing via Cloudflare AI Gateway / NVIDIA NIM
    if (url.pathname === "/api/chat" && request.method === "POST") {
      try {
        const { message } = await request.json();

        // 1. If AI Gateway is configured, route via gateway URL:
        // const gatewayUrl = `https://gateway.ai.cloudflare.com/v1/${env.CF_ACCOUNT_ID}/${env.CF_GATEWAY_ID}/openai/chat/completions`;
        const nvidiaUrl = "https://integrate.api.nvidia.com/v1/chat/completions";

        const aiResponse = await fetch(nvidiaUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${env.NVIDIA_API_KEY || "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"}`
          },
          body: JSON.stringify({
            model: "nvidia/nemotron-3.5-lightning-30b-a3b",
            messages: [
              { role: "system", content: "You are LifeFlow Edge Agent deployed on Cloudflare Workers and FastMCP." },
              { role: "user", content: message }
            ],
            max_tokens: 300,
            temperature: 0.2
          })
        });

        const aiData = await aiResponse.json();
        const answer = aiData.choices?.[0]?.message?.content || "Processed at Cloudflare Edge.";

        return new Response(JSON.stringify({
          answer,
          provider: "Cloudflare Worker + NVIDIA NIM Edge Gateway"
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });

      } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
    }

    return new Response("LifeFlow Cloudflare Edge Worker Online", { headers: corsHeaders });
  }
};
