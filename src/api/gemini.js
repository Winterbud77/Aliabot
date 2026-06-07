// Gemini API 연동 (Phase 5.2 + Option A)
// - 기본: Firebase Callable Function → 호스트 Gemini 키 (지인 테스트)
// - 선택: Settings BYOK 키가 있으면 브라우저에서 직접 호출 (개발/호스트 오버라이드)

import { httpsCallable } from 'firebase/functions';
import { functions } from '../firebase';

const GEMINI_API_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

const ANALYSIS_PROMPT = (text) => `다음 메모를 분석하여 JSON만 반환하세요. 코드블록이나 부연 설명 없이 순수 JSON 텍스트만 출력하세요.

메모: "${text}"

반환 형식:
{
  "tags": ["키워드1", "키워드2"],
  "summary": "한 줄 요약"
}

규칙:
- tags: 최대 3개, 핵심 주제 키워드 (한국어 또는 영어)
- summary: 메모의 핵심을 20자 이내로 요약`;

function parseGeminiJson(rawText) {
  const firstBrace = rawText.indexOf('{');
  const lastBrace = rawText.lastIndexOf('}');
  if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
    throw new Error('Gemini 응답에서 JSON을 추출할 수 없습니다.');
  }
  const jsonText = rawText.substring(firstBrace, lastBrace + 1);
  return JSON.parse(jsonText);
}

/**
 * BYOK: 브라우저에서 직접 Gemini 호출 (Settings에 키가 있을 때만)
 */
async function analyzeWithGeminiDirect(text, apiKey) {
  console.log('[Gemini] BYOK 직접 호출, 키 시작:', apiKey.substring(0, 8) + '...');

  const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: ANALYSIS_PROMPT(text) }] }],
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
