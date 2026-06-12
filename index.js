require("dotenv").config();
const express = require("express");
const { Telegraf, Markup } = require("telegraf");
const axios = require("axios");

const app = express();
const bot = new Telegraf(process.env.BOT_TOKEN || "8763036932:AAG51hUFI0fC30-UidGKiWXwj2VB4nbgyJs");
const PORT = process.env.PORT || 3000;

// ====================== MZC LİSANS HAVUZU ======================
// Kurucu ve ücretli abonelerin Telegram ID havuzu
const ALLOWED_USERS = [
  5459345209, // Örnek ID
];

// LİSANS KORUMA DUVARI VE @alperentutku OTOMATİK KURUCU BYPASS
const mzc_licence_guard = (ctx, next) => {
  const userId = ctx.from?.id;
  const username = ctx.from?.username?.toLowerCase();
  
  // @alperentutku kullanıcı adına tam yetki veriliyor ve havuza dinamik ekleniyor
  if (username === "alperentutku" || ALLOWED_USERS.includes(userId) || ctx.message?.text === "/start") {
    if (username === "alperentutku" && !ALLOWED_USERS.includes(userId)) {
      ALLOWED_USERS.push(userId);
    }
    return next();
  }
  
  // Yetkisiz kullanıcılar için ticari bariyer ($25/Ay)
  return ctx.replyWithHTML(
    `<b>❌ MZC MUCIZEWORK™ // ERİŞİM ENGELLENDİ</b>\n\n` +
    `Bu bot, <b>MUCIZEWORK™ Ghost Engine OS</b> altyapısı ile korunmaktadır.\n\n` +
    `• Sizin Telegram ID: <code>${userId}</code>\n` +
    `• Durum: <b>Lisans Bulunamadı ⚠️</b>\n\n` +
    `💬 Piyasa değerinin tam <b>YARI FİYATINA ($25/Ay)</b> anlık istihbarat hattına lisans satın almak ve bu botu aktifleştirmek için lütfen yönetici ile iletişime geçiniz.\n\n` +
    `── Sahibi: <b>Yunus Kalkan</b> // Speak and Go Limited ──`
  );
};

bot.use(mzc_licence_guard);

// ====================== SMART FORMATTER ======================
const formatCurrency = (value) => {
  if (!value || isNaN(value)) return "$0.0";
  if (value >= 1000000000) return `$${(value / 1000000000).toFixed(1)}B`;
  return `$${(value / 1000000).toFixed(1)}M`;
};

// ====================== REAL-TIME HELPERS ======================
async function getTrendingMetas() {
  try {
    const res = await axios.get("https://api.dexscreener.com/metas/trending/v1");
    return Array.isArray(res.data) ? res.data : (res.data.data || []);
  } catch { return []; }
}

async function getActiveBoosts() {
  try {
    const res = await axios.get("https://api.dexscreener.com/token-boosts/top/v1");
    return res.data?.data || (Array.isArray(res.data) ? res.data : []);
  } catch { return []; }
}

// ====================== KOMUTLAR ======================
bot.start((ctx) => {
  const userId = ctx.from?.id;
  const username = ctx.from?.username?.toLowerCase();
  const hasLicence = ALLOWED_USERS.includes(userId) || username === "alperentutku";

  if (!hasLicence) {
    return ctx.replyWithHTML(
      `<b>🛡️ MZC MUCIZEWORK™ // Ghost Engine OS v1.0</b>\n\n` +
      `Sistem Modeli: <b>Ticari Lisans Katmanı Aktif 🔐</b>\n` +
      `Sizin Telegram ID: <code>${userId}</code>\n\n` +
      `❌ Havuzda aktif lisansınız görünmemektedir. Dışarıdaki yazılım ajanslarının yarı fiyatına <b>($25/Ay)</b> tam erişim sağlamak için lisans talep edebilirsiniz.\n\n` +
      `── Sahibi: <b>Yunus Kalkan</b> // Speak and Go Limited ──`
    );
  }

  return ctx.replyWithHTML(
    `<b>🛡️ MZC MUCIZEWORK™ // Ghost Engine OS</b>\n\n` +
    `Sahibi: <b>Yunus Kalkan</b>\n` +
    `Durum: <b>LİSANSLI TAM ERİŞİM ✅</b>\n\n` +
    `Piyasa istihbarat komutları tetiklenmeye hazır. Menüyü kullanabilirsiniz.\n\n` +
    `• /metas -> Trend Akımları Listele\n` +
    `• /boost -> Sıcak Para Kontratları Yakala\n` +
    `• /ai -> Yapay Zeka Metasını Süz\n` +
    `• /durum -> Sistem Sıcaklığı`
  );
});

