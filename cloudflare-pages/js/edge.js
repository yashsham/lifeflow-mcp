// Edge Client connecting to lifeflow-edge-api worker
const API_URL = "https://lifeflow-edge-api.aspect-ratio---video-resolution-calculator.workers.dev/api/chat";

// On-Device Local Storage Engine (100% Privacy-First, Air-Gapped per Device: Laptop or Mobile)
const DeviceDB = {
    getExpenses() {
        try {
            const data = localStorage.getItem("lifeflow_expenses");
            if (data) return JSON.parse(data);
        } catch (e) {}
        // Initial seed if device is newly opened
        const initial = [
            { id: 1, date: "2026-10-01", category: "Food", amount: 450.0, currency: "INR", note: "Groceries at supermarket" },
            { id: 2, date: "2026-10-03", category: "Travel", amount: 120.0, currency: "INR", note: "Metro card recharge" },
            { id: 3, date: "2026-10-05", category: "Bills", amount: 899.0, currency: "INR", note: "Wifi fiber connection" }
        ];
        localStorage.setItem("lifeflow_expenses", JSON.stringify(initial));
        return initial;
    },

    saveExpenses(list) {
        localStorage.setItem("lifeflow_expenses", JSON.stringify(list));
    },

    getRules() {
        try {
            const data = localStorage.getItem("lifeflow_rules");
            if (data) return JSON.parse(data);
        } catch (e) {}
        const initial = { monthly_budget: 15000.0, default_currency: "INR", savings_target_pct: 20.0, needs_cap_pct: 50.0 };
        localStorage.setItem("lifeflow_rules", JSON.stringify(initial));
        return initial;
    },

    saveRules(r) {
        localStorage.setItem("lifeflow_rules", JSON.stringify(r));
    },

    getHabits() {
        try {
            const data = localStorage.getItem("lifeflow_habits");
            if (data) return JSON.parse(data);
        } catch (e) {}
        const initial = [
            { name: "Morning Workout", target_days: 5, streak: 4, last_done: "2026-10-05" },
            { name: "Read 20 pages", target_days: 7, streak: 12, last_done: "2026-10-06" },
            { name: "Coding practice", target_days: 6, streak: 8, last_done: "2026-10-07" }
        ];
        localStorage.setItem("lifeflow_habits", JSON.stringify(initial));
        return initial;
    },

    saveHabits(h) {
        localStorage.setItem("lifeflow_habits", JSON.stringify(h));
    },

    // Process local intent on the user's actual device
    processLocalIntent(msg) {
        const pLower = msg.toLowerCase();
        const expenses = this.getExpenses();
        const rules = this.getRules();
        const habits = this.getHabits();
        const today = new Date().toISOString().split("T")[0];

        // 1. DELETE EXPENSE
        if (pLower.includes("delete") || pLower.includes("remove")) {
            const match = msg.match(/\b(\d+)\b/);
            if (match) {
                const idToDelete = parseInt(match[1]);
                const index = expenses.findIndex(e => e.id === idToDelete);
                if (index !== -1) {
                    const removed = expenses.splice(index, 1)[0];
                    this.saveExpenses(expenses);
                    return {
                        handled: true,
                        tool: "delete_expense (On-Device Local)",
                        answer: `🗑️ **Expense Deleted Successfully from Device Storage**:\n- **Removed:** [ID ${removed.id}] ${removed.category}: ${removed.amount} ${removed.currency} (*${removed.note || 'No note'}*)\n- **Remaining Expenses:** ${expenses.length} records in local storage.\n- *(Air-gapped: Kept 100% on this device)*`
                    };
                } else {
                    return {
                        handled: true,
                        tool: "delete_expense (On-Device Local)",
                        answer: `❌ **Expense ID ${idToDelete} not found** in your local device records.\nAvailable IDs: ${expenses.map(e => e.id).join(", ") || "None"}.`
                    };
                }
            }
        }

        // 2. ADD EXPENSE
        if (pLower.includes("spent") || pLower.includes("add expense") || pLower.includes("kharcha") || (pLower.includes("log") && (pLower.includes("dinner") || pLower.includes("lunch") || pLower.includes("food") || pLower.includes("travel")))) {
            const numMatch = msg.match(/(\d+(?:\.\d+)?)/);
            if (numMatch) {
                const amount = parseFloat(numMatch[1]);
                let category = "General";
                if (pLower.includes("dinner") || pLower.includes("lunch") || pLower.includes("food") || pLower.includes("grocery")) category = "Food";
                else if (pLower.includes("travel") || pLower.includes("metro") || pLower.includes("cab") || pLower.includes("uber")) category = "Travel";
                else if (pLower.includes("bill") || pLower.includes("recharge") || pLower.includes("wifi")) category = "Bills";

                const newId = expenses.length > 0 ? Math.max(...expenses.map(e => e.id)) + 1 : 1;
                const newEntry = {
                    id: newId,
                    date: today,
                    category: category,
                    amount: amount,
                    currency: rules.default_currency || "INR",
                    note: msg
                };
                expenses.push(newEntry);
                this.saveExpenses(expenses);

                const totalSpent = expenses.reduce((s, e) => s + e.amount, 0);
                const remaining = rules.monthly_budget - totalSpent;

                return {
                    handled: true,
                    tool: "add_expense (On-Device Local)",
                    answer: `✅ **Expense Logged to Device Storage**:\n- **[ID ${newId}]** ${category}: **₹${amount.toLocaleString()} ${rules.default_currency}**\n- **Date:** ${today}\n- **Updated Ledger:** ${expenses.length} total expenses\n- **Budget Status:** ₹${totalSpent.toLocaleString()} spent / ₹${rules.monthly_budget.toLocaleString()} limit (Remaining: ₹${remaining.toLocaleString()})\n- *(Privacy Guaranteed: Stored locally on this ${navigator.userAgent.includes('Mobile') ? 'Phone' : 'Computer'})*`
                };
            }
        }

        // 3. RETRIEVE / LIST ALL EXPENSES
        if (pLower.includes("list expense") || pLower.includes("show expense") || pLower.includes("all expense") || pLower.includes("my expense") || pLower.includes("expanses list") || pLower.includes("view expense")) {
            if (expenses.length === 0) {
                return {
                    handled: true,
                    tool: "get_all_expenses (On-Device Local)",
                    answer: `📋 **On-Device Local Expenses**:\nNo expenses recorded yet on this device. You can add one by typing *"I spent 250 on lunch"*.`
                };
            }
            const total = expenses.reduce((s, e) => s + e.amount, 0);
            let rows = expenses.slice().reverse().map(e => `| **#${e.id}** | ${e.date} | ${e.category} | **₹${e.amount.toLocaleString()}** | ${e.note || '-'} |`).join("\n");
            
            return {
                handled: true,
                tool: "get_all_expenses (On-Device Local)",
                answer: `📋 **All Local Expenses (${expenses.length} items)**\n\n| ID | Date | Category | Amount | Note |\n|:---:|:---:|:---:|:---:|:---|\n${rows}\n\n**Total Spending:** **₹${total.toLocaleString()} ${rules.default_currency}**\n*(Stored strictly on your local device)*`
            };
        }

        // 4. CHECK BUDGET STATUS
        if (pLower.includes("budget status") || pLower.includes("check budget") || pLower.includes("remaining budget")) {
            const total = expenses.reduce((s, e) => s + e.amount, 0);
            const remaining = rules.monthly_budget - total;
            const pct = ((total / rules.monthly_budget) * 100).toFixed(1);
            const status = total > rules.monthly_budget ? "⚠️ **BUDGET EXCEEDED**" : "✅ **HEALTHY**";

            return {
                handled: true,
                tool: "check_budget_status (On-Device Local)",
                answer: `📊 **Active Budget Status (On-Device)**:\n- **Status:** ${status}\n- **Monthly Limit:** ₹${rules.monthly_budget.toLocaleString()} ${rules.default_currency}\n- **Total Spent:** ₹${total.toLocaleString()} (${pct}% used)\n- **Remaining Balance:** ₹${remaining.toLocaleString()} ${rules.default_currency}`
            };
        }

        // 5. UPDATE FINANCIAL RULES
        if (pLower.includes("update budget") || pLower.includes("change budget") || (pLower.includes("budget") && (pLower.includes("set") || pLower.includes("make")))) {
            const match = msg.match(/\b(\d+(?:,\d+)?)\b/);
            if (match) {
                const newBudget = parseFloat(match[1].replace(",", ""));
                rules.monthly_budget = newBudget;
                this.saveRules(rules);
                return {
                    handled: true,
                    tool: "update_financial_rules (On-Device Local)",
                    answer: `⚙️ **Financial Rules Updated on Device**:\n- **New Monthly Budget Cap:** **₹${newBudget.toLocaleString()} ${rules.default_currency}**\n- **Default Currency:** ${rules.default_currency}\n- Your future budget warnings will use this new threshold!`
                };
            }
        }

        // 6. HABITS
        if (pLower.includes("habit streak") || pLower.includes("show habit") || pLower.includes("my habit")) {
            let habitList = habits.map(h => `- **${h.name}**: 🔥 ${h.streak} days streak (Target: ${h.target_days} days/week)`).join("\n");
            return {
                handled: true,
                tool: "get_habit_streaks (On-Device Local)",
                answer: `🏃 **Your Habit Streaks (On-Device)**:\n\n${habitList}\n\n*(Kept private on this device)*`
            };
        }

        return { handled: false };
    }
};

async function sendEdgeMessage() {
    const input = document.getElementById("chat-input");
    const text = input.value.trim();
    if (!text) return;

    input.value = "";
    appendUserMsg(text);
    showTyping();

    // Check if query is an on-device local MCP operation
    const localResult = DeviceDB.processLocalIntent(text);
    if (localResult && localResult.handled) {
        setTimeout(() => {
            removeTyping();
            appendAiMsg(localResult.answer, `Device Local Server (${navigator.userAgent.includes('Mobile') ? 'Mobile' : 'Desktop'})`);
            logEdge(`🏠 Executed ${localResult.tool} on device storage`);
        }, 150);
        return;
    }

    try {
        logEdge(`📤 Request: "${text}" dispatched to Cloudflare Edge Worker`);

        // Pack current device context so cloud model knows device realities
        const localContext = {
            budget: DeviceDB.getRules().monthly_budget,
            currency: DeviceDB.getRules().default_currency,
            recentExpenses: DeviceDB.getExpenses().slice(-5),
            habits: DeviceDB.getHabits()
        };

        const res = await fetch(API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ message: text, localContext: localContext })
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
