/**
 * webrtc_channel.js
 *
 * WyreSup Sovereign P2P WebRTC Communication Channel (v2.0)
 * Grounded in the 5 Classical Arabic Epistemic Pillars:
 * 1. Al-Mufradāt (Pure Domain Teleology & Ontological Modeling)
 * 2. Asās al-Balāghah (Anti-Leakage & Rhetorical Eloquence)
 * 3. Lisān al-ʿArab (Exhaustive Lifecycle States & Zero-Loss Error Handling)
 * 4. Kitāb al-ʿAyn (Orthogonal Primitive Decomposition)
 * 5. Al-Kitāb Sībawayh (Syntactic Governance & Strict Contracts)
 */

(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    root.WyreWebRtcChannel = factory();
  }
})(typeof window !== "undefined" ? window : globalThis, function () {
  "use strict";

  // Classical Lifecycle State Enumeration (Lisān al-ʿArab)
  const ChannelState = Object.freeze({
    INITIALIZING: "INITIALIZING",
    CONNECTING: "CONNECTING",
    CONNECTED: "CONNECTED",
    DEGRADED: "DEGRADED",
    CLOSED: "CLOSED",
    FAILED: "FAILED"
  });

  class WyreWebRtcChannel {
    constructor(configuration = {}) {
      this.rtcConfig = configuration.rtcConfig || {
        bundlePolicy: "max-bundle",
        rtcpMuxPolicy: "require",
        iceServers: [
          { urls: ["stun:stun.l.google.com:19302", "stun:stun1.l.google.com:19302", "stun:stun2.l.google.com:19302"] },
          { urls: ["stun:stun.cloudflare.com:3478"] },
          { urls: ["stun:openrelay.metered.ca:80"] },
          {
            urls: [
              "turn:openrelay.metered.ca:80",
              "turn:openrelay.metered.ca:443",
              "turns:openrelay.metered.ca:443?transport=tcp"
            ],
            username: "openrelay",
            credential: "openrelay"
          }
        ],
        iceCandidatePoolSize: 10,
        sdpSemantics: "unified-plan"
      };
      this.channelState = ChannelState.INITIALIZING;
      this.remoteMediaStream = null;
      this.peerConnection = null;
      this.dataChannel = null;
      this.dataChannelState = 'closed';
    }

    /**
     * Initializes and configures an RTCPeerConnection with unified track routing
     * and exhaustive lifecycle event management.
     */
    createPeerConnection(options = {}) {
      const {
        localStream,
        targetPeerId,
        onRemoteTrack,
        onIceCandidate,
        onConnectionChange,
        onError
      } = options;

      const pc = new RTCPeerConnection(this.rtcConfig);
      this.peerConnection = pc;
      this.channelState = ChannelState.CONNECTING;
      this.remoteMediaStream = new MediaStream();

      // Zero-Hop Direct RTCDataChannel (Barq Wire-Speed Conduit)
      const enableDataChannel = options.enableDataChannel !== false;
      const isInitiator = !!options.isInitiator;

      if (enableDataChannel && isInitiator && typeof pc.createDataChannel === 'function') {
        try {
          const dc = pc.createDataChannel('wyrenet-direct-p2p', { ordered: true });
          this._setupDataChannel(dc, options);
        } catch (dcErr) {
          console.warn('[WyreWebRtcChannel] DataChannel init notice:', dcErr.message);
        }
      }

      pc.ondatachannel = (event) => {
        if (event.channel) {
          this._setupDataChannel(event.channel, options);
        }
      };

      // 1. Ingest Local Media Tracks (Kitāb al-ʿAyn primitive binding)
      if (localStream && typeof localStream.getTracks === "function") {
        localStream.getTracks().forEach((track) => {
          pc.addTrack(track, localStream);
        });
      }

      // 2. Direct Bilateral Remote Track Accumulation
      pc.ontrack = (event) => {
        let stream = (event.streams && event.streams[0]) ? event.streams[0] : null;
        if (!stream) {
          if (!this.remoteMediaStream) {
            this.remoteMediaStream = new MediaStream();
          }
          this.remoteMediaStream.addTrack(event.track);
          stream = this.remoteMediaStream;
        }

        if (typeof onRemoteTrack === "function") {
          onRemoteTrack(stream, event.track);
        }
      };

      // 3. Bilateral ICE Candidate Signaling
      pc.onicecandidate = (event) => {
        if (event.candidate && typeof onIceCandidate === "function") {
          onIceCandidate(event.candidate, targetPeerId);
        }
      };

      // 4. Exhaustive Connection State Machine (Lisān al-ʿArab)
      pc.onconnectionstatechange = () => {
        const cs = pc.connectionState;
        switch (cs) {
          case "connected":
            this.channelState = ChannelState.CONNECTED;
            break;
          case "connecting":
            this.channelState = ChannelState.CONNECTING;
            break;
          case "disconnected":
            this.channelState = ChannelState.DEGRADED;
            break;
          case "failed":
            this.channelState = ChannelState.FAILED;
            break;
          case "closed":
            this.channelState = ChannelState.CLOSED;
            break;
        }

        if (typeof onConnectionChange === "function") {
          onConnectionChange(this.channelState, cs);
        }
      };

      // 5. ICE Connection Failure Watchdog
      pc.oniceconnectionstatechange = () => {
        const iceState = pc.iceConnectionState;
        if (iceState === "failed" || iceState === "disconnected") {
          if (typeof onError === "function") {
            onError(new Error("ICE connection entered degraded state: " + iceState));
          }
        }
      };

      return pc;
    }

    /**
     * Synthesizes and applies local offer SDP.
     */
    async generateOffer(pc, sdpModifier = null) {
      try {
        const offer = await pc.createOffer({
          offerToReceiveAudio: true,
          offerToReceiveVideo: true
        });

        let finalSdp = offer.sdp;
        if (typeof sdpModifier === "function") {
          finalSdp = sdpModifier(finalSdp);
        }

        const sessionDesc = new RTCSessionDescription({ type: "offer", sdp: finalSdp });
        await pc.setLocalDescription(sessionDesc);
        return sessionDesc;
      } catch (offerError) {
        this.channelState = ChannelState.FAILED;
        console.error("[WyreWebRtcChannel] Failed to generate local offer:", offerError);
        throw offerError;
      }
    }

    /**
     * Ingests remote offer and synthesizes local answer SDP.
     */
    async generateAnswer(pc, remoteOfferSdp, sdpModifier = null) {
      try {
        const remoteDesc = new RTCSessionDescription(remoteOfferSdp);
        await pc.setRemoteDescription(remoteDesc);

        const answer = await pc.createAnswer();
        let finalSdp = answer.sdp;
        if (typeof sdpModifier === "function") {
          finalSdp = sdpModifier(finalSdp);
        }

        const sessionDesc = new RTCSessionDescription({ type: "answer", sdp: finalSdp });
        await pc.setLocalDescription(sessionDesc);
        return sessionDesc;
      } catch (answerError) {
        this.channelState = ChannelState.FAILED;
        console.error("[WyreWebRtcChannel] Failed to generate local answer:", answerError);
        throw answerError;
      }
    }

    /**
     * Applies remote answer SDP to the active peer connection.
     */
    async applyRemoteAnswer(pc, remoteAnswerSdp) {
      try {
        const remoteDesc = new RTCSessionDescription(remoteAnswerSdp);
        await pc.setRemoteDescription(remoteDesc);
      } catch (descError) {
        console.error("[WyreWebRtcChannel] Failed to apply remote answer:", descError);
        throw descError;
      }
    }

    /**
     * Safely queues or applies a remote ICE candidate.
     */
    async applyIceCandidate(pc, candidateInit) {
      try {
        if (!candidateInit) return;
        const candidate = new RTCIceCandidate(candidateInit);
        await pc.addIceCandidate(candidate);
      } catch (iceError) {
        console.warn("[WyreWebRtcChannel] Safe ICE candidate application warning:", iceError.message);
      }
    }

    /**
     * Internal setup and event binding for RTCDataChannel
     */
    _setupDataChannel(dc, options = {}) {
      this.dataChannel = dc;
      this.dataChannelState = dc.readyState;

      dc.onopen = () => {
        this.dataChannelState = 'open';
        console.log('[WyreWebRtcChannel] Zero-Hop Direct DataChannel Established');
        if (typeof options.onDataChannelOpen === 'function') {
          options.onDataChannelOpen(dc);
        }
      };

      dc.onclose = () => {
        this.dataChannelState = 'closed';
        console.log('[WyreWebRtcChannel] Zero-Hop Direct DataChannel Closed');
        if (typeof options.onDataChannelClose === 'function') {
          options.onDataChannelClose();
        }
      };

      dc.onerror = (err) => {
        console.warn('[WyreWebRtcChannel] DataChannel notice:', err && err.message ? err.message : err);
      };

      dc.onmessage = (event) => {
        let parsed = event.data;
        if (typeof event.data === 'string') {
          try {
            parsed = JSON.parse(event.data);
          } catch (e) {
            parsed = event.data;
          }
        }
        if (typeof options.onDataMessage === 'function') {
          options.onDataMessage(parsed, event);
        }
      };
    }

    /**
     * Sends structured data or E2EE packets over the 0-hop DataChannel
     */
    sendData(data) {
      if (this.dataChannel && this.dataChannel.readyState === 'open') {
        const payload = typeof data === 'string' ? data : JSON.stringify(data);
        this.dataChannel.send(payload);
        return true;
      }
      return false;
    }

    /**
     * Gracefully tears down peer connection and active tracks.
     */
    terminateSession(pc = null) {
      if (this.dataChannel) {
        try {
          this.dataChannel.onopen = null;
          this.dataChannel.onclose = null;
          this.dataChannel.onmessage = null;
          this.dataChannel.onerror = null;
          this.dataChannel.close();
        } catch (e) {}
        this.dataChannel = null;
        this.dataChannelState = 'closed';
      }
      const activePc = pc || this.peerConnection;
      this.channelState = ChannelState.CLOSED;

      if (activePc) {
        try {
          activePc.ontrack = null;
          activePc.onicecandidate = null;
          activePc.onconnectionstatechange = null;
          activePc.oniceconnectionstatechange = null;
          activePc.close();
        } catch (closeError) {
          console.warn("[WyreWebRtcChannel] Safe close notice:", closeError.message);
        }
      }

      if (this.remoteMediaStream && typeof this.remoteMediaStream.getTracks === "function") {
        this.remoteMediaStream.getTracks().forEach((track) => {
          try {
            track.stop();
          } catch (trackError) {
            console.warn("[WyreWebRtcChannel] Track stop notice:", trackError.message);
          }
        });
      }

      this.peerConnection = null;
      this.remoteMediaStream = null;
    }
  }

  WyreWebRtcChannel.State = ChannelState;
  return WyreWebRtcChannel;
});