/**
 * Notion API 연동 유틸리티
 * - BYOK 방식: 사용자 입력 API 토큰을 Firebase Cloud Functions로 넘겨 처리합니다.
 * - CORS 이슈를 해결하기 위해 Firebase 백엔드 Proxy 함수를 사용합니다.
 */

import { functions } from '../firebase'
import { httpsCallable } from 'firebase/functions'

/**
 * @param {object} args
 * @param {string} args.text - 원본 메모 텍스트
 * @param {string[]} args.tags - Gemini tags
 * @param {string} args.summary - Gemini 요약
 * @param {string} args.notionToken - Notion API 토큰
 * @param {string} args.databaseId - 대상 Database ID
 * @param {string} [args.titleProperty='Title'] - Title property name
 * @param {string} [args.contentProperty='Content'] - Content property name
 * @returns {Promise<{success: boolean, message?: string, error?: string}>}
 */
export async function sendToNotion({
  text,
  tags,
  summary,
  notionToken,
  databaseId,
  titleProperty = 'Title',
  contentProperty = 'Content',
}) {
  if (!notionToken) {
    return { success: false, error: 'Notion API Token이 설정되지 않았습니다.' }
  }
  if (!databaseId) {
    return { success: false, error: 'Notion Database ID가 설정되지 않았습니다.' }
  }

  try {
    const sendToNotionFn = httpsCallable(functions, 'sendToNotionViaFunctions')
    const response = await sendToNotionFn({
      text,
      tags,
      summary,
      notionToken,
      databaseId,
      titleProperty,
      contentProperty,
    })

    const result = response.data
    if (result && result.success) {
      return { success: true, message: '✅ Notion에 페이지 생성 완료' }
    } else {
      return { success: false, error: result?.error || 'Notion 전송 실패' }
    }
  } catch (err) {
    console.error('[Notion Client Error]', err)
    return { success: false, error: err?.message || 'Notion 전송 중 알 수 없는 오류' }
  }
}


