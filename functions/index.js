/**
 * AliaBot Cloud Functions — Option A (지인 테스트)
 * - analyzeMemoWithGemini: 호스트 Gemini 키로 AI 분석 (Callable)
 * - gateFriendSignIn: allowlist 이메일만 Google 로그인 허용 (Blocking Function)
 */
const admin = require('firebase-admin');
const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { beforeUserSignedIn } = require('firebase-functions/v2/identity');
const { defineSecret, defineString } = require('firebase-functions/params');
const { analyzeTextWithGemini, parseAllowedEmails } = require('./geminiCore');

admin.initializeApp();

// 서버에만 저장 — firebase functions:secrets:set GEMINI_API_KEY
const geminiApiKey = defineSecret('GEMINI_API_KEY');
const emailApiKey = defineSecret('EMAIL_API_KEY');

// firebase deploy 시 --set ALLOWED_EMAILS="you@gmail.com,friend@gmail.com" 또는 functions/.env
const allowedEmailsParam = defineString('ALLOWED_EMAILS', {
  description: 'Comma-separated invited Google account emails',
  default: '',
});

// 서울 리전 (한국 사용자 지연 최소화)
const FUNCTION_REGION = 'asia-northeast3';

function getAllowedEmailSet() {
  return new Set(parseAllowedEmails(allowedEmailsParam.value()));
}

/**
 * allowlist 검사 — 목록이 비어 있으면 경고만 하고 통과 (로컬 개발용)
 */
function assertEmailAllowed(email) {
  const allowedSet = getAllowedEmailSet();
  if (allowedSet.size === 0) {
    console.warn('[Auth] ALLOWED_EMAILS 미설정 — 모든 로그인 허용 (테스트 배포 전 반드시 설정하세요)');
    return;
  }

  const normalized = (email || '').trim().toLowerCase();
  if (!normalized || !allowedSet.has(normalized)) {
    throw new HttpsError(
      'permission-denied',
      '이 AliaBot 테스트는 초대된 Google 계정만 사용할 수 있습니다.'
    );
  }
}

/** 로그인한 지인/호스트 — 호스트 API 키로 Gemini 분석 */
exports.analyzeMemoWithGemini = onCall(
  {
    region: FUNCTION_REGION,
    secrets: [geminiApiKey],
  },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', '로그인이 필요합니다.');
    }

    assertEmailAllowed(request.auth.token.email);

    const text = request.data?.text;
    if (!text || typeof text !== 'string' || !text.trim()) {
      throw new HttpsError('invalid-argument', '분석할 메모 텍스트가 필요합니다.');
    }

    try {
      return await analyzeTextWithGemini(geminiApiKey.value(), text);
    } catch (error) {
      console.error('[analyzeMemoWithGemini]', error);
      throw new HttpsError('internal', error.message || 'Gemini 분석에 실패했습니다.');
    }
  }
);

/**
 * 지인/호스트 메모를 지정된 이메일 또는 본인 이메일로 전송 (Blaze 요금제 필수)
 */
exports.sendEmailViaFunctions = onCall(
  {
    region: FUNCTION_REGION,
    secrets: [emailApiKey],
  },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', '로그인이 필요합니다.');
    }

    assertEmailAllowed(request.auth.token.email);

    const { to, subject, text, html } = request.data || {};
    const targetEmail = to || request.auth.token.email;
    if (!targetEmail) {
      throw new HttpsError('invalid-argument', '수신인 이메일 주소가 필요합니다.');
    }

    const emailKey = emailApiKey.value();
    if (!emailKey || !emailKey.trim()) {
      throw new HttpsError('failed-precondition', '이메일 API 키가 Firebase에 설정되지 않았습니다. firebase functions:secrets:set EMAIL_API_KEY 명령으로 설정해 주세요.');
    }

    const emailSubject = subject || `[AliaBot] 메모 전송`;
    const emailBody = text || '';
    const emailHtml = html || `<p>${emailBody.replace(/\n/g, '<br>')}</p>`;

    try {
      let response;
      if (emailKey.startsWith('re_')) {
        // Resend API
        response = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${emailKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'AliaBot <onboarding@resend.dev>',
            to: [targetEmail],
            subject: emailSubject,
            html: emailHtml,
          }),
        });
      } else {
        // SendGrid API
        response = await fetch('https://api.sendgrid.com/v3/mail/send', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${emailKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            personalizations: [{ to: [{ email: targetEmail }] }],
            from: { email: 'onboarding@resend.dev', name: 'AliaBot' },
            subject: emailSubject,
            content: [{ type: 'text/html', value: emailHtml }],
          }),
        });
      }

      const resText = await response.text();
      let resJson = {};
      try {
        resJson = JSON.parse(resText);
      } catch (e) {}

      if (!response.ok) {
        console.error('[Email API Error Output]', resText);
        throw new Error(resJson?.message || `이메일 API 전송 실패 (Status: ${response.status})`);
      }

      return { success: true, data: resJson };
    } catch (error) {
      console.error('[sendEmailViaFunctions Error]', error);
      throw new HttpsError('internal', error.message || '이메일 발송 처리 중 실패했습니다.');
    }
  }
);

/**
 * Firebase Console > Authentication > Settings > Blocking functions 에서
 * gateFriendSignIn 함수를 등록해야 서버 차단이 활성화됩니다.
 * (주의: GCIP 업그레이드가 완료된 경우에만 주석을 해제하여 사용하세요)
 */
