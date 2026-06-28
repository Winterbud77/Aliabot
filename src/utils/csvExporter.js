/**
 * AliaBot Firestore 데이터를 Excel 호환 CSV 파일로 내보내기 위한 유틸리티 모듈입니다.
 * UTF-8 BOM을 삽입하여 Microsoft Excel 등에서 한글 깨짐을 원천 차단합니다.
 */

/**
 * 날짜 포맷 변경 헬퍼 함수
 * @param {string|number|object} timestamp - 포맷팅할 타임스탬프
 * @returns {string} YYYY-MM-DD HH:mm:ss 포맷의 문자열
 */
const formatDateTime = (timestamp) => {
  if (!timestamp) return '';
  try {
    // Firestore Timestamp 객체 처리 (.toDate() 존재 시)
    const date = typeof timestamp.toDate === 'function' 
      ? timestamp.toDate() 
      : new Date(timestamp);
    
    if (isNaN(date.getTime())) return '';

    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    const hh = String(date.getHours()).padStart(2, '0');
    const min = String(date.getMinutes()).padStart(2, '0');
    const ss = String(date.getSeconds()).padStart(2, '0');

    return `${yyyy}-${mm}-${dd} ${hh}:${min}:${ss}`;
  } catch (error) {
    console.error('Error formatting date in CSV export:', error);
    return '';
  }
};

/**
 * CSV 필드 이스케이프 처리 함수
 * 필드 내부의 큰따옴표(")는 두 개("")로 치환하고, 쉼표(,)나 줄바꿈(\n)이 포함된 경우 전체를 큰따옴표로 감쌉니다.
 * @param {string} val - 정제할 원본 값
 * @returns {string} CSV 표준에 맞게 가공된 필드 값
 */
const escapeCSVField = (val) => {
  if (val === null || val === undefined) return '""';
  let str = String(val);
  
  // 큰따옴표 이스케이프
  str = str.replace(/"/g, '""');
  
  // 쉼표, 줄바꿈, 혹은 큰따옴표가 포함된 경우 전체를 큰따옴표로 감쌈
  if (str.includes(',') || str.includes('\n') || str.includes('\r') || str.includes('"')) {
    return `"${str}"`;
  }
  
  // 기본적으로 안전하게 큰따옴표로 묶어 리턴
  return `"${str}"`;
};

/**
 * Firestore의 todos 리스트를 CSV 파일로 내보내기 실행
 * @param {Array} todos - Firestore에서 조회한 todo 객체 배열
 */
export const exportTodosToCSV = (todos) => {
  if (!todos || todos.length === 0) {
    alert('내보낼 데이터가 없습니다.');
    return;
  }

  // 1. CSV 헤더 설정
  const headers = ['순번(Seq)', '작성시간(DateTime)', '메모 내용(Text)', 'AI 요약(Summary)', '태그(Tags)', '전송 목적지(Destinations)'];
  
  // 2. CSV 행 데이터 가공
  const rows = todos.map(todo => {
    const seq = todo.seq !== undefined ? todo.seq : '';
    const dateStr = formatDateTime(todo.createdAt);
    const text = todo.text || '';
    const summary = todo.summary || '';
    const tagsStr = Array.isArray(todo.tags) ? todo.tags.join(', ') : '';
    const destStr = Array.isArray(todo.destinations) ? todo.destinations.join(', ') : '';

    return [
      escapeCSVField(seq),
      escapeCSVField(dateStr),
      escapeCSVField(text),
      escapeCSVField(summary),
      escapeCSVField(tagsStr),
      escapeCSVField(destStr)
    ];
  });

  // 3. CSV 문자열 조립
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\r\n');

  // 4. Excel 한글 깨짐 방지를 위한 UTF-8 BOM (\uFEFF) 추가
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });

  // 5. 브라우저 다운로드 트리거
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  // 현재 날짜 기준 파일명 생성 (예: AliaBot_Export_20260627.csv)
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const fileName = `AliaBot_Export_${yyyy}${mm}${dd}.csv`;

  link.setAttribute('href', url);
  link.setAttribute('download', fileName);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  
  // 6. 리소스 해제 및 DOM 정리
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
