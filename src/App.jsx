import React, { useState, useEffect, useRef } from 'react'
import { auth, db, googleProvider } from './firebase'
import { signInWithPopup, signInWithRedirect, getRedirectResult, signOut, onAuthStateChanged, GoogleAuthProvider } from 'firebase/auth'
import { collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, query, orderBy, serverTimestamp } from 'firebase/firestore'
import { parseCommand } from './utils/parser'
import { sendToObsidian, sendToObsidianViaDeepLink } from './api/obsidian'
import { sendToNotion } from './api/notion'
import { analyzeWithGemini } from './api/gemini'
import { insertCalendarEvent } from './api/calendar'
import { sendEmail } from './api/mail'
import { getSuggestedDestinations } from './utils/routingRules'
import { isEmailAllowed, getAllowlistDeniedMessage } from './utils/authAllowlist'
import {
    shouldShowPwaInstallHint,
    isPwaBannerDismissed,
    dismissPwaBanner,
    getPwaInstallSteps,
} from './utils/pwaInstall'
import { buildChronologicalSeqUpdates, looksLikeLegacySeqMismatch, hasDuplicateSeqs } from './utils/seqBackfill'
import { exportTodosToCSV } from './utils/csvExporter'

function App() {
    const [user, setUser] = useState(null)
    const [todos, setTodos] = useState([])
    const [viewMode, setViewMode] = useState('list') // 'list' | 'table'
    const [inputValue, setInputValue] = useState('')
    const [editingId, setEditingId] = useState(null)       // 수정 중인 메모 ID
    const [editingText, setEditingText] = useState('')     // 수정 중인 텍스트
    const [activeTag, setActiveTag] = useState(null)       // 태그 필터링
    const [deferredPrompt, setDeferredPrompt] = useState(null)
    const [showInstallBtn, setShowInstallBtn] = useState(false)
    const [isListening, setIsListening] = useState(false)
    const recognitionRef = useRef(null)
    const inputTextareaRef = useRef(null)       // 메모 입력 textarea
    const sttBaseTextRef = useRef('')           // 음성 입력 시작 시점의 기존 텍스트
    const sttCommittedRef = useRef('')          // 이번 세션에서 확정(final)된 음성 텍스트
    const sttWantsListeningRef = useRef(false)  // 사용자가 마이크를 끌 때까지 듣기 유지
    const isBackfillingRef = useRef(false)      // AI 백필 중복 실행 방지 락(Lock)
    const failedDocIdsRef = useRef(new Set())   // AI 분석 실패 문서 목록 캐시 (429 무한 늪 방지용)
    
    // Google Calendar API용 Access Token 관리
    const [googleAccessToken, setGoogleAccessToken] = useState(() => {
        return localStorage.getItem('alia-bot-google-access-token') || ''
    })
    
    // 모달 상태 관리
    const [exportModalTodo, setExportModalTodo] = useState(null)
    const [exportSelectedDestinations, setExportSelectedDestinations] = useState([])
    const [exportActionType, setExportActionType] = useState('copy') // 'copy' | 'move'
    const [recipientEmail, setRecipientEmail] = useState('')
    const [showSettingsModal, setShowSettingsModal] = useState(false)
    const [showPwaHelpModal, setShowPwaHelpModal] = useState(false)
    const [showUserManualModal, setShowUserManualModal] = useState(false)
    const [showPwaBanner, setShowPwaBanner] = useState(() => {
        return shouldShowPwaInstallHint() && !isPwaBannerDismissed()
    })

    // API Keys (BYOK)
    const [apiKeys, setApiKeys] = useState(() => {
        const savedKeys = localStorage.getItem('alia-bot-api-keys')
        const parsed = savedKeys ? JSON.parse(savedKeys) : {}
        return {
            openai: '',
            gemini: '',
            notion: '',
            // Notion 연동을 위한 추가 설정 (Phase 5.3)
            notionDatabaseId: '',
            notionTitleProperty: 'Title',
            notionContentProperty: 'Content',
            // Obsidian 설정을 위한 추가 (Phase 5.8)
            obsidianMode: 'deepLink', // 'deepLink' | 'localRest'
            obsidianVaultName: '',
            ...parsed,
        }
    })

    useEffect(() => {
        localStorage.setItem('alia-bot-api-keys', JSON.stringify(apiKeys))
    }, [apiKeys])

    // todos와 apiKeys의 최신값을 setInterval 안에서 타이머 리셋 없이 안전하게 참조할 수 있도록 useRef 동기화
    const todosRef = useRef(todos)
    const apiKeysRef = useRef(apiKeys)
    useEffect(() => {
        todosRef.current = todos
        apiKeysRef.current = apiKeys
    }, [todos, apiKeys])

    // Redirect 로그인 결과 처리 (팝업이 막히는 환경 대응)
    useEffect(() => {
        ;(async () => {
            try {
                const result = await getRedirectResult(auth)
                if (result) {
                    const credential = GoogleAuthProvider.credentialFromResult(result)
                    const token = credential?.accessToken
                    if (token) {
                        setGoogleAccessToken(token)
                        localStorage.setItem('alia-bot-google-access-token', token)
                        console.log('[Auth] Redirect 구글 액세스 토큰 획득 성공')
                    }
                }
            } catch (e) {
                // redirect 결과 처리 실패는 치명적이지 않으므로 경고만 남깁니다.
                console.warn('[Auth] redirect 결과 처리 실패:', e?.code || e?.message || e)
            }
        })()
    }, [])

    // Export 모달이 열리면 태그 기반 추천 목적지로 체크 상태를 초기화합니다.
    useEffect(() => {
        if (!exportModalTodo) return

        const suggested = getSuggestedDestinations(exportModalTodo.tags || [])
        setExportSelectedDestinations(suggested)
        setExportActionType('copy')
        setRecipientEmail('')
    }, [exportModalTodo])

    useEffect(() => {
        const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
            // allowlist: 초대된 Google 계정 이메일만 허용 (클라이언트 1차 + Blocking Function)
            if (currentUser && !isEmailAllowed(currentUser.email)) {
                alert(getAllowlistDeniedMessage(currentUser.email))
                try {
                    await signOut(auth)
                } catch (e) {
                    console.warn('[Auth] allowlist 거부 후 signOut 실패:', e)
                }
                setUser(null)
                setTodos([])
                return
            }

            setUser(currentUser)
            
            if (currentUser) {
                // 로그인 시, 로컬 스토리지에 데이터가 있다면 Firestore로 마이그레이션(이동)합니다.
                const savedTodos = localStorage.getItem('todos')
                if (savedTodos) {
                    const localTodos = JSON.parse(savedTodos)
                    if (localTodos.length > 0) {
                        console.log("Migrating local todos to Firestore...")
                        for (const todo of localTodos) {
                            await addDoc(collection(db, `users/${currentUser.uid}/todos`), {
                                text: todo.text,
                                completed: todo.completed,
                                category: 'todo', // 기본 카테고리
                                createdAt: serverTimestamp()
                            })
                        }
                        // 마이그레이션 완료 후 로컬 데이터는 삭제합니다.
                        localStorage.removeItem('todos') 
                    }
                }

                // Firestore 데이터 실시간 구독 (내 할 일 목록 가져오기)
                const q = query(
                    collection(db, `users/${currentUser.uid}/todos`),
                    orderBy('createdAt', 'desc')  // 최신순 정렬
                )
                
                const unsubscribeTodos = onSnapshot(q, (snapshot) => {
                    const todosData = snapshot.docs.map(doc => ({
                        id: doc.id,
                        ...doc.data()
                    }))

                    setTodos(todosData)

                    // seq 보정: seq 필드가 없는 문서가 1개라도 있거나, 중복/역전 감지 시 createdAt 기준 1..N (오래된=1, 최신=큰 번호) 자동 복구
                    try {
                        const docsNeedSeq = snapshot.docs.filter(doc => doc.data()?.seq === undefined || doc.data()?.seq === null)
                        const hasDuplicates = hasDuplicateSeqs(snapshot.docs)
                        const isMismatched = looksLikeLegacySeqMismatch(snapshot.docs)
                        if ((docsNeedSeq.length > 0 || hasDuplicates || isMismatched) && snapshot.docs.length > 0) {
                            console.log(`[seq] 보정 트리거 작동: 누락 ${docsNeedSeq.length}개, 중복 ${hasDuplicates}, 역전 ${isMismatched}. 순번 복원 작업을 시작합니다...`)
                            ;(async () => {
                                try {
                                    const updates = buildChronologicalSeqUpdates(snapshot.docs)
                                    for (const item of updates) {
                                        if (item.oldSeq === item.newSeq) continue
                                        const todoRef = doc(
                                            db,
                                            `users/${currentUser.uid}/todos`,
                                            item.id
                                        )
                                        await updateDoc(todoRef, { seq: item.newSeq })
                                    }
                                    console.log('[seq] createdAt 기준 seq 복원 완료')
                                } catch (e) {
                                    console.warn('[seq] 복원 실패:', e?.message || e)
                                }
                            })()
                        }
                    } catch (e) {
                        console.warn('[seq] 보정 처리 실패:', e?.message || e)
                    }

                    // [AI Backfill] onSnapshot 내부 가동 중단 (독립 Poller useEffect로 이전)
                })

                return () => unsubscribeTodos() // cleanup listener
            } else {
                // 로그아웃 상태일 때
                setTodos([])
                // 로컬 데이터가 있다면 보여주기 (로그인 유도를 위해)
                const savedTodos = localStorage.getItem('todos')
                if (savedTodos) {
                    setTodos(JSON.parse(savedTodos))
                }
            }
        })

        return () => unsubscribeAuth()
    }, [])

    // [AI Backfill Poller] 15초 주기 미처리 AI 데이터 자동 치유 엔진 (Phase 5.7)
    // 의존성 배열에 todos를 제외하여 상태 변경에 따른 불필요한 타이머 해제 및 재등록(리셋 버그)을 완벽히 방지합니다.
    useEffect(() => {
        if (!user) return

        const backfillInterval = setInterval(() => {
            if (isBackfillingRef.current) return

            const currentTodos = todosRef.current
            const currentApiKeys = apiKeysRef.current
            if (!currentTodos?.length) return

            const nowMs = Date.now()
            const pendingAiDocs = currentTodos.filter(todo => {
                if (!todo.text) return false
                
                // 이미 분석에 실패했거나 429 쿼터 한도 초과 판정을 받은 문서는 이번 세션에서 중복 요청 격리 차단
                if (failedDocIdsRef.current.has(todo.id)) return false
                
                // 생성된 지 20초 미만인 문서는 방금 추가된 것이므로 백필 대상에서 제외 (addTodo의 실시간 처리가 완료될 시간을 벌어줌)
                const createdTime = todo.createdAt?.toDate ? todo.createdAt.toDate().getTime() : 0
                if (nowMs - createdTime < 20000) return false

                return todo.aiProcessed !== true || !todo.tags || todo.tags.length === 0
            })

            // 한 번에 모든 미처리 문서를 복구하려 들면 429 쿼터 한계가 터집니다. 
            // 매 주기마다 최대 2개씩만 조심스럽게 복구하도록 슬라이싱 제어를 가합니다.
            const sliceDocs = pendingAiDocs.slice(0, 2)

            if (sliceDocs.length > 0) {
                isBackfillingRef.current = true
                console.log(`[AI Poller] 미처리 문서 ${pendingAiDocs.length}개 발견. (이번 주기 최대 2개 처리 시작...)`)
                
                ;(async () => {
                    try {
                        for (const todo of sliceDocs) {
                            try {
                                // 429 Rate Limit 방어를 위한 5초(5000ms) 강제 대기
                                await new Promise(resolve => setTimeout(resolve, 5000))
                                
                                const result = await analyzeWithGemini(todo.text, currentApiKeys.gemini || null)
                                const todoRef = doc(db, `users/${user.uid}/todos`, todo.id)
                                
                                if (result) {
                                    await updateDoc(todoRef, {
                                        tags: result.tags || [],
                                        summary: result.summary || '',
                                        metadata: {
                                            parsedEvent: result.parsedEvent || null
                                        },
                                        aiProcessed: true
                                    })
                                } else {
                                    await updateDoc(todoRef, { aiProcessed: true })
                                }
                                console.log(`[AI Poller] 문서 ${todo.seq || todo.id} 요약 복구 완료`)
                            } catch (err) {
                                console.warn(`[AI Poller] 문서 ${todo.id} 분석 실패:`, err.message)
                                failedDocIdsRef.current.add(todo.id) // 실패 격리 캐시에 등록하여 무한 루프 제외
                                const todoRef = doc(db, `users/${user.uid}/todos`, todo.id)
                                await updateDoc(todoRef, { aiProcessed: true }).catch(() => {})

                                // 429 Quota Exceeded (할당량 초과) 발생 시, 쿼터 보호를 위해 남은 대기열 처리를 즉시 중단하고 탈출합니다.
                                if (err.message.includes('429') || err.message.includes('quota') || err.message.includes('Quota')) {
                                    console.log('[AI Poller] 429 Quota Exceeded 감지 - 남은 백필 대기열 처리를 정지하고 안전하게 탈출합니다.')
                                    break
                                }
                            }
                        }
                    } finally {
                        isBackfillingRef.current = false
                    }
                })()
            }
        }, 15000)

        return () => clearInterval(backfillInterval)
    }, [user])
    

    // PWA Install Prompt Listener
    useEffect(() => {
        const handleBeforeInstallPrompt = (e) => {
            e.preventDefault();
            setDeferredPrompt(e);
            setShowInstallBtn(true);
        };
        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        window.addEventListener('appinstalled', () => {
            console.log('App was installed');
            setShowInstallBtn(false);
        });
        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        };
    }, []);

    const handleInstallClick = async () => {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        console.log(`User response to the install prompt: ${outcome}`);
        setDeferredPrompt(null);
        setShowInstallBtn(false);
    };

    const copyUserManualToClipboard = () => {
        const text = `[AliaBot 사용 설명서]
1. 앱으로 다운받기 (PWA 설치)
- 크롬 주소창 우측의 '설치/다운로드' 버튼을 누르면 바탕화면에 앱으로 설치됩니다.
- 만약 "App에서 열기"만 뜨고 다운로드가 안 된다면, 크롬 주소창에 chrome://apps 를 입력하거나 Windows 설정 > 앱 > 설치된 앱에서 기존 AliaBot을 검색하여 완전히 '제거'한 다음 재접속해 보세요.

2. 빠른 메모 및 음성 입력
- 입력창에 텍스트를 적은 후 Enter를 치거나 '추가' 버튼을 누르면 메모가 등록됩니다.
- 🎤(마이크) 버튼을 누르면 연속적인 음성 받아쓰기가 작동합니다. 말을 마친 후 다시 클릭하면 입력이 완료됩니다.

3. 카테고리 자동 지정 (! 명령어)
- 메모 작성 시 맨 앞에 !단어 를 적으면 카테고리가 강제 지정됩니다.
  예) "!일정 오후 3시 회의" ➡️ 캘린더 카테고리
  예) "!노션 중요 소스 정리" ➡️ Notion 카테고리
  예) "!옵시디언 SOP 검토" ➡️ Obsidian 카테고리

4. AI 자동 태깅 및 요약
- 메모를 입력하면 AI가 내용을 실시간 분석하여 관련된 태그(#Priva 등)와 한 줄 요약(Summary)을 자동으로 생성합니다.
- 태그를 클릭하면 해당 필터의 메모들만 모아볼 수 있습니다.

5. 외부 전송 (Notion, Obsidian, Clipboard)
- 등록된 메모 우측의 📤(내보내기) 아이콘을 눌러 Obsidian, Notion 등으로 동시 전송할 수 있습니다.
- 설정(⚙️) 메뉴에서 본인의 Notion API 키와 데이터베이스 ID를 등록해 연동할 수 있습니다.`;
        navigator.clipboard.writeText(text)
            .then(() => alert('📋 사용 설명서가 클립보드에 복사되었습니다! 지인들에게 카톡이나 메일로 공유해 보세요.'))
            .catch(() => alert('클립보드 복사에 실패했습니다.'));
    };

    // Auth Actions
    const handleLogin = async () => {
        try {
            // 일부 환경(내장 브라우저/팝업 정책)에서 팝업이 막히면 redirect로 폴백합니다.
            const result = await signInWithPopup(auth, googleProvider)
            if (result) {
                const credential = GoogleAuthProvider.credentialFromResult(result)
                const token = credential?.accessToken
                if (token) {
                    setGoogleAccessToken(token)
                    localStorage.setItem('alia-bot-google-access-token', token)
                    console.log('[Auth] Popup 구글 액세스 토큰 획득 성공')
                }
            }
        } catch (error) {
            console.error("Login failed:", error)
            const code = error?.code || ''

            if (code === 'auth/popup-blocked' || code === 'auth/popup-closed-by-user') {
                alert('팝업 로그인이 차단되어 Redirect 방식으로 다시 시도합니다.')
                try {
                    await signInWithRedirect(auth, googleProvider)
                } catch (e2) {
                    console.error('[Auth] redirect 로그인 실패:', e2)
                    alert('로그인에 실패했습니다. (Redirect 로그인도 실패)')
                }
                return
            }

            if (code === 'auth/unauthorized-domain') {
                alert(
                    '로그인에 실패했습니다. (authorized domain 문제)\n' +
                    'Firebase Console > Authentication > Settings > Authorized domains에\n' +
                    'localhost 를 추가한 뒤 다시 시도해주세요.'
                )
                return
            }

            // Blocking Function / allowlist 거부
            if (
                code === 'auth/user-disabled' ||
                code === 'auth/permission-denied' ||
                (typeof error?.message === 'string' &&
                    error.message.includes('초대된 Google 계정'))
            ) {
                alert(getAllowlistDeniedMessage(null))
                return
            }

            if (code) {
                alert(`로그인에 실패했습니다. (${code})`)
            } else {
                alert("Login failed. (Check popup blocks/browser policies)")
            }
        }
    }

    const handleLogout = async () => {
        try {
            await signOut(auth)
            setGoogleAccessToken('')
            localStorage.removeItem('alia-bot-google-access-token')
        } catch (error) {
            console.error("Logout failed:", error)
        }
    }

    // 음성 인식(STT) 중지 — 추가 버튼 등 다른 동작 전에 호출
    const stopListening = () => {
        sttWantsListeningRef.current = false
        const recognition = recognitionRef.current
        if (recognition) {
            // onend에서 자동 재시작되지 않도록 핸들러 제거 후 stop
            recognition.onend = null
            recognition.onerror = null
            try {
                recognition.stop()
            } catch (e) {
                console.warn('[STT] stop 실패:', e?.message || e)
            }
            recognitionRef.current = null
        }
        setIsListening(false)
    }

    // Todo Actions
    const addTodo = async () => {
        if (inputValue.trim() === '') return

        // 음성 인식 중이면 먼저 종료 (continuous 모드와 추가 버튼 충돌 방지)
        if (isListening) {
            stopListening()
        }
        
        if (!user) {
            alert("할 일을 클라우드에 저장하려면 먼저 로그인을 해주세요!")
            return
        }

        try {
            // 입력값을 파서(Parser)를 통해 분석
            const { cleanedText, category, metadata } = parseCommand(inputValue);

            // 1. Firestore에 즉시 저장 (AI 분석 전, 빠른 UX 보장)
            const maxExistingSeq = todos.reduce(
                (max, todo) => Math.max(max, typeof todo.seq === 'number' ? todo.seq : 0),
                0
            )
            const docRef = await addDoc(collection(db, `users/${user.uid}/todos`), {
                text: cleanedText,
                category: category,
                metadata: metadata || {},
                completed: false,
                seq: maxExistingSeq + 1,  // 게시판식 고정 번호 (기존 최대 seq + 1)
                tags: [],
                summary: '',
                aiProcessed: false,
                // Phase 5.3: 목적지(라우팅) 기록 (복수 선택)
                destinations: [],
                createdAt: serverTimestamp()
            })
            setInputValue('')

            // 2. AI 분석 — 백필 루프 가동 상태와 상관없이 사용자가 입력한 신규 메모는 최우선(Priority)으로 즉시 실시간 분석을 수행합니다.
            analyzeWithGemini(cleanedText, apiKeys.gemini || null)
                .then(async (result) => {
                    if (result) {
                        await updateDoc(doc(db, `users/${user.uid}/todos`, docRef.id), {
                            tags: result.tags || [],
                            summary: result.summary || '',
                            metadata: {
                                parsedEvent: result.parsedEvent || null
                            },
                            aiProcessed: true
                        })
                    } else {
                        await updateDoc(doc(db, `users/${user.uid}/todos`, docRef.id), {
                            aiProcessed: true
                        })
                    }
                })
                .catch(err => {
                    console.warn('Gemini 분석 실패:', err.message)
                    failedDocIdsRef.current.add(docRef.id) // 실패 격리 캐시에 등록
                    updateDoc(doc(db, `users/${user.uid}/todos`, docRef.id), {
                        aiProcessed: true
                    }).catch(() => {})
                })
        } catch (error) {
            console.error("Error adding todo:", error)
        }
    }

    const toggleTodo = async (todo) => {
        if (!user) return
        try {
            const todoRef = doc(db, `users/${user.uid}/todos`, todo.id)
            await updateDoc(todoRef, {
                completed: !todo.completed
            })
        } catch (error) {
            console.error("Error toggling todo:", error)
        }
    }

    const deleteTodo = async (id) => {
        if (!user) return
        try {
            const todoRef = doc(db, `users/${user.uid}/todos`, id)
            await deleteDoc(todoRef)
        } catch (error) {
            console.error("Error deleting todo:", error)
        }
    }

    // 메모 수정 저장
    const saveTodo = async (id) => {
        if (!user || !editingText.trim()) return
        try {
            const todoRef = doc(db, `users/${user.uid}/todos`, id)
            await updateDoc(todoRef, { text: editingText.trim() })
            setEditingId(null)
            setEditingText('')
        } catch (error) {
            console.error("Error saving todo:", error)
        }
    }

    // textarea 높이 자동 조절 (최소 3줄, 최대 약 8줄)
    const adjustInputHeight = () => {
        const textareaEl = inputTextareaRef.current
        if (!textareaEl) return

        textareaEl.style.height = 'auto'
        const minHeightPx = 72   // 약 3줄
        const maxHeightPx = 200  // 약 8줄
        const nextHeight = Math.min(Math.max(textareaEl.scrollHeight, minHeightPx), maxHeightPx)
        textareaEl.style.height = `${nextHeight}px`
    }

    useEffect(() => {
        adjustInputHeight()
    }, [inputValue])

    const handleInputKeyDown = (e) => {
        // Enter: 추가 / Shift+Enter: 줄바꿈 (일반 메모 앱 표준)
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            addTodo()
        }
    }

    // Web Speech API (STT) — 연속 인식 + 침묵 시 자동 재시작
    const toggleListening = () => {
        if (isListening) {
            stopListening()
            return
        }

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
        if (!SpeechRecognition) {
            alert('이 브라우저는 음성 인식을 지원하지 않습니다. 크롬 브라우저를 사용해주세요.')
            return
        }

        const recognition = new SpeechRecognition()
        recognition.lang = 'ko-KR'
        // continuous=true: 한 문장만 받고 끊기지 않고 계속 듣기 (마이크 버튼으로 종료)
        recognition.continuous = true
        recognition.interimResults = true
        recognition.maxAlternatives = 1

        recognition.onstart = () => {
            sttBaseTextRef.current = inputTextareaRef.current?.value || inputValue
            sttCommittedRef.current = ''
            sttWantsListeningRef.current = true
            setIsListening(true)
        }

        recognition.onresult = (event) => {
            let interimText = ''
            // resultIndex부터만 처리해 중복 누적 방지
            for (let i = event.resultIndex; i < event.results.length; i++) {
                const transcript = event.results[i][0].transcript
                if (event.results[i].isFinal) {
                    sttCommittedRef.current += transcript
                } else {
                    interimText += transcript
                }
            }

            const baseText = sttBaseTextRef.current.trim()
            const committedText = sttCommittedRef.current.trim()
            const mergedParts = [baseText, committedText, interimText.trim()].filter(Boolean)
            setInputValue(mergedParts.join(' '))
        }

        recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error)

            // 짧은 침묵(no-speech)은 onend에서 재시작 시도
            if (event.error === 'no-speech' && sttWantsListeningRef.current) {
                return
            }
            if (event.error === 'aborted') {
                return
            }

            stopListening()
            if (event.error === 'not-allowed') {
                alert('마이크 권한이 필요합니다. 브라우저 주소창 옆 마이크 아이콘에서 허용해 주세요.')
            }
        }

        recognition.onend = () => {
            // 사용자가 마이크를 끈 경우 종료
            if (!sttWantsListeningRef.current) {
                setIsListening(false)
                return
            }

            // Chrome: 잠깐 침묵해도 세션이 끊기므로 자동 재시작 (긴 메모 입력 가능)
            setTimeout(() => {
                if (!sttWantsListeningRef.current) {
                    setIsListening(false)
                    return
                }
                try {
                    recognition.start()
                } catch (e) {
                    console.warn('[STT] 자동 재시작 실패:', e?.message || e)
                    stopListening()
                }
            }, 250)
        }

        recognitionRef.current = recognition
        try {
            recognition.start()
        } catch (e) {
            console.error('[STT] start 실패:', e)
            stopListening()
            alert('음성 인식을 시작할 수 없습니다. 잠시 후 다시 시도해 주세요.')
        }
    }

    // Clipboard 복사 유틸리티 (Phase 5.3)
    const copyToClipboard = async (text) => {
        try {
            if (navigator?.clipboard?.writeText) {
                await navigator.clipboard.writeText(text);
                return { success: true, message: '✅ 클립보드에 복사 완료' };
            }
        } catch (e) {
            // 권한/환경 문제일 수 있으므로 아래 폴백으로 처리합니다.
            console.warn('[Clipboard] writeText 실패, 폴백 실행:', e?.message || e);
        }

        // 폴백: 보이지 않는 textarea에 넣고 execCommand로 복사
        try {
            const textarea = document.createElement('textarea');
            textarea.value = text;
            textarea.style.position = 'fixed';
            textarea.style.left = '-9999px';
            textarea.style.top = '-9999px';
            document.body.appendChild(textarea);
            textarea.focus();
            textarea.select();
            const ok = document.execCommand('copy');
            document.body.removeChild(textarea);
            if (!ok) throw new Error('execCommand(copy) 실패');
            return { success: true, message: '✅ 클립보드에 복사 완료' };
        } catch (e) {
            return { success: false, error: e?.message || '클립보드 복사 실패' };
        }
    }

    // 선택된 목적지들로 "주 배지(category)"를 결정합니다.
    const resolvePrimaryCategoryFromDestinations = (destinations) => {
        if (!destinations || destinations.length === 0) return 'todo'
        if (destinations.includes('calendar')) return 'calendar'
        if (destinations.includes('email')) return 'email'
        if (destinations.includes('obsidian')) return 'obsidian'
        if (destinations.includes('notion')) return 'notion'
        return 'todo'
    }

    // Export Handler (사후 내보내기) - Phase 5.4 다중 목적지 Dispatch
    const handleDispatchExport = async () => {
        if (!exportModalTodo) return
        if (!user) {
            alert('로그인이 필요합니다.')
            return
        }
        if (!exportSelectedDestinations || exportSelectedDestinations.length === 0) {
            alert('전송할 목적지를 최소 1개 이상 선택해주세요.')
            return
        }

        const todo = exportModalTodo
        const destinations = exportSelectedDestinations

        console.log(`Dispatch "${todo.text}" ->`, destinations, `mode=${exportActionType}`)

        // 1) 외부 시스템 전송 (일괄 시도 및 개별 예외 격리)
        const successDestinations = []
        const failedDestinations = []

        for (const destination of destinations) {
            try {
                let result = null
                if (destination === 'obsidian') {
                    const eventDetails = todo.metadata?.parsedEvent || null
                    if (apiKeys.obsidianMode === 'localRest') {
                        result = await sendToObsidian(todo.text, '', eventDetails)
                    } else {
                        result = await sendToObsidianViaDeepLink(todo.text, '', eventDetails, apiKeys.obsidianVaultName)
                    }
                } else if (destination === 'notion') {
                    result = await sendToNotion({
                        text: todo.text,
                        tags: todo.tags || [],
                        summary: todo.summary || '',
                        notionToken: apiKeys.notion,
                        databaseId: apiKeys.notionDatabaseId,
                        titleProperty: apiKeys.notionTitleProperty,
                        contentProperty: apiKeys.notionContentProperty,
                    })
                } else if (destination === 'calendar') {
                    let currentToken = googleAccessToken
                    if (!currentToken) {
                        console.log('[Calendar Dispatch] 누락된 구글 캘린더 액세스 토큰 팝업 재획득 시도...')
                        try {
                            const authResult = await signInWithPopup(auth, googleProvider)
                            const credential = GoogleAuthProvider.credentialFromResult(authResult)
                            currentToken = credential?.accessToken || ''
                            if (currentToken) {
                                setGoogleAccessToken(currentToken)
                                localStorage.setItem('alia-bot-google-access-token', currentToken)
                                console.log('[Auth] 캘린더 전송을 위한 팝업 토큰 획득 성공')
                            }
                        } catch (authErr) {
                            failedDestinations.push({ 
                                destination, 
                                error: '구글 인증 획득 실패: ' + (authErr.message || '인증 팝업이 차단되었거나 닫혔습니다.') 
                            })
                            continue
                        }
                    }

                    if (!currentToken) {
                        failedDestinations.push({ destination, error: '구글 캘린더 연동을 위해 구글 인증이 필요합니다.' })
                        continue
                    }

                    const eventDetails = todo.metadata?.parsedEvent
                        ? { ...todo.metadata.parsedEvent, description: todo.metadata.parsedEvent.description || todo.text }
                        : {
                            summary: todo.summary || todo.text.slice(0, 50),
                            description: todo.text
                        }
                    result = await insertCalendarEvent(currentToken, eventDetails)
                } else if (destination === 'email') {
                    const emailHtml = todo.summary 
                        ? `<h3>[AliaBot] 요약</h3><p><b>${todo.summary}</b></p><hr/><p>${todo.text.replace(/\n/g, '<br>')}</p>`
                        : `<p>${todo.text.replace(/\n/g, '<br>')}</p>`;
                    
                    result = await sendEmail({
                        to: recipientEmail.trim() || undefined,
                        subject: todo.summary ? `[AliaBot] ${todo.summary}` : `[AliaBot] 메모 전송`,
                        text: todo.text,
                        html: emailHtml
                    })
                } else if (destination === 'clipboard') {
                    result = await copyToClipboard(todo.text)
                } else {
                    failedDestinations.push({ destination, error: `지원하지 않는 목적지입니다: ${destination}` })
                    continue
                }

                if (result?.success) {
                    successDestinations.push(destination)
                } else {
                    let errMsg = result?.error || '알 수 없는 오류'
                    
                    // 구글 캘린더 전송 시 만료 토큰(401) 자동 감지 및 정리 (Re-auth 팝업 유도)
                    if (destination === 'calendar' && (errMsg.includes('401') || errMsg.includes('invalid credentials') || errMsg.includes('authentication') || errMsg.includes('credential'))) {
                        setGoogleAccessToken('')
                        localStorage.removeItem('alia-bot-google-access-token')
                        errMsg = '구글 로그인 인증 세션이 만료되었습니다. 안전하게 만료된 토큰을 비웠으니, 다시 한 번 전송 버튼을 클릭하여 구글 로그인 인증을 갱신해 주세요.'
                    }
                    
                    if (destination === 'obsidian') {
                        errMsg += ' (옵시디언 전송 실패: PC에서 옵시디언이 켜져있고 Local REST API 플러그인이 활성화되어 있는지 확인해 주세요.)'
                    }
                    failedDestinations.push({ destination, error: errMsg })
                }
            } catch (err) {
                failedDestinations.push({ destination, error: err.message || '런타임 오류 발생' })
            }
        }

        // 2) 외부 전송 성공 후 Firestore 처리 (이동 or 복사)
        const totalSuccess = successDestinations.length
        const totalFailed = failedDestinations.length

        if (totalSuccess === 0) {
            const errMsg = failedDestinations.map(f => `- ${f.destination.toUpperCase()}: ${f.error}`).join('\n')
            alert(`❌ 모든 전송 시도에 실패했습니다.\n\n${errMsg}`)
            return
        }

        try {
            const todoRef = doc(db, `users/${user.uid}/todos`, todo.id)

            // 전체 성공이고 이동(move) 선택 시만 데이터 삭제
            if (exportActionType === 'move' && totalFailed === 0) {
                await deleteDoc(todoRef)
            } else {
                // 복사이거나 일부 전송 실패 시 성공한 채널 뱃지 기록
                const currentDestinations = todo.destinations || []
                const newMergedDestinations = Array.from(new Set([...currentDestinations, ...successDestinations]))

                await updateDoc(todoRef, {
                    destinations: newMergedDestinations,
                    category: resolvePrimaryCategoryFromDestinations(newMergedDestinations),
                    exportedAt: serverTimestamp(),
                })
            }
        } catch (error) {
            console.error('Export/Dispatch Firestore 처리 실패:', error)
            alert('전송 처리는 수행되었으나 Firestore 상태 업데이트에 실패했습니다.')
            return
        }

        // 최종 알림 및 모달 닫기
        if (totalFailed > 0) {
            const successList = successDestinations.map(d => d.toUpperCase()).join(', ')
            const errMsg = failedDestinations.map(f => `- ${f.destination.toUpperCase()}: ${f.error}`).join('\n')
            alert(`⚠️ 일부 전송 완료 (성공: ${successList})\n\n❌ 실패 내역:\n${errMsg}\n\n(실패한 목적지가 존재하므로 원본 메모는 삭제되지 않았습니다.)`)
        } else {
            const successList = successDestinations.map(d => d.toUpperCase()).join(', ')
            alert(`✅ 전송 완료: ${successList}`)
        }

        setExportModalTodo(null) // 모달 닫기
    }

    // 테이블 뷰 내에서 날짜와 시간을 짧게 포맷팅하는 헬퍼 함수
    const formatDateForTable = (timestamp) => {
        if (!timestamp) return '-'
        try {
            const date = typeof timestamp.toDate === 'function' ? timestamp.toDate() : new Date(timestamp)
            if (isNaN(date.getTime())) return '-'
            const mm = String(date.getMonth() + 1).padStart(2, '0')
            const dd = String(date.getDate()).padStart(2, '0')
            const hh = String(date.getHours()).padStart(2, '0')
            const min = String(date.getMinutes()).padStart(2, '0')
            return `${mm}/${dd} ${hh}:${min}`
        } catch (e) {
            return '-'
        }
    }

    return (
        <div className={`app-container ${viewMode === 'table' ? 'mode-table' : ''}`}>
            {/* 상단 고정: 로고·로그인·입력 (#63) */}
            <div className="app-fixed-top">
            <div className="app-header">
                <h1>AliaBot <span style={{fontSize: '0.4em', color: '#888'}}>v2.1</span></h1>
                <div className="header-actions">
                    <button
                        className="btn-user-manual"
                        onClick={() => setShowUserManualModal(true)}
                        title="AliaBot 사용 설명서"
                        type="button"
                    >
                        📖 가이드
                    </button>
                    {shouldShowPwaInstallHint() && (
                        <button
                            className="btn-pwa-help"
                            onClick={() => setShowPwaHelpModal(true)}
                            title="홈 화면에 추가 방법"
                            type="button"
                        >
                            📲
                        </button>
                    )}
                    {user && (
                        <>
                            <button 
                                className="btn-settings" 
                                onClick={() => setShowSettingsModal(true)}
                                title="설정 (API 키 연동)"
                            >
                                ⚙️
                            </button>
                            <button 
                                className="btn-admin-db" 
                                onClick={() => window.open('https://console.firebase.google.com/project/react-todo-d3fcc/firestore', '_blank')}
                                title="Firebase 데이터베이스 관리자"
                            >
                                🗄️ DB
                            </button>
                        </>
                    )}
                    {showInstallBtn && (
                        <button className="btn-install" onClick={handleInstallClick}>
                            Install
                        </button>
                    )}
                    {user ? (
                        <button className="btn-google-sync" onClick={handleLogout} style={{backgroundColor: '#e0e0e0', color: '#333'}}>
                            Logout
                        </button>
                    ) : (
                        <button className="btn-google-sync" onClick={handleLogin}>
                            Login
                        </button>
                    )}
                </div>
            </div>

            {/* #62: 모바일 브라우저 — 홈 화면 추가 안내 배너 */}
            {showPwaBanner && (
                <div className="pwa-install-banner">
                    <div className="pwa-install-banner-text">
                        <strong>앱처럼 쓰려면</strong> 홈 화면에 추가하세요.
                        <button
                            type="button"
                            className="pwa-install-banner-link"
                            onClick={() => setShowPwaHelpModal(true)}
                        >
                            방법 보기
                        </button>
                    </div>
                    <button
                        type="button"
                        className="pwa-install-banner-close"
                        onClick={() => {
                            dismissPwaBanner()
                            setShowPwaBanner(false)
                        }}
                        aria-label="배너 닫기"
                    >
                        ✕
                    </button>
                </div>
            )}
            
            <div className="input-group">
                <textarea
                    ref={inputTextareaRef}
                    className="todo-textarea"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleInputKeyDown}
                    placeholder={user ? "할 일, 일정, !메모 입력... (Enter: 추가, Shift+Enter: 줄바꿈)" : "로그인 후 입력 가능합니다"}
                    id="todo-input"
                    rows={3}
                    disabled={!user}
                />
                <div className="input-actions">
                    <button
                        className={`btn-mic ${isListening ? 'listening' : ''}`}
                        onClick={toggleListening}
                        title="음성 입력: 클릭하면 시작, 다시 클릭하면 종료 (긴 문장도 연속 인식)"
                        disabled={!user}
                        type="button"
                    >
                        {isListening ? '🎙️' : '🎤'}
                    </button>
                    <button
                        className="btn-add"
                        onClick={addTodo}
                        id="add-btn"
                        disabled={!user}
                        type="button"
                    >
                        추가
                    </button>
                </div>
            </div>

            {user && (
                <div className="dashboard-control-bar">
                    <div className="view-toggle-buttons">
                        <button 
                            className={`btn-view-toggle ${viewMode === 'list' ? 'active' : ''}`}
                            onClick={() => setViewMode('list')}
                            type="button"
                        >
                            📋 목록
                        </button>
                        <button 
                            className={`btn-view-toggle ${viewMode === 'table' ? 'active' : ''}`}
                            onClick={() => setViewMode('table')}
                            type="button"
                        >
                            📊 표 보기
                        </button>
                    </div>
                    <button 
                        className="btn-csv-export"
                        onClick={() => exportTodosToCSV(todos)}
                        type="button"
                    >
                        📥 Excel 다운로드
                    </button>
                </div>
            )}
            </div>{/* /.app-fixed-top */}

            {/* 메모 목록만 스크롤 (#63) */}
            <div className="todo-scroll-region">
            {viewMode === 'table' ? (
                <div className="spreadsheet-container">
                    <table className="spreadsheet-table">
                        <thead>
                            <tr>
                                <th>순번</th>
                                <th>상태</th>
                                <th>작성시간</th>
                                <th>메모 내용</th>
                                <th>AI 요약</th>
                                <th>태그</th>
                                <th>전송 목적지</th>
                                <th>작업</th>
                            </tr>
                        </thead>
                        <tbody>
                            {todos
                              .filter(todo => activeTag ? (todo.tags && todo.tags.includes(activeTag)) : true)
                              .map((todo, index) => (
                                <tr key={todo.id} className={todo.completed ? 'completed' : ''}>
                                    <td className="col-seq">{todo.seq ?? (todos.length - index)}</td>
                                    <td className="col-status">
                                        <label className="checkbox-container">
                                            <input
                                                type="checkbox"
                                                checked={todo.completed}
                                                onChange={() => toggleTodo(todo)}
                                                disabled={!user}
                                            />
                                            <span className="checkmark"></span>
                                        </label>
                                    </td>
                                    <td className="col-date">{formatDateForTable(todo.createdAt)}</td>
                                    <td className="col-text">
                                        {editingId === todo.id ? (
                                            <div className="edit-inline-table">
                                                <input
                                                    type="text"
                                                    className="edit-input-table"
                                                    value={editingText}
                                                    onChange={e => setEditingText(e.target.value)}
                                                    onKeyDown={e => {
                                                        if (e.key === 'Enter') saveTodo(todo.id);
                                                        if (e.key === 'Escape') setEditingId(null);
                                                    }}
                                                    autoFocus
                                                />
                                                <div className="edit-buttons-table">
                                                    <button className="btn-save-table" onClick={() => saveTodo(todo.id)}>✓</button>
                                                    <button className="btn-cancel-table" onClick={() => setEditingId(null)}>✕</button>
                                                </div>
                                            </div>
                                        ) : (
                                            <span className="todo-text-table" onClick={() => user && toggleTodo(todo)}>
                                                {todo.text}
                                            </span>
                                        )}
                                        {todo.aiProcessed === false && user && (
                                            <span className="ai-processing-table">✨ AI 분석 중...</span>
                                        )}
                                    </td>
                                    <td className="col-summary">{todo.summary || '-'}</td>
                                    <td className="col-tags">
                                        {todo.tags && todo.tags.length > 0 ? (
                                            <div className="todo-tags-table">
                                                {todo.tags.map(tag => (
                                                    <span
                                                        key={tag}
                                                        className={`tag-chip ${activeTag === tag ? 'tag-chip-active' : ''}`}
                                                        onClick={() => setActiveTag(activeTag === tag ? null : tag)}
                                                        title={`'${tag}' 태그로 필터링`}
                                                    >#{tag}</span>
                                                ))}
                                            </div>
                                        ) : '-'}
                                    </td>
                                    <td className="col-destinations">
                                        {todo.destinations && todo.destinations.length > 0 ? (
                                            <div className="todo-badges-table" style={{ display: 'inline-flex', gap: '4px', flexWrap: 'wrap' }}>
                                                {todo.destinations.map(dest => (
                                                    <span key={dest} className={`badge badge-${dest}`} style={{ margin: '0' }}>
                                                        {dest === 'calendar' ? '📅 캘린더' 
                                                         : dest === 'email' ? '✉️ 이메일' 
                                                         : dest === 'obsidian' ? '📝 Obsidian' 
                                                         : dest === 'notion' ? '📝 Notion' 
                                                         : dest === 'clipboard' ? '📋 클립보드' 
                                                         : dest}
                                                    </span>
                                                ))}
                                            </div>
                                        ) : (
                                            todo.category && todo.category !== 'todo' ? (
                                                <span className={`badge badge-${todo.category}`}>
                                                    {todo.category === 'calendar' ? '📅 캘린더' 
                                                     : todo.category === 'email' ? '✉️ 이메일' 
                                                     : todo.category === 'obsidian' ? '📝 Obsidian' 
                                                     : todo.category === 'notion' ? '📝 Notion' 
                                                     : '📝 메모'}
                                                </span>
                                            ) : '-'
                                        )}
                                    </td>
                                    <td className="col-actions">
                                        {user && (
                                            <div className="todo-actions-table">
                                                <button className="btn-edit" onClick={() => { setEditingId(todo.id); setEditingText(todo.text); }} aria-label="Edit">
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                                    </svg>
                                                </button>
                                                <button className="btn-export" onClick={() => setExportModalTodo(todo)} aria-label="Export">
                                                    <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path><polyline points="16 6 12 2 8 6"></polyline><line x1="12" y1="2" x2="12" y2="15"></line></svg>
                                                </button>
                                                <button className="btn-delete" onClick={() => deleteTodo(todo.id)} aria-label="Delete">
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                        <path d="M3 6h18"></path>
                                                        <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                                                        <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                                                    </svg>
                                                </button>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                              ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <ul className="todo-list">
                {!activeTag && (
                    <div className="tag-help-banner">
                        <span>
                            태그(예: <b>#Priva</b>)를 클릭하면 해당 태그만 모아볼 수 있어요. 같은 태그를 다시 누르면 해제됩니다.
                        </span>
                    </div>
                )}
                {/* 태그 필터 활성 시 상단 배너 표시 */}
                {activeTag && (
                    <div className="tag-filter-banner">
                        <span>#{activeTag} 태그 필터 중</span>
                        <button onClick={() => setActiveTag(null)}>✕ 전체 보기</button>
                    </div>
                )}
                {todos
                  .filter(todo => activeTag ? (todo.tags && todo.tags.includes(activeTag)) : true)
                  .map((todo, index) => (
                    <li key={todo.id} className={`todo-item ${todo.completed ? 'completed' : ''}`}>
                        <div className="todo-left">
                            {/* 과거 데이터에 seq가 없을 수 있으므로 UI 표시용 fallback을 둡니다. (역순 공식) */}
                            <span className="todo-number">{todo.seq ?? (todos.length - index)}</span>
                            <label className="checkbox-container">
                                <input
                                    type="checkbox"
                                    checked={todo.completed}
                                    onChange={() => toggleTodo(todo)}
                                    disabled={!user}
                                />
                                <span className="checkmark"></span>
                            </label>
                            
                            <div className="todo-content">
                                {editingId === todo.id ? (
                                    /* 인라인 수정 모드 */
                                    <div className="edit-inline">
                                        <input
                                            type="text"
                                            className="edit-input"
                                            value={editingText}
                                            onChange={e => setEditingText(e.target.value)}
                                            onKeyDown={e => {
                                                if (e.key === 'Enter') saveTodo(todo.id);
                                                if (e.key === 'Escape') setEditingId(null);
                                            }}
                                            autoFocus
                                        />
                                        <div className="edit-buttons">
                                            <button className="btn-save" onClick={() => saveTodo(todo.id)}>✓ 저장</button>
                                            <button className="btn-cancel" onClick={() => setEditingId(null)}>✕ 취소</button>
                                        </div>
                                    </div>
                                ) : (
                                    /* 일반 표시 모드 */
                                    <>
										<div className="todo-main-row">
											{todo.destinations && todo.destinations.length > 0 ? (
												<div className="todo-badges-container" style={{ display: 'inline-flex', gap: '4px', marginRight: '4px', flexWrap: 'wrap' }}>
													{todo.destinations.map((dest) => (
														<span key={dest} className={`badge badge-${dest}`} style={{ margin: '0' }}>
															{dest === 'calendar'
																? '📅 캘린더'
																: dest === 'email'
																	? '✉️ 이메일'
																	: dest === 'obsidian'
																		? '📝 Obsidian'
																		: dest === 'notion'
																			? '📝 Notion'
																			: dest === 'clipboard'
																				? '📋 클립보드'
																				: `📝 ${dest}`}
														</span>
													))}
												</div>
											) : (
												todo.category && todo.category !== 'todo' && (
													<span className={`badge badge-${todo.category}`}>
														{todo.category === 'calendar'
															? '📅 캘린더'
															: todo.category === 'email'
																? '✉️ 이메일'
																: todo.category === 'obsidian'
																	? '📝 Obsidian'
																	: todo.category === 'notion'
																		? '📝 Notion'
																		: '📝 메모'}
													</span>
												)
											)}
											<span className="todo-text" onClick={() => user && toggleTodo(todo)}>
												{todo.text}
											</span>
										</div>
                                        {todo.aiProcessed === false && user && (
                                            <span className="ai-processing">✨ AI 분석 중...</span>
                                        )}
                                        {todo.summary && (
                                            <p className="todo-summary">{todo.summary}</p>
                                        )}
                                        {todo.tags && todo.tags.length > 0 && (
                                            <div className="todo-tags">
                                                {todo.tags.map(tag => (
                                                    <span
                                                        key={tag}
                                                        className={`tag-chip ${activeTag === tag ? 'tag-chip-active' : ''}`}
                                                        onClick={() => setActiveTag(activeTag === tag ? null : tag)}
                                                        title={`'${tag}' 태그로 필터링`}
                                                    >#{tag}</span>
                                                ))}
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                        {user && (
                            <div className="todo-actions">
                                {/* 수정 버튼 */}
                                <button className="btn-edit" onClick={() => { setEditingId(todo.id); setEditingText(todo.text); }} aria-label="Edit">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                    </svg>
                                </button>
                                {/* 내보내기 버튼 */}
                                <button className="btn-export" onClick={() => setExportModalTodo(todo)} aria-label="Export">
                                    <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path><polyline points="16 6 12 2 8 6"></polyline><line x1="12" y1="2" x2="12" y2="15"></line></svg>
                                </button>
                                {/* 삭제 버튼 */}
                                <button className="btn-delete" onClick={() => deleteTodo(todo.id)} aria-label="Delete">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M3 6h18"></path>
                                        <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                                        <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                                    </svg>
                                </button>
                            </div>
                        )}
                    </li>
                ))}
            </ul>
            )}
            </div>{/* /.todo-scroll-region */}

            {/* --- Settings Modal (BYOK) --- */}
            {showSettingsModal && (
                <div className="modal-overlay" onClick={() => setShowSettingsModal(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <h3>⚙️ Conductor 설정</h3>
                        <p className="modal-description">
                            Notion 등 개인 연동 키를 입력하세요. AI 태깅/요약은 호스트 Gemini 키로 자동 제공됩니다.
                            (고급: Gemini 키를 입력하면 본인 BYOK로 우선 사용)
                        </p>
                        
                        <div className="settings-group">
                            <label>OpenAI API Key (Whisper/GPT)</label>
                            <input 
                                type="password" 
                                placeholder="sk-..." 
                                value={apiKeys.openai}
                                onChange={e => setApiKeys({...apiKeys, openai: e.target.value})}
                            />
                        </div>

                        <div className="settings-group">
                            <label>Gemini API Key (선택 — BYOK 오버라이드)</label>
                            <input 
                                type="password" 
                                placeholder="비워두면 호스트 AI 사용" 
                                value={apiKeys.gemini}
                                onChange={e => setApiKeys({...apiKeys, gemini: e.target.value})}
                            />
                        </div>

                        <div className="settings-group">
                            <label>Notion API Token (Connect to Note)</label>
                            <input 
                                type="password" 
                                placeholder="secret_..." 
                                value={apiKeys.notion}
                                onChange={e => setApiKeys({...apiKeys, notion: e.target.value})}
                            />
                        </div>

                        <div className="settings-group">
                            <label>Notion Database ID (대상 DB)</label>
                            <input
                                type="text"
                                placeholder="예: 1234abcd-...."
                                value={apiKeys.notionDatabaseId}
                                onChange={e => setApiKeys({...apiKeys, notionDatabaseId: e.target.value})}
                            />
                        </div>

                        <div className="settings-group">
                            <label>Notion Title Property Name</label>
                            <input
                                type="text"
                                placeholder="기본: Title"
                                value={apiKeys.notionTitleProperty}
                                onChange={e => setApiKeys({...apiKeys, notionTitleProperty: e.target.value})}
                            />
                        </div>

                        <div className="settings-group">
                            <label>Notion Content Property Name</label>
                            <input
                                type="text"
                                placeholder="기본: Content"
                                value={apiKeys.notionContentProperty}
                                onChange={e => setApiKeys({...apiKeys, notionContentProperty: e.target.value})}
                            />
                        </div>

                        <div className="settings-group">
                            <label>Obsidian 연동 모드</label>
                            <div style={{ display: 'flex', gap: '16px', marginTop: '6px' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem', cursor: 'pointer' }}>
                                    <input 
                                        type="radio" 
                                        name="obsidianMode" 
                                        value="deepLink" 
                                        checked={apiKeys.obsidianMode !== 'localRest'} 
                                        onChange={e => setApiKeys({...apiKeys, obsidianMode: 'deepLink'})}
                                    />
                                    <span>딥링크 모드 (기본/추천)</span>
                                </label>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem', cursor: 'pointer' }}>
                                    <input 
                                        type="radio" 
                                        name="obsidianMode" 
                                        value="localRest" 
                                        checked={apiKeys.obsidianMode === 'localRest'} 
                                        onChange={e => setApiKeys({...apiKeys, obsidianMode: 'localRest'})}
                                    />
                                    <span>Local REST API 모드</span>
                                </label>
                            </div>
                        </div>

                        {apiKeys.obsidianMode !== 'localRest' && (
                            <div className="settings-group">
                                <label>Obsidian Vault Name (보관소 이름 — 선택)</label>
                                <input
                                    type="text"
                                    placeholder="비워두면 마지막으로 활성화된 보관소로 저장"
                                    value={apiKeys.obsidianVaultName || ''}
                                    onChange={e => setApiKeys({...apiKeys, obsidianVaultName: e.target.value})}
                                />
                            </div>
                        )}

                        <button className="btn-primary-action" onClick={() => setShowSettingsModal(false)}>
                            저장 및 닫기
                        </button>
                    </div>
                </div>
            )}

            {/* #62: PWA 홈 화면 추가 안내 모달 */}
            {showPwaHelpModal && (
                <div className="modal-overlay" onClick={() => setShowPwaHelpModal(false)}>
                    <div className="modal-content pwa-help-modal" onClick={e => e.stopPropagation()}>
                        <h3>📲 홈 화면에 추가하기</h3>
                        <p className="modal-description">
                            브라우저 주소창 대신 앱 아이콘으로 AliaBot을 열 수 있습니다.
                        </p>
                        <ol className="pwa-help-steps">
                            {getPwaInstallSteps().map((step, index) => (
                                <li key={index}>{step}</li>
                            ))}
                        </ol>
                        <button className="btn-primary-action" onClick={() => setShowPwaHelpModal(false)}>
                            확인
                        </button>
                    </div>
                </div>
            )}

            {/* 사용 설명서 모달 */}
            {showUserManualModal && (
                <div className="modal-overlay" onClick={() => setShowUserManualModal(false)}>
                    <div className="modal-content user-manual-modal" onClick={e => e.stopPropagation()}>
                        <h3>📖 AliaBot 사용 설명서</h3>
                        <p className="modal-description">
                            AliaBot을 처음 접하는 지인분들을 위한 간단한 사용 가이드입니다.
                        </p>
                        
                        <div className="manual-scroll-area">
                            <div className="manual-section">
                                <h4>1. 앱으로 다운받기 (바탕화면 PWA 설치)</h4>
                                <ul>
                                    <li><b>설치 방법:</b> 브라우저(크롬 등) 주소창 우측 끝에 나타나는 <b>'설치' 또는 모니터+화살표(다운로드) 아이콘</b>을 누르면 바탕화면에 바로가기 앱이 설치됩니다.</li>
                                    <li>
                                        <b style={{color: '#ff6b6b'}}>🚨 앱 설치 에러 해결법:</b> 만약 "App에서 열기"만 뜨고 설치가 안 된다면, 기존 구버전 앱이 컴퓨터에 꼬여서 남아있기 때문입니다. 
                                        주소창에 <code style={{background: '#eee', padding: '2px 4px', borderRadius: '4px'}}>chrome://apps</code>를 입력하여 접속하거나, 윈도우 <b>[설정 ➡️ 앱 ➡️ 설치된 앱]</b>으로 들어가서 <b>AliaBot</b>을 검색한 뒤 기존 앱을 완전히 <b>'제거(Uninstall)'</b>하고 사이트에 다시 접속해 주세요.
                                    </li>
                                </ul>
                            </div>

                            <div className="manual-section">
                                <h4>2. 빠른 메모 및 🎙️ 음성 연속 입력</h4>
                                <ul>
                                    <li><b>키보드 입력:</b> 하단 텍스트창에 내용을 치고 <b>Enter</b>를 누르면 즉시 추가됩니다. (Shift+Enter는 줄바꿈)</li>
                                    <li><b>연속 음성 입력:</b> 🎤 버튼을 클릭하면 불이 켜지며 실시간 음성 인식을 시작합니다. 긴 문장도 중간에 끊기지 않고 계속 텍스트로 전환되며, 말을 다 마친 후에 마이크 버튼을 다시 누르면 자동으로 작성이 완료되어 등록됩니다.</li>
                                </ul>
                            </div>

                            <div className="manual-section">
                                <h4>3. ⚡ 카테고리 자동 지정 (! 명령어)</h4>
                                <ul>
                                    <li>텍스트 입력 시 첫 글자에 느낌표(<code style={{background: '#eee', padding: '2px 4px', borderRadius: '4px'}}>!</code>)와 함께 카테고리명을 적으면 전송 목적지가 자동으로 매핑됩니다.
                                        <ul>
                                            <li><code style={{color: '#e28743'}}>!일정</code> 또는 <code style={{color: '#e28743'}}>!캘린더</code> ➡️ 📅 캘린더 전송 카테고리</li>
                                            <li><code style={{color: '#3498db'}}>!노션</code> 또는 <code style={{color: '#3498db'}}>!notion</code> ➡️ Notion 메모 카테고리</li>
                                            <li><code style={{color: '#9b59b6'}}>!옵시디언</code> 또는 <code style={{color: '#9b59b6'}}>!obsidian</code> ➡️ Obsidian 메모 카테고리</li>
                                        </ul>
                                    </li>
                                </ul>
                            </div>

                            <div className="manual-section">
                                <h4>4. ✨ AI 자동 태깅 및 한 줄 요약</h4>
                                <ul>
                                    <li>메모를 등록하면 백그라운드에서 AI(Gemini)가 텍스트 내용을 심층 분석하여 연관된 <b>키워드 태그(#태그)</b>와 <b>한 줄 요약(Summary)</b>을 즉각 생성해 붙여줍니다.</li>
                                    <li>생성된 태그 칩을 클릭하면 해당 카테고리/태그만 필터링하여 모아볼 수 있습니다.</li>
                                </ul>
                            </div>

                            <div className="manual-section">
                                <h4>5. 📤 외부 서비스 전송 (Dispatch)</h4>
                                <ul>
                                    <li>각 메모 카드의 오른쪽 끝에 있는 <b>내보내기(📤)</b> 버튼을 누르면 Obsidian, Notion, Clipboard(클립보드 복사) 중 원하는 목적지를 복수 선택하여 동시에 보낼 수 있습니다.</li>
                                    <li>설정(⚙️) 메뉴에 들어가 본인의 Notion API 키와 데이터베이스 ID를 등록해 두면 개인 노션 페이지와 완벽히 자동 동기화됩니다.</li>
                                </ul>
                            </div>
                        </div>

                        <div className="manual-footer-actions">
                            <button className="btn-secondary-action" onClick={copyUserManualToClipboard}>
                                📋 설명서 텍스트 복사하기
                            </button>
                            <button className="btn-primary-action" onClick={() => setShowUserManualModal(false)}>
                                닫기
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Export Modal */}
            {exportModalTodo && (
                <div className="modal-overlay" onClick={() => setExportModalTodo(null)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <h3>내보내기 (Dispatch)</h3>
                        <p className="modal-target-text">"{exportModalTodo.text}"</p>

                        <div className="modal-options">
                            <div className="modal-section">
                                <h4>🎯 목적지 (복수 선택)</h4>

                                <div className="export-destination-list">
                                    {[
                                        { key: 'obsidian', label: '📝 Obsidian' },
										{ key: 'notion', label: '📝 Notion' },
										{ key: 'calendar', label: '📅 Google Calendar' },
										{ key: 'email', label: '✉️ Email' },
										{ key: 'clipboard', label: '📋 Clipboard' },
									].map((option) => {
                                        const suggested = getSuggestedDestinations(exportModalTodo.tags || [])
                                        const isSuggested = suggested.includes(option.key)
                                        const isChecked = exportSelectedDestinations.includes(option.key)

                                        return (
                                            <label key={option.key} className="export-destination-option">
                                                <input
                                                    type="checkbox"
                                                    checked={isChecked}
                                                    onChange={(e) => {
                                                        const checked = e.target.checked
                                                        setExportSelectedDestinations((prev) => {
                                                            if (checked) {
                                                                return Array.from(new Set([...prev, option.key]))
                                                            }
                                                            return prev.filter((d) => d !== option.key)
                                                        })
                                                    }}
                                                />
                                                <span>{option.label}</span>
                                                {isSuggested && <span className="export-recommended">추천</span>}
                                            </label>
                                        )
                                    })}
                                </div>
                                {exportSelectedDestinations.includes('email') && (
                                    <div className="email-recipient-input-group" style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                        <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '600', textAlign: 'left', display: 'block' }}>
                                            ✉️ 수신자 이메일 주소 (비워두면 본인에게 발송)
                                        </label>
                                        <input
                                            type="email"
                                            className="email-recipient-input"
                                            placeholder={user?.email || "example@domain.com"}
                                            value={recipientEmail}
                                            onChange={(e) => setRecipientEmail(e.target.value)}
                                            style={{
                                                padding: '8px 12px',
                                                border: '2px solid #e5e7eb',
                                                borderRadius: '8px',
                                                fontSize: '0.88rem',
                                                outline: 'none',
                                                width: '100%',
                                                transition: 'border-color 0.2s',
                                                boxSizing: 'border-box'
                                            }}
                                            onFocus={(e) => e.target.style.borderColor = 'var(--primary)'}
                                            onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                                        />
                                    </div>
                                )}
                            </div>

                            <div className="modal-section">
                                <h4>전송 방식</h4>
                                <label className="export-radio-option">
                                    <input
                                        type="radio"
                                        name="export-action"
                                        value="copy"
                                        checked={exportActionType === 'copy'}
                                        onChange={() => setExportActionType('copy')}
                                    />
                                    <span>복사 (여기에 남김)</span>
                                </label>

                                <label className="export-radio-option">
                                    <input
                                        type="radio"
                                        name="export-action"
                                        value="move"
                                        checked={exportActionType === 'move'}
                                        onChange={() => setExportActionType('move')}
                                    />
                                    <span>이동/삭제 (모든 목적지 전송 성공 시)</span>
                                </label>
                            </div>
                        </div>

                        <button className="btn-primary-action" onClick={handleDispatchExport}>
                            선택한 목적지로 전송
                        </button>
                        <button className="btn-close" onClick={() => setExportModalTodo(null)}>취소</button>
                    </div>
                </div>
            )}
        </div>
    )
}

export default App
