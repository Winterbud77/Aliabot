import React, { useState, useEffect, useRef } from 'react'
import { auth, db, googleProvider } from './firebase'
import { signInWithPopup, signInWithRedirect, getRedirectResult, signOut, onAuthStateChanged } from 'firebase/auth'
import { collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, query, orderBy, serverTimestamp } from 'firebase/firestore'
import { parseCommand } from './utils/parser'
import { sendToObsidian } from './api/obsidian'
import { sendToNotion } from './api/notion'
import { analyzeWithGemini } from './api/gemini'
import { getSuggestedDestinations } from './utils/routingRules'
import { isEmailAllowed, getAllowlistDeniedMessage } from './utils/authAllowlist'
import {
    shouldShowPwaInstallHint,
    isPwaBannerDismissed,
    dismissPwaBanner,
    getPwaInstallSteps,
} from './utils/pwaInstall'
import { buildChronologicalSeqUpdates } from './utils/seqBackfill'

function App() {
    const [user, setUser] = useState(null)
    const [todos, setTodos] = useState([])
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
    
    // 모달 상태 관리
    const [exportModalTodo, setExportModalTodo] = useState(null)
    const [exportSelectedDestinations, setExportSelectedDestinations] = useState([])
    const [exportActionType, setExportActionType] = useState('copy') // 'copy' | 'move'
    const [showSettingsModal, setShowSettingsModal] = useState(false)
    const [showPwaHelpModal, setShowPwaHelpModal] = useState(false)
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
            ...parsed,
        }
    })

    useEffect(() => {
        localStorage.setItem('alia-bot-api-keys', JSON.stringify(apiKeys))
    }, [apiKeys])

    // Redirect 로그인 결과 처리 (팝업이 막히는 환경 대응)
    useEffect(() => {
        ;(async () => {
            try {
                await getRedirectResult(auth)
                // 결과는 onAuthStateChanged에서 잡히므로 여기서는 별도 처리하지 않습니다.
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
                        if (docsNeedSeq.length > 0 && snapshot.docs.length > 0) {
                            console.log(`[seq] seq 필드가 없는 구형 문서 ${docsNeedSeq.length}개 발견. 순번 복원 작업을 시작합니다...`)
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

    // Auth Actions
    const handleLogin = async () => {
        try {
            // 일부 환경(내장 브라우저/팝업 정책)에서 팝업이 막히면 redirect로 폴백합니다.
            await signInWithPopup(auth, googleProvider)
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
                alert("로그인에 실패했습니다. (팝업 차단/브라우저 정책을 확인해주세요)")
            }
        }
    }

    const handleLogout = async () => {
        try {
            await signOut(auth)
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

            // 2. AI 분석 — BYOK 키 없어도 Cloud Function(호스트 Gemini) 사용
            analyzeWithGemini(cleanedText, apiKeys.gemini || null)
                .then(async (result) => {
                    if (result) {
                        await updateDoc(doc(db, `users/${user.uid}/todos`, docRef.id), {
                            tags: result.tags || [],
                            summary: result.summary || '',
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
        if (destinations.includes('obsidian')) return 'obsidian'
        if (destinations.includes('notion')) return 'notion'
        return 'todo'
    }

    // Export Handler (사후 내보내기) - Phase 5.3 다중 목적지 Dispatch
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

        // 1) 외부 시스템 전송 (순서대로 처리: 실패 시 즉시 중단)
        for (const destination of destinations) {
            if (destination === 'obsidian') {
                const result = await sendToObsidian(todo.text)
                if (!result?.success) {
                    alert(
                        `❌ 옵시디언 전송 실패: ${result?.error || '알 수 없는 오류'}\n` +
                        '(현재 PC의 옵시디언이 켜져있고 Local REST API 플러그인이 활성화되어 있는지 확인해주세요)'
                    )
                    return
                }
            } else if (destination === 'notion') {
                const result = await sendToNotion({
                    text: todo.text,
                    tags: todo.tags || [],
                    summary: todo.summary || '',
                    notionToken: apiKeys.notion,
                    databaseId: apiKeys.notionDatabaseId,
                    titleProperty: apiKeys.notionTitleProperty,
                    contentProperty: apiKeys.notionContentProperty,
                })
                if (!result?.success) {
                    alert(`❌ Notion 전송 실패: ${result?.error || '알 수 없는 오류'}`)
                    return
                }
            } else if (destination === 'clipboard') {
                const result = await copyToClipboard(todo.text)
                if (!result?.success) {
                    alert(`❌ 클립보드 복사 실패: ${result?.error || '알 수 없는 오류'}`)
                    return
                }
            } else {
                // 현재 UI에서는 지원하지 않는 destination인 경우 방어 처리
                alert(`지원하지 않는 목적지입니다: ${destination}`)
                return
            }
        }

        // 2) 외부 전송 성공 후 Firestore 처리 (이동 or 복사)
        try {
            const todoRef = doc(db, `users/${user.uid}/todos`, todo.id)

            if (exportActionType === 'move') {
                // 이동(Move): 전송 성공 후 리스트에서 삭제
                await deleteDoc(todoRef)
            } else {
                // 복사(Copy): destinations/category/exportedAt 기록
                await updateDoc(todoRef, {
                    destinations: destinations,
                    category: resolvePrimaryCategoryFromDestinations(destinations),
                    exportedAt: serverTimestamp(),
                })
            }
        } catch (error) {
            console.error('Export/Dispatch Firestore 처리 실패:', error)
            alert('전송은 성공했지만 Firestore 상태 업데이트에 실패했습니다.')
            // move인 경우 삭제가 이미 되었을 수 있으므로 여기서는 추가 복구를 하지 않습니다.
            return
        }

        setExportModalTodo(null) // 전송 완료 후 모달 닫기
    }

    return (
        <div className="app-container">
            {/* 상단 고정: 로고·로그인·입력 (#63) */}
            <div className="app-fixed-top">
            <div className="app-header">
                <h1>AliaBot <span style={{fontSize: '0.4em', color: '#888'}}>v2.1</span></h1>
                <div className="header-actions">
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
            </div>{/* /.app-fixed-top */}

            {/* 메모 목록만 스크롤 (#63) */}
            <div className="todo-scroll-region">
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
                            {/* 과거 데이터에 seq가 없을 수 있으므로 UI 표시용 fallback을 둡니다. */}
                            <span className="todo-number">{todo.seq ?? (index + 1)}</span>
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
                                            {todo.category && todo.category !== 'todo' && (
                                                <span className={`badge badge-${todo.category}`}>
                                                    {todo.category === 'calendar'
                                                        ? '📅 캘린더'
                                                        : todo.category === 'obsidian'
                                                            ? '📝 Obsidian'
                                                            : todo.category === 'notion'
                                                                ? '📝 Notion'
                                                                : '📝 메모'}
                                                </span>
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
