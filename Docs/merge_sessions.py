import json
import os

old_session = r"C:\Users\eugene\.gemini\antigravity\brain\bf344642-382f-4515-9b71-60b5ea124d9a\.system_generated\logs\overview.txt"
current_session = r"C:\Users\eugene\.gemini\antigravity\brain\4f8a91a7-ff25-4be4-942b-01fbc07a8e1b\.system_generated\logs\overview.txt"

if not os.path.exists(old_session):
    print("Old session overview.txt not found.")
    exit(1)

if not os.path.exists(current_session):
    print("Current session overview.txt not found.")
    exit(1)

# Backup current overview
backup_path = current_session + ".bak"
with open(current_session, 'r', encoding='utf-8') as f_in:
    with open(backup_path, 'w', encoding='utf-8') as f_out:
        f_out.write(f_in.read())
print(f"Backed up current session to {backup_path}")

# Read old session lines
with open(old_session, 'r', encoding='utf-8') as f:
    old_lines = [line.strip() for line in f if line.strip()]

# Read current session lines
with open(current_session, 'r', encoding='utf-8') as f:
    current_lines = [line.strip() for line in f if line.strip()]

merged_lines = []
merged_lines.extend(old_lines)

# Get the last step index from old session
last_step_index = 0
if old_lines:
    try:
        last_step_index = json.loads(old_lines[-1]).get("step_index", 0)
    except:
        last_step_index = 300

print(f"Old session last step_index: {last_step_index}")

# Merge and increment step_index sequentially
for line in current_lines:
    try:
        data = json.loads(line)
        last_step_index += 1
        data["step_index"] = last_step_index
        merged_lines.append(json.dumps(data, ensure_ascii=False))
    except Exception as e:
        merged_lines.append(line)

# Write back merged logs to the current active session
with open(current_session, 'w', encoding='utf-8') as f:
    for line in merged_lines:
        f.write(line + '\n')

print("Sessions merged successfully! The current active session now contains the entire conversation history from yesterday.")
