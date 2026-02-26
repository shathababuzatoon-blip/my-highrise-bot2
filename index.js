const { Highrise } = require("highrise-js-sdk");
const fs = require("fs");

// ⚙️ الإعدادات الأساسية
const settings = {
    token: "89908fe42d0e89b668c5ce2aa96ac4d281ec8e80dc1262f21c0e93731a01afa8",
    room: "69a0d083286f3dd83a9570b8"
};

const bot = new Highrise(settings.token, settings.room);

// --- 📂 إدارة قاعدة البيانات 📂 ---
// ملاحظة: على Render، الملفات قد تُمحى عند إعادة التشغيل، لكن الكود سيظل يعمل
let db = {
    owners: ["ar.z".toLowerCase()], 
    moshrefs: [],
    locations: {},
    messages: [],
    vipPassword: "123",
    stats: { totalJoins: 0, totalMessages: 0, userTalkCount: {} }
};

// --- 💃 مكتبة الرقصات الكاملة ---
const emotes = {
    "1": "emote-superpose", "2": "emote-frog", "3": "emote-float", "4": "idle_singing", "5": "idle_layingdown",
    "6": "emote-swordfight", "7": "emote-energyball", "8": "emote-cute", "9": "emote-teleporting", "10": "emote-telekinesis",
    "11": "emote-maniac", "12": "emote-embarrassed", "13": "emote-frustrated", "14": "emote-snake", "15": "emote-confused",
    "16": "emote-roll", "17": "emote-rofl", "18": "emote-superpunch", "19": "emote-superrun", "20": "emote-monster_fail",
    "21": "emote-peekaboo", "22": "emote-sumo", "23": "emote-charging", "24": "emote-proposing", "25": "emote-ropepull",
    "26": "emote-secrethandshake", "27": "emote-elbowbump", "28": "emote-hug", "29": "emote-hugyourself", "30": "emote-snowball",
    "31": "emote-hot", "32": "emote-snowangel", "33": "emote-curtsy", "34": "emote-fail2", "35": "emote-fail1",
    "36": "emote-boo", "37": "emote-wings", "38": "emote-model", "39": "emote-theatrical", "40": "emote-laughing2",
    "41": "emote-jetpack", "42": "emote-bunnyhop", "43": "emote-death", "44": "emote-disco", "45": "emote-cold",
    "46": "emote-handstand", "47": "emote-splitsdrop", "48": "emote-deathdrop", "49": "emote-heartshape", "50": "emote-greedy",
    "51": "emote-panic", "52": "emote-exasperated", "53": "emote-exasperatedb", "54": "emote-dab", "55": "emote-harlemshake",
    "56": "emote-gangnam", "57": "emote-tapdance", "58": "emote-robot", "59": "emote-rainbow", "60": "emote-nightfever",
    "61": "emote-laughing", "62": "emote-kiss", "63": "emote-judochop", "64": "emote-gordonshuffle", "65": "emote-zombierun",
    "66": "emote-astronaut", "67": "emote-punkguitar", "68": "emote-gravity", "69": "emote-fashionista", "70": "dance-tiktok10",
    "71": "dance-weird", "72": "dance-tiktok9", "73": "dance-shoppingcart", "74": "dance-zombie", "75": "dance-russian",
    "76": "dance-pennywise", "77": "dance-smoothwalk", "78": "dance-singleladies", "79": "dance-duckwalk", "80": "dance-aerobics",
    "81": "dance-icecream", "82": "idle-fighter", "83": "emote-ghost-idle", "84": "emoji-angry", "85": "emote-bow",
    "86": "idle-dance-casual", "87": "emoji-celebrate", "88": "idle-enthusiastic", "89": "idle-floating", "90": "emote-shy",
    "91": "emote-tired", "92": "dance-pinguin", "93": "idle-guitar", "94": "emote-stargazer", "95": "emote-boxer",
    "96": "dance-creepypuppet", "97": "dance-anime", "98": "emote-creepycute", "99": "emote-headblowup", "100": "emote-shy2",
    "183": "emote-heartfingers", "185": "emote-howl", "186": "dance-orangejustice"
};

const activeLoops = new Map();
const playerPositions = new Map();
const playerIds = new Map();
let msgIntervals = [];

// وظيفة تشغيل الرسائل التلقائية
function startMessages() {
    msgIntervals.forEach(clearInterval);
    msgIntervals = db.messages.map(m => setInterval(() => bot.chat.send(m.text), m.time * 60000));
}

// --- أحداث البوت ---
bot.on("ready", () => {
    startMessages();
    console.log("✅ البوت متصل وشغال عبر Render!");
});

bot.on("playerJoin", (user, pos) => {
    playerIds.set(user.username.toLowerCase(), user.id);
    if (pos) playerPositions.set(user.id, pos);
    db.stats.totalJoins++;
    bot.chat.send(`نورت يا @${user.username} ❤️ اكتب help للأوامر.`);
});

bot.on("playerMove", (user, pos) => playerPositions.set(user.id, pos));

bot.on("chatMessage", async (user, message) => {
    const input = message.trim().toLowerCase();
    const args = message.split(" ");
    const sender = user.username.toLowerCase();
    const isOwner = db.owners.includes(sender);
    const isMoshref = db.moshrefs.includes(sender) || isOwner;

    db.stats.totalMessages++;
    db.stats.userTalkCount[sender] = (db.stats.userTalkCount[sender] || 0) + 1;

    // 📩 المساعدة
    if (input === "help") {
        bot.whisper.send(user.id, "📜 الأوامر:\n- الأرقام (1-186) للرقص.\n- توقف: لإنهاء الرقص.\n- stats: للإحصائيات.\n🛠️ للمشرفين: set [اسم], ms [نص] [وقت]");
        return;
    }

    // 🔐 دخول الـ VIP
    if (message === db.vipPassword && db.locations["vip"]) {
        const l = db.locations["vip"];
        bot.player.teleport(user.id, l.x, l.y, l.z, l.facing);
        return;
    }

    // 🛠️ أوامر الإدارة
    if (isMoshref) {
        if (input.startsWith("set ")) {
            const name = args[1].toLowerCase();
            const p = playerPositions.get(user.id);
            if (p) { db.locations[name] = p; bot.chat.send(`📍 تم حفظ موقع ${name}`); }
        }
        if (input.startsWith("ms ")) {
            const time = parseInt(args.pop());
            const text = args.slice(1).join(" ");
            if (time) { db.messages.push({text, time}); startMessages(); bot.chat.send("✅ تمت إضافة الرسالة التلقائية"); }
        }
    }

    // 🌍 رقص وحركة
    if (db.locations[input]) {
        const l = db.locations[input];
        bot.player.teleport(user.id, l.x, l.y, l.z, l.facing);
    } else if (input === "stats") {
        bot.chat.send(`📊 الزوار: ${db.stats.totalJoins} | الرسائل: ${db.stats.totalMessages}`);
    } else if (input === "توقف") {
        if (activeLoops.has(user.id)) { clearInterval(activeLoops.get(user.id)); activeLoops.delete(user.id); }
    } else if (emotes[input]) {
        if (activeLoops.has(user.id)) clearInterval(activeLoops.get(user.id));
        const doEmote = () => bot.player.emote(user.id, emotes[input]).catch(()=>{});
        doEmote();
        activeLoops.set(user.id, setInterval(doEmote, 10000));
    }
});

bot.on("error", (err) => console.log("❌ خطأ:", err));
bot.login();
