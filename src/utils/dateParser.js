/**
 * 텍스트 기반 자연어 날짜/시간 정적 추출 유틸리티
 */

/**
 * 텍스트에서 날짜 및 시간 정보를 추출하여 Date 객체로 반환합니다. (추출 실패 시 null 반환)
 * 예: "6월 26일 오전 10시", "June 28 14:00", "6/26" 등
 * @param {string} text 
 * @returns {Date|null}
 */
export function extractDateFromText(text) {
    if (!text) return null;
    
    const now = new Date();
    let year = now.getFullYear();
    let month = now.getMonth(); // 0-indexed
    let date = now.getDate();
    let hour = 12; // 기본 시간 낮 12시
    let minute = 0;
    let foundDate = false;
    let foundTime = false;

    // 1. 한국어 날짜 패턴: "X월 Y일"
    const koDateRegex = /(\d{1,2})\s*월\s*(\d{1,2})\s*일/;
    const koMatch = text.match(koDateRegex);
    if (koMatch) {
        month = parseInt(koMatch[1], 10) - 1;
        date = parseInt(koMatch[2], 10);
        foundDate = true;
    } 
    // 2. 슬래시/하이픈 패턴: "M/D" 또는 "M-D"
    else {
        const slashRegex = /(?<!\d)(\d{1,2})[\/\-](\d{1,2})(?!\d)/;
        const slashMatch = text.match(slashRegex);
        if (slashMatch) {
            month = parseInt(slashMatch[1], 10) - 1;
            date = parseInt(slashMatch[2], 10);
            foundDate = true;
        }
        // 3. 영어 날짜 패턴: "June 28", "Jun 28" 등
        else {
            const monthsEng = {
                jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5, jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
                january: 0, february: 1, march: 2, april: 3, june: 5, july: 6, august: 7, september: 8, october: 9, november: 10, december: 11
            };
            const engDateRegex = /(january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|jun|jul|aug|sep|oct|nov|dec)\s*(\d{1,2})/i;
            const engMatch = text.match(engDateRegex);
            if (engMatch) {
                const monthName = engMatch[1].toLowerCase();
                if (monthsEng[monthName] !== undefined) {
                    month = monthsEng[monthName];
                    date = parseInt(engMatch[2], 10);
                    foundDate = true;
                }
            }
        }
    }

    // 4. 시간 패턴 추출: "오후 2시 30분", "오전 9시", "14:30", "14시" 등
    // (1) "HH:MM" 형식 우선 매칭
    const colonTimeRegex = /(?<!\d)(\d{1,2})\s*:\s*(\d{2})(?!\d)/;
    const colonMatch = text.match(colonTimeRegex);
    if (colonMatch) {
        hour = parseInt(colonMatch[1], 10);
        minute = parseInt(colonMatch[2], 10);
        foundTime = true;
    }
    // (2) "오전/오후 X시 Y분" 형식 매칭
    else {
        const koTimeRegex = /(오전|오후)?\s*(\d{1,2})\s*시\s*(?:(\d{1,2})\s*분)?/;
        const koTimeMatch = text.match(koTimeRegex);
        if (koTimeMatch) {
            hour = parseInt(koTimeMatch[2], 10);
            minute = koTimeMatch[3] ? parseInt(koTimeMatch[3], 10) : 0;
            const ampm = koTimeMatch[1];
            if (ampm === '오후' && hour < 12) hour += 12;
            if (ampm === '오전' && hour === 12) hour = 0;
            foundTime = true;
        }
    }

    if (foundDate) {
        const testDate = new Date(year, month, date, hour, minute, 0);
        if (!isNaN(testDate.getTime())) {
            return testDate;
        }
    }
    return null;
}

/**
 * 로컬 Date 객체를 한국 표준시(+09:00) 기준 ISO 8601 포맷으로 변환합니다.
 * @param {Date} date 
 * @returns {string} YYYY-MM-DDTHH:mm:ss+09:00
 */
export function getSeoulISOStringFromDate(date) {
    const tzOffset = 9 * 60; // KST is UTC+9
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
