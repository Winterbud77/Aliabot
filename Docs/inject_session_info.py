# c:\Users\eugene\Projects\Work01_Anti\Docs\inject_session_info.py
import os
import re
import sys
import argparse

def inject_metadata(session_name, session_id, ai_provider, session_path):
    docs_dir = os.path.dirname(os.path.abspath(__file__))
    print(f"[SEARCH] Target Path: {docs_dir}")
    print(f"[INPUT] Session Name: {session_name}")
    print(f"[INPUT] Session ID: {session_id}")
    print(f"[INPUT] AI Provider: {ai_provider}")
    print(f"[INPUT] Session Path: {session_path}")

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

            # YAML Frontmatter 영역 파싱 (--- 기준 split)
            parts = content.split('---', 2)
            if len(parts) < 3:
                print(f"[SKIP] Frontmatter not found in: {filename}")
                continue

            yaml_content = parts[1]

            # 헬퍼 함수: 특정 YAML 키가 있으면 업데이트하고, 없으면 신규 추가
            def update_or_add_yaml(yaml_text, key, value):
                # 키가 이미 존재하는 경우
                if re.search(fr'(?m)^{key}:\s*', yaml_text):
                    return re.sub(fr'(?m)^{key}:.*$', f'{key}: "{value}"', yaml_text)
                # 존재하지 않는 경우 영역 끝에 추가
                else:
                    return yaml_text.rstrip() + f'\n{key}: "{value}"\n'

            # 각 메타데이터 주입 및 업데이트
            yaml_content = update_or_add_yaml(yaml_content, "session_name", session_name)
            yaml_content = update_or_add_yaml(yaml_content, "session_id", session_id)
            yaml_content = update_or_add_yaml(yaml_content, "ai_provider", ai_provider)
            yaml_content = update_or_add_yaml(yaml_content, "session_path", session_path)

            parts[1] = yaml_content
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
    parser = argparse.ArgumentParser(description="VTL/SOP Multi-Model Metadata Injector")
    parser.add_argument("name", help="Session Name")
    parser.add_argument("id", help="Session ID / UUID")
    parser.add_argument("--provider", default="Antigravity", help="AI Provider (e.g. Antigravity, Claude, ChatGPT, Cursor)")
    parser.add_argument("--path", default=r"C:\Users\eugene\.gemini\antigravity\brain", help="Physical path to the session storage")
    
    # 윈도우 인자 처리 대비 예외 방지
    args = parser.parse_args()
    
    # 역슬래시 이스케이프 방지 처리
    normalized_path = args.path.replace('\\\\', '\\')
    
    inject_metadata(args.name, args.id, args.provider, normalized_path)
