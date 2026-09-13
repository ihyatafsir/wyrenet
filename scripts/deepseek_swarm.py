#!/usr/bin/env python3
"""
scripts/deepseek_swarm.py
Autonomous DeepSeek Flash 4.1 Agent Swarm Runner.
Orchestrates parallel epistemic task agents for code verification,
WebRTC SDP review, CGNAT resilience verification, and security analysis.

Zero external dependencies beyond standard library. Zero emojis.
"""

import os
import sys
import json
import time
import urllib.request
import urllib.error
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

DEEPSEEK_API_KEY = os.getenv("DEEPSEEK_API_KEY")
if not DEEPSEEK_API_KEY:
    env_file = Path(__file__).parent.parent / ".env"
    if env_file.exists():
        for line in env_file.read_text(encoding="utf-8").splitlines():
            line = line.strip()
            if line.startswith("DEEPSEEK_API_KEY="):
                DEEPSEEK_API_KEY = line.split("=", 1)[1].strip()

API_URL = os.getenv("DEEPSEEK_BASE_URL", "https://api.deepseek.com") + "/v1/chat/completions"
MODEL = os.getenv("DEEPSEEK_MODEL", "deepseek-chat")

def call_deepseek_agent(agent_name, role_prompt, user_prompt, max_tokens=1024, temp=0.2):
    payload = {
        "model": MODEL,
        "messages": [
            {"role": "system", "content": f"You are DeepSeek Flash 4.1 Agent [{agent_name}]. {role_prompt} Output technical evaluation concisely. Zero emojis."},
            {"role": "user", "content": user_prompt}
        ],
        "temperature": temp,
        "max_tokens": max_tokens
    }
    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(
        API_URL,
        data=data,
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {DEEPSEEK_API_KEY}"
        }
    )
    t0 = time.time()
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            res_body = resp.read().decode("utf-8")
            res_json = json.loads(res_body)
            duration = round(time.time() - t0, 2)
            content = res_json["choices"][0]["message"]["content"]
            return {
                "agent": agent_name,
                "status": "SUCCESS",
                "duration_sec": duration,
                "result": content.strip()
            }
    except Exception as e:
        return {
            "agent": agent_name,
            "status": "ERROR",
            "duration_sec": round(time.time() - t0, 2),
            "error": str(e)
        }

def run_agent_swarm(tasks):
    print("==================================================================")
    print("Dispatching DeepSeek Flash 4.1 Epistemic Agent Swarm")
    print(f"Model: {MODEL} | Active Agents: {len(tasks)}")
    print("==================================================================")

    results = []
    with ThreadPoolExecutor(max_workers=min(len(tasks), 5)) as executor:
        future_to_agent = {
            executor.submit(call_deepseek_agent, t["name"], t["role"], t["prompt"]): t["name"]
            for t in tasks
        }
        for future in as_completed(future_to_agent):
            name = future_to_agent[future]
            try:
                res = future.result()
                results.append(res)
                print(f"[*] Agent [{name}] completed in {res['duration_sec']}s (Status: {res['status']})")
            except Exception as e:
                print(f"[!] Agent [{name}] encountered exception: {e}")

    print("\n==================================================================")
    print("Agent Swarm Synthesis Report")
    print("==================================================================")
    for r in sorted(results, key=lambda x: x["agent"]):
        print(f"\n--- [AGENT: {r['agent']}] ({r['duration_sec']}s) ---")
        if r["status"] == "SUCCESS":
            print(r["result"])
        else:
            print(f"ERROR: {r.get('error')}")
        print("------------------------------------------------------------------")
    return results

if __name__ == "__main__":
    test_tasks = [
        {
            "name": "WebRTC_CGNAT_Auditor",
            "role": "You specialize in WebRTC SDP, ICE candidate negotiation across symmetric NAT/CGNAT, and STUN/TURN fallback.",
            "prompt": "Evaluate the robustness of combining Google STUN, Cloudflare STUN, and OpenRelay TURN servers with an adaptive fallback to containerless PCM audio and JPEG video over WebSocket when direct UDP hole punching fails. Summarize in 3 bullet points."
        },
        {
            "name": "ZBAT_E2EE_Crypto_Auditor",
            "role": "You specialize in end-to-end cryptographic protocols, ECDH key agreement, and authenticated AES-GCM.",
            "prompt": "Review using ECDH P-256 for key agreement, AES-256-GCM for packet encryption with metadata bound in Additional Authenticated Data (AAD), and ECDSA-P256 for packet authentication. Verify if relay servers can read content."
        },
        {
            "name": "Subnet_EVM_RPC_Auditor",
            "role": "You specialize in EVM JSON-RPC 2.0 and Avalanche Subnets.",
            "prompt": "Review serving EVM JSON-RPC 2.0 methods (eth_chainId, eth_blockNumber, eth_getBalance, eth_sendRawTransaction) on Subnet 51950. Summarize key security invariants for gasless EIP-712 relayers in 2 bullet points."
        }
    ]
    run_agent_swarm(test_tasks)
