/**
 * PWA 설치/홈 화면 추가 안내 유틸리티
 */

/** 이미 홈 화면(PWA)으로 실행 중인지 */
export function isStandalonePwa() {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true
  );
}

/** 모바일 브라우저로 접속 중인지 (대략적) */
export function isMobileBrowser() {
  if (typeof navigator === 'undefined') return false;
  return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}

export function isIosSafari() {
  const ua = navigator.userAgent || '';
  const isIos = /iPhone|iPad|iPod/i.test(ua);
  const isSafari = /Safari/i.test(ua) && !/CriOS|FxiOS|EdgiOS/i.test(ua);
  return isIos && isSafari;
}

export function isAndroidChrome() {
  const ua = navigator.userAgent || '';
  return /Android/i.test(ua) && /Chrome/i.test(ua);
}

/** OS별 홈 화면 추가 단계 */
export function getPwaInstallSteps() {
  if (isIosSafari()) {
    return [
      'Safari 하단 공유(□↑) 버튼을 누릅니다.',
      '「홈 화면에 추가」를 선택합니다.',
      '우측 상단 「추가」를 누르면 앱 아이콘이 생깁니다.',
      '이미 옛 버전 아이콘이 있다면 삭제 후 위 과정을 다시 해 주세요.',
    ];
  }

  if (isAndroidChrome()) {
    return [
      'Chrome 우측 상단 ⋮ 메뉴를 엽니다.',
      '「홈 화면에 추가」 또는 「앱 설치」를 선택합니다.',
      '이름 확인 후 추가/설치를 누릅니다.',
      '이미 옛 버전 아이콘이 있다면 삭제 후 다시 설치해 주세요.',
    ];
  }

  return [
    '브라우저 메뉴에서 「홈 화면에 추가」 또는 Install app을 찾아 실행하세요.',
    'iPhone은 Safari, Android는 Chrome 사용을 권장합니다.',
    '앱 업데이트 후에는 기존 아이콘을 삭제하고 재설치하는 것이 좋습니다.',
  ];
}

export function shouldShowPwaInstallHint() {
  if (isStandalonePwa()) return false;
  return isMobileBrowser();
}

const PWA_BANNER_DISMISS_KEY = 'alia-bot-pwa-banner-dismissed-v1';

export function isPwaBannerDismissed() {
  return localStorage.getItem(PWA_BANNER_DISMISS_KEY) === '1';
}

export function dismissPwaBanner() {
  localStorage.setItem(PWA_BANNER_DISMISS_KEY, '1');
}
