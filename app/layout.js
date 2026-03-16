// app/layout.js
import './globals.css'

export const metadata = {
  title: '양돈 농장 관리 시스템',
  description: '직원들을 위한 농장 정보 조회 서비스',
}

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  )
}
