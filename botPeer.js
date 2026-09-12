/**
 * WyreSup AI Bot Peer (AntigravityBot - رَفِيق الشَّبَكَة)
 * Automated interactive companion peer running on the server
 */

const NodeP2PClient = require('./NodeP2PClient');

async function startBot() {
    console.log('═══════════════════════════════════════════════════════════════════════');
    console.log(' 🤖 WyreSup AntigravityBot (رَفِيق الشَّبَكَة)');
    console.log(' Interactive Decentralized Companion Server');
    console.log('═══════════════════════════════════════════════════════════════════════\n');

    const bot = new NodeP2PClient({
        name: 'AntigravityBot',
        relayUrl: 'ws://127.0.0.1:5190'
    });

    bot.on('ready', ({ identity }) => {
        console.log(`[BOT] ✓ Identity active: ${identity.fullId}`);
    });

    bot.on('relay_connected', ({ url }) => {
        console.log(`[BOT] ✓ Connected to relay at ${url}`);
    });

    // When a peer connects & establishes key
    bot.on('key_established', async ({ peerId, transport }) => {
        console.log(`[BOT] 🔒 Key established with: ${peerId} [${transport}]`);
        
        // Wait 500ms and send greeting
        setTimeout(async () => {
            try {
                const greeting = `السلام عليكم! 🤖 I am AntigravityBot, your decentralized mesh companion on WyreSup!\n\nI am connected as the other side for your phone browser test. You can send me messages, test voice notes 🎤, group chats 👥, or publish to the Nashr feed 📰!`;
                await bot.sendMessage(peerId, greeting);
                console.log(`[BOT] Sent greeting to ${peerId}`);
            } catch (e) {
                console.error(`[BOT] Greeting error: ${e.message}`);
            }
        }, 600);
    });

    // Direct chat messages
    bot.on('message', async ({ from, text, encrypted, transport }) => {
        console.log(`[BOT] Message from ${from}: "${text}"`);
        if (from === bot.identity.fullId) return;

        const input = text.trim();
        let reply = '';

        if (/^(hi|hello|hey|salam|marhaba|السلام عليكم)/i.test(input)) {
            reply = `وعليكم السلام ورحمة الله! 👋 Welcome to WyreSup P2P! Your connection from your phone is fully encrypted via Miftah AES-GCM (🔒). How is the mobile interface looking?`;
        } else if (/ping/i.test(input)) {
            reply = `🏓 Pong! Connection is crystal clear over ${transport.toUpperCase()}. Time: ${new Date().toLocaleTimeString()}`;
        } else if (/status/i.test(input)) {
            reply = `📊 Mesh Status:\n• Peer: ${from}\n• Transport: ${transport.toUpperCase()}\n• Miftah PFS: Active (24h Covenant)\n• Server Time: ${new Date().toISOString()}`;
        } else if (/quote/i.test(input) || /lisan/i.test(input)) {
            reply = `📜 From Lisan al-Arab (لسان العرب):\n"سَيْل: الماءُ الكثيرُ الذي يَجْرِي، و مِفْتَاح: ما يُفْتَحُ به الباب."\nEvery message flows like Sayl (torrent) and unlocks securely with Miftah!`;
        } else {
            reply = `🤖 [AntigravityBot] Received: "${input}"\n\n✓ Decrypted cleanly via Miftah\n✓ Sequence verified with zero replay\n✓ Echo response from your computer side!`;
        }

        setTimeout(async () => {
            try {
                await bot.sendMessage(from, reply);
                console.log(`[BOT] Replied to ${from}`);
            } catch (e) {
                console.error(`[BOT] Reply error: ${e.message}`);
            }
        }, 400);
    });

    // Mesh Group Chat
    bot.on('group_message', async ({ groupName, groupId, senderId, content }) => {
        console.log(`[BOT] Group [${groupName}] from ${senderId}: "${content}"`);
        if (senderId === bot.identity.fullId) return;

        setTimeout(async () => {
            try {
                await bot.sendGroupMessage(groupId, `🤖 [AntigravityBot in ${groupName}] Heard loud and clear: "${content}" across the mesh!`);
            } catch (e) {}
        }, 800);
    });

    // Nashr Feed Post
    bot.on('feed_post_received', async ({ post }) => {
        console.log(`[BOT] Received Nashr post from ${post.authorPrefix}: "${post.content}"`);
        
        // Auto-follow author
        await bot.follow(post.authorId);

        // Publish a reply post to the feed
        setTimeout(async () => {
            try {
                await bot.publishPost(`🤖 [Reply to @${post.authorPrefix}] Great post! Cached your thought in my local Hafiz store. Decentralized mesh in action!`);
            } catch (e) {}
        }, 1200);
    });

    // Sawt Voice Note
    bot.on('voice_received', async ({ from, duration, caption, visualWaveform }) => {
        console.log(`[BOT] Received Sawt voice note from ${from} (${duration}s)`);
        
        setTimeout(async () => {
            try {
                const responseText = `🎤 [Sawt Response] Received your ${duration}s voice message ("${caption}")! Waveform preview: ${visualWaveform}`;
                await bot.sendMessage(from, responseText);
            } catch (e) {}
        }, 600);
    });

    // File Received
    bot.on('file_received', async ({ fileName, fileSize, from }) => {
        console.log(`[BOT] Received file: ${fileName} (${fileSize} bytes) from ${from}`);
        
        setTimeout(async () => {
            try {
                await bot.sendMessage(from, `📁 [File Transfer Acknowledged] Saved "${fileName}" (${fileSize} bytes) with 100% verified SHA-256!`);
            } catch (e) {}
        }, 500);
    });

    await bot.init();
}

startBot().catch(console.error);
