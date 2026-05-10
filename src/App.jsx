import { useState, useEffect } from 'react'
import { auth, db, googleProvider } from './firebase'
import { signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth'
import { collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, query, orderBy, serverTimestamp } from 'firebase/firestore'
import { parseCommand } from './utils/parser'
import { sendToObsidian } from './api/obsidian'

function App() {
    const [user, setUser] = useState(null)
    const [todos, setTodos] = useState([])
    const [inputValue, setInputValue] = useState('')
    const [deferredPrompt, setDeferredPrompt] = useState(null)
    const [showInstallBtn, setShowInstallBtn] = useState(false)
    const [isListening, setIsListening] = useState(false)
    const recognitionRef = React.useRef(null)
    
    // 모달 상태 관리
    const [exportModalTodo, setExportModalTodo] = useState(null)

    // 1. Authentication Listener & Data Migration
    useEffect(() => {
        const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
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
                    orderBy('createdAt', 'asc')
                )
                
                const unsubscribeTodos = onSnapshot(q, (snapshot) => {
                    const todosData = snapshot.docs.map(doc => ({
                        id: doc.id,
                        ...doc.data()
                    }))
                    setTodos(todosData)
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
            await signInWithPopup(auth, googleProvider)
        } catch (error) {
            console.error("Login failed:", error)
            alert("로그인에 실패했습니다. (팝업 차단을 확인해주세요)")
        }
    }

    const handleLogout = async () => {
        try {
            await signOut(auth)
        } catch (error) {
            console.error("Logout failed:", error)
        }
    }

    // Todo Actions
    const addTodo = async () => {
        if (inputValue.trim() === '') return
        
        if (!user) {
            alert("할 일을 클라우드에 저장하려면 먼저 로그인을 해주세요!")
            return
        }

        try {
            // 입력값을 파서(Parser)를 통해 분석
            const { cleanedText, category, metadata } = parseCommand(inputValue);

            await addDoc(collection(db, `users/${user.uid}/todos`), {
                text: cleanedText,
                category: category,
                metadata: metadata || {},
                completed: false,
                createdAt: serverTimestamp()
            })
            setInputValue('')
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

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            addTodo()
        }
    }

    // Web Speech API (STT)
    const toggleListening = () => {
        if (isListening) {
            // 이미 듣고 있다면 중지
            if (recognitionRef.current) {
                recognitionRef.current.stop();
            }
            return;
        }

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            alert('이 브라우저는 음성 인식을 지원하지 않습니다. 크롬 브라우저를 사용해주세요.');
            return;
        }
        
        const recognition = new SpeechRecognition();
        recognition.lang = 'ko-KR';
        // continuous를 true로 설정하여 말이 잠깐 끊겨도 계속 듣게 만듭니다.
        recognition.continuous = true; 
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;

        recognition.onstart = () => {
            setIsListening(true);
        };

        recognition.onresult = (event) => {
            // continuous 모드에서는 여러 결과가 배열로 들어올 수 있으므로 마지막 결과를 가져옵니다.
            const current = event.resultIndex;
            const transcript = event.results[current][0].transcript;
            
            // 기존 입력된 텍스트 뒤에 이어서 붙입니다.
            setInputValue((prev) => (prev ? prev + ' ' + transcript : transcript));
        };

        recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            setIsListening(false);
        };

        recognition.onend = () => {
            setIsListening(false);
        };

        recognitionRef.current = recognition;
        recognition.start();
    }

    // Export Handler (사후 내보내기)
    const handleExport = async (target, actionType) => {
        if (!exportModalTodo) return;
        
        const todo = exportModalTodo;
        console.log(`Exporting "${todo.text}" to ${target} via ${actionType}`);
        
        // 1. 외부 시스템으로 데이터 실제 전송
        if (target === 'obsidian') {
            try {
                // 옵시디언 로컬 REST API 호출
                const result = await sendToObsidian(todo.text);
                if (result.success) {
                    alert(`✅ ${result.message}`);
                } else {
                    alert(`❌ 옵시디언 전송 실패: ${result.error}\n(현재 PC의 옵시디언이 켜져있고 Local REST API 플러그인이 활성화되어 있는지 확인해주세요)`);
                    return; // 전송 실패 시 삭제나 상태 변경을 하지 않고 중단
                }
            } catch (e) {
                console.error(e);
                alert("옵시디언 연결 중 예기치 않은 오류가 발생했습니다.");
                return;
            }
        } else if (target === 'calendar') {
            alert(`[개발 중] Google Calendar 연동 로직 대기 중...`);
            // return; // 당장 캘린더 연동이 없으므로 주석 처리하거나 막아둘 수 있음
        }

        // 2. 전송 성공 후 Firestore 데이터 처리 (이동 or 복사)
        try {
            const todoRef = doc(db, `users/${user.uid}/todos`, todo.id);
            if (actionType === 'move') {
                // 이동(Move)의 경우: 리스트에서 삭제
                await deleteDoc(todoRef);
            } else {
                // 복사(Copy)의 경우: 전송 완료 뱃지를 위해 상태 업데이트
                await updateDoc(todoRef, {
                    category: target === 'calendar' ? 'calendar' : 'obsidian'
                });
            }
        } catch (error) {
            console.error("Export error:", error);
        }

        setExportModalTodo(null); // 전송 완료 후 모달 닫기
    }

    return (
        <div className="app-container">
            <div className="app-header">
                <h1>AliaBot <span style={{fontSize: '0.4em', color: '#888'}}>v2.1</span></h1>
                <div className="header-actions">
                    {user && (
                        <button 
                            className="btn-admin-db" 
                            onClick={() => window.open('https://console.firebase.google.com/project/react-todo-d3fcc/firestore', '_blank')}
                            title="Firebase 데이터베이스 관리자"
                        >
                            🗄️ DB
                        </button>
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
            
            <div className="input-group">
                <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder={user ? "할 일, 일정, !메모 입력..." : "로그인 후 입력 가능합니다"}
                    id="todo-input"
                    disabled={!user}
                />
                <button 
                    className={`btn-mic ${isListening ? 'listening' : ''}`} 
                    onClick={toggleListening} 
                    title="음성 입력 (한 번 누르면 시작, 다시 누르면 종료)"
                    disabled={!user}
                >
                    {isListening ? '🎙️' : '🎤'}
                </button>
                <button className="btn-add" onClick={addTodo} id="add-btn" disabled={!user}>
                    추가
                </button>
            </div>

            <ul className="todo-list">
                {todos.map((todo, index) => (
                    <li key={todo.id} className={`todo-item ${todo.completed ? 'completed' : ''}`}>
                        <div className="todo-left">
                            <span className="todo-number">{index + 1}</span>
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
                                {/* 카테고리 뱃지 */}
                                {todo.category && todo.category !== 'todo' && (
                                    <span className={`badge badge-${todo.category}`}>
                                        {todo.category === 'calendar' ? '📅 캘린더' : '📝 메모'}
                                    </span>
                                )}
                                <span className="todo-text" onClick={() => user && toggleTodo(todo)}>
                                    {todo.text}
                                </span>
                            </div>
                        </div>
                        {user && (
                            <div className="todo-actions">
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

            {/* Export Modal */}
            {exportModalTodo && (
                <div className="modal-overlay" onClick={() => setExportModalTodo(null)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <h3>내보내기 (Dispatch)</h3>
                        <p className="modal-target-text">"{exportModalTodo.text}"</p>
                        
                        <div className="modal-options">
                            <div className="modal-section">
                                <h4>📅 Google Calendar</h4>
                                <button onClick={() => handleExport('calendar', 'copy')}>복사 (여기에 남김)</button>
                                <button onClick={() => handleExport('calendar', 'move')} className="btn-danger">이동 (여기서 삭제)</button>
                            </div>
                            <div className="modal-section">
                                <h4>📝 Obsidian</h4>
                                <button onClick={() => handleExport('obsidian', 'copy')}>복사 (여기에 남김)</button>
                                <button onClick={() => handleExport('obsidian', 'move')} className="btn-danger">이동 (여기서 삭제)</button>
                            </div>
                        </div>
                        <button className="btn-close" onClick={() => setExportModalTodo(null)}>취소</button>
                    </div>
                </div>
            )}
        </div>
    )
}

export default App