bot.command("durum", (ctx) => ctx.replyWithHTML(`<b>📊 MZC EAI+OS Sistem Durumu</b>\n\n• Kontrol Katmanı: <b>AKTİF 🟢</b>\n• Veri Katmanı: <b>REAL-TIME ⚡</b>\n• Lisans Kontrolü: <b>KORUMA AKTİF 🔒</b>\n• Entegrasyon Mührü: <b>MZC-OK ✅</b>`));

bot.command("metas", async (ctx) => {
  const waitingMsg = await ctx.reply("🔥 Trending Metas çekiliyor...");
  const metas = await getTrendingMetas();
  if (!metas || metas.length === 0) return ctx.telegram.editMessageText(ctx.chat.id, waitingMsg.message_id, null, "Şu anda trend meta verisi alınamadı.");

  let msg = "<b>🔥 Güncel Trending Metas</b>\n\n";
  metas.slice(0, 8).forEach((m, index) => {
    msg += `${index + 1}. <b>${m.name}</b>\n💰 MC: <code>${formatCurrency(m.marketCap)}</code> | 🪙 Token: <code>${m.tokenCount}</code>\n\n`;
  });
  await ctx.telegram.editMessageText(ctx.chat.id, waitingMsg.message_id, null, msg, { parse_mode: "HTML" });
});

bot.command("ai", async (ctx) => {
  const waitingMsg = await ctx.reply("🤖 AI Meta sorgulanıyor...");
  const metas = await getTrendingMetas();
  const ai = metas.find(m => m.slug === "ai" || m.name.toLowerCase().includes("ai"));
  
  if (ai) {
    await ctx.telegram.editMessageText(ctx.chat.id, waitingMsg.message_id, null, 
      `<b>🤖 AI & Agents Meta Raporu</b>\n\n` +
      `• Market Cap: <b>${formatCurrency(ai.marketCap)}</b>\n` +
      `• 24s Hacim: <b>${formatCurrency(ai.volume)}</b>\n` +
      `• Toplam Token Sayısı: <b>${ai.tokenCount}</b>`,
      { parse_mode: "HTML" }
    );
  } else {
    await ctx.telegram.editMessageText(ctx.chat.id, waitingMsg.message_id, null, "AI meta verisi şu an piyasada aktif görünmüyor.");
  }
});

bot.command("boost", async (ctx) => {
  const waitingMsg = await ctx.reply("🚀 En aktif boost’lanan token’lar çekiliyor...");
  const boosts = await getActiveBoosts();
  if (!boosts || boosts.length === 0) return ctx.telegram.editMessageText(ctx.chat.id, waitingMsg.message_id, null, "Aktif boost'lanan token bulunamadı.");

  await ctx.telegram.deleteMessage(ctx.chat.id, waitingMsg.message_id);
  await ctx.replyWithHTML("<b>🚀 En Aktif Canlı Boost'lar (DEX Screener)</b>\n\nSıcak para akışı olan kontratlar aşağıda listelenmiştir:");

  for (const b of boosts.slice(0, 4)) {
    if (!b.tokenAddress) continue;
    const dexUrl = b.url || `https://dexscreener.com/${b.chainId}/${b.tokenAddress}`;
    const inlineKeyboard = Markup.inlineKeyboard([Markup.button.url("📊 Grafiği & Detayları Aç", dexUrl)]);
    const infoText = `⛓️ <b>Ağ:</b> <code>${b.chainId?.toUpperCase() || "N/A"}</code>\n📍 <b>Kontrat:</b> <code>${b.tokenAddress}</code>\n🔥 <b>Anlık Boost:</b> <code>${b.amount || 0}</code> | 📊 <b>Toplam:</b> <code>${b.totalAmount || 0}</code>`;
    await ctx.replyWithHTML(infoText, inlineKeyboard);
  }
});

bot.command("kütük", (ctx) => ctx.replyWithHTML(`<b>🔐 Konsolide Egemen Kütük</b>\n\nToplam Rezerv: <b>$20.889.592,98</b> USD`));

// ====================== SERVER ======================
app.get("/health", (req, res) => res.json({ status: "UP", licence_system: "ACTIVE", botId: "8763036932" }));

app.listen(PORT, () => {
  console.log(`🚀 MUCIZEWORK Production Server: http://localhost:${PORT}`);
  console.log("── Mühür: Yunus Kalkan // Speak and Go Limited ──");
});

bot.on("message", (ctx) => {
  console.log(`[LOG] Gelen Mesaj - Gönderen ID: ${ctx.from?.id} | Kullanıcı Adı: @${ctx.from?.username || "Bilinmiyor"}`);
});

bot.launch()
  .then(() => console.log("[MZC OPERASYON] @alperentutku Kurucu bypass aktif edildi. Ghost Engine yayında!"))
  .catch((err) => console.error("[TELEGRAM_HATA]", err.message));
