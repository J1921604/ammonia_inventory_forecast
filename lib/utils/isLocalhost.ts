/**
 * localhost判定ユーティリティ
 * GitHub Pages環境とローカル環境を判別し、環境別機能制御を実現
 */

/**
 * 現在の実行環境がlocalhostかどうかを判定
 * @returns {boolean} localhostの場合true、それ以外false
 */
export function isLocalhost(): boolean {
  if (typeof window === 'undefined') {
    // サーバーサイドレンダリング時は false
    return false
  }

  const hostname = window.location.hostname

  // localhost または 127.0.0.1 の場合のみ true
  return hostname === 'localhost' || hostname === '127.0.0.1'
}

/**
 * 環境名を取得
 * @returns {string} 'localhost' | 'production'
 */
export function getEnvironment(): string {
  return isLocalhost() ? 'localhost' : 'production'
}

/**
 * GitHub Pages環境かどうかを判定
 * @returns {boolean} GitHub Pagesの場合true
 */
export function isGitHubPages(): boolean {
  if (typeof window === 'undefined') {
    return false
  }

  const hostname = window.location.hostname
  return hostname.includes('github.io')
}
