/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    // 만약 src 폴더를 사용하신다면 아래 줄을 추가하세요.
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // 농장 느낌에 맞는 커스텀 녹색을 추가하고 싶다면 여기서 조절 가능합니다.
        farmGreen: '#15803d',
      },
    },
  },
  plugins: [],
}
