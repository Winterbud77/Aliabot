/**
 * GitHub API 연동 모듈 (Phase 6.0)
 * - 브라우저에서 직접 GitHub REST API를 호출하여 리포지토리의 파일 내용을 긁어옵니다.
 * - Public 리포지토리는 토큰 없이 호출이 가능하지만, Rate Limit이 걸리거나 Private 리포지토리를 지원하기 위해 PAT(Personal Access Token) 연동을 지원합니다.
 */

/**
 * GitHub 리포지토리에서 지정된 경로의 파일 원문(Raw Text)을 가져옵니다.
 * @param {string} repo - "owner/repo" 포맷 (예: "Winterbud77/Greenhouse-CropDataOps")
 * @param {string} path - 리포지토리 내 파일 경로 (예: "CLAUDE.md")
 * @param {string | null} token - GitHub Personal Access Token (선택)
 * @returns {Promise<string>} 파일 원문 내용
 */
export async function fetchGitHubFile(repo, path, token) {
  const cleanRepo = (repo || '').trim();
  const cleanPath = (path || '').trim();
  
  if (!cleanRepo) {
    throw new Error('GitHub 리포지토리 주소(owner/repo)가 설정되지 않았습니다.');
  }
  if (!cleanPath) {
    throw new Error('가져올 파일 경로가 지정되지 않았습니다.');
  }

  const url = `https://api.github.com/repos/${cleanRepo}/contents/${cleanPath}`;
  const headers = {
    'Accept': 'application/vnd.github.v3.raw', // raw 텍스트 파일 포맷으로 직접 다운로드
  };

  const cleanToken = (token || '').trim();
  if (cleanToken) {
    headers['Authorization'] = `token ${cleanToken}`;
  }

  const response = await fetch(url, {
    method: 'GET',
    headers: headers,
  });

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error(`파일을 찾을 수 없습니다. 경로를 확인해 주세요: ${cleanPath}`);
    }
    if (response.status === 403 || response.status === 401) {
      throw new Error('GitHub API 권한이 거부되었습니다. 토큰 설정을 확인해 주세요.');
    }
    throw new Error(`GitHub API 호출 실패 (${response.status}): ${response.statusText}`);
  }

  return response.text();
}

/**
 * 리포지토리의 주요 프로젝트 컨텍스트 파일들(CLAUDE.md, README.md 등)을 일괄적으로 긁어옵니다.
 * @param {string} repo 
 * @param {string | null} token 
 * @returns {Promise<string>} 조립된 컨텍스트 문자열
 */
export async function fetchProjectContext(repo, token) {
  const filesToFetch = ['CLAUDE.md', 'README.md'];
  const fetchedContents = [];

  for (const file of filesToFetch) {
    try {
      console.log(`[GitHub Bridge] Fetching context file: ${file}`);
      const content = await fetchGitHubFile(repo, file, token);
      fetchedContents.push(`=== FILE: ${file} ===\n${content}\n`);
    } catch (err) {
      console.warn(`[GitHub Bridge] ${file} 읽기 실패 (건너뜀):`, err.message);
      // 필수 파일이 아니므로 에러를 뿜지 않고 넘어감
    }
  }

  if (fetchedContents.length === 0) {
    throw new Error('프로젝트 컨텍스트 파일(CLAUDE.md, README.md)을 전혀 가져오지 못했습니다. 리포지토리 명칭 또는 GitHub 권한을 확인하세요.');
  }

  return fetchedContents.join('\n');
}
