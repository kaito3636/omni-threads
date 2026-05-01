import './globals.css'

export const metadata = { title: 'omni-threads dashboard' }

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  )
}
