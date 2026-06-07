/**
 * Gemini API 호출 공통 로직 (Cloud Functions 전용)
 */
const GEMINI_API_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

function buildAnalysisPrompt(text) {
  return `다음 메모를 분석하여 JSON만 반환하세요. 코드블록이나 부연 설명 없이 순수 JSON 텍스트만 출력하세요.

메모: "${text}"

반환 형식:
{
  "tags": ["키워드1", "키워드2"],
  "summary": "한 줄 요약"
}

규칙:
- tags: 최대 3개, 핵심 주제 키워드 (한국어 또는 영어)
- summary: 메모의 핵심을 20자 이내로 요약`;
}

function extractJsonFromGeminiText(rawText) {
  const firstBrace = rawText.indexOf('{');
  const lastBrace = rawText.lastIndexOf('}');
  if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
    throw new Error('Gemini 응답에서 JSON을 추출할 수 없습니다.');
  }
  return rawText.substring(firstBrace, lastBrace + 1);
}

/**
 * @param {string} apiKey - 서버에만 보관된 Gemini API 키
 * @param {string} text - 분석할 메모
 * @returns {Promise<{tags: string[], summary: string}>}
 */
async function analyzeTextWithGemini(apiKey, text) {
  const trimmed = (text || '').trim();
  if (!trimmed) {
    throw new Error('분석할 메모 텍스트가 비어 있습니다.');
  }
  if (!apiKey) {
    throw new Error('서버 Gemini API 키가 설정되지 않았습니다.');
  }

  const requestUrl = `${GEMINI_API_URL}?key=${apiKey}`;
  const response = await fetch(requestUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: buildAnalysisPrompt(trimmed) }] }],
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
      `Gemini API가 JSON이 아닌 응답을 반환했습니다 (status: ${response.status}). ${rawBody.substring(0, 120)}`
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
    throw new Error('Gemini 응답이 비어 있습니다.');
  }

  const jsonText = extractJsonFromGeminiText(rawText);
  const result = JSON.parse(jsonText);
  return {
    tags: Array.isArray(result.tags) ? result.tags : [],
    summary: typeof result.summary === 'string' ? result.summary : '',
  };
}

/**
 * @param {string} raw - ALLOWED_EMAILS 환경값 (쉼표 구분)
 */
function parseAllowedEmails(raw) {
  return (raw || '')
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

module.exports = {
  analyzeTextWithGemini,
  parseAllowedEmails,
};
