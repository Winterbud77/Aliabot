
2. ⚙️ 다른 데스크탑 에이전트에게 Git 가이드 전수하기 (Terminology & Mechanism)
데스크탑에서 작업 중인 Claude Code 에이전트에게 본 프로젝트의 Git 노하우를 상속하기 위해서는 아래의 핵심 원리를 활용하시는 것이 좋습니다.

① Web Fetching (웹 크롤링)
개념: AI 에이전트가 제공된 인터넷 HTTP 링크를 호출하여 그 안의 마크다운(.md) 또는 HTML 문서를 직접 긁어와 해독하는 작업입니다.
한계: 네트워크 방화벽, 깃허브(GitHub)의 일시적인 봇 접속 차단 등의 문제로 에이전트가 링크 속 텍스트를 제대로 파싱(Parsing; 분석)하지 못하고 에러를 뿜는 현상이 발생할 수 있습니다.
② Context Injection (컨텍스트 주입 / 맥락 주입)
개념: AI 에이전트에게 완벽한 지식 지침을 상속하기 위해, 외부 링크 대신 로컬 프로젝트 폴더 내에 지침 파일을 직접 복사해 넣어 에이전트가 해당 로컬 파일 경로를 다이렉트로 읽도록 지시하는 설계 기법입니다.
이점: 외부 통신 오류를 100% 차단하며, 에이전트가 해당 파일의 내용을 영구 메모리로 인식하여 즉시 완벽한 코드를 작성할 수 있게 합니다.
3. 🛠️ 데스크탑 Claude Code에 전수하는 구체적인 2가지 방법 (Action Plan)
현재 AliaBot의 깃허브 원격 주소는 https://github.com/Winterbud77/AliaBot.git 입니다. 이를 활용하여 아래 두 가지 방법 중 편하신 방식을 선택하여 지시해 보세요.

방법 A. 깃허브 다이렉트 주소 제공 (간단한 방식)
데스크탑 Claude Code의 채팅 입력창에 아래 내용을 그대로 복사해서 전달합니다.

"안녕! 우리는 지금 Git/GitHub 연동 환경을 구축하려고 해. 아래 링크된 깃허브 문서를 읽고 참고해서, 우리 Tomato 프로젝트의 Git Commit/Push 자동화 절차와 문서 관리 가이드를 똑같이 셋팅해 줘."

1) 사용자용 Git 지침서 (VSOP): https://github.com/Winterbud77/AliaBot/blob/master/Docs/20260623_AliaBot_Git_Usage_VSOP.md
2) 기술용 Git 기술로그 (VTL): https://github.com/Winterbud77/AliaBot/blob/master/Docs/20260623_AliaBot_Git_Usage_VTL.md
방법 B. 로컬 파일 복사 후 맥락 주입 (가장 확실하고 추천하는 방식)
깃허브 웹 접속 오류를 원천 차단하는 가장 완벽한 방법입니다.

파일 복사:
본 랩탑의 c:\Users\eugene\Projects\Work01_Anti\Docs 폴더에서 아래 2개 마크다운 파일을 USB나 메일, OneDrive 등으로 데스크탑에 가져갑니다.
20260623_AliaBot_Git_Usage_VSOP.md
20260623_AliaBot_Git_Usage_VTL.md
파일 붙여넣기:
데스크탑의 Tomato GH Data Automation 프로젝트 폴더 내부에 Docs/ 폴더를 만들고 거기에 위 파일 2개를 그대로 붙여넣습니다.
Claude Code에 지시:
데스크탑 Claude Code 창에 파일 경로를 직접 대입해 다음과 같이 명령합니다:
"Docs 폴더 안에 넣어둔 20260623_AliaBot_Git_Usage_VSOP.md 파일과 VTL 문서를 읽고, 이 지침 방식 그대로 우리 토마토 프로젝트에서도 VSCode의 Source Control GUI와 연동하여 자동으로 Git Commit/Push를 깔끔하게 작성할 수 있도록 로컬 환경과 에이전트 메모리를 셋팅해 줘."

이렇게 하시면 데스크탑의 Claude Code가 프로젝트 내부의 지침서를 직접 파싱하여 완벽하게 Git 환경을 세팅해 줄 것입니다.





----------------------------

사실 데스크탑의 Greenhouse Data, Data Automation 경우에는 GitHub에는 브랜치 폴더도 만들지 않았어요.

그런데 한 가지 질문은 지금 Antigravity의 경우에는 Git Extension이 있어서 이렇게 상세하게 가능한 것 같은데, 데스크탑 클로드 코드의 GUI 버전(Cowork 옆에 있는)에서도 별도로 Git Extension 같은 것이 깔지 않아도 이런 방식으로 하면 될까요?

아니면 클로드 CLI 방식으로 터미널에서 작업을 해야 되나요? 






데스크탑 환경(Greenhouse Data Automation 프로젝트)에서 깃허브 원격 저장소나 별도의 확장 프로그램(Extension) 설정 없이도 동일한 Git 형상 관리를 수행하는 원리와 구체적인 실행법에 대해 명확히 설명해 드립니다.

