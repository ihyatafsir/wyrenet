#!/usr/bin/env python3
import os
import sys
import json
import time
from pathlib import Path

sys.path.append("/home/absolut7/aynengineaicoding")
from core.coding_engine import AynCodingEngine

AUDIT_TARGETS = [
    {
        "category": "Encryption & Key Agreement",
        "file": "src/network/MiftahEncryption.ts",
        "language": "typescript",
        "focus": "Puncturable Forward-Secrecy (PFS), Ratchet key derivation, sequence puncturing (Thaqb), and replay protection"
    },
    {
        "category": "Encryption & Token Authentication",
        "file": "src/network/ZBATProtocol.ts",
        "language": "typescript",
        "focus": "Zero-Knowledge Binary Authentication Token, AES-256-GCM AEAD, AAD authentication, dual-layer Zahir/Batin separation"
    },
    {
        "category": "Encryption & AEAD Primitives",
        "file": "src/mesh/ZbatCrypto.js",
        "language": "javascript",
        "focus": "ChaCha20-Poly1305 / AES-256-GCM AEAD encryption, random nonce generation, HMAC packet integrity"
    },
    {
        "category": "Cryptographic State Machine",
        "file": "src/network/WireGuardCore.ts",
        "language": "typescript",
        "focus": "Noise protocol handshake, ephemeral key generation, replay sliding window, and anti-tamper state transitions"
    },
    {
        "category": "Linguistic & Lexical Cryptography",
        "file": "src/utils/ArabicLexicalCryptoEngine.ts",
        "language": "typescript",
        "focus": "Triliteral root morphological permutation cipher, transliteration protection, and entropy distribution"
    },
    {
        "category": "Covert & Steganographic Conduits",
        "file": "src/network/ShabahStego.ts",
        "language": "typescript",
        "focus": "Carrier masking, LSB entropy insertion, steganalysis resistance, and covert packet framing"
    },
    {
        "category": "Acoustic Key Exchange",
        "file": "src/network/NaghamDTMF.ts",
        "language": "typescript",
        "focus": "Out-of-band acoustic DTMF key modulation/demodulation, frequency precision, and audio buffer handling"
    },
    {
        "category": "Unified Protocol Stack",
        "file": "src/network/UnifiedProtocolManager.ts",
        "language": "typescript",
        "focus": "13-layer sovereign stack orchestration, protocol dispatch, error recovery, and layer isolation"
    },
    {
        "category": "Transport & 0-RTT Delivery",
        "file": "src/network/NaqlTransport.ts",
        "language": "typescript",
        "focus": "Unified transport abstraction (UDP/WebRTC/BLE), MTU fragmentation, and packet scheduling"
    },
    {
        "category": "Instant Burst Protocol",
        "file": "src/network/BarqProtocol.ts",
        "language": "typescript",
        "focus": "0-RTT connection establishment, burst message encoding, and immediate ACK tracking"
    },
    {
        "category": "Congestion & Flow Control",
        "file": "src/network/SaylFlow.ts",
        "language": "typescript",
        "focus": "BBR/Vegas sliding-window flow control, congestion window throttling, and packet drop recovery"
    },
    {
        "category": "CGNAT-Proof Tunneling",
        "file": "src/network/NafaqTunnel.ts",
        "language": "typescript",
        "focus": "Containerless PCM audio and SHAF video framing, symmetric NAT hole-punching, and packet replay defense"
    },
    {
        "category": "Onion Routing & Privacy",
        "file": "src/network/WakilProxy.ts",
        "language": "typescript",
        "focus": "Multi-hop Sphinx onion routing, layered encryption peel, and traffic decorrelation"
    },
    {
        "category": "Zero-Hop WebRTC Signaling",
        "file": "public/webrtc_channel.js",
        "language": "javascript",
        "focus": "Direct RTCDataChannel establishment, SDP negotiation, ICE candidate buffering, and zero-server data transfer"
    }
]

