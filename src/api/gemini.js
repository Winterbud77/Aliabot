// Gemini API 연동 모듈 (Phase 5.2)
// BYOK(Bring Your Own Key) 방식: 사용자 설정에서 입력한 API 키를 직접 사용합니다.

const GEMINI_API_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

/**
 * Gemini API를 사용하여 메모 텍스트를 분석하고 태그와 요약을 반환합니다.
 * @param {string} text - 분석할 메모 텍스트
 * @param {string} apiKey - 사용자의 Gemini API 키
 * @returns {Promise<{tags: string[], summary: string} | null>}
 */
export async function analyzeWithGemini(text, apiKey) {
  if (!apiKey || !text?.trim()) return null;

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

  const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 150,
      },
    }),
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(
      `Gemini API 오류 (${response.status}): ${errData.error?.message || '알 수 없는 오류'}`
    );
  }

  const data = await response.json();
  const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!rawText) throw new Error('Gemini 응답이 비어있습니다.');

  // 마크다운 코드블록(```json ... ```)이 포함된 경우 제거
  const jsonText = rawText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  return JSON.parse(jsonText);
}
