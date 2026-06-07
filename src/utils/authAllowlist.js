/**
 * 지인 테스트 allowlist (클라이언트 UX + 1차 방어)
 * - 서버 차단: Firebase Blocking Function gateFriendSignIn
 * - VITE_ALLOWED_EMAILS 와 Functions ALLOWED_EMAILS 는 동일 목록을 유지하세요.
 */

/** @returns {string[]} */
export function getAllowedEmailsFromEnv() {
  const raw = import.meta.env.VITE_ALLOWED_EMAILS || '';
  return raw
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

/**
 * @param {string | null | undefined} email
 * @returns {boolean}
 */
export function isEmailAllowed(email) {
  const allowedList = getAllowedEmailsFromEnv();
  // 목록 미설정 = 로컬 개발 편의 (프로덕션/Vercel에서는 반드시 설정)
  if (allowedList.length === 0) {
    return true;
  }
  const normalized = (email || '').trim().toLowerCase();
  return Boolean(normalized && allowedList.includes(normalized));
}

/**
 * 로그인 거부 시 사용자에게 보여줄 안내 문구
 */
export function getAllowlistDeniedMessage(email) {
  const shownEmail = email || '(이메일 없음)';
  return (
    `초대된 Google 계정만 AliaBot 테스트에 참여할 수 있습니다.\n\n` +
    `현재 계정: ${shownEmail}\n\n` +
    `호스트에게 Google 로그인 이메일을 등록 요청해 주세요.`
  );
}
