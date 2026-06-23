/**
 * 태그 기반 목적지(라우팅) 추천 규칙
 * - Gemini가 생성하는 tags 값은 대소문자가 섞일 수 있으므로 소문자 기준으로 비교합니다.
 * - 현재 UI에서 지원하는 목적지는: notion, obsidian, clipboard (+ calendar은 이후 단계)
 */

/**
 * @param {string[] | undefined | null} tags
 * @returns {string[]} 추천 목적지 키 배열 (중복 없음)
 */
export function getSuggestedDestinations(tags) {
  const normalizedTags = (tags || [])
    .filter(Boolean)
    .map((t) => String(t).trim().toLowerCase())

  const hasTag = (needle) => normalizedTags.includes(needle.toLowerCase())

  const destinations = new Set()

  // Notion 전송 추천
  if (hasTag('notion') || hasTag('meeting-notion')) {
    destinations.add('notion')
  }

  // Obsidian 전송 추천
  if (
    hasTag('priva') ||
    hasTag('sop') ||
    hasTag('thermal insulation') ||
    hasTag('priva-rpa')
  ) {
    destinations.add('obsidian')
  }

  // Calendar 전송 추천 (Phase 5.4)
  if (
    hasTag('meeting') ||
    hasTag('calendar') ||
    hasTag('일정') ||
    hasTag('schedule')
  ) {
    destinations.add('calendar')
  }

  // 이메일 전송 추천 (Phase 5.4)
  if (
    hasTag('email') ||
    hasTag('mail') ||
    hasTag('이메일') ||
    hasTag('전송')
  ) {
    destinations.add('email')
  }

  // 추천 규칙으로 아무 것도 나오지 않으면 Clipboard로라도 복사 제공
  if (destinations.size === 0) {
    destinations.add('clipboard')
  }

  return Array.from(destinations)
}

