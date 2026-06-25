import { extractDateFromText, getSeoulISOStringFromDate } from '../utils/dateParser';

/**
 * Google Calendar API 연동 모듈 (Phase 5.4)
 */

/**
 * 구글 캘린더 API를 호출하여 새로운 일정을 등록합니다.
 * @param {string} accessToken 구글 OAuth 2.0 액세스 토큰
 * @param {Object} eventDetails 일정 세부 정보
 * @param {string} eventDetails.summary 일정 제목
 * @param {string} [eventDetails.location] 일정 장소
 * @param {string} [eventDetails.description] 일정 설명
 * @param {string} [eventDetails.startDateTime] 시작 일시 (ISO 8601 형식: YYYY-MM-DDTHH:mm:ss+09:00)
 * @param {string} [eventDetails.endDateTime] 종료 일시 (ISO 8601 형식: YYYY-MM-DDTHH:mm:ss+09:00)
 * @returns {Promise<{success: boolean, data?: any, error?: string}>}
 */
export async function insertCalendarEvent(accessToken, eventDetails) {
    if (!accessToken) {
        return { success: false, error: '구글 로그인 액세스 토큰이 없습니다. 다시 로그인해 주세요.' };
    }

    const summary = eventDetails.summary;
    const location = eventDetails.location || '';
    const description = eventDetails.description || '';

    // AI의 JSON 응답 키 불일치 오차 대비 유연한 날짜 매핑 (startDateTime, startDate, start 등)
    let startIso = eventDetails.startDateTime || eventDetails.startDate || eventDetails.start;
    let endIso = eventDetails.endDateTime || eventDetails.endDate || eventDetails.end;

    // AI 파싱 실패 시, 원본 메모 텍스트(description)로부터 스마트 정적 날짜 파싱 시도
    if (!startIso && description) {
        const extractedDate = extractDateFromText(description);
        if (extractedDate) {
            startIso = getSeoulISOStringFromDate(extractedDate);
            const oneHourLater = new Date(extractedDate.getTime() + 60 * 60 * 1000);
            endIso = getSeoulISOStringFromDate(oneHourLater);
            console.log('[Calendar Fallback] 스마트 폴백으로 날짜 추출 성공:', startIso);
        }
    }

    if (!summary || summary.trim() === '') {
        return { success: false, error: '일정 제목(summary)은 필수 항목입니다.' };
    }

    if (!startIso) {
        const now = new Date();
        startIso = getSeoulISOStringFromDate(now);
    }
    if (!endIso) {
        try {
            const startDateObj = new Date(startIso);
            const oneHourLater = new Date(startDateObj.getTime() + 60 * 60 * 1000);
            endIso = getSeoulISOStringFromDate(oneHourLater);
        } catch (e) {
            const now = new Date();
            const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);
            endIso = getSeoulISOStringFromDate(oneHourLater);
        }
    }

    const requestBody = {
        summary: summary.trim(),
        location: location.trim(),
        description: description.trim(),
        start: {
            dateTime: startIso,
            timeZone: 'Asia/Seoul',
        },
        end: {
            dateTime: endIso,
            timeZone: 'Asia/Seoul',
        },
    };

    try {
        const response = await fetch(
            'https://www.googleapis.com/calendar/v3/calendars/primary/events',
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody),
            }
        );

        const data = await response.json();

        if (!response.ok) {
            console.error('[Google Calendar API Error]', data);
            throw new Error(data?.error?.message || '구글 캘린더 일정 등록 API 응답 오류');
        }

        return { success: true, data: data };
    } catch (error) {
        console.error('[Google Calendar Integration Failed]', error);
        return { success: false, error: error.message || '알 수 없는 네트워크 오류' };
    }
}
