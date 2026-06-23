import { httpsCallable } from 'firebase/functions';
import { functions } from '../firebase';

/**
 * Firebase Cloud Functions를 통하여 이메일을 발송합니다. (Phase 5.4)
 * @param {Object} emailDetails
 * @param {string} [emailDetails.to] 수신자 이메일 주소 (비워두면 본인 이메일로 전송)
 * @param {string} [emailDetails.subject] 이메일 제목
 * @param {string} [emailDetails.text] 이메일 본문 (텍스트)
 * @param {string} [emailDetails.html] 이메일 본문 (HTML 포맷)
 * @returns {Promise<{success: boolean, data?: any, error?: string}>}
 */
export async function sendEmail(emailDetails) {
    try {
        const sendEmailFn = httpsCallable(functions, 'sendEmailViaFunctions');
        const response = await sendEmailFn(emailDetails);
        
        if (response.data && response.data.success) {
            return { success: true, data: response.data.data };
        }
        return { success: false, error: '이메일 발송 결과 처리 오류' };
    } catch (error) {
        console.error('[Callable Email API Failed]', error);
        return { 
            success: false, 
            error: error?.message || '이메일 발송 중 서버 오류가 발생하였습니다.' 
        };
    }
}
