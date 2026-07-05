import os
import shutil

# 1. Rollback current active session (4f8a91a7) to avoid pollution
current_session_log = r"C:\Users\eugene\.gemini\antigravity\brain\4f8a91a7-ff25-4be4-942b-01fbc07a8e1b\.system_generated\logs\overview.txt"
current_backup_log = current_session_log + ".bak"

if os.path.exists(current_backup_log):
    try:
        shutil.copy2(current_backup_log, current_session_log)
        print("1. Current session (4f8a91a7) successfully rolled back using backup.")
    except Exception as e:
        print(f"1. Rollback failed: {e}")
else:
    print("1. Rollback backup not found. Leaving current session intact.")

# 2. Define target paths for session cloning
# Clone yesterday's bf344642-382f-4515-9b71-60b5ea124d9a to a new UUID to bypass indexing conflicts
old_session_dir = r"C:\Users\eugene\.gemini\antigravity\brain\bf344642-382f-4515-9b71-60b5ea124d9a"
new_session_dir = r"C:\Users\eugene\.gemini\antigravity\brain\bf344642-382f-4515-9b71-60b5ea124d9f"

if not os.path.exists(old_session_dir):
    print(f"Error: Yesterday's session directory {old_session_dir} does not exist.")
    exit(1)

# Clean up new session directory if it exists
if os.path.exists(new_session_dir):
    try:
        shutil.rmtree(new_session_dir)
        print(f"Cleaned up existing target folder: {new_session_dir}")
    except Exception as e:
        print(f"Failed to clear target folder: {e}")

# Copy the entire directory structure including logs and tempmediaStorage
try:
    shutil.copytree(old_session_dir, new_session_dir)
    print(f"2. Cloned yesterday's session to new location: {new_session_dir}")
except Exception as e:
    print(f"Failed to clone session directory: {e}")
    exit(1)

# Verify the final log file location
new_log_path = os.path.join(new_session_dir, ".system_generated", "logs", "overview.txt")
if os.path.exists(new_log_path):
    print(f"3. Verification Success: New session log is live at {new_log_path}")
else:
    print("3. Warning: Cloned log file is missing!")
