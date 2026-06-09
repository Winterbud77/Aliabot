/**
 * seq(게시판 번호) 보정 — createdAt 기준 오래된=1, 최신=큰 번호
 */

/**
 * Firestore Timestamp / ms / 초 단위를 밀리초로 변환
 * @param {unknown} createdAt
 * @returns {number}
 */
export function getCreatedAtMillis(createdAt) {
  if (!createdAt) return 0;
  if (typeof createdAt.toMillis === 'function') return createdAt.toMillis();
  if (typeof createdAt === 'number') return createdAt;
  if (typeof createdAt.seconds === 'number') return createdAt.seconds * 1000;
  return 0;
}

/**
 * snapshot.docs를 createdAt 오름차순으로 정렬한 뒤 seq 1..N 부여 계획 반환
 * @param {import('firebase/firestore').QueryDocumentSnapshot[]} docs
 */
export function buildChronologicalSeqUpdates(docs) {
  const sorted = [...docs].sort((a, b) => {
    const timeA = getCreatedAtMillis(a.data()?.createdAt);
    const timeB = getCreatedAtMillis(b.data()?.createdAt);
    if (timeA !== timeB) return timeA - timeB;
    // createdAt 동일 시 기존 seq로 안정 정렬
    const seqA = a.data()?.seq ?? 0;
    const seqB = b.data()?.seq ?? 0;
    return seqA - seqB;
  });

  return sorted.map((docSnap, index) => ({
    id: docSnap.id,
    newSeq: index + 1,
    oldSeq: docSnap.data()?.seq,
  }));
}

/** v3 레거시 flip 이후 1~53 구간이 역전된 패턴인지 */
export function looksLikeLegacySeqMismatch(docs) {
  if (docs.length < 3) return false;

  const chronologicallySorted = [...docs].sort(
    (a, b) => getCreatedAtMillis(a.data()?.createdAt) - getCreatedAtMillis(b.data()?.createdAt)
  );

  // 최신(createdAt 큰) 문서의 seq가 더 작으면 역전
  let mismatchCount = 0;
  for (let i = 0; i < chronologicallySorted.length - 1; i++) {
    const older = chronologicallySorted[i].data()?.seq;
    const newer = chronologicallySorted[i + 1].data()?.seq;
    if (typeof older === 'number' && typeof newer === 'number' && newer < older) {
      mismatchCount++;
    }
  }

  return mismatchCount >= 2;
}

/** seq 번호 중 중복된 숫자가 존재하는지 확인 */
export function hasDuplicateSeqs(docs) {
  const seqs = docs
    .map(d => d.data()?.seq)
    .filter(s => typeof s === 'number' && s > 0);
  const uniqueSeqs = new Set(seqs);
  return seqs.length !== uniqueSeqs.size;
}
