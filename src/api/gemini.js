// Gemini API 연동 모듈 (Phase 5.2)
// BYOK(Bring Your Own Key) 방식: 사용자 설정에서 입력한 API 키를 직접 사용합니다.

// 모델명: gemini-2.5-flash (가장 범용적, 무료 티어 지원, 빠른 응답)
const GEMINI_API_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

/**
 * Gemini API를 사용하여 메모 텍스트를 분석하고 태그와 요약을 반환합니다.
 * @param {string} text - 분석할 메모 텍스트
 * @param {string} apiKey - 사용자의 Gemini API 키
 * @returns {Promise<{tags: string[], summary: string} | null>}
 */
export async function analyzeWithGemini(text, apiKey) {
  if (!apiKey || !text?.trim()) return null;

  // 디버그: 키 형식 확인 (처음 8자만 노출)
  console.log('[Gemini] 분석 시작, API 키 시작:', apiKey.substring(0, 8) + '...');

  const prompt = `다음 메모를 분석하여 JSON만 반환하세요. 코드블록이나 부연 설명 없이 순수 JSON 텍스트만 출력하세요.

메모: "${text}"

반환 형식:
{
  "tags": ["키워드1", "키워드2"],
  "summary": "한 줄 요약"
}

규칙:
- tags: 최대 3개, 핵심 주제 키워드 (한국어 또는 영어)
- summary: 메모의 핵심을 20자 이내로 요약`;

  const requestUrl = `${GEMINI_API_URL}?key=${apiKey}`;
  console.log('[Gemini] 요청 URL:', GEMINI_API_URL);

  const response = await fetch(requestUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 1024,
      },
    }),
  });

  console.log('[Gemini] 응답 상태:', response.status, response.statusText);
  console.log('[Gemini] Content-Type:', response.headers.get('content-type'));

  // 응답이 JSON이 아닌 경우 (HTML 에러 페이지 등) 방어
  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    const rawBody = await response.text();
    console.error('[Gemini] JSON이 아닌 응답 수신:', rawBody.substring(0, 300));
    throw new Error(
      `Gemini API가 JSON이 아닌 응답을 반환했습니다 (status: ${response.status}, type: ${contentType}). API 키를 확인해주세요.`
    );
  }

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    console.error('[Gemini] API 에러 응답:', JSON.stringify(errData, null, 2));
    throw new Error(
      `Gemini API 오류 (${response.status}): ${errData.error?.message || '알 수 없는 오류'}`
    );
  }

  const data = await response.json();
  const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!rawText) {
    console.error('[Gemini] 응답 전체:', JSON.stringify(data, null, 2));
    throw new Error('Gemini 응답이 비어있습니다.');
  }

  console.log('[Gemini] AI 원문 응답:', rawText);

  // Gemini 응답에서 순수 JSON만 추출 (마크다운 래핑, 공백, 줄바꿈 모두 무시)
  // 방법: { 로 시작하고 } 로 끝나는 부분만 정확히 추출
  const firstBrace = rawText.indexOf('{');
  const lastBrace = rawText.lastIndexOf('}');
  if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
    console.error('[Gemini] JSON 구조를 찾을 수 없음:', rawText);
    throw new Error('Gemini 응답에서 JSON을 추출할 수 없습니다.');
  }
  const jsonText = rawText.substring(firstBrace, lastBrace + 1);
  console.log('[Gemini] 추출된 JSON:', jsonText);
  const result = JSON.parse(jsonText);
  console.log('[Gemini] ✅ 파싱 성공:', result);
  return result;
}
