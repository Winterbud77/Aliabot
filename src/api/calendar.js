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

    const { summary, location = '', description = '', startDateTime, endDateTime } = eventDetails;

    if (!summary || summary.trim() === '') {
        return { success: false, error: '일정 제목(summary)은 필수 항목입니다.' };
    }

    // 기본 시간대 설정 (서울)
    const timeZone = 'Asia/Seoul';

    // 시작/종료 시간이 누락된 경우 기본값 처리 (현재 시간 기준)
    let startIso = startDateTime;
    let endIso = endDateTime;

    if (!startIso) {
        const now = new Date();
        // 타임존 오프셋 반영한 ISO 포맷 생성 (+09:00)
        startIso = getSeoulISOString(now);
    }
    if (!endIso) {
        const now = new Date();
        const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000); // 1시간 뒤
        endIso = getSeoulISOString(oneHourLater);
    }

    const requestBody = {
        summary: summary.trim(),
        location: location.trim(),
        description: description.trim(),
        start: {
            dateTime: startIso,
            timeZone: timeZone,
        },
        end: {
            dateTime: endIso,
            timeZone: timeZone,
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

/**
 * 로컬 Date 객체를 한국 표준시(+09:00) 기준 ISO 8601 포맷으로 변환합니다.
 * @param {Date} date 
 * @returns {string} YYYY-MM-DDTHH:mm:ss+09:00
 */
function getSeoulISOString(date) {
    const tzOffset = 9 * 60; // Korea is UTC+9 (minutes)
    const localTime = date.getTime();
    const localOffset = date.getTimezoneOffset(); // in minutes
    // 한국 시간 기준으로 보정된 일시
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
