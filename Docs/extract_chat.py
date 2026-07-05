import json
import os
import re

filepath = r"C:\Users\eugene\.gemini\antigravity\brain\bf344642-382f-4515-9b71-60b5ea124d9a\.system_generated\logs\overview.txt"
output_path = r"c:\Users\eugene\Projects\Work01_Anti\Docs\20260704_AliaBot_Phase58_Conversation_History_Backup.md"

if not os.path.exists(filepath):
    print("Log file not found.")
    exit(1)

markdown_content = []
markdown_content.append("# 📜 어제 세션 (2026-07-04) AliaBot Phase 5.8 대화록 복원 백업\n")
markdown_content.append("> **세션 ID:** `bf344642-382f-4515-9b71-60b5ea124d9a`  ")
markdown_content.append("> **복원 시점:** 2026-07-05 10:45 (Local Time)  ")
markdown_content.append("> **AI Provider:** Antigravity (Gemini)  \n\n---\n")

with open(filepath, 'r', encoding='utf-8') as f:
    lines = f.readlines()

print(f"Reading {len(lines)} lines of raw JSON lines to extract conversation...")

for line in lines:
    line = line.strip()
    if not line:
        continue
    try:
        data = json.loads(line)
        source = data.get("source", "")
        msg_type = data.get("type", "")
        content = data.get("content", "")
        
        if not content:
            continue
            
        if source == "USER_EXPLICIT" and msg_type == "USER_INPUT":
            clean_content = content.replace("<USER_REQUEST>", "").replace("</USER_REQUEST>", "").strip()
            # Clean additional metadata patterns if any
            clean_content = re.sub(r'<ADDITIONAL_METADATA>.*?</ADDITIONAL_METADATA>', '', clean_content, flags=re.DOTALL)
            markdown_content.append(f"### 👤 사용자 (USER)\n\n```text\n{clean_content}\n```\n")
            
        elif source == "MODEL" and msg_type == "PLANNER_RESPONSE":
            markdown_content.append(f"### 🤖 Antigravity (AI Agent)\n\n{content}\n")
            markdown_content.append("\n---\n")
            
    except Exception as e:
        continue

with open(output_path, 'w', encoding='utf-8') as f:
    f.write("\n".join(markdown_content))

print(f"Conversation history successfully extracted and written to {output_path}")
