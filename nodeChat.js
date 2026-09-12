#!/usr/bin/env node

/**
 * WyreSup Interactive Terminal P2P Chat Application
 * 
 * Features:
 * - Direct TCP & WebSocket Relay P2P messaging
 * - Miftah / Aqd / Thaqb end-to-end encryption
 * - Chunked encrypted file transfer (/sendfile)
 * - Multi-hop mesh gossip group chat (/group)
 * - Follower-hosted decentralized feed (/post, /follow, /feed)
 * - Real-time audio voice notes (/voice) with terminal waveform visualizer
 */

const readline = require('readline');
const fs = require('fs');
const path = require('path');
const NodeP2PClient = require('./NodeP2PClient');

// Parse CLI args
const args = process.argv.slice(2);
const options = {
    name: 'user_' + Math.random().toString(36).substring(2, 6),
    tcpPort: null,
    relayUrl: null,
    connectTarget: null
};

for (let i = 0; i < args.length; i++) {
    if (args[i] === '--name' && args[i + 1]) {
        options.name = args[++i];
    } else if (args[i] === '--port' && args[i + 1]) {
        options.tcpPort = parseInt(args[++i], 10);
    } else if (args[i] === '--relay' && args[i + 1]) {
        options.relayUrl = args[++i];
    } else if (args[i] === '--connect' && args[i + 1]) {
        options.connectTarget = args[++i];
    } else if (args[i] === '--help' || args[i] === '-h') {
        printUsage();
        process.exit(0);
    }
}

function printUsage() {
    console.log(`
WyreSup Terminal P2P Chat Client

Usage:
  node nodeChat.js [options]

Options:
  --name <name>        User display name (default: random)
  --port <port>        TCP port to listen on for direct peer connections
  --relay <ws-url>     WebSocket relay URL (e.g. ws://localhost:5190)
  --connect <host:port> Directly connect to a peer's TCP port at launch
  --help, -h           Show this help message
`);
}

// ANSI Colors
const C = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    dim: '\x1b[2m',
    green: '\x1b[32m',
    cyan: '\x1b[36m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    red: '\x1b[31m',
    gray: '\x1b[90m'
};

