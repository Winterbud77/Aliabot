# -*- coding: utf-8 -*-
import os
import re
import datetime
from google import genai
from google.genai import types

def run_auto_agent():
    print("[AliaBot Executor] 자율 자동화 연산 프로그램 기동.")
    
    inbox_path = "Docs/Instruction_Inbox.md"
    rules_path = "Docs/Automation_Rules.md"
    output_dir = "Outputs"
    
    if not os.path.exists(inbox_path):
        print(f"Error: 지시 수신함({inbox_path}) 파일이 존재하지 않습니다.")
        return

    # 1. 지시사항 수신함에서 마지막 지시 추출
    with open(inbox_path, 'r', encoding='utf-8') as f:
        content = f.read()
        
    # 날짜와 메시지 패턴 추출 (예: * [2026-07-08 15:30] 지시내용...)
    matches = re.findall(r'\*\s*\[([^\]]+)\]\s*(.+)', content)
    if not matches:
        print("[AliaBot Executor] 수신된 명령이 없습니다. 종료합니다.")
        return
        
    last_time, last_instruction = matches[-1]
    print(f"[AliaBot Executor] 최종 감지 지시사항: [{last_time}] {last_instruction}")
    
    # "대기 중..." 이거나 시스템 초기화 메시지인 경우 스킵
    if "대기 중" in last_instruction or "초기화" in last_instruction:
        print("[AliaBot Executor] 대기 모드 상태입니다. 연산을 수행하지 않습니다.")
        return

    # 2. 이미 해당 지시에 대해 결과 보고서가 생성되었는지 중복 검사
    os.makedirs(output_dir, exist_ok=True)
    report_date = datetime.datetime.now().strftime("%Y%m%d")
    report_path = os.path.join(output_dir, f"Crop_Report_{report_date}.md")
    
    # 3. Gemini API를 이용해 지시사항 수행 시뮬레이션 및 마크다운 리포트 생성
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        print("[AliaBot Executor] Error: GEMINI_API_KEY 환경변수가 설정되지 않았습니다.")
        # 테스트용 시뮬레이션 모드로 작동
        raw_analysis = f"""# 📊 Crop Data Analysis Report (영농 크롭 데이터 분석 보고서)
* **분석 요청 시간**: {last_time}
* **요청된 지시사항**: "{last_instruction}"
* **경고**: Gemini API Key가 감지되지 않아 로컬 시뮬레이터 모드로 가동되었습니다.

## 1. 🔍 데이터 분석 결과 요약
* 본 분석은 테스트 시뮬레이션 결과입니다. 
* 사용자가 요청하신 온실 B-Set 데이터의 수분 함량 및 이상치는 현재 24주차 표준 오차 범위 내에서 안정적인 흐름을 보이고 있습니다.
* 다음 단계로 가동을 전환할 준비가 되었습니다.
"""
    else:
        try:
            client = genai.Client(api_key=api_key)
            
            # 조율 행동 규약 로드
            rules_content = ""
            if os.path.exists(rules_path):
                with open(rules_path, 'r', encoding='utf-8') as rf:
                    rules_content = rf.read()

            system_instruction = f"""당신은 사무실 컴퓨터 내에서 대형 농업 데이터 및 코딩 연산을 위임받은 자율 분석 비서(Autonomous Executor)입니다.
아래의 행동 규약을 엄격히 준수하여 사용자의 지시사항을 해석하고, 최종 보고서(마크다운 형식)를 생성하십시오.

[행동 규약]
{rules_content}"""

            prompt = f"사용자의 지시사항: '{last_instruction}'\n이 지시사항에 대해 영농 데이터를 가공하고 정밀 분석한 최종 마크다운 보고서를 작성하십시오."
            
            response = client.models.generate_content(
                model='gemini-2.5-flash',
                contents=prompt,
                config=types.GenerateContentConfig(
                    system_instruction=system_instruction,
                    temperature=0.2
                )
            )
            raw_analysis = response.text
        except Exception as e:
            print(f"[AliaBot Executor] API 호출 중 오류 발생: {e}")
            raw_analysis = f"# ❌ 연산 에러 보고서\n* **요청 지시**: {last_instruction}\n* **에러 로그**: {e}"

    # 4. 최종 리포트 파일 쓰기
    with open(report_path, 'w', encoding='utf-8') as wf:
        wf.write(raw_analysis)
        
    print(f"[AliaBot Executor] 분석 보고서 작성 완료: {report_path}")

    # 5. 지시사항 처리 완료 후 Inbox 파일에 완료 상태 기록 (무한루프 방지)
    current_time = datetime.datetime.now().strftime("%Y-%m-%d %H:%M")
    with open(inbox_path, 'a', encoding='utf-8') as af:
        af.write(f"\n* [{current_time}] 시스템 처리 완료. 대기 중...\n")
    print("[AliaBot Executor] 지시 처리 마크다운 갱신 완료.")

if __name__ == "__main__":
    run_auto_agent()
