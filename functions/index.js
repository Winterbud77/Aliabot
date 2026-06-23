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


