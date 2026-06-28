# ✉️ AliaBot 이메일(Email) 발송 환경 변수 등록 및 배포 SOP

이 문서는 이메일 발송용 API Key를 **Firebase Secret Manager**에 안전하게 주입하고, 서버리스 백엔드인 **Firebase Cloud Functions**에 반영하기 위한 표준 운영 절차(Standard Operating Procedure, SOP) 가이드입니다. 

터미널 입력 시 한글 각주나 등호(`=`) 오기입으로 인한 문법 에러(Syntax Error)를 방지하기 위해, 복사하여 바로 붙여넣을 수 있는 **순수 명령어 코드 블록**으로 작성되었습니다.

---

## 1. ⚙️ 작동 원리 (Mechanism)

* **Secret Manager Protection (비밀 데이터 보호)**: `EMAIL_API_KEY`와 같은 외부 연동 비밀키는 소스 코드에 평문(Plaintext)으로 하드코딩하지 않습니다. 구글 클라우드의 암호화 인프라인 Secret Manager에 독립 보관한 뒤, 함수 실행 시 메모리상에만 바인딩(Binding)하여 환경 변수로 주입합니다.
* **Interactive Prompt Entry (대화형 프롬프트 주입)**: Firebase CLI는 명령어 인자(Arguments)로 비밀키 값을 직접 넘기는 대신, 명령어를 입력한 뒤 뒤따라오는 숨김 입력 프롬프트를 통해 값을 받아 처리함으로써 보안 위생(Security Hygiene)을 지킵니다.
session_name: "Restoring Session Test09"
session_id: "4a121658-e924-48e9-9455-497feba68766"
ai_provider: "Antigravity"
session_path: "C:\Users\eugene\.gemini\antigravity\brain"
---

## 2. 📋 1단계: 메일 API Key 발급 및 준비

1. [Resend 공식 홈페이지(resend.com)](https://resend.com)에 로그인합니다.
2. **API Keys** 메뉴에서 새로운 키를 발급받고 복사해 둡니다. (예: `re_1a2B3c4D...`)

---

## 3. 📋 2단계: 터미널 명령어 실행 (VSOP)

아래의 두 가지 방법 중 편하신 명령어를 마우스로 복사하여 터미널(PowerShell)에 그대로 붙여넣어 실행합니다.

### 💡 방법 A: 대화형 프롬프트 입력 방식 (권장)

1. 아래 명령어를 복사하여 터미널에 붙여넣고 엔터를 누릅니다.
```powershell
firebase functions:secrets:set EMAIL_API_KEY
```

2. 다음과 같이 입력 대기 문구가 나타나면, 복사해 둔 실제 Resend API Key를 마우스 우클릭으로 **붙여넣고 엔터**를 누릅니다. (※ 글자가 화면에 보이지 않아도 정상 입력됩니다.)
```text
? Enter a value for EMAIL_API_KEY: 
```

3. 배포 및 구버전 삭제를 묻는 질문에 **`Yes`**를 입력하고 엔터를 누릅니다.
```text
? Do you want to re-deploy the functions and destroy the stale version of secret EMAIL_API_KEY? Yes
```

---

### 💡 방법 B: 비대화형 파이프라인(Pipe) 단줄 입력 방식

대화형 프롬프트가 번거로운 경우, 아래 명령어의 따옴표 내부를 본인의 API Key로만 수정한 뒤 복사하여 실행합니다.

```powershell
"re_1a2B3c4D..." | firebase functions:secrets:set EMAIL_API_KEY
```

---

## 4. 📋 3단계: 백엔드 함수 수동 배포 (필요시)

만약 2단계 실행 도중 자동 배포가 진행되지 않았거나, 강제로 리부팅(Cold Start)이 필요할 경우 아래 명령어를 실행합니다.

```powershell
firebase deploy --only functions
```

---

## 5. ⚠️ 터미널 한글 플레이스홀더 주입 장애 주의사항 (Important Warning)

### ① 비-ASCII 입력 차단 원리 (Non-ASCII Rejection Mechanism)
* **원인**: Firebase Secret Manager는 비밀키 값의 아스키 규격(ASCII Specification) 정규식 검증(Regex Validation)을 강제합니다.
* **장애 증상**: 명령어 내에 한글 가이드용 플레이스홀더(예: `"복사한_Resend_API_키"`)를 포함시켜 그대로 터미널에 붙여넣고 엔터를 치면, CLI가 값의 포맷을 위반한 것으로 인지하여 `Error Key ... must start with an uppercase ASCII...`를 내뿜고 입력을 전면 중단시킵니다.

### ② 예방 조치 지침 (Prevention Guidelines)
* **한글 각주 및 사전 설명 보존**: 시스템의 이해를 돕기 위한 풍부한 한글 개념 각주와 사전 설명들은 그대로 안전하게 유지하십시오. 비개발자 사용자의 가독성과 학습에 매우 유익합니다.
* **명령어 파라미터 내 한글 격리**: 오직 실제 복사해 붙여넣는 PowerShell 명령어 내부의 **API Key 대입 자리(예: `="복사한_Resend_API_키"`)**에 한글이 섞여서 오입력되는 현상만 방어해 주시면 됩니다. 
* 항상 **방법 A**와 같이 파라미터가 배제된 순수 템플릿 명령어(`firebase functions:secrets:set EMAIL_API_KEY`)를 먼저 실행한 뒤, 프롬프트 입력창에 실제 값만 마우스 우클릭으로 복사/붙여넣기 하십시오.

