/**
 * Gemini API 호출 공통 로직 (Cloud Functions 전용)
 */
const GEMINI_API_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

function buildAnalysisPrompt(text, currentDateTime) {
  return `다음 메모를 분석하여 JSON만 반환하세요. 코드블록이나 부연 설명 없이 순수 JSON 텍스트만 출력하세요.
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
 * @param {string} apiKey - 서버에만 보관된 Gemini API 키
 * @param {string} text - 분석할 메모
 * @returns {Promise<{tags: string[], summary: string, parsedEvent: any}>}
 */
async function analyzeTextWithGemini(apiKey, text) {
  const trimmed = (text || '').trim();
  if (!trimmed) {
    throw new Error('분석할 메모 텍스트가 비어 있습니다.');
  }
  if (!apiKey) {
    throw new Error('서버 Gemini API 키가 설정되지 않았습니다.');
  }

  const seoulTime = getSeoulNowISOString();
  const requestUrl = `${GEMINI_API_URL}?key=${apiKey}`;
  const response = await fetch(requestUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: buildAnalysisPrompt(trimmed, seoulTime) }] }],
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
    parsedEvent: result.parsedEvent || null,
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
