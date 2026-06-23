// Gemini API 연동 (Phase 5.2 + Option A)
// - 기본: Firebase Callable Function → 호스트 Gemini 키 (지인 테스트)
// - 선택: Settings BYOK 키가 있으면 브라우저에서 직접 호출 (개발/호스트 오버라이드)

import { httpsCallable } from 'firebase/functions';
import { functions } from '../firebase';

const GEMINI_API_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

const ANALYSIS_PROMPT = (text, currentDateTime) => `다음 메모를 분석하여 JSON만 반환하세요. 코드블록이나 부연 설명 없이 순수 JSON 텍스트만 출력하세요.
현재 한국 기준 시각(Reference Time): "${currentDateTime}"

메모: "${text}"

반환 형식:
{
  "tags": ["키워드1", "키워드2"],
  "summary": "한 줄 요약",
  "parsedEvent": {
    "summary": "일정 제목",
    "location": "장소",
    "description": "일정 상세 설명",
    "startDateTime": "YYYY-MM-DDTHH:mm:ss+09:00",
    "endDateTime": "YYYY-MM-DDTHH:mm:ss+09:00"
  }
}

규칙:
- tags: 최대 3개, 핵심 주제 키워드 (한국어 또는 영어). 만약 구글 캘린더나 일정 등록에 적합하다면 "calendar" 또는 "일정" 태그를 포함하고, 메일 발송이 의도된 것이라면 "email" 또는 "이메일" 태그를 포함하세요.
- summary: 메모의 핵심을 20자 이내로 요약.
- parsedEvent: 메모가 모임, 회의, 약속, 마감 등 특정 일시를 포함하는 구체적 일정인 경우에만 이 필드를 포함하고, 그렇지 않다면 parsedEvent 필드를 null로 설정하세요.
  * startDateTime, endDateTime은 현재 한국 시각("${currentDateTime}")을 기준으로 상대적인 표현("내일 오후 3시", "오늘 7시")을 절대적인 ISO 8601 포맷(YYYY-MM-DDTHH:mm:ss+09:00)으로 정확히 환산하여 입력하세요.
  * endDateTime이 명시되지 않은 경우, 기본적으로 startDateTime으로부터 1시간 뒤로 설정하세요.
  * 일정 정보가 없는 경우 parsedEvent: null 로 반환하세요.`;

function parseGeminiJson(rawText) {
  const firstBrace = rawText.indexOf('{');
  const lastBrace = rawText.lastIndexOf('}');
  if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
    throw new Error('Gemini 응답에서 JSON을 추출할 수 없습니다.');
  }
  const jsonText = rawText.substring(firstBrace, lastBrace + 1);
  return JSON.parse(jsonText);
}

function getSeoulNowISOString() {
  const date = new Date();
  const tzOffset = 9 * 60;
  const localTime = date.getTime();
  const localOffset = date.getTimezoneOffset();
  const korDate = new Date(localTime + (tzOffset + localOffset) * 60 * 1000);
  const pad = (n) => String(n).padStart(2, '0');
  
  const yyyy = korDate.getFullYear();
  const mm = pad(korDate.getMonth() + 1);
  const dd = pad(korDate.getDate());
  const hh = pad(korDate.getHours());
  const min = pad(korDate.getMinutes());
  const ss = pad(korDate.getSeconds());

  return `${yyyy}-${mm}-${dd}T${hh}:${min}:${ss}+09:00`;
}

/**
 * BYOK: 브라우저에서 직접 Gemini 호출 (Settings에 키가 있을 때만)
 */
async function analyzeWithGeminiDirect(text, apiKey) {
  console.log('[Gemini] BYOK 직접 호출, 키 시작:', apiKey.substring(0, 8) + '...');

  const seoulTime = getSeoulNowISOString();
  const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: ANALYSIS_PROMPT(text, seoulTime) }] }],
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 1024,
      },
    }),
  });

  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    const rawBody = await response.text();
    throw new Error(
      `Gemini API가 JSON이 아닌 응답을 반환했습니다 (status: ${response.status}). API 키를 확인해주세요.`
    );
  }

  const data = await response.json();
  if (!response.ok) {
    throw new Error(
      `Gemini API 오류 (${response.status}): ${data.error?.message || '알 수 없는 오류'}`
    );
  }

  const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!rawText) {
    throw new Error('Gemini 응답이 비어있습니다.');
  }

  return parseGeminiJson(rawText);
}

/**
 * Option A: Firebase Function → 서버에 저장된 호스트 Gemini 키 사용
 */
async function analyzeWithGeminiCloud(text) {
  console.log('[Gemini] Cloud Function 호출 (호스트 API)');
  const callable = httpsCallable(functions, 'analyzeMemoWithGemini');
  const { data } = await callable({ text });
  return data;
}

/**
 * 메모 AI 분석 — apiKey 있으면 BYOK, 없으면 Cloud Function(호스트 키)
 * @param {string} text
 * @param {string | null | undefined} apiKey - Settings BYOK (선택)
 */
export async function analyzeWithGemini(text, apiKey) {
  if (!text?.trim()) return null;

  if (apiKey?.trim()) {
    return analyzeWithGeminiDirect(text.trim(), apiKey.trim());
  }

  return analyzeWithGeminiCloud(text.trim());
}
