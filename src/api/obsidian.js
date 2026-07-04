import { extractDateFromText } from '../utils/dateParser';

const OBSIDIAN_PORT = 27123; // Non-encrypted HTTP 포트
const OBSIDIAN_URL = `http://127.0.0.1:${OBSIDIAN_PORT}`;
const API_KEY = "bf62ace3c70a4c515f16399bba09350ebeefaad6b9055a12c310df3143af4710";

// 파일명 및 vault 경로 생성 헬퍼 함수
export const generateObsidianFilePath = (text, fileName = '', eventDetails = null) => {
    // 파일명이 없으면 목표 날짜 또는 오늘 날짜와 시간 기반으로 생성
    if (!fileName) {
        let dateObj = new Date();
        
        // 1. AI 파싱 정보가 있는 경우 해당 시작 날짜 사용
        if (eventDetails && (eventDetails.startDateTime || eventDetails.startDate || eventDetails.start)) {
            const isoStr = eventDetails.startDateTime || eventDetails.startDate || eventDetails.start;
            try {
                const parsedDate = new Date(isoStr);
                if (!isNaN(parsedDate.getTime())) {
                    dateObj = parsedDate;
                }
            } catch (e) {
                console.warn('[Obsidian] startDateTime 파싱 실패:', e);
            }
        } else {
            // 2. AI 파싱 정보가 없는 경우 텍스트에서 날짜 직접 정적 파싱 시도 (스마트 폴백)
            const extractedDate = extractDateFromText(text);
            if (extractedDate) {
                dateObj = extractedDate;
            }
        }

        const yyyy = dateObj.getFullYear();
        const mm = (dateObj.getMonth() + 1).toString().padStart(2, '0');
        const dd = dateObj.getDate().toString().padStart(2, '0');
        
        // 고유성을 유지하기 위해 전송 시점의 시분초를 덧붙임
        const now = new Date();
        const hh = now.getHours().toString().padStart(2, '0');
        const min = now.getMinutes().toString().padStart(2, '0');
        const ss = now.getSeconds().toString().padStart(2, '0');
        
        fileName = `Inbox/Siders_${yyyy}${mm}${dd}_${hh}${min}${ss}.md`;
    } else {
        // 기존 확장자 중복 제거 방지용 폴백
        if (!fileName.endsWith('.md')) {
            fileName = `Inbox/${fileName}.md`;
        } else {
            fileName = `Inbox/${fileName}`;
        }
    }
    return fileName;
};

// 1. [기본 모드] Obsidian URI (딥링크) 기반 파일 생성 전송
export const sendToObsidianViaDeepLink = async (text, fileName = '', eventDetails = null, vaultName = '') => {
    try {
        const targetPath = generateObsidianFilePath(text, fileName, eventDetails);
        
        // obsidian://new?vault=보관소명&file=경로&content=내용
        let deepLinkUrl = `obsidian://new?file=${encodeURIComponent(targetPath)}&content=${encodeURIComponent(text)}`;
        if (vaultName && vaultName.trim()) {
            deepLinkUrl += `&vault=${encodeURIComponent(vaultName.trim())}`;
        }

        // OS의 Protocol Handler를 호출하여 네이티브 옵시디언 앱 가동
        window.location.href = deepLinkUrl;

        return { success: true, message: `옵시디언 딥링크 실행 완료 (파일: ${targetPath})` };
    } catch (error) {
        console.error("Obsidian Deep Link Error:", error);
        return { success: false, error: error.message };
    }
};

// 2. [고급 모드] 기존 Local REST API 기반 데이터 Direct 전송
export const sendToObsidian = async (text, fileName = '', eventDetails = null) => {
    const targetPath = generateObsidianFilePath(text, fileName, eventDetails);

    try {
        const response = await fetch(`${OBSIDIAN_URL}/vault/${targetPath}`, {
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

        return { success: true, message: `옵시디언에 생성 완료: ${targetPath}` };
    } catch (error) {
        console.error("Obsidian REST API Error:", error);
        return { success: false, error: error.message };
    }
};

