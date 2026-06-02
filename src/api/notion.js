/**
 * Notion API 연동 유틸리티
 * - BYOK 방식: 사용자 입력 API 토큰을 프론트에서 사용합니다.
 * - CORS 이슈가 발생하면(환경에 따라) 별도 프록시/서버 연동이 필요할 수 있습니다.
 */

const NOTION_API_VERSION = '2022-06-28'

function safeFirstLine(text) {
  const normalized = String(text || '').trim()
  if (!normalized) return 'AliaBot 메모'
  const firstLine = normalized.split(/\r?\n/).filter(Boolean)[0]
  const maxLen = 200
  return firstLine.length > maxLen ? firstLine.slice(0, maxLen) + '…' : firstLine
}

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

  const title = safeFirstLine(summary || text)
  const content = [
    summary ? `요약: ${summary}` : null,
    tags && tags.length ? `태그: ${tags.map((t) => `#${t}`).join(' ')}` : null,
    String(text || '').trim(),
  ]
    .filter(Boolean)
    .join('\n\n')

  const endpoint = 'https://api.notion.com/v1/pages'

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${notionToken}`,
        'Notion-Version': NOTION_API_VERSION,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        parent: { database_id: databaseId },
        properties: {
          // Title property는 Notion에서 "title" type 이어야 합니다.
          [titleProperty]: {
            title: [{ text: { content: title } }],
          },
          // Content property는 Notion에서 "rich_text" type 이어야 합니다.
          [contentProperty]: {
            rich_text: [
              {
                text: {
                  // rich_text 길이 제한이 있을 수 있으니 너무 길면 잘라둡니다.
                  content: content.length > 20000 ? content.slice(0, 20000) + '…' : content,
                },
              },
            ],
          },
        },
      }),
    })

    if (!response.ok) {
      const errorText = await response.text().catch(() => '')
      return {
        success: false,
        error: `Notion 전송 실패: ${response.status} ${response.statusText}${errorText ? ` - ${errorText}` : ''}`,
      }
    }

    return { success: true, message: '✅ Notion에 페이지 생성 완료' }
  } catch (err) {
    return { success: false, error: err?.message || 'Notion 전송 중 알 수 없는 오류' }
  }
}

