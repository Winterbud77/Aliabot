import os
import shutil

# 삭제할 임시 세션 UUID 목록
delete_uuids = [
    "471d6458-a9fb-47e6-9602-5a68c051900a",
    "a9b508e3-962b-4f30-83dc-fa6aa4e5ee01",
    "4caf75a0-7dcd-41f6-b706-fe29acc5b546",
    "e54c26cf-e192-4e71-b5ad-9aedc309eaec",
    "103b225d-f912-484f-904a-c86c6c2d7d48"
]

conv_dir = r"C:\Users\eugene\.gemini\antigravity\conversations"
brain_dir = r"C:\Users\eugene\.gemini\antigravity\brain"

print("--- START CLEANING TEMP SESSIONS ---")

for uuid in delete_uuids:
    pb_file = os.path.join(conv_dir, f"{uuid}.pb")
    b_dir = os.path.join(brain_dir, uuid)
    
    # 1. pb 파일 삭제
    if os.path.exists(pb_file):
        try:
            os.system(f'attrib -r "{pb_file}"')  # 잠금 해제
            os.remove(pb_file)
            print(f"Deleted .pb file: {pb_file}")
        except Exception as e:
            print(f"Error deleting .pb {uuid}: {e}")
    else:
        print(f"No .pb file found for: {uuid}")
        
    # 2. brain 폴더 삭제
    if os.path.exists(b_dir):
        try:
            shutil.rmtree(b_dir)
            print(f"Deleted brain directory: {b_dir}")
        except Exception as e:
            print(f"Error deleting brain dir {uuid}: {e}")
    else:
        print(f"No brain dir found for: {uuid}")

print("--- CLEANING COMPLETE ---")
