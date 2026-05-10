/**
 * Obsidian Local REST API 통신 유틸리티
 * 
 * [주의사항] 
 * 1. Obsidian에서 'Local REST API' 커뮤니티 플러그인이 설치 및 활성화되어 있어야 합니다.
 * 2. 기본 포트는 27123 또는 27124 입니다. (플러그인 설정에서 확인 가능)
 * 3. API Key(Authorization 토큰)가 필요할 수 있습니다.
 */

const OBSIDIAN_PORT = 27123; // Non-encrypted HTTP 포트
const OBSIDIAN_URL = `http://127.0.0.1:${OBSIDIAN_PORT}`;
const API_KEY = "bf62ace3c70a4c515f16399bba09350ebeefaad6b9055a12c310df3143af4710";

export const sendToObsidian = async (text, fileName = '') => {
    // 파일명이 없으면 오늘 날짜와 시간 기반으로 생성
    if (!fileName) {
        const now = new Date();
        fileName = `Inbox/Siders_${now.getFullYear()}${(now.getMonth()+1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}_${now.getHours()}${now.getMinutes()}${now.getSeconds()}.md`;
    } else {
        fileName = `Inbox/${fileName}.md`;
    }

    try {
        const response = await fetch(`${OBSIDIAN_URL}/vault/${fileName}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'text/markdown',
                'Authorization': `Bearer ${API_KEY}` 
            },
            body: text
        });

        if (!response.ok) {
            throw new Error(`Obsidian API Error: ${response.statusText}`);
        }

        return { success: true, message: `옵시디언에 생성 완료: ${fileName}` };
    } catch (error) {
        console.error("Obsidian Error:", error);
        return { success: false, error: error.message };
    }
};
