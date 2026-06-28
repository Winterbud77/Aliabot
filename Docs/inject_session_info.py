# c:\Users\eugene\Projects\Work01_Anti\Docs\inject_session_info.py
import os
import re
import sys

def inject_metadata(session_name, session_id):
    docs_dir = os.path.dirname(os.path.abspath(__file__))
    print(f"[SEARCH] Target Path: {docs_dir}")
    print(f"[INPUT] Session Name: {session_name}")
    print(f"[INPUT] Session ID: {session_id}")

    count_success = 0
    for filename in os.listdir(docs_dir):
        if filename.endswith(".md") and filename != "inject_session_info.py":
            filepath = os.path.join(docs_dir, filename)
            
            try:
                with open(filepath, 'r', encoding='utf-8') as f:
                    content = f.read()
            except Exception as read_err:
                print(f"[ERROR] Failed to read {filename}: {str(read_err)}")
                continue

            # 개행 문자 LF로 통일
            content = content.replace('\r\n', '\n')

            # 1) session_name 처리
            if re.search(r'(?m)^session_name:\s*', content):
                content = re.sub(r'(?m)^session_name:.*$', f'session_name: "{session_name}"', content)
            else:
                parts = content.split('---', 2)
                if len(parts) >= 3:
                    parts[1] = parts[1].rstrip() + f'\nsession_name: "{session_name}"\n'
                    content = '---'.join(parts)
                else:
                    print(f"[SKIP] Frontmatter not found in: {filename}")
                    continue

            # 2) session_id 처리
            if re.search(r'(?m)^session_id:\s*', content):
                content = re.sub(r'(?m)^session_id:.*$', f'session_id: "{session_id}"', content)
            else:
                parts = content.split('---', 2)
                if len(parts) >= 3:
                    parts[1] = parts[1].rstrip() + f'\nsession_id: "{session_id}"\n'
                    content = '---'.join(parts)

            # 파일 쓰기
            try:
                with open(filepath, 'w', encoding='utf-8', newline='\n') as f:
                    f.write(content)
                print(f"[SUCCESS] Updated: {filename}")
                count_success += 1
            except Exception as write_err:
                print(f"[ERROR] Failed to write {filename}: {str(write_err)}")

    print(f"[FINISH] Bulk update completed. Total updated: {count_success}")

if __name__ == "__main__":
    s_name = "Restoring Session Test09"
    s_id = "4a121658-e924-48e9-9455-497feba68766"
    
    if len(sys.argv) > 2:
        s_name = sys.argv[1]
        s_id = sys.argv[2]
        
    inject_metadata(s_name, s_id)
