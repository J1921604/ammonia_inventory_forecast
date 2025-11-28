import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'アンモニア在庫レベル予測ダッシュボード',
  description: 'Next.js 14で構築されたアンモニア在庫レベル予測ダッシュボード。Chart.jsによるインタラクティブなグラフ表示、CSV管理、自動デプロイ対応。',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  )
}
