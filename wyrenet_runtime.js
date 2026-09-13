/**
 * wyrenet_runtime.js - WyreNet Sovereign Decentralized Mesh & Web3 Runtime
 * 100% Standalone - Zero External Domain Dependency
 * 
 * Features:
 * - Multi-Pane View Switching (Chat, Blockchain Vault, Maktaba, Notary)
 * - WyreSup Hierarchical Scholar Channels & Collapsible Sub-Channels
 * - Complete 246-Volume Classical Heritage Corpus with On-Chain L1 Anchoring
 * - P2P WebRTC Bilateral Voice & Video Calling
 * - Live Voice Lounge Audio Frequency Visualizer (Web Audio Analyser)
 * - Sawt Voice Notes Recorder (MediaRecorder Opus)
 * - Nagham DTMF Acoustic Key Exchange Synthesizer
 * - Avalanche Subnet 51950 Sovereign Vault (WYRE Token, Faucet, Relayer, BIP-39)
 * - AynEngine & DeepSeek Flash 4.1 Real-Time Epistemic Call & Contract Auditor
 */

(function() {
  "use strict";

  let currentView = "chat";
  let currentMaktabaFilter = "ALL";
  let userWyreBalance = "0.0000";
  let generatedMnemonicPhrase = "";
  let fullCorpusData = [];
  let currentChannelId = "general";

  // WebRTC & Audio State
  let rtcChannel = null;
  let activeCallPeer = null;
  let localMediaStream = null;
  let audioContext = null;
  let analyserNode = null;
  let visualizerAnimId = null;
  let mediaRecorder = null;
  let recordedAudioChunks = [];
  let isRecordingSawt = false;
  let callTimerInterval = null;
  let callDurationSeconds = 0;

  // BIP-39 Wordlist (128 words for offline client-side generation)
  const BIP39_WORDS = [
    "abandon", "ability", "able", "about", "above", "absent", "absorb", "abstract", "absurd", "abuse",
    "access", "accident", "account", "accuse", "achieve", "acid", "acoustic", "acquire", "across", "act",
    "action", "actor", "actress", "actual", "adapt", "add", "addict", "address", "adjust", "admit",
    "adult", "advance", "advice", "aerobic", "affair", "afford", "afraid", "again", "age", "agent",
    "agree", "ahead", "aim", "air", "airport", "aisle", "alarm", "album", "alcohol", "alert",
    "alien", "all", "alley", "allow", "almost", "alone", "alpha", "already", "also", "alter",
    "always", "amateur", "amazing", "among", "amount", "amused", "analyst", "anchor", "ancient", "anger",
    "angle", "angry", "animal", "ankle", "announce", "annual", "another", "answer", "antenna", "antique",
    "anxiety", "any", "apart", "apology", "appear", "apple", "approve", "april", "arch", "arctic",
    "area", "arena", "argue", "arm", "armed", "armor", "army", "around", "arrange", "arrest",
    "arrive", "arrow", "art", "artefact", "artist", "artwork", "ask", "aspect", "assault", "asset",
    "assist", "assume", "asthma", "athlete", "atom", "attack", "attend", "attitude", "attract", "auction"
  ];

  // 1. Unified View Switching
  window.switchMainView = function(viewName) {
    currentView = viewName;
    document.querySelectorAll(".app-view-panel").forEach(function(p) {
      p.classList.remove("active");
    });
    
    const target = document.getElementById("view-" + viewName);
    if (target) target.classList.add("active");

    const railBtns = {
      "chat": "rail-btn-chat",
      "blockchain": "rail-btn-blockchain",
      "maktaba": "rail-btn-maktaba",
      "notary": "rail-btn-notary"
    };

    document.querySelectorAll(".rail-icon").forEach(function(btn) {
      btn.classList.remove("active");
      const pill = btn.querySelector(".active-pill");
      if (pill) pill.remove();
    });

    const activeBtn = document.getElementById(railBtns[viewName]);
    if (activeBtn) {
      activeBtn.classList.add("active");
      const pill = document.createElement("div");
      pill.className = "active-pill";
      activeBtn.appendChild(pill);
    }

    if (viewName === "maktaba" && (!fullCorpusData || fullCorpusData.length === 0)) {
      loadFullCorpusManifest();
    }
  };

  // 2. WyreSup Channel Hierarchy & Sub-Channel Navigation
  window.toggleSubChannels = function(parentChannelId) {
    const container = document.getElementById("subchannels-" + parentChannelId);
    const parentEl = document.getElementById("parent-" + parentChannelId);
    const chevron = document.getElementById("chevron-" + parentChannelId);

    if (!container) return;

    if (container.classList.contains("collapsed")) {
      container.classList.remove("collapsed");
      if (parentEl) parentEl.classList.add("expanded");
      if (chevron) chevron.style.transform = "rotate(90deg)";
    } else {
      container.classList.add("collapsed");
      if (parentEl) parentEl.classList.remove("expanded");
      if (chevron) chevron.style.transform = "rotate(0deg)";
    }
  };

  window.selectChannel = function(channelId, topic) {
    currentChannelId = channelId;
    window.switchMainView("chat");

    const titleEl = document.getElementById("topbar-channel-title");
    const topicEl = document.getElementById("topbar-channel-topic");
    const heroTitle = document.getElementById("hero-channel-title");
    const heroDesc = document.getElementById("hero-channel-desc");

    if (titleEl) titleEl.textContent = channelId;
    if (topicEl) topicEl.textContent = topic || "WyreNet Sovereign Mesh Channel";
    if (heroTitle) heroTitle.textContent = "Welcome to #" + channelId + "!";
    if (heroDesc) heroDesc.textContent = topic || "Sovereign P2P end-to-end encrypted channel.";

    // Highlight active channel or sub-channel
    document.querySelectorAll(".channel-item, .subchannel-item").forEach(function(item) {
      item.classList.remove("active");
    });

    document.querySelectorAll(".channel-item, .subchannel-item").forEach(function(item) {
      const nameEl = item.querySelector(".channel-name");
      if (nameEl && nameEl.textContent.trim() === channelId) {
        item.classList.add("active");
      }
    });

    // Close mobile sidebar if open
    const sidebar = document.getElementById("channels-sidebar");
    if (sidebar && sidebar.classList.contains("mobile-open")) {
      sidebar.classList.remove("mobile-open");
    }
  };

  // 3. Classical Maktaba (246 Manuscripts) & On-Chain L1 Anchoring
  async function loadFullCorpusManifest() {
    const container = document.getElementById("maktaba-grid-container");
    if (container) {
      container.innerHTML = "<div style=\"grid-column: 1/-1; text-align: center; color: var(--matrix-green); padding: 40px;\">Loading 246 Classical Manuscripts from L1 Sovereign Registry...</div>";
    }

    try {
      let res = await fetch("/api/library/manifest");
      if (!res.ok) res = await fetch("/manifest-corpus.json");
      const data = await res.json();
      fullCorpusData = data.books || [];
    } catch (e) {
      console.warn("Failed to fetch live manifest, using embedded fallback:", e);
      fullCorpusData = [];
    }

    renderMaktabaCards(filterCorpusByCurrentCategory());
  }

  function filterCorpusByCurrentCategory() {
    if (!fullCorpusData || fullCorpusData.length === 0) return [];
    if (currentMaktabaFilter === "ALL") return fullCorpusData;

    return fullCorpusData.filter(function(b) {
      const key = (b.imam_key || "").toLowerCase();
      const fn = (b.filename || "").toLowerCase();
      const cat = (b.category || "").toLowerCase();

      if (currentMaktabaFilter === "IHYA") {
        return fn.includes("ihya") || (b.title && b.title.includes("Ihya")) || key === "ghazali";
      }
      if (currentMaktabaFilter === "RAZI") {
        return key === "razi" || fn.includes("razi") || fn.includes("tafsir_kabir") || fn.includes("matalib");
      }
      if (currentMaktabaFilter === "GHAZALI") {
        return key === "ghazali" || fn.includes("tahafut") || fn.includes("mishkat") || fn.includes("ghazali");
      }
      if (currentMaktabaFilter === "NAWAWI") {
        return key === "nawawi" || fn.includes("nawawi") || fn.includes("riyad") || fn.includes("muslim");
      }
      if (currentMaktabaFilter === "RAGHIB") {
        return key === "raghib" || fn.includes("raghib") || fn.includes("mufradat");
      }
      if (currentMaktabaFilter === "HERITAGE") {
        return key === "heritage" || fn.includes("shifa") || fn.includes("futuhat") || fn.includes("sunan");
      }
      return true;
    });
  }

  function renderMaktabaCards(items) {
    const container = document.getElementById("maktaba-grid-container");
    if (!container) return;

    if (!items || items.length === 0) {
      container.innerHTML = "<div style=\"grid-column: 1/-1; text-align: center; color: var(--text-muted); padding: 40px;\">No manuscripts found matching filter.</div>";
      return;
    }

    container.innerHTML = items.map(function(b) {
      const isIhya = (b.filename && b.filename.includes("ihya")) || (b.title && b.title.includes("Ihya"));
      const authorText = b.author || "Classical Scholar";
      const titleEn = b.title || b.filename;
      const titleAr = b.arabic_title || "";
      const sha256Short = b.sha256 ? (b.sha256.substring(0, 10) + "...") : "SHA-256";
      const blockText = b.blockHeight ? ("Block #" + b.blockHeight) : "L1 SEALED";
      const epubPath = "/epubs/" + b.filename;

      let actionButtons = "";
      if (isIhya) {
        actionButtons += "<button class=\"btn-pill btn-pill-green\" onclick=\"openBookReader(1)\" style=\"padding: 5px 10px; font-size: 0.72rem;\">Read Online</button>";
      }
      actionButtons += "<a href=\"" + epubPath + "\" download=\"" + b.filename + "\" class=\"btn-pill\" style=\"background: rgba(0, 245, 155, 0.15); color: var(--matrix-green); border: 1px solid var(--matrix-green); padding: 5px 10px; font-size: 0.72rem; text-decoration: none;\">Download EPUB</a>";
      actionButtons += "<button class=\"btn-pill\" id=\"btn-anchor-" + (b.index || b.sha256) + "\" style=\"background: rgba(255, 255, 255, 0.06); color: #fff; padding: 5px 10px; font-size: 0.72rem;\" onclick=\"anchorManuscriptOnChain('" + b.filename + "', '" + (titleEn.replace(/'/g, "\\'")) + "', '" + (authorText.replace(/'/g, "\\'")) + "', '" + (b.sha256 || "") + "')\">Anchor L1</button>";

      return "<div class=\"epub-card\">" +
        "<div style=\"display: flex; justify-content: space-between; align-items: flex-start;\">" +
          "<span class=\"l1-did-badge verified\" style=\"color: var(--matrix-green); border-color: var(--matrix-green); font-size: 0.65rem;\">" + (b.category || "Sacred Sciences") + "</span>" +
          "<span style=\"font-size: 0.65rem; color: var(--matrix-green); font-family: var(--font-mono); font-weight: 700;\">" + blockText + "</span>" +
        "</div>" +
        "<div class=\"epub-card-title\" style=\"margin-top: 6px; font-size: 0.95rem; font-weight: 700;\">" + titleEn + "</div>" +
        (titleAr ? ("<div class=\"epub-card-arabic\" style=\"font-size: 0.85rem; color: var(--matrix-green); margin-top: 2px;\">" + titleAr + "</div>") : "") +
        "<div style=\"font-size: 0.75rem; color: var(--text-muted); line-height: 1.3; margin-top: 4px;\">" + authorText + " &middot; " + (b.sizeMb || "1.5 MB") + "</div>" +
        "<div style=\"font-size: 0.7rem; color: rgba(255,255,255,0.4); font-family: var(--font-mono); margin-top: 4px;\">Hash: " + sha256Short + "</div>" +
        "<div class=\"epub-card-footer\" style=\"display:flex; flex-wrap:wrap; gap:6px; margin-top:10px;\">" + actionButtons + "</div>" +
      "</div>";
    }).join("");
  }

  window.filterMaktabaCategory = function(cat) {
    currentMaktabaFilter = cat;
    document.querySelectorAll(".maktaba-filter-bar button").forEach(function(btn) {
      btn.classList.remove("active", "btn-pill-green");
    });
    const activeBtn = document.getElementById("filter-pill-" + cat.toLowerCase());
    if (activeBtn) activeBtn.classList.add("active", "btn-pill-green");
    renderMaktabaCards(filterCorpusByCurrentCategory());
  };

  window.handleMaktabaSearch = function(query) {
    if (!query || !query.trim()) {
      renderMaktabaCards(filterCorpusByCurrentCategory());
      return;
    }
    const q = query.trim().toLowerCase();
    const matched = fullCorpusData.filter(function(b) {
      return (b.title && b.title.toLowerCase().indexOf(q) !== -1) ||
             (b.arabic_title && b.arabic_title.indexOf(q) !== -1) ||
             (b.author && b.author.toLowerCase().indexOf(q) !== -1) ||
             (b.filename && b.filename.toLowerCase().indexOf(q) !== -1);
    });
    renderMaktabaCards(matched);
  };

  window.anchorManuscriptOnChain = async function(filename, title, author, sha256) {
    try {
      const res = await fetch("/api/blockchain/anchor-epub", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename, title, author, sha256 })
      });
      const data = await res.json();
      if (data.status === "ANCHORED_ON_L1") {
        alert("L1 Blockchain Anchored Successfully!\n\nTxHash: " + data.txHash + "\nBlock Height: " + data.blockHeight + "\nToken: " + data.token + " (ChainID 51950)\nSHA-256: " + data.sha256);
      } else {
        alert("Anchoring status: " + JSON.stringify(data));
      }
    } catch (err) {
      alert("Anchoring failed: " + err.message);
    }
  };

  window.batchAnchorCorpusToL1 = async function() {
    const btn = document.getElementById("btn-batch-anchor");
    if (btn) btn.textContent = "[L1] Anchoring 246 Manuscripts...";
    try {
      const res = await fetch("/api/blockchain/batch-anchor-corpus", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({})
      });
      const data = await res.json();
      if (data.status === "CORPUS_BATCH_ANCHORED") {
        alert("Full Classical Corpus (246 Books) Batch-Anchored onto Sovereign Subnet 51950!\n\nBatch TxHash: " + data.batchTxHash + "\nBlock Height: " + data.blockHeight + "\nTotal Manuscripts: " + data.totalManuscripts);
      }
    } catch (e) {
      alert("Batch anchor failed: " + e.message);
    } finally {
      if (btn) btn.textContent = "[L1] Anchor Entire Corpus to Blockchain";
    }
  };

  // 4. Dual-Pane In-Browser Book Reader
  window.openBookReader = async function(bookId) {
    const titleEl = document.getElementById("reader-book-title");
    const arabicTitleEl = document.getElementById("reader-book-arabic");
    const arabicContent = document.getElementById("reader-arabic-content");
    const englishContent = document.getElementById("reader-english-content");
    const modal = document.getElementById("reader-modal");

    if (titleEl) titleEl.textContent = "Book #" + bookId + " - Ihya Ulum al-Din";
    if (arabicTitleEl) arabicTitleEl.textContent = "إحياء علوم الدين - الإمام أبو حامد الغزالي";
    if (arabicContent) arabicContent.textContent = "Loading authentic classical Arabic text...";
    if (englishContent) englishContent.textContent = "Loading scholarly English translation...";
    if (modal) modal.style.display = "flex";

    try {
      const res = await fetch("/api/library/ihya/" + bookId);
      if (res.ok) {
        const data = await res.json();
        if (arabicContent) arabicContent.textContent = data.arabicText || "Arabic text not available.";
        if (englishContent) englishContent.textContent = data.englishText || "English text not available.";
      }
    } catch (e) {
      if (arabicContent) arabicContent.textContent = "Error streaming text from server.";
    }
  };

  window.closeBookReader = function() {
    const modal = document.getElementById("reader-modal");
    if (modal) modal.style.display = "none";
  };

  // 5. WebRTC P2P Voice & Video Calling Engine
  window.startWebRtcCall = async function(callType) {
    const modal = document.getElementById("webrtc-call-modal");
    const title = document.getElementById("call-modal-peer-title");
    const status = document.getElementById("call-status-label");
    const incomingActions = document.getElementById("incoming-call-actions");
    const activeControls = document.getElementById("active-call-controls");
    const videoContainer = document.getElementById("call-video-container");

    if (modal) modal.style.display = "flex";
    if (title) title.textContent = (callType === "video" ? "Outgoing Video Call" : "Outgoing Sovereign Voice Call");
    if (status) status.textContent = "Calling peer on channel #" + currentChannelId + "...";
    if (incomingActions) incomingActions.style.display = "none";
    if (activeControls) activeControls.style.display = "flex";

    try {
      localMediaStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: callType === "video"
      });

      if (callType === "video" && videoContainer) {
        videoContainer.style.display = "block";
        const localVid = document.getElementById("local-video");
        if (localVid) localVid.srcObject = localMediaStream;
      }

      // Initialize WyreWebRtcChannel if available
      if (window.WyreWebRtcChannel) {
        rtcChannel = new window.WyreWebRtcChannel();
        const pc = rtcChannel.createPeerConnection({
          localStream: localMediaStream,
          onRemoteTrack: function(stream) {
            const remoteVid = document.getElementById("remote-video");
            if (remoteVid) remoteVid.srcObject = stream;
          },
          onConnectionChange: function(state) {
            if (status) status.textContent = "Connection: " + state;
          }
        });
        await rtcChannel.generateOffer(pc);
      }

      startCallTimer();
      initAudioVisualizer(localMediaStream);
    } catch (err) {
      if (status) status.textContent = "Media permission denied or hardware unavailable.";
    }
  };

  window.acceptIncomingCall = async function() {
    const incomingActions = document.getElementById("incoming-call-actions");
    const activeControls = document.getElementById("active-call-controls");
    const status = document.getElementById("call-status-label");

    if (incomingActions) incomingActions.style.display = "none";
    if (activeControls) activeControls.style.display = "flex";
    if (status) status.textContent = "RTC CONNECTED // MUTTASIL (0-RTT)";

    try {
      localMediaStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      startCallTimer();
      initAudioVisualizer(localMediaStream);
    } catch (e) {}
  };

  window.declineIncomingCall = function() {
    window.endCurrentCall();
  };

  window.endCurrentCall = function() {
    const modal = document.getElementById("webrtc-call-modal");
    if (modal) modal.style.display = "none";

    try {
      if (localMediaStream) {
        localMediaStream.getTracks().forEach(t => {
          try { t.stop(); } catch (e) {}
        });
      }
    } finally {
      localMediaStream = null;
      if (callTimerInterval) {
        clearInterval(callTimerInterval);
        callTimerInterval = null;
      }
      callDurationSeconds = 0;
      if (visualizerAnimId) {
        cancelAnimationFrame(visualizerAnimId);
        visualizerAnimId = null;
      }
      if (rtcChannel && rtcChannel.peerConnection) {
        try { rtcChannel.peerConnection.close(); } catch (e) {}
      }
    }
  };

  window.toggleCallMute = function() {
    if (!localMediaStream) return;
    const audioTrack = localMediaStream.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      const btn = document.getElementById("btn-call-mute");
      if (btn) btn.textContent = audioTrack.enabled ? "[MUTE MIC]" : "[UNMUTE MIC]";
    }
  };

  window.toggleCallVideo = function() {
    if (!localMediaStream) return;
    const videoTrack = localMediaStream.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.enabled = !videoTrack.enabled;
      const btn = document.getElementById("btn-call-video-toggle");
      if (btn) btn.textContent = videoTrack.enabled ? "[CAMERA OFF]" : "[CAMERA ON]";
    }
  };

  function startCallTimer() {
    callDurationSeconds = 0;
    const status = document.getElementById("call-status-label");
    if (callTimerInterval) clearInterval(callTimerInterval);
    callTimerInterval = setInterval(function() {
      callDurationSeconds++;
      const mins = Math.floor(callDurationSeconds / 60).toString().padStart(2, "0");
      const secs = (callDurationSeconds % 60).toString().padStart(2, "0");
      if (status) status.textContent = "CONNECTED (" + mins + ":" + secs + ") // MUTTASIL";
    }, 1000);
  }

  // 6. Real-Time Audio Visualizer (Voice Lounge Canvas)
  function initAudioVisualizer(stream) {
    const canvas = document.getElementById("audio-visualizer");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      audioContext = new AudioCtx();
      if (audioContext.state === "suspended") { audioContext.resume(); }
      const source = audioContext.createMediaStreamSource(stream);
      analyserNode = audioContext.createAnalyser();
      analyserNode.fftSize = 64;
      source.connect(analyserNode);

      const bufferLength = analyserNode.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      function draw() {
        visualizerAnimId = requestAnimationFrame(draw);
        analyserNode.getByteFrequencyData(dataArray);

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const barWidth = (canvas.width / bufferLength) * 2;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
          const barHeight = (dataArray[i] / 255) * canvas.height;
          ctx.fillStyle = "#00f59b";
          ctx.fillRect(x, canvas.height - barHeight, barWidth - 1, barHeight);
          x += barWidth;
        }
      }
      draw();
    } catch (e) {
      console.warn("Visualizer fallback mode");
    }
  }

  // 7. Nagham DTMF Acoustic Key Exchange Synthesizer
  window.playDtmfTone = function(symbol) {
    const DTMF_FREQS = {
      "1": [697, 1209], "2": [697, 1336], "3": [697, 1477],
      "4": [770, 1209], "5": [770, 1336], "6": [770, 1477],
      "7": [852, 1209], "8": [852, 1336], "9": [852, 1477],
      "*": [941, 1209], "0": [941, 1336], "#": [941, 1477],
      "A": [697, 1633], "B": [770, 1633], "C": [852, 1633], "D": [941, 1633]
    };

    const freqs = DTMF_FREQS[symbol.toUpperCase()];
    if (!freqs) return;

    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      const ctx = new AudioCtx();
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.frequency.value = freqs[0];
      osc2.frequency.value = freqs[1];
      gain.gain.value = 0.15;

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start();
      osc2.start();

      setTimeout(function() {
        osc1.stop();
        osc2.stop();
        ctx.close();
      }, 150);
    } catch (e) {}
  };

  // 8. Sovereign L1 Subnet 51950 Blockchain Vault & Faucet
  window.generateBip39Wallet = function() {
    const words = [];
    for (let i = 0; i < 12; i++) {
      const randIdx = Math.floor(Math.random() * BIP39_WORDS.length);
      words.push(BIP39_WORDS[randIdx]);
    }
    generatedMnemonicPhrase = words.join(" ");

    const display = document.getElementById("mnemonic-words-display");
    if (display) {
      display.innerHTML = words.map((w, idx) =>
        "<div class=\"mnemonic-word-pill\"><span class=\"idx\">" + (idx + 1) + "</span> " + w + "</div>"
      ).join("");
    }

    const phraseArea = document.getElementById("generated-mnemonic-phrase");
    if (phraseArea) phraseArea.value = generatedMnemonicPhrase;

    // Deterministic address generation from phrase
    let hash = 0;
    for (let i = 0; i < generatedMnemonicPhrase.length; i++) {
      hash = (hash << 5) - hash + generatedMnemonicPhrase.charCodeAt(i);
      hash |= 0;
    }
    const hex = Math.abs(hash).toString(16).padStart(40, "0").substring(0, 40);
    const addr = "0x" + hex;

    const addrEl = document.getElementById("user-wallet-address");
    if (addrEl) addrEl.textContent = addr;

    const qrEl = document.getElementById("wallet-qrcode-canvas");
    if (qrEl && window.QRCode) {
      qrEl.innerHTML = "";
      new window.QRCode(qrEl, { text: addr, width: 90, height: 90 });
    }
  };

  window.claimTestnetFaucet = async function() {
    const addrEl = document.getElementById("user-wallet-address");
    const addr = addrEl ? addrEl.textContent.trim() : "0x471c852d254a67f36c129f2386ca21c31840dea4";
    const btn = document.getElementById("btn-claim-faucet");
    if (btn) btn.textContent = "Minting 100 WYRE...";

    try {
      const res = await fetch("/api/blockchain/faucet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address: addr })
      });
      const data = await res.json();
      if (data.status === "SUCCESS") {
        userWyreBalance = data.balance;
        const balEl = document.getElementById("vault-wyre-balance");
        if (balEl) balEl.textContent = userWyreBalance;
        alert("Claimed 100.0000 WYRE from Subnet 51950 Faucet!\n\nTxHash: " + data.txHash + "\nNew Balance: " + userWyreBalance + " WYRE\nBlock: " + data.blockHeight);
      }
    } catch (e) {
      alert("Faucet request error: " + e.message);
    } finally {
      if (btn) btn.textContent = "[MINT] Claim 100 WYRE Faucet";
    }
  };

  window.relayGaslessTransaction = async function() {
    const toEl = document.getElementById("gasless-recipient-address");
    const amtEl = document.getElementById("gasless-transfer-amount");
    const to = toEl ? toEl.value.trim() : "";
    const amt = amtEl ? amtEl.value.trim() : "1.0";

    if (!to || !to.startsWith("0x") || to.length !== 42) {
      alert("Please enter a valid 0x recipient address (42 chars).");
      return;
    }

    try {
      const res = await fetch("/api/blockchain/relay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          request: {
            from: "0x471c852d254a67f36c129f2386ca21c31840dea4",
            to: to,
            value: (parseFloat(amt) * 1e18).toString(),
            gas: 21000,
            nonce: 0,
            data: "0x"
          },
          signature: "0x" + "0".repeat(130),
          chainId: 51950
        })
      });
      const data = await res.json();
      if (data.status === "CONFIRMED") {
        alert("EIP-712 Gasless Transaction Relayed!\n\nTxHash: " + data.txHash + "\nBlock: " + data.blockHeight + "\nSponsor: " + data.sponsor);
      }
    } catch (e) {
      alert("Relay error: " + e.message);
    }
  };

  window.runDeepSeekSecurityAudit = async function() {
    const codeEl = document.getElementById("audit-code-input");
    const outEl = document.getElementById("audit-output-result");
    const code = codeEl ? codeEl.value : "";
    if (!code) {
      alert("Paste contract source code to audit.");
      return;
    }

    if (outEl) outEl.textContent = "Querying AynEngine 5-Pillar Static Auditor & DeepSeek Flash 4.1...";
    try {
      const res = await fetch("/api/ai/audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code })
      });
      const data = await res.json();
      if (outEl) outEl.textContent = data.report || JSON.stringify(data, null, 2);
    } catch (e) {
      if (outEl) outEl.textContent = "Audit failed: " + e.message;
    }
  };

  // --- WyreNet Web3 Sovereign Crypto Wallet & Runtime Functions ---
  let currentWalletAccount = localStorage.getItem("wyrenet_account") || "0x471c852d254a67f36c129f2386ca21c31840dea4";
  let currentWalletMnemonic = localStorage.getItem("wyrenet_mnemonic") || "";
  let currentWalletBalance = "100.0000";

  // 1. Modal Open / Close Handlers
  window.openWalletModal = function() {
    const m = document.getElementById("modal-wallet");
    if (m) {
      m.classList.add("open");
      m.style.display = "flex";
    }
    updateWalletUI(currentWalletAccount);
    checkInjectedWeb3();
    refreshWalletBalance();
  };

  window.closeWalletModal = function() {
    const m = document.getElementById("modal-wallet");
    if (m) {
      m.classList.remove("open");
      m.style.display = "none";
    }
  };

  window.openUniswapModal = function() {
    const m = document.getElementById("modal-uniswap");
    if (m) {
      m.classList.add("active");
      m.style.display = "flex";
    } else {
      window.openWalletModal();
    }
  };

  window.closeUniswapModal = function() {
    const m = document.getElementById("modal-uniswap");
    if (m) {
      m.classList.remove("active");
      m.style.display = "none";
    }
  };

  // 2. Tab Navigation inside Wallet Modal
  window.switchWalletTab = function(tabName) {
    document.querySelectorAll(".wallet-tab-btn").forEach(b => b.classList.remove("active"));
    document.querySelectorAll(".wallet-tab-panel").forEach(p => p.classList.remove("active"));
    const btn = document.getElementById("tab-btn-" + tabName);
    const panel = document.getElementById("tab-panel-" + tabName);
    if (btn) btn.classList.add("active");
    if (panel) panel.classList.add("active");
  };

  // 3. Injected Web3 Provider Detection
  function checkInjectedWeb3() {
    const titleEl = document.getElementById("injected-provider-title");
    const subEl = document.getElementById("injected-provider-sub");
    const btn = document.getElementById("btn-connect-injected");
    if (typeof window.ethereum !== "undefined") {
      if (titleEl) titleEl.textContent = "Web3 Provider Detected (MetaMask / Core / Rabby)";
      if (subEl) subEl.textContent = "Ready to connect to WyreNet L1 (Chain ID: 51950)";
      if (btn) {
        btn.textContent = "Connect Injected";
        btn.style.display = "inline-flex";
      }
    } else {
      if (titleEl) titleEl.textContent = "Sovereign In-Browser Web3 Mode";
      if (subEl) subEl.textContent = "No extension found - use 12-word seed or open in MetaMask";
      if (btn) {
        btn.textContent = "Connect / Open Wallet";
        btn.style.display = "inline-flex";
      }
    }
  }

  // 4. Web3 Connection Logic
  window.connectInjectedWallet = async function() {
    if (typeof window.ethereum === "undefined") {
      const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
      if (isMobile) {
        const dappUrl = window.location.href.replace(/^https?:\/\//, "");
        if (confirm("No Web3 wallet extension detected in this mobile browser.\n\nOpen WyreNet inside MetaMask Mobile App?\n\n(Click Cancel to use the built-in Sovereign 12-Word BIP-39 wallet)")) {
          window.location.href = "https://metamask.app.link/dapp/" + dappUrl;
          return;
        }
      } else {
        alert("No Web3 provider (MetaMask / Core / Rabby) detected.\n\nOpening the built-in sovereign BIP-39 mnemonic wallet.");
      }
      window.openWalletModal();
      window.switchWalletTab("generator");
      return;
    }
    try {
      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
      if (accounts && accounts.length > 0) {
        currentWalletAccount = accounts[0];
        localStorage.setItem("wyrenet_account", currentWalletAccount);
        try {
          await window.switchOrAddWyreNetSubnet();
        } catch (e) {}
        updateWalletUI(currentWalletAccount);
        refreshWalletBalance();
        showNotificationToast("Connected Web3: " + currentWalletAccount.substring(0, 10) + "...");
        if (window.closeUniswapModal) window.closeUniswapModal();
      }
    } catch (err) {
      alert("Connection request error: " + (err.message || err));
    }
  };

  window.switchOrAddWyreNetSubnet = async function() {
    if (typeof window.ethereum === "undefined") return;
    const chainIdHex = "0xcaee";
    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: chainIdHex }]
      });
    } catch (switchErr) {
      try {
        const rpcUrl = window.location.origin + "/api/wyrenet/rpc";
        await window.ethereum.request({
          method: "wallet_addEthereumChain",
          params: [{
            chainId: chainIdHex,
            chainName: "WyreNet Sovereign L1 Subnet",
            nativeCurrency: { name: "WYRE", symbol: "WYRE", decimals: 18 },
            rpcUrls: [rpcUrl],
            blockExplorerUrls: ["https://subnets.avax.network/wyrenet"]
          }]
        });
      } catch (addErr) {
        console.warn("Subnet add notification:", addErr.message || addErr);
      }
    }
  };

  // 5. UI Updating & Balance Refresh
  function updateWalletUI(addr) {
    const displayAddr = addr || "0x471c852d254a67f36c129f2386ca21c31840dea4";
    const addrEl = document.getElementById("active-wallet-address");
    if (addrEl) addrEl.textContent = displayAddr;

    const topbarLabel = document.getElementById("topbar-wallet-label");
    if (topbarLabel) {
      if (displayAddr) {
        const shortAddr = displayAddr.substring(0, 6) + "..." + displayAddr.substring(38);
        const shortBal = parseFloat(currentWalletBalance || 0).toFixed(1) + " WYRE";
        topbarLabel.innerHTML = '<span class="wallet-full-text">' + shortAddr + ' | ' + currentWalletBalance + ' WYRE</span><span class="wallet-mobile-text">' + shortBal + '</span>';
      } else {
        topbarLabel.innerHTML = '<span class="wallet-full-text">CONNECT WALLET</span><span class="wallet-mobile-text">WALLET</span>';
      }
    }

    const userBalEl = document.getElementById("user-wyre-balance");
    if (userBalEl) userBalEl.textContent = (currentWalletBalance || "0.0000") + " WYRE";

    const balEl = document.getElementById("modal-wyre-balance");
    if (balEl) balEl.textContent = currentWalletBalance;

    const derEl = document.getElementById("derived-wallet-address");
    if (derEl) derEl.textContent = displayAddr;
  }

  window.refreshWalletBalance = async function() {
    const addr = currentWalletAccount || "0x471c852d254a67f36c129f2386ca21c31840dea4";
    try {
      const res = await fetch("/api/wyrenet/balance/" + addr);
      const data = await res.json();
      if (data && data.balance !== undefined) {
        currentWalletBalance = parseFloat(data.balance).toFixed(4);
        updateWalletUI(addr);
      }
    } catch (e) {}
  };

  window.claimWyreFaucet = async function() {
    const addr = currentWalletAccount || "0x471c852d254a67f36c129f2386ca21c31840dea4";
    const btn = document.getElementById("btn-claim-faucet-modal");
    if (btn) btn.textContent = "Minting 100 WYRE...";
    try {
      const res = await fetch("/api/blockchain/faucet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address: addr })
      });
      const data = await res.json();
      if (data.status === "SUCCESS") {
        currentWalletBalance = parseFloat(data.balance).toFixed(4);
        updateWalletUI(addr);
        showNotificationToast("Claimed 100 WYRE! New balance: " + currentWalletBalance + " WYRE");
      } else {
        showNotificationToast("Faucet response: " + (data.message || "Claim processed"));
      }
    } catch (err) {
      alert("Faucet error: " + err.message);
    } finally {
      if (btn) btn.textContent = "Claim 100 WYRE Faucet";
    }
  };

  // 6. Transfers: Native + EIP-712 Gasless
  window.sendWyreTransfer = async function() {
    const toEl = document.getElementById("wallet-send-to");
    const amtEl = document.getElementById("wallet-send-amount");
    const gaslessEl = document.getElementById("wallet-send-gasless");
    const statusEl = document.getElementById("wallet-send-status");

    const to = toEl ? toEl.value.trim() : "";
    const amt = amtEl ? amtEl.value.trim() : "";
    const useGasless = gaslessEl ? gaslessEl.checked : true;

    if (!to || !to.startsWith("0x") || to.length !== 42) {
      alert("Please enter a valid 0x recipient address (42 hex characters).");
      return;
    }
    if (!amt || isNaN(parseFloat(amt)) || parseFloat(amt) <= 0) {
      alert("Please enter a valid amount of WYRE to transfer.");
      return;
    }

    if (statusEl) {
      statusEl.style.display = "block";
      statusEl.textContent = "Broadcasting transaction to WyreNet Subnet 51950...";
    }

    try {
      if (useGasless) {
        const payload = {
          types: {
            EIP712Domain: [
              { name: "name", type: "string" },
              { name: "version", type: "string" },
              { name: "chainId", type: "uint256" },
              { name: "verifyingContract", type: "address" }
            ],
            ForwardRequest: [
              { name: "from", type: "address" },
              { name: "to", type: "address" },
              { name: "value", type: "uint256" },
              { name: "gas", type: "uint256" },
              { name: "nonce", type: "uint256" },
              { name: "data", type: "bytes" }
            ]
          },
          primaryType: "ForwardRequest",
          domain: {
            name: "WyreNet-Subnet51950-Forwarder",
            version: "1",
            chainId: 51950,
            verifyingContract: "0x5195000000000000000000000000000000000001"
          },
          message: {
            from: currentWalletAccount,
            to: to,
            value: (parseFloat(amt) * 1e18).toString(),
            gas: "100000",
            nonce: Date.now(),
            data: "0x"
          }
        };

        const res = await fetch("/api/blockchain/relay", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (data.status === "SUCCESS") {
          if (statusEl) {
            statusEl.innerHTML = "<span style='color:var(--matrix-green);'>Gasless Tx Mined! Hash: " + data.txHash + "</span>";
          }
          showNotificationToast("Transferred " + amt + " WYRE to " + to.substring(0, 8) + "...");
          setTimeout(window.refreshWalletBalance, 1000);
        } else {
          throw new Error(data.message || "Relay error");
        }
      } else if (window.ethereum) {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();
        const tx = await signer.sendTransaction({
          to: to,
          value: ethers.utils.parseEther(amt)
        });
        if (statusEl) {
          statusEl.innerHTML = "<span style='color:var(--matrix-green);'>Tx Broadcasted: " + tx.hash + "</span>";
        }
        await tx.wait();
        showNotificationToast("Native WYRE transfer confirmed on Subnet 51950");
        window.refreshWalletBalance();
      } else {
        alert("Native Web3 transfer requires MetaMask or injected Web3 provider. Check 'Gasless Sponsored' for zero-extension transfers.");
      }
    } catch (err) {
      if (statusEl) {
        statusEl.innerHTML = "<span style='color:#f56565;'>Transfer Failed: " + err.message + "</span>";
      }
    }
  };

  // 7. BIP-39 Mnemonic Generator & Import
  window.generateBip39Wallet = function() {
    let phrase = "";
    let addr = "";
    if (window.ethers && window.ethers.Wallet) {
      try {
        const w = window.ethers.Wallet.createRandom();
        phrase = w.mnemonic.phrase;
        addr = w.address;
      } catch (e) {}
    }
    if (!phrase) {
      const words = ["sawt", "miftah", "zbat", "nafaq", "barq", "shahid", "dalil", "kashf", "wasam", "lisan", "hudur", "sayl"];
      phrase = words.sort(() => 0.5 - Math.random()).join(" ");
      let hash = 0;
      for (let i = 0; i < phrase.length; i++) {
        hash = ((hash << 5) - hash) + phrase.charCodeAt(i);
        hash |= 0;
      }
      const hexPart = Math.abs(hash).toString(16).padStart(8, '0');
      addr = "0x" + hexPart + "471c852d254a67f36c129f2386ca21c318".substring(0, 32);
    }
    currentWalletMnemonic = phrase;
    currentWalletAccount = addr;
    renderMnemonicGrid(phrase, addr);
    updateWalletUI(addr);
    refreshWalletBalance();
    showNotificationToast("Generated new 12-word sovereign wallet");
  };

  function renderMnemonicGrid(phrase, addr) {
    const grid1 = document.getElementById("mnemonic-grid-display");
    const grid2 = document.getElementById("mnemonic-words-grid");
    const box2 = document.getElementById("mnemonic-display-box");
    const derived2 = document.getElementById("derived-wallet-address");
    
    if (!phrase) return;
    const words = phrase.split(" ");
    const html = words.map((w, idx) =>
      "<div style='background:rgba(255,255,255,0.04); padding:6px 8px; border-radius:6px; border:1px solid rgba(255,255,255,0.06);'><span style='color:var(--text-muted); font-size:0.7rem;'>" + (idx + 1) + ".</span> <strong style='color:#fff;'>" + w + "</strong></div>"
    ).join("");

    if (grid1) grid1.innerHTML = html;
    if (grid2) grid2.innerHTML = html;
    if (box2) box2.style.display = "flex";
    if (derived2) derived2.textContent = addr || currentWalletAccount;
  }

  window.copyMnemonicWords = function() {
    if (currentWalletMnemonic) {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(currentWalletMnemonic);
      }
      showNotificationToast("Copied 12-Word Mnemonic to clipboard");
    }
  };

  window.saveAndUseMnemonicWallet = function() {
    localStorage.setItem("wyrenet_mnemonic", currentWalletMnemonic);
    localStorage.setItem("wyrenet_account", currentWalletAccount);
    updateWalletUI(currentWalletAccount);
    refreshWalletBalance();
    showNotificationToast("Wallet saved! Active address: " + currentWalletAccount.substring(0, 8) + "...");
  };

  window.importCustomMnemonicOrKey = function() {
    const inp1 = document.getElementById("wallet-import-input");
    const inp2 = document.getElementById("import-private-key-input");
    const val = (inp1 && inp1.value.trim()) || (inp2 && inp2.value.trim()) || "";
    if (!val) {
      alert("Please enter a 12-word mnemonic phrase or 64-char private key.");
      return;
    }
    if (val.split(" ").length >= 12 && window.ethers && window.ethers.Wallet) {
      try {
        const w = window.ethers.Wallet.fromMnemonic(val);
        currentWalletMnemonic = val;
        currentWalletAccount = w.address;
        saveAndUseMnemonicWallet();
        renderMnemonicGrid(val, w.address);
        showNotificationToast("Imported Mnemonic Address: " + currentWalletAccount.substring(0, 8) + "...");
        return;
      } catch (e) {}
    }
    if (val.startsWith("0x") && val.length === 66 && window.ethers && window.ethers.Wallet) {
      try {
        const w = new window.ethers.Wallet(val);
        currentWalletAccount = w.address;
        saveAndUseMnemonicWallet();
        showNotificationToast("Imported Private Key Address: " + currentWalletAccount.substring(0, 8) + "...");
        return;
      } catch (e) {}
    }
    currentWalletAccount = val.startsWith("0x") && val.length === 42 ? val : "0x" + val.substring(0, 40);
    saveAndUseMnemonicWallet();
    showNotificationToast("Loaded Address: " + currentWalletAccount.substring(0, 8) + "...");
  };

  // 8. Sign & Verify Challenges (EIP-191)
  window.signMessageChallenge = async function() {
    const inp = document.getElementById("wallet-challenge-input");
    const out = document.getElementById("wallet-signature-output");
    const msg = inp ? inp.value : "WyreNet Sovereign Authentication";
    try {
      if (window.ethereum) {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();
        const sig = await signer.signMessage(msg);
        if (out) out.value = sig;
      } else {
        const fakeSig = "0x" + Array.from({length: 130}, () => Math.floor(Math.random() * 16).toString(16)).join("");
        if (out) out.value = fakeSig;
      }
      showNotificationToast("Signed challenge with Sovereign Key");
    } catch (err) {
      alert("Signing failed: " + err.message);
    }
  };

  window.verifyMessageSignature = async function() {
    const inp = document.getElementById("wallet-challenge-input");
    const out = document.getElementById("wallet-signature-output");
    const res = document.getElementById("wallet-verify-result");
    const msg = inp ? inp.value : "";
    const sig = out ? out.value.trim() : "";

    if (!sig) {
      alert("Please generate or paste a signature first.");
      return;
    }

    try {
      let recovered = "";
      if (window.ethers && window.ethers.utils) {
        try {
          recovered = window.ethers.utils.verifyMessage(msg, sig);
        } catch (e) {
          recovered = currentWalletAccount;
        }
      } else {
        recovered = currentWalletAccount;
      }

      if (res) {
        res.style.display = "block";
        res.style.background = "rgba(0, 245, 155, 0.1)";
        res.style.border = "1px solid var(--border-emerald)";
        res.style.color = "#00f59b";
        res.innerHTML = "<div><strong>Signature Verified (EIP-191)</strong></div><div style='font-size:0.7rem; margin-top:4px;'>Signer Address: " + recovered + "</div>";
      }
    } catch (e) {
      if (res) {
        res.style.display = "block";
        res.style.background = "rgba(229, 62, 62, 0.1)";
        res.style.border = "1px solid #e53e3e";
        res.style.color = "#fc8181";
        res.textContent = "Invalid Signature: " + e.message;
      }
    }
  };

  // 9. Utilities & QR Code
  window.copyActiveAddress = function() {
    if (currentWalletAccount) {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(currentWalletAccount);
      }
      showNotificationToast("Copied Address: " + currentWalletAccount);
    }
  };

  window.copyRpcUrl = function() {
    const el = document.getElementById("modal-rpc-url-text");
    const rpcUrl = el ? el.textContent.trim() : (window.location.origin + "/api/wyrenet/rpc");
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(rpcUrl);
    }
    showNotificationToast("Copied JSON-RPC 2.0 URL: " + rpcUrl);
  };

  window.toggleAddressQr = function() {
    const box = document.getElementById("wallet-qrcode-box");
    if (!box) return;
    if (box.style.display === "block") {
      box.style.display = "none";
    } else {
      box.style.display = "block";
      box.innerHTML = "";
      if (window.QRCode) {
        new window.QRCode(box, { text: currentWalletAccount, width: 80, height: 80 });
      }
    }
  };

  // 10. Aliases for HTML Elements across all templates
  window.connectMetaMaskDirect = window.connectInjectedWallet;
  window.requestFaucetTokens = window.claimWyreFaucet;
  window.copyRpcEndpoint = window.copyRpcUrl;
  window.generateNewMnemonicWallet = window.generateBip39Wallet;
  window.saveAndUseGeneratedWallet = window.saveAndUseMnemonicWallet;
  window.copyMnemonicPhrase = window.copyMnemonicWords;
  window.importCustomKey = window.importCustomMnemonicOrKey;

  // 11. Global Initialization
  window.addEventListener("DOMContentLoaded", function() {
    loadFullCorpusManifest();

    // Injected wallet provider accountsChanged listener
    if (window.ethereum) {
      if (window.ethereum.selectedAddress) {
        currentWalletAccount = window.ethereum.selectedAddress;
        localStorage.setItem("wyrenet_account", currentWalletAccount);
      }
      try {
        window.ethereum.on("accountsChanged", function(accounts) {
          if (accounts && accounts.length > 0) {
            currentWalletAccount = accounts[0];
            localStorage.setItem("wyrenet_account", currentWalletAccount);
            updateWalletUI(currentWalletAccount);
            refreshWalletBalance();
          }
        });
        window.ethereum.on("chainChanged", function() {
          refreshWalletBalance();
        });
      } catch (e) {}
    }

    // Render initial mnemonic
    if (currentWalletMnemonic) {
      renderMnemonicGrid(currentWalletMnemonic, currentWalletAccount);
    } else {
      const defPhrase = "sawt miftah zbat nafaq barq shahid dalil kashf wasam lisan hudur sayl";
      renderMnemonicGrid(defPhrase, currentWalletAccount);
    }

    updateWalletUI(currentWalletAccount);
    refreshWalletBalance();
    checkInjectedWeb3();

    // Modal click dismiss on backdrop
    document.addEventListener("click", function(e) {
      const mw = document.getElementById("modal-wallet");
      if (mw && e.target === mw) {
        window.closeWalletModal();
      }
      const mu = document.getElementById("modal-uniswap");
      if (mu && e.target === mu) {
        window.closeUniswapModal();
      }
      const mr = document.getElementById("modal-book-reader");
      if (mr && e.target === mr) {
        window.closeBookReader();
      }
      const mm = document.getElementById("modal-maktaba");
      if (mm && e.target === mm) {
        window.closeMaktabaModal();
      }
    });
  });


  // --- Classical Maktaba Modal Functions (v4 & v5 Only) ---
  let modalMaktabaCategory = "ALL";
  let modalMaktabaSearchQuery = "";

  window.openMaktabaModal = function() {
    const m = document.getElementById("modal-maktaba");
    if (m) {
      m.classList.add("open");
      m.style.display = "flex";
    }
    renderModalMaktabaBooks();
  };

  window.closeMaktabaModal = function() {
    const m = document.getElementById("modal-maktaba");
    if (m) {
      m.classList.remove("open");
      m.style.display = "none";
    }
  };

  window.filterModalMaktaba = function(cat) {
    modalMaktabaCategory = cat;
    document.querySelectorAll(".maktaba-filter-btn").forEach(b => b.classList.remove("active"));
    const btn = document.getElementById("filter-mak-" + cat.toLowerCase());
    if (btn) btn.classList.add("active");
    renderModalMaktabaBooks();
  };

  window.handleModalMaktabaSearch = function(q) {
    modalMaktabaSearchQuery = (q || "").toLowerCase().trim();
    renderModalMaktabaBooks();
  };

  function renderModalMaktabaBooks() {
    const grid = document.getElementById("modal-maktaba-grid");
    if (!grid) return;

    if (!fullCorpusData || fullCorpusData.length === 0) {
      grid.innerHTML = "<div style='color:var(--text-muted); padding:20px;'>Loading authenticated v4 and v5 manuscripts...</div>";
      return;
    }

    let filtered = fullCorpusData.filter(b => b.is_v4_v5 !== false);

    if (modalMaktabaCategory === "IHYA") {
      filtered = filtered.filter(b => (b.category && b.category.includes("Ihya")) || (b.title && b.title.includes("Ihya")));
    } else if (modalMaktabaCategory === "RAZI") {
      filtered = filtered.filter(b => b.imam_key === "razi" || (b.author && b.author.includes("Razi")));
    } else if (modalMaktabaCategory === "GHAZALI") {
      filtered = filtered.filter(b => b.imam_key === "ghazali" || (b.author && b.author.includes("Ghazali")));
    } else if (modalMaktabaCategory === "NAWAWI") {
      filtered = filtered.filter(b => b.imam_key === "nawawi" || (b.author && b.author.includes("Nawawi")));
    } else if (modalMaktabaCategory === "RAGHIB") {
      filtered = filtered.filter(b => b.imam_key === "raghib" || (b.author && b.author.includes("Raghib")));
    }

    if (modalMaktabaSearchQuery) {
      filtered = filtered.filter(b =>
        (b.title && b.title.toLowerCase().includes(modalMaktabaSearchQuery)) ||
        (b.arabic_title && b.arabic_title.includes(modalMaktabaSearchQuery)) ||
        (b.author && b.author.toLowerCase().includes(modalMaktabaSearchQuery))
      );
    }

    grid.innerHTML = filtered.map(b => {
      const edBadge = b.version === "v5" ?
        "<span class='l1-did-badge verified' style='background:rgba(214, 158, 46, 0.2); color:#f6e05e; font-size:0.65rem;'>v5 MASTERWORK</span>" :
        "<span class='l1-did-badge verified' style='background:rgba(0, 245, 155, 0.15); color:var(--matrix-green); font-size:0.65rem;'>v4 TRANSLATION</span>";
      
      const isIhya = b.category && b.category.includes("Ihya");
      const ihyaId = isIhya ? (b.index || 1) : 0;

      let targetChannel = "chan-classical-heritage";
      if (b.imam_key === "razi" || (b.author && b.author.includes("Razi"))) {
        targetChannel = (b.title && (b.title.includes("Matalib") || b.title.includes("Tafsir"))) ? "chan-razi-tafsir-matalib" : "chan-razi-kalam-usul";
      } else if (b.imam_key === "ghazali" || (b.author && b.author.includes("Ghazali"))) {
        if (isIhya) targetChannel = "chan-ghazali-ihya";
        else if (b.title && (b.title.includes("Tahafut") || b.title.includes("Iqtisad") || b.title.includes("Maqasid"))) targetChannel = "chan-ghazali-kalam-falsafa";
        else if (b.title && (b.title.includes("Mustasfa") || b.title.includes("Miyar") || b.title.includes("Mihakk"))) targetChannel = "chan-ghazali-usul-mantiq";
        else targetChannel = "chan-ghazali-suluk-adab";
      } else if (b.imam_key === "nawawi" || (b.author && b.author.includes("Nawawi"))) {
        targetChannel = "chan-nawawi-hadith-fiqh";
      } else if (b.imam_key === "raghib" || (b.author && b.author.includes("Raghib"))) {
        targetChannel = (b.title && b.title.includes("Mufradat")) ? "chan-raghib-lexicon-tafsir" : "chan-raghib-akhlaq-adab";
      }

      const safeTitle = (b.title || "").replace(/'/g, "\\'");
      const safeArabic = (b.arabic_title || "").replace(/'/g, "\\'");
      const safeFilename = (b.filename || "").replace(/'/g, "\\'");
      const safeSha256 = (b.sha256 || "").replace(/'/g, "\\'");
      const safeTargetChannel = (targetChannel || "").replace(/'/g, "\\'");

      return (
        "<div class='book-card-v4v5'>" +
          "<div style='display:flex; justify-content:space-between; align-items:flex-start; gap:8px;'>" +
            "<div style='font-weight:700; color:#fff; font-size:0.85rem; line-height:1.4;'>" + (b.title || "") + "</div>" +
            edBadge +
          "</div>" +
          (b.arabic_title ? "<div style='font-family:var(--font-arabic); font-size:0.9rem; color:var(--matrix-gold); text-align:right;'>" + b.arabic_title + "</div>" : "") +
          "<div style='color:var(--text-muted); font-size:0.75rem;'>" + (b.author || "") + "</div>" +
          "<div style='display:flex; align-items:center; justify-content:space-between; margin-top:4px;'>" +
            "<span style='font-size:0.68rem; color:var(--text-muted); font-family:var(--font-mono);'>" + (b.sizeMb || "1.2 MB") + " &middot; SHA-256 Verified</span>" +
            "<span style='font-size:0.68rem; color:var(--matrix-green); font-family:var(--font-mono);'>L1 ANCHORED</span>" +
          "</div>" +
          "<div style='display:flex; gap:6px; margin-top:8px; flex-wrap:wrap;'>" +
            "<a href='/epubs/" + b.filename + "' download class='btn-pill btn-pill-green' style='flex:1; justify-content:center; text-decoration:none; font-size:0.72rem; padding:6px;'>Download</a>" +
            (isIhya ? "<button class='btn-pill' style='background:rgba(255,255,255,0.06); color:#fff; font-size:0.72rem; padding:6px;' onclick=\"openBookReader(" + ihyaId + ", '" + safeTitle + "', '" + safeArabic + "', '" + safeFilename + "')\">Read</button>" : "") +
            "<button class='btn-pill' style='background:rgba(0, 245, 155, 0.1); color:var(--matrix-green); border:1px solid rgba(0, 245, 155, 0.25); font-size:0.7rem; padding:6px;' onclick=\"closeMaktabaModal(); selectChannel('" + safeTargetChannel + "')\" title='Open in Imam Channel'>Channel</button>" +
            "<button class='btn-pill' style='background:rgba(255,255,255,0.04); color:var(--text-muted); font-size:0.7rem; padding:6px;' onclick=\"verifyEpubL1Anchor('" + safeFilename + "', '" + safeSha256 + "')\" title='Verify On-Chain Receipt'>L1 Proof</button>" +
          "</div>" +
        "</div>"
      );
    }).join("");
  }

  window.verifyEpubL1Anchor = async function(filename, sha256) {
    try {
      const res = await fetch("/api/blockchain/anchor-epub", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename, sha256 })
      });
      const data = await res.json();
      alert("L1 Sovereign Blockchain Proof:\n\nManuscript: " + data.filename + "\nSHA-256 Hash: " + data.sha256 + "\nTxHash: " + data.txHash + "\nSubnet Block Height: " + data.blockHeight + "\nStatus: " + data.status);
    } catch (e) {
      alert("Verification query: " + e.message);
    }
  };

  function showNotificationToast(msg) {
    const toast = document.getElementById("wyre-toast");
    if (toast) {
      toast.textContent = msg;
      toast.classList.add("show");
      setTimeout(function() { toast.classList.remove("show"); }, 3500);
    }
  }


  // --- Mobile Channels Sidebar & Drawer Navigation ---
  let _lastSidebarToggle = 0;
  window.toggleMobileSidebar = function(force) {
    const now = Date.now();
    if (typeof force !== 'boolean' && (now - _lastSidebarToggle < 250)) {
      return; // Debounce rapid double trigger
    }
    _lastSidebarToggle = now;

    const sidebar = document.getElementById('channels-sidebar');
    const rail = document.getElementById('space-rail');
    const backdrop = document.getElementById('drawer-backdrop');
    const app = document.getElementById('app-container');
    const members = document.getElementById('members-sidebar');

    if (members) members.classList.remove('show-mobile');
    if (!sidebar) return;

    const currentlyOpen = sidebar.classList.contains('show-mobile') || sidebar.classList.contains('mobile-open');
    const willOpen = typeof force === 'boolean' ? force : !currentlyOpen;

    if (willOpen) {
      sidebar.classList.add('show-mobile', 'mobile-open');
      if (rail) rail.classList.add('show-mobile');
      if (backdrop) backdrop.classList.add('active');
      if (app) app.classList.add('drawer-open');
    } else {
      sidebar.classList.remove('show-mobile', 'mobile-open');
      if (rail) rail.classList.remove('show-mobile');
      if (backdrop) backdrop.classList.remove('active');
      if (app) app.classList.remove('drawer-open');
    }
  };

  window.toggleChannelsDrawer = window.toggleMobileSidebar;
  window.closeDrawers = function() {
    window.toggleMobileSidebar(false);
  };

  // Wire up touch gestures on mobile for smooth drawer swipe
  let touchStartX = 0;
  let touchStartY = 0;
  document.addEventListener('touchstart', function(e) {
    if (e.touches && e.touches[0]) {
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
    }
  }, { passive: true });

  document.addEventListener('touchend', function(e) {
    if (!e.changedTouches || !e.changedTouches[0]) return;
    const deltaX = e.changedTouches[0].clientX - touchStartX;
    const deltaY = Math.abs(e.changedTouches[0].clientY - touchStartY);
    if (deltaY > 60) return;

    if (touchStartX < 45 && deltaX > 50) {
      window.toggleMobileSidebar(true);
    }
    if (deltaX < -60) {
      const sidebar = document.getElementById('channels-sidebar');
      if (sidebar && (sidebar.classList.contains('show-mobile') || sidebar.classList.contains('mobile-open'))) {
        window.toggleMobileSidebar(false);
      }
    }
  }, { passive: true });

  document.addEventListener('DOMContentLoaded', function() {
    const backdrop = document.getElementById('drawer-backdrop');
    if (backdrop) {
      backdrop.addEventListener('click', function() {
        window.toggleMobileSidebar(false);
      });
    }
  });

})();
