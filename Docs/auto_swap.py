import os
import shutil

source_pb = r"C:\Users\eugene\.gemini\antigravity\conversations\bf344642-382f-4515-9b71-60b5ea124d9a.pb"
target_pb = r"C:\Users\eugene\.gemini\antigravity\conversations\656e8400-19e4-4b38-aac4-56ea1d525f26.pb"

source_brain = r"C:\Users\eugene\.gemini\antigravity\brain\bf344642-382f-4515-9b71-60b5ea124d9f"
target_brain = r"C:\Users\eugene\.gemini\antigravity\brain\656e8400-19e4-4b38-aac4-56ea1d525f26"

if not os.path.exists(source_pb):
    print(f"Source .pb not found: {source_pb}")
    exit(1)

if not os.path.exists(source_brain):
    print(f"Source brain directory not found: {source_brain}")
    exit(1)

# 1. Swapping the .pb file content
try:
    if os.path.exists(target_pb):
        os.system(f'attrib -r "{target_pb}"')
    shutil.copy2(source_pb, target_pb)
    print("1. Target .pb file content successfully swapped.")
except Exception as e:
    print(f"Error swapping .pb file: {e}")
    exit(1)

# 2. Swapping the brain log directory content
try:
    if os.path.exists(target_brain):
        shutil.rmtree(target_brain)
    shutil.copytree(source_brain, target_brain)
    print("2. Target brain directory successfully swapped.")
except Exception as e:
    print(f"Error swapping brain directory: {e}")
    exit(1)

# 3. Apply read-only file attribute lock (+r) to target .pb
try:
    os.system(f'attrib +r "{target_pb}"')
    print("3. Target .pb file successfully locked (read-only +r applied).")
except Exception as e:
    print(f"Error applying +r lock: {e}")
    exit(1)

print("\n--- SWAP COMPLETE ---")
print("Target UUID: 656e8400-19e4-4b38-aac4-56ea1d525f26")
print("Please reload the VS Code window to apply changes.")
