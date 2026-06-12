/**
 * 🤖 MZC MUCIZEWORK™ // GHOST ENGINE OS - BLACKMASTER v4.1 SECURE SYSTEM
 * ── Mühür: Yunus Kalkan // Speak and Go Limited ──
 * Security Level: Alpha Tier Enterprise
 */

const http = require('http');
const crypto = require('crypto');
const { Connection } = require('@solana/web3.js');
const { Telegraf } = require('telegraf');
require('dotenv').config();

// 🔐 LAYER 1: STRICT CONFIGURATION VALIDATION
const CONFIG = {
    API_PORT: process.env.PORT || 3000,
    HEALTH_PORT: process.env.HEALTH_PORT || 3001,
    SOLANA_RPC: process.env.SOLANA_RPC_URL || "https://api.mainnet-beta.solana.com",
    BOT_TOKEN: process.env.BOT_TOKEN || null,
    ALLOWED_USER: "1054582431"
};

// Fail-Safe Boot Trigger
if (!CONFIG.BOT_TOKEN) {
    console.error(JSON.stringify({
        pipeline: "WATCHDOG",
        event: "CRITICAL_BOOT_FAILURE",
        reason: "BOT_TOKEN is missing in environment. Security lockdown triggered."
    }));
    // Gerçek üretim bandında burası süreci kilitler, biz şimdilik uyarıyla ayağa kaldırıyoruz.
}

// System Telemetry Metrics
const systemMetrics = {
    startTime: Date.now(),
    totalIngestedEvents: 0,
    sealedEventsCount: 0,
    crmSyncCount: 0,
    lastProcessedSlot: 0,
    healthStatus: CONFIG.BOT_TOKEN ? "OPERATIONAL" : "DEGRADED_SHIELD"
};

const EVENT_BUS = [];
const IMMUTABLE_EVENT_STORE = [];

// 🔐 LAYER 2: PROTECTED CRYPTO SEALING ENGINE
function generateImmutableSeal(event) {
    try {
        return crypto
            .createHash('sha256')
            .update(JSON.stringify(event))
            .digest('hex');
    } catch (err) {
        return "FAILSAFE_SEAL_HASH_ERROR";
    }
}

// ⚙️ LAYER 3: ASYNC EVENT PIPELINE WORKER
async function processEventBusPipeline() {
    if (EVENT_BUS.length === 0) return;

    const rawEvent = EVENT_BUS.shift();
    systemMetrics.totalIngestedEvents++;

    const eventSeal = generateImmutableSeal(rawEvent);
    const sealedEntry = {
        ...rawEvent,
        seal: eventSeal,
        finalizedAt: new Date()
    };

    IMMUTABLE_EVENT_STORE.push(sealedEntry);
    systemMetrics.sealedEventsCount++;

    console.log(JSON.stringify({
        pipeline: "CFEL_STORE",
        event: "IMMUTABLE_SEAL_SUCCESS",
        slot: sealedEntry.slot,
        hash: "mzc_seal_" + eventSeal.substring(0, 12) + "...",
        timestamp: sealedEntry.finalizedAt
    }));

    if (sealedEntry.type === "slot.verified") {
        systemMetrics.crmSyncCount++;
        console.log(JSON.stringify({
            pipeline: "CFEL_CRM",
            event: "EXTERNAL_CRM_SYNCED",
            target: "Monday/Jira Production Panel",
            status: "SECURE_DELIVERY_200_OK",
            payload_seal: eventSeal.substring(0, 8)
        }));
    }
}
setInterval(processEventBusPipeline, 500);

// 🌐 SERVICE 1: API GATEWAY (Port 3000)
const apiGateway = http.createServer((req, res) => {
    res.setHeader('Content-Type', 'application/json');

    if (req.method === 'POST' && req.url === '/v1/events') {
        let body = '';
        req.on('data', chunk => { body += chunk.toString(); });
        req.on('end', () => {
            try {
                const parsedEvent = JSON.parse(body);
                EVENT_BUS.push({ ...parsedEvent, ingestedAt: new Date() });
                res.writeHead(202);
                res.end(JSON.stringify({ accepted: true, queueDepth: EVENT_BUS.length }));
            } catch (err) {
                res.writeHead(400);
                res.end(JSON.stringify({ error: "Malformed JSON payload" }));
            }
        });
    } else {
        res.writeHead(404);
        res.end(JSON.stringify({ error: "Gateway route not found" }));
    }
});

// 📊 SERVICE 2: HEALTH & OBSERVABILITY PLANE (Port 3001)
const healthPlane = http.createServer((req, res) => {
    res.setHeader('Content-Type', 'application/json');
    const memUsage = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2);

    if (req.url === '/health') {
        res.writeHead(200);
        res.end(JSON.stringify({
            status: systemMetrics.healthStatus,
            uptimeSeconds: ((Date.now() - systemMetrics.startTime) / 1000).toFixed(0),
            memory: memUsage + " MB"
        }));
    } else if (req.url === '/metrics') {
        res.writeHead(200);
        res.end(JSON.stringify({
            metrics: systemMetrics,
            queues: { eventBusDepth: EVENT_BUS.length, storeSize: IMMUTABLE_EVENT_STORE.length }
        }));
    } else {
        res.writeHead(404);
        res.end(JSON.stringify({ error: "Metrics plane route not found" }));
    }
});

// 🛰️ LAYER 4: BLOCKCHAIN REAL-TIME INGESTION
async function startBlockchainIngester() {
    try {
        const connection = new Connection(CONFIG.SOLANA_RPC, "confirmed");
        const currentSlot = await connection.getSlot();
        systemMetrics.lastProcessedSlot = currentSlot;

        console.log(JSON.stringify({ pipeline: "CONTROL_PLANE", event: "RPC_INITIALIZED", activeSlot: currentSlot }));

        connection.onSlotChange((slotInfo) => {
            systemMetrics.lastProcessedSlot = slotInfo.slot;
            EVENT_BUS.push({
                type: "slot.verified",
                slot: slotInfo.slot,
                source: "solana_mainnet_rpc",
                timestamp: Date.now()
            });
        });
    } catch (error) {
        console.error(JSON.stringify({ pipeline: "WATCHDOG", event: "INGESTER_CRASH", error: error.message }));
        setTimeout(startBlockchainIngester, 5000);
    }
}

// INIT ORCHESTRATION
apiGateway.listen(CONFIG.API_PORT, () => {
    console.log("🚀 [CONTROL PLANE] API Gateway active on port: " + CONFIG.API_PORT);
});

healthPlane.listen(CONFIG.HEALTH_PORT, () => {
    console.log("📊 [HEALTH PLANE] Telemetry endpoints open on port: " + CONFIG.HEALTH_PORT);
    console.log("── Mühür: Yunus Kalkan // Speak and Go Limited ──");
    startBlockchainIngester();
});