async function main() {
    console.clear();
    console.log(`${C.green}${C.bright}═══════════════════════════════════════════════════════════════════════${C.reset}`);
    console.log(`${C.green}${C.bright}  WyreSup P2P Encrypted Messenger (سَيْل و مِفْتَاح)               ${C.reset}`);
    console.log(`${C.cyan}  Decentralized • Files • Groups • Nashr Feed • Sawt Voice Notes        ${C.reset}`);
    console.log(`${C.green}${C.bright}═══════════════════════════════════════════════════════════════════════${C.reset}\n`);

    const client = new NodeP2PClient({
        name: options.name,
        tcpPort: options.tcpPort,
        relayUrl: options.relayUrl
    });

    let activePeerId = null;

    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
        prompt: `${C.yellow}[${options.name}] > ${C.reset}`
    });

    function printLog(msg) {
        readline.cursorTo(process.stdout, 0);
        readline.clearLine(process.stdout, 0);
        console.log(msg);
        rl.prompt(true);
    }

    client.on('ready', ({ identity, tcpPort, relayUrl }) => {
        printLog(`${C.green}✓ Identity established:${C.reset} ${C.bright}${identity.fullId}${C.reset}`);
        if (tcpPort) {
            printLog(`${C.cyan}✓ Direct TCP Listening on port:${C.reset} ${C.bright}${tcpPort}${C.reset}`);
        }
        if (relayUrl) {
            printLog(`${C.cyan}✓ Connecting to WebSocket Relay:${C.reset} ${relayUrl}`);
        }
        printLog(`${C.gray}Type /help for available commands or start typing to chat.${C.reset}\n`);

        rl.setPrompt(`${C.yellow}[${identity.prefix}] > ${C.reset}`);
        rl.prompt();
    });

    client.on('relay_connected', ({ url }) => {
        printLog(`${C.green}✓ Connected to Relay (${url})${C.reset}`);
    });

    client.on('peer_discovered', ({ peerId, transport }) => {
        printLog(`${C.magenta}🔍 Discovered peer:${C.reset} ${peerId} [${transport.toUpperCase()}]`);
        if (!activePeerId) activePeerId = peerId;
    });

    client.on('key_established', ({ peerId, transport }) => {
        printLog(`${C.green}🔒 [Aqd / عَقْد] Established encrypted session with:${C.reset} ${C.bright}${peerId}${C.reset} [${transport.toUpperCase()}]`);
        if (!activePeerId) activePeerId = peerId;
    });

    client.on('peer_connected', ({ peerId, transport }) => {
        printLog(`${C.green}🤝 Peer connected & verified:${C.reset} ${peerId} [${transport.toUpperCase()}]`);
        if (!activePeerId) activePeerId = peerId;
    });

    client.on('peer_disconnected', ({ peerId, transport }) => {
        printLog(`${C.gray}✗ Peer disconnected: ${peerId} [${transport.toUpperCase()}]${C.reset}`);
        if (activePeerId === peerId) {
            activePeerId = client.peers.keys().next().value || null;
        }
    });

    client.on('message', ({ from, text, encrypted, transport, timestamp }) => {
        const timeStr = new Date(timestamp).toLocaleTimeString();
        const encBadge = encrypted ? `${C.green}🔒${C.reset}` : `${C.yellow}🔓${C.reset}`;
        const transBadge = `${C.gray}[${transport.toUpperCase()}]${C.reset}`;
        
        printLog(`\n${C.gray}${timeStr}${C.reset} ${encBadge} ${C.cyan}${C.bright}${from}${C.reset} ${transBadge}:`);
        printLog(`  ${C.bright}${text}${C.reset}\n`);
    });

    // Subsystem Event Listeners
    client.on('file_offer', ({ fileName, fileSize, totalChunks, from }) => {
        printLog(`\n${C.blue}📥 Incoming file from ${from}:${C.reset} ${C.bright}${fileName}${C.reset} (${fileSize} bytes, ${totalChunks} chunks)`);
    });

    client.on('transfer_progress', ({ fileName, receivedChunks, totalChunks, progress }) => {
        const barLen = 20;
        const filled = Math.round((progress / 100) * barLen);
        const bar = '█'.repeat(filled) + '░'.repeat(barLen - filled);
        printLog(`${C.blue}📥 Downloading ${fileName}:${C.reset} [${bar}] ${progress}% (${receivedChunks}/${totalChunks})`);
    });

    client.on('file_received', ({ fileName, fileSize, savedPath, from, duration }) => {
        printLog(`\n${C.green}✓ File Received Successfully!${C.reset}`);
        printLog(`  From:     ${from}`);
        printLog(`  File:     ${fileName} (${fileSize} bytes) in ${duration}ms`);
        printLog(`  Location: ${savedPath}\n`);
    });

    client.on('group_message', ({ groupName, senderId, content, hops }) => {
        const hopBadge = hops > 1 ? `${C.yellow}[${hops} hops]${C.reset}` : `${C.gray}[direct]${C.reset}`;
        printLog(`\n${C.magenta}👥 [${groupName}] ${C.cyan}${senderId}${C.reset} ${hopBadge}:`);
        printLog(`  ${C.bright}${content}${C.reset}\n`);
    });

    client.on('feed_post_received', ({ post }) => {
        printLog(`\n${C.yellow}📰 [NASHR FEED] Post from ${post.authorPrefix} (${post.authorId}):${C.reset}`);
        printLog(`  "${C.bright}${post.content}${C.reset}"`);
        printLog(`  ${C.gray}Signature: ${post.signature.slice(0, 24)}... (Verified ✓)${C.reset}\n`);
    });

    client.on('voice_received', ({ from, duration, caption, visualWaveform }) => {
        printLog(`\n${C.magenta}🎤 [SAWT VOICE NOTE] From ${from} (${duration}s):${C.reset}`);
        printLog(`  Waveform: ${C.green}${visualWaveform}${C.reset}`);
        printLog(`  Caption:  "${caption}"\n`);
    });

    client.on('voice_sent', ({ peerId, duration, waveform }) => {
        printLog(`${C.green}🎤 Voice note sent to ${peerId} (${duration}s): ${waveform}${C.reset}`);
    });

    client.on('error', (err) => {
        printLog(`${C.red}Error: ${err.message}${C.reset}`);
    });

    // Handle CLI input
    rl.on('line', async (line) => {
        const input = line.trim();
        if (!input) {
            rl.prompt();
            return;
        }

        if (input.startsWith('/')) {
            const parts = input.split(' ');
            const cmd = parts[0].toLowerCase();

            switch (cmd) {
                case '/help':
                    printLog(`
${C.bright}Available Commands:${C.reset}
  ${C.cyan}/peers${C.reset}                          List connected peers
  ${C.cyan}/select <peerId>${C.reset}                Select default peer
  ${C.cyan}/connect <ip:port>${C.reset}              Connect directly via TCP
  ${C.cyan}/relay <ws-url>${C.reset}                 Connect to WebSocket relay
  ${C.cyan}/msg <peerId> <text>${C.reset}            Send encrypted direct message
  ${C.cyan}/broadcast <text>${C.reset}               Broadcast to all connected peers
  ${C.cyan}/sendfile <peerId> <filePath>${C.reset}   Send encrypted file (TAKHIR chunked)
  ${C.cyan}/group create <groupName>${C.reset}       Create a new mesh gossip group
  ${C.cyan}/group join <groupId>${C.reset}          Join an existing group
  ${C.cyan}/group msg <groupId> <text>${C.reset}    Send multi-hop group gossip message
  ${C.cyan}/post <content>${C.reset}                 Publish signed post to followers (Nashr)
  ${C.cyan}/follow <authorId>${C.reset}              Follow an author's distributed feed
  ${C.cyan}/feed [authorId]${C.reset}                View local or author's distributed feed
  ${C.cyan}/voice <peerId> [sec] [caption]${C.reset} Send real-time voice note (Sawt)
  ${C.cyan}/status${C.reset}                         Show node status & identity
  ${C.cyan}/exit${C.reset}, ${C.cyan}/quit${C.reset}                   Close and exit
`);
                    break;

                case '/peers':
                    if (client.peers.size === 0) {
                        printLog(`${C.gray}No peers currently connected.${C.reset}`);
                    } else {
                        printLog(`\n${C.bright}Connected Peers (${client.peers.size}):${C.reset}`);
                        client.peers.forEach((p, id) => {
                            const isSelected = id === activePeerId ? `${C.green}(active)${C.reset}` : '';
                            const encStatus = p.keyEstablished ? `${C.green}🔒 Encrypted${C.reset}` : `${C.yellow}Unencrypted${C.reset}`;
                            printLog(`  • ${C.cyan}${id}${C.reset} [${p.transport.toUpperCase()}] - ${encStatus} ${isSelected}`);
                        });
                        printLog('');
                    }
                    break;

                case '/select':
                case '/peer':
                    if (parts[1]) {
                        activePeerId = parts[1];
                        printLog(`${C.green}Active peer set to: ${activePeerId}${C.reset}`);
                    } else {
                        printLog(`${C.yellow}Usage: /select <peerId>${C.reset}`);
                    }
                    break;

                case '/connect':
                    if (parts[1]) {
                        const [host, portStr] = parts[1].split(':');
                        const port = parseInt(portStr, 10);
                        if (!host || isNaN(port)) {
                            printLog(`${C.yellow}Usage: /connect <ip:port>${C.reset}`);
                        } else {
                            try {
                                await client.connectTcp(host, port);
                                printLog(`${C.green}✓ TCP connection initiated.${C.reset}`);
                            } catch (e) {
                                printLog(`${C.red}TCP connection failed: ${e.message}${C.reset}`);
                            }
                        }
                    } else {
                        printLog(`${C.yellow}Usage: /connect <ip:port>${C.reset}`);
                    }
                    break;

                case '/relay':
                    if (parts[1]) {
                        client.connectRelay(parts[1]);
                    } else {
                        printLog(`${C.yellow}Usage: /relay <ws-url>${C.reset}`);
                    }
                    break;

                case '/sendfile':
                    if (parts.length >= 3) {
                        const target = parts[1];
                        const filePath = parts.slice(2).join(' ');
                        try {
                            printLog(`${C.cyan}Preparing & sending file ${filePath} to ${target}...${C.reset}`);
                            const meta = await client.sendFile(target, filePath);
                            printLog(`${C.green}✓ File ${meta.fileName} (${meta.fileSize} bytes, ${meta.totalChunks} chunks) sent!${C.reset}`);
                        } catch (e) {
                            printLog(`${C.red}File transfer failed: ${e.message}${C.reset}`);
                        }
                    } else {
                        printLog(`${C.yellow}Usage: /sendfile <peerId> <filePath>${C.reset}`);
                    }
                    break;

                case '/group':
                    if (parts[1] === 'create' && parts[2]) {
                        const group = client.createGroup(parts.slice(2).join(' '));
                        printLog(`${C.green}✓ Group created:${C.reset} ${group.name} (ID: ${C.cyan}${group.id}${C.reset})`);
                    } else if (parts[1] === 'join' && parts[2]) {
                        const group = client.joinGroup(parts[2]);
                        printLog(`${C.green}✓ Joined group:${C.reset} ${group.id}`);
                    } else if (parts[1] === 'msg' && parts[3]) {
                        const groupId = parts[2];
                        const text = parts.slice(3).join(' ');
                        try {
                            const res = await client.sendGroupMessage(groupId, text);
                            printLog(`${C.magenta}Group msg sent to ${res.forwardedTo.length} peer(s) across mesh.${C.reset}`);
                        } catch (e) {
                            printLog(`${C.red}Group message failed: ${e.message}${C.reset}`);
                        }
                    } else {
                        printLog(`${C.yellow}Usage: /group create <name> | /group join <id> | /group msg <id> <text>${C.reset}`);
                    }
                    break;

                case '/post':
                    if (parts.length >= 2) {
                        const content = parts.slice(1).join(' ');
                        try {
                            const post = await client.publishPost(content);
                            printLog(`${C.green}✓ Post published & replicated to followers!${C.reset}`);
                        } catch (e) {
                            printLog(`${C.red}Publish post failed: ${e.message}${C.reset}`);
                        }
                    } else {
                        printLog(`${C.yellow}Usage: /post <content text>${C.reset}`);
                    }
                    break;

                case '/follow':
                    if (parts[1]) {
                        try {
                            await client.follow(parts[1]);
                            printLog(`${C.green}✓ Followed author:${C.reset} ${parts[1]}`);
                        } catch (e) {
                            printLog(`${C.red}Follow failed: ${e.message}${C.reset}`);
                        }
                    } else {
                        printLog(`${C.yellow}Usage: /follow <authorId>${C.reset}`);
                    }
                    break;

                case '/feed':
                    const authorFilter = parts[1] || null;
                    const timeline = client.getTimeline(authorFilter);
                    if (timeline.length === 0) {
                        printLog(`${C.gray}No posts in feed cache.${C.reset}`);
                    } else {
                        printLog(`\n${C.bright}=== Distributed Nashr Feed (${timeline.length} posts) ===${C.reset}`);
                        timeline.forEach((p, idx) => {
                            const timeStr = new Date(p.timestamp).toLocaleTimeString();
                            printLog(`  ${idx + 1}. [${timeStr}] ${C.cyan}${p.authorPrefix}${C.reset}: "${p.content}"`);
                        });
                        printLog('');
                    }
                    break;

                case '/voice':
                    if (parts.length >= 2) {
                        const target = parts[1];
                        const duration = parts[2] ? parseFloat(parts[2]) : 3;
                        const caption = parts.slice(3).join(' ') || 'Voice note';
                        try {
                            await client.sendVoiceNote(target, duration, caption);
                        } catch (e) {
                            printLog(`${C.red}Voice note failed: ${e.message}${C.reset}`);
                        }
                    } else {
                        printLog(`${C.yellow}Usage: /voice <peerId> [durationSeconds] [caption]${C.reset}`);
                    }
                    break;

                case '/msg':
                    if (parts.length >= 3) {
                        const target = parts[1];
                        const text = parts.slice(2).join(' ');
                        try {
                            await client.sendMessage(target, text);
                            printLog(`${C.gray}Sent to ${target} (🔒 ZBAT Encrypted)${C.reset}`);
                        } catch (e) {
                            printLog(`${C.red}Send failed: ${e.message}${C.reset}`);
                        }
                    } else {
                        printLog(`${C.yellow}Usage: /msg <peerId> <message text>${C.reset}`);
                    }
                    break;

                case '/broadcast':
                    if (parts.length >= 2) {
                        const text = parts.slice(1).join(' ');
                        const res = await client.broadcastMessage(text);
                        printLog(`${C.gray}Broadcast sent to ${res.length} peer(s).${C.reset}`);
                    } else {
                        printLog(`${C.yellow}Usage: /broadcast <message text>${C.reset}`);
                    }
                    break;

                case '/status':
                    printLog(`
${C.bright}WyreSup Node Status:${C.reset}
  Identity:       ${client.identity?.fullId}
  TCP Port:       ${client.tcpPort || 'Not listening'}
  Relay URL:      ${client.relayUrl || 'None'} (${client.relayConnected ? C.green + 'Connected' + C.reset : C.yellow + 'Disconnected' + C.reset})
  Connected Peers:${client.peers.size}
  Active Peer:    ${activePeerId || 'None selected'}
  Groups:         ${client.meshGroup.groups.size}
  Nashr Posts:    ${client.nashr.myPosts.size} (Followers: ${client.nashr.followers.size})
`);
                    break;

                case '/clear':
                    console.clear();
                    break;

                case '/exit':
                case '/quit':
                    printLog(`${C.cyan}Closing connections... Goodbye!${C.reset}`);
                    await client.close();
                    process.exit(0);
                    break;

                default:
                    printLog(`${C.yellow}Unknown command: ${cmd}. Type /help for options.${C.reset}`);
            }
        } else {
            // Regular text message
            if (activePeerId) {
                try {
                    await client.sendMessage(activePeerId, input);
                    printLog(`${C.gray}You → ${activePeerId}: ${input}${C.reset}`);
                } catch (e) {
                    printLog(`${C.red}Send failed: ${e.message}${C.reset}`);
                }
            } else if (client.peers.size > 0) {
                activePeerId = client.peers.keys().next().value;
                try {
                    await client.sendMessage(activePeerId, input);
                    printLog(`${C.gray}You → ${activePeerId}: ${input}${C.reset}`);
                } catch (e) {
                    printLog(`${C.red}Send failed: ${e.message}${C.reset}`);
                }
            } else {
                printLog(`${C.yellow}No connected peers. Connect using /connect <ip:port> or /relay <url>${C.reset}`);
            }
        }

        rl.prompt();
    });

    await client.init();

    if (options.connectTarget) {
        const [host, portStr] = options.connectTarget.split(':');
        const port = parseInt(portStr, 10);
        if (host && port) {
            setTimeout(async () => {
                printLog(`${C.cyan}Auto-connecting to ${host}:${port}...${C.reset}`);
                try {
                    await client.connectTcp(host, port);
                } catch (e) {
                    printLog(`${C.red}Auto-connect failed: ${e.message}${C.reset}`);
                }
            }, 500);
        }
    }
}

main().catch((err) => {
    console.error('Fatal error:', err);
    process.exit(1);
});