// exports.gateFriendSignIn = beforeUserSignedIn({ region: FUNCTION_REGION }, (event) => {
//   assertEmailAllowed(event.data.email);
// });

// Force redeployment to clear instance caching of GEMINI_API_KEY and EMAIL_API_KEY
// Redeployed on: 2026-07-04T15:42:00Z (Added sendToNotionViaFunctions for CORS bypass)

/**
 * 지인/호스트 메모를 지정된 노션 데이터베이스에 적재 (CORS 우회용 프록시)
 */
exports.sendToNotionViaFunctions = onCall(
  {
    region: FUNCTION_REGION,
  },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', '로그인이 필요합니다.');
    }

    assertEmailAllowed(request.auth.token.email);

    const {
      text,
      tags,
      summary,
      notionToken,
      databaseId,
      titleProperty = 'Title',
      contentProperty = 'Content',
    } = request.data || {};

    if (!notionToken || !notionToken.trim()) {
      throw new HttpsError('invalid-argument', 'Notion API Token이 설정되지 않았습니다.');
    }
    if (!databaseId || !databaseId.trim()) {
      throw new HttpsError('invalid-argument', 'Notion Database ID가 설정되지 않았습니다.');
    }

    const title = text ? text.split(/\r?\n/).filter(Boolean)[0] || 'AliaBot 메모' : 'AliaBot 메모';
    const cleanTitle = title.length > 200 ? title.slice(0, 200) + '…' : title;

    const content = [
      summary ? `요약: ${summary}` : null,
      tags && tags.length ? `태그: ${tags.map((t) => `#${t}`).join(' ')}` : null,
      String(text || '').trim(),
    ]
      .filter(Boolean)
      .join('\n\n');

    try {
      const response = await fetch('https://api.notion.com/v1/pages', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${notionToken}`,
          'Notion-Version': '2022-06-28',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          parent: { database_id: databaseId },
          properties: {
            [titleProperty]: {
              title: [{ text: { content: cleanTitle } }],
            },
            [contentProperty]: {
              rich_text: [
                {
                  text: {
                    content: content.length > 20000 ? content.slice(0, 20000) + '…' : content,
                  },
                },
              ],
            },
          },
        }),
      });

      const resText = await response.text();
      let resJson = {};
      try {
        resJson = JSON.parse(resText);
      } catch (e) {}

      if (!response.ok) {
        console.error('[Notion API Error Output]', resText);
        throw new Error(resJson?.message || `노션 API 전송 실패 (Status: ${response.status})`);
      }

      return { success: true, data: resJson };
    } catch (error) {
      console.error('[sendToNotionViaFunctions Error]', error);
      throw new HttpsError('internal', error.message || '노션 API 전송 중 오류가 발생했습니다.');
    }
  }
);

/**
 * 지인/호스트 프로젝트 대화 중계 (서버리스 호스트 키 사용)
 */
exports.chatWithGeminiCloud = onCall(
  {
    region: FUNCTION_REGION,
    secrets: [geminiApiKey],
  },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', '로그인이 필요합니다.');
    }

    assertEmailAllowed(request.auth.token.email);

    const { message, context, history } = request.data || {};
    if (!message || typeof message !== 'string' || !message.trim()) {
      throw new HttpsError('invalid-argument', '메시지가 필요합니다.');
    }

    const apiKey = geminiApiKey.value();
    if (!apiKey || !apiKey.trim()) {
      throw new HttpsError('failed-precondition', 'Gemini API 키가 서버에 설정되지 않았습니다.');
    }

    const systemInstruction = `당신은 사용자의 깃허브 프로젝트 지식을 완벽히 이해하는 프로젝트 비서입니다.
제공된 프로젝트 컨텍스트(CLAUDE.md 및 README.md 등)를 기반으로 사용자의 질문에 정확하고 상세히 답변하세요.
답변은 유려하고 친절한 한글로 작성해 주세요. 핵심 전문 용어(Terminology)는 영어 원문을 쓰되, 생소하거나 어려운 용어는 괄호 안에 한글 뜻을 병기하세요.
답변은 마크다운(Markdown) 포맷으로 가독성 있게 정리해 주세요.

[프로젝트 컨텍스트]
${context || '제공된 컨텍스트가 없습니다.'}
`;

    // 대화 히스토리 구성 (Gemini API 2.5-flash 규격에 최적화)
    const contents = [];
    if (history && history.length > 0) {
      history.forEach(msg => {
        contents.push({
          role: msg.sender === 'user' ? 'user' : 'model',
          parts: [{ text: msg.text }]
        });
      });
    }
    contents.push({
      role: 'user',
      parts: [{ text: message }]
    });

    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents,
          systemInstruction: {
            parts: [{ text: systemInstruction }]
          },
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 2048,
          },
        }),
      });

      const contentType = response.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        const rawBody = await response.text();
        throw new Error(`Gemini API가 JSON이 아닌 응답을 반환했습니다 (status: ${response.status}).`);
      }

      const data = await response.json();
      if (!response.ok) {
        throw new Error(`Gemini API 오류 (${response.status}): ${data.error?.message || '알 수 없는 오류'}`);
      }

      const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!rawText) {
        throw new Error('Gemini 응답이 비어있습니다.');
      }

      return { text: rawText };
    } catch (error) {
      console.error('[chatWithGeminiCloud Error]', error);
      throw new HttpsError('internal', error.message || '프로젝트 챗 처리 중 실패했습니다.');
    }
  }
);
