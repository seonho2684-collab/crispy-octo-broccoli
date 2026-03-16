// app/layout.js
import './globals.css'

export const metadata = {
  title: '양돈 농장 관리 시스템',
}

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <body suppressHydrationWarning={true}>{children}</body>
    </html>
  )
}