1. ⚙️ 핵심 개념 및 작동 원리 (Terminology & Mechanism)
① Built-in Git Support (VSCode 내장 Git 지원 기능)
개념: 비주얼 스튜디오 코드(VSCode) 에디터 내부에 기본적으로 탑재되어 있는 로컬 형상 관리 GUI 제어판입니다.
작동 원리: 로컬 데스크탑 컴퓨터에 Git 프로그램만 깔려 있다면, VSCode는 아무런 추가 확장 프로그램(Extension)을 설치하지 않아도 좌측 3번째 '소스 제어(Source Control)' 탭(Ctrl + Shift + G)을 통해 코드의 변경 사항을 시각적으로 보여주고 수동으로 커밋할 수 있게 지원합니다. (사용자님의 화면 캡처에서 보인 이력 브랜치 선들은 Git Graph라는 시각화 도구일 뿐, 핵심 Git 기능은 이미 에디터 내장 기능입니다.)
② Agent CLI Execution (에이전트 CLI 명령 자동 실행)
개념: 코딩 에이전트(Claude Code, Antigravity 등)가 운영체제의 터미널(CLI; Command Line Interface) 명령 창을 획득하여 사람 대신 직접 Git 셸 명령어를 타이핑하여 실행하는 능력입니다.
작동 원리: 에이전트는 GUI 화면의 버튼을 눌러 동작하는 것이 아니라, 사용자의 자연어 요청을 받아 백그라운드 터미널에 git init (저장소 생성), git add . (파일 추적), git commit (버전 기록) 등의 명령어를 직접 입력해 실행합니다. 따라서 데스크탑의 Claude Code GUI가 어떤 형태이든 에이전트는 Git 명령을 완벽히 다룰 수 있습니다.
2. 🛠️ 데스크탑에서의 구체적인 실행법 (Action Plan)
현재 데스크탑의 토마토 자동화 프로젝트가 깃허브(GitHub)에 업로드되어 있지 않고 로컬 Git 저장소조차 초기화되지 않았더라도, 아래 순서대로 지시하시면 별도의 확장 프로그램을 깔거나 직접 터미널에 명령어를 치지 않아도 Claude Code가 알아서 완벽하게 형상 관리를 셋팅해 줍니다.

[1단계] 로컬 Git 저장소 생성 및 첫 버전 기록 지시
데스크탑의 Claude Code 창에 다음 한 줄을 명령합니다:

"우리 이 프로젝트에 로컬 Git 저장소를 새로 생성(git init)해 주고, 지금까지 작업된 소스 코드 파일들을 첫 번째 버전으로 깔끔하게 커밋(Initial Commit)해 줘."

에이전트의 내부 동작: Claude Code가 터미널을 열어 아래 명령을 순서대로 자동 실행합니다.
powershell
git init
git add .
git commit -m "Initial commit by Claude Code"
[2단계] 코드 변경 시 저장 지시 (작업 중 수시로)
기능을 추가하거나 코드를 수정한 뒤, 버전으로 남기고 싶을 때 Claude Code에게 다음과 같이 한마디만 하시면 됩니다.

"방금 구현한 토마토 온실 센서 자동화 코드 변경 사항을 Git 커밋으로 기록해 줘."

에이전트의 내부 동작: 수정한 파일을 감지하여 커밋 메시지를 논리적으로 작성하고 git commit을 대행합니다.
[3단계] 추후 GitHub 원격 저장소 백업이 필요할 때
로컬 버전을 깃허브에 백업하고 싶을 때가 오면 그때 처리하셔도 늦지 않습니다.

웹 브라우저로 깃허브(github.com)에 접속하여 빈 저장소(New Repository)를 하나 생성합니다. (예: https://github.com/Winterbud77/Tomato-Automation.git)
데스크탑 Claude Code 창에 생성된 주소와 함께 다음과 같이 명령합니다:
"이 깃허브 원격 주소를 우리 프로젝트에 연동하고, 지금까지 로컬에 기록해 둔 버전들을 메인 브랜치에 업로드(git push)해 줘: https://github.com/Winterbud77/Tomato-Automation.git"

에이전트의 내부 동작:
powershell
git remote add origin https://github.com/Winterbud77/Tomato-Automation.git
git branch -M main
git push -u origin main
위 터미널 명령을 스스로 판단하여 수행하고 백업을 완료합니다.
3. 📝 결론 및 가이드
확장 프로그램 불필요: 별도의 Git Extension을 데스크탑에 추가로 설치하실 필요가 없습니다.
CLI 터미널 조작 불필요: 사용자가 직접 검은색 터미널 창에 타자를 치지 않아도, Claude Code에게 한글로 자연스럽게 지시하면 에이전트가 알아서 CLI 방식으로 백그라운드에서 모든 Git 작업을 대행해 줍니다.
의사소통 팁: 앞서 공유해 드린 AliaBot의 Git Usage 지침서(20260623_AliaBot_Git_Usage_VSOP.md) 텍스트를 데스크탑 에이전트에게 읽혀서 "우리 프로젝트에서도 커밋을 생성할 때 이 지침에 있는 방식대로 파일 이름 옆에 VTL/SOP/Code 등의 접두사(Prefix)를 붙여서 깔끔하게 기록해 줘"라고 가이드 규칙을 동기화하시는 것을 적극 추천합니다.