/**
 * 사용자 입력을 분석하여 카테고리(Todo, Calendar, Obsidian)를 분류하는 자연어 파서입니다.
 * @param {string} text - 원본 입력 텍스트
 * @returns {object} { cleanedText, category, metadata }
 */
export const parseCommand = (text) => {
    let category = 'todo';
    let cleanedText = text.trim();
    let metadata = {};

    // 1. Obsidian (영구 메모) 명령어 체크
    // '!메모' 또는 '!obsidian'으로 시작하는지 확인
    const obsidianRegex = /^!(메모|obsidian)\s+/i;
    if (obsidianRegex.test(cleanedText)) {
        category = 'obsidian';
        cleanedText = cleanedText.replace(obsidianRegex, '');
    } 
    // 2. Calendar (일정) 키워드 체크
    // 날짜나 시간에 관련된 키워드가 있는지 확인
    else if (/(오늘|내일|모레|이번주|예약|미팅|회의)/.test(cleanedText) || /\d+시/.test(cleanedText) || /\d+:\d+/.test(cleanedText)) {
        category = 'calendar';
        
        // 날짜 힌트 추출 (임시)
        if (cleanedText.includes('내일')) metadata.dateHint = 'tomorrow';
        else if (cleanedText.includes('오늘')) metadata.dateHint = 'today';
    }

    return {
        cleanedText,
        category,
        metadata
    };
};