def main():
    print("==================================================================")
    print("AynEngine AI Coding Engine: Communication & Encryption Audit")
    print("5 Classical Epistemic Pillars + DeepSeek Flash 4.1 Reasoning")
    print("Zero-Emoji Sovereign Audit Standard")
    print("==================================================================")

    engine = AynCodingEngine()
    audit_results = []
    
    output_dir = Path("/home/absolut7/.gemini/antigravity-ide/brain/0d2a3306-4c59-4661-8f9d-e5b0b95a6e56")
    output_dir.mkdir(parents=True, exist_ok=True)
    json_output_path = output_dir / "aynengine_audit_results.json"

    for idx, target in enumerate(AUDIT_TARGETS, 1):
        fpath = Path(target["file"])
        print(f"\n[{idx}/{len(AUDIT_TARGETS)}] Auditing {target['category']}: {target['file']}")
        if not fpath.exists():
            print(f"  [WARN] File not found: {target['file']}")
            continue

        code = fpath.read_text(encoding="utf-8", errors="ignore")

        # 1. Local 5-Pillar Static Epistemic Audit
        local_report = engine.audit_local(code, language=target["language"], filename=target["file"])
        epistemic_score = local_report.get("epistemic_score", 90)
        grade = local_report.get("grade", "A")
        pillars = local_report.get("pillars", {})

        print(f"  Pillars Score: {epistemic_score}/100 (Grade: {grade})")
        for p_name, p_data in pillars.items():
            print(f"    - {p_name}: {p_data.get('status', 'PASS')} (score: {p_data.get('score', 100)})")

        # 2. DeepSeek Flash 4.1 Epistemic Reasoning
        print(f"  Running DeepSeek Flash 4.1 Cryptographic & Resilience Analysis...")
        sample_code = code[:4500]
        prompt = (
            f"You are the Chief Cryptographic and Protocol Auditor of the AynEngine AI Coding Engine.\n"
            f"Audit the following source file from WyreNet Sovereign P2P Mesh.\n\n"
            f"File: {target['file']}\n"
            f"Category: {target['category']}\n"
            f"Focus Area: {target['focus']}\n\n"
            f"Evaluate against:\n"
            f"1. Cryptographic Security: Forward secrecy, nonce uniqueness, replay resistance, key lifecycle, side-channel/timing resilience.\n"
            f"2. Protocol Robustness: State transitions, unhandled edge cases, resource cleanup, network partition resilience.\n"
            f"3. 5 Classical Pillars Alignment: Ontological purity (Al-Mufradat), Abstraction tightness (Asas al-Balaghah), Error exhaustiveness (Lisan al-Arab), Atomic primitives (Kitab al-Ayn), Syntactic contracts (Al-Kitab).\n\n"
            f"Deliverables:\n"
            f"- Executive Verdict: Pass / Pass with Advisory / Critical\n"
            f"- Key Cryptographic Strengths (2-3 concise points)\n"
            f"- Identified Vulnerabilities or Edge Case Risks (1-2 precise points)\n"
            f"- Hardening Recommendation\n"
            f"Strict constraint: Do not use any emojis whatsoever.\n\n"
            f"Source Code Sample:\n```\n{sample_code}\n```"
        )

        sys_prompt = "You are an uncompromising cryptographic and P2P protocol security auditor for AynEngine AI. Strictly zero emojis."
        deepseek_verdict = engine.call_api(
            system_prompt=sys_prompt,
            user_prompt=prompt,
            temperature=0.1,
            max_tokens=1200
        )

        record = {
            "category": target["category"],
            "file": target["file"],
            "language": target["language"],
            "focus": target["focus"],
            "epistemic_score": epistemic_score,
            "grade": grade,
            "pillars": pillars,
            "deepseek_analysis": deepseek_verdict.strip()
        }
        audit_results.append(record)
        print("  Analysis completed successfully.")
        time.sleep(0.5)

    with open(json_output_path, "w", encoding="utf-8") as f:
        json.dump(audit_results, f, indent=2)

    print("\n==================================================================")
    print(f"Audit completed: {len(audit_results)} modules audited.")
    print(f"Detailed JSON results written to: {json_output_path}")
    print("==================================================================")

if __name__ == "__main__":
    main()
