'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { motion, AnimatePresence } from 'framer-motion';

// 환경변수 설정
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function FarmManagementPage() {
  const [farms, setFarms] = useState([]);
  const [selectedFarm, setSelectedFarm] = useState(null);
  const [droneImages, setDroneImages] = useState([]);

  useEffect(() => {
    fetchFarms();
    fetchDroneImages();
  }, []);

  // 농장 리스트 가져오기
  async function fetchFarms() {
    const { data } = await supabase.from('farms').select('*');
    setFarms(data || []);
  }

  // 드론 이미지 무한 슬라이드용 데이터 로드
  async function fetchDroneImages() {
    try {
      // 1. drone_image 버킷에서 파일 목록 읽기
      const { data, error } = await supabase.storage.from('drone_image').list();
      
      if (error) {
        console.error("이미지 목록 로드 실패:", error.message);
        return;
      }

      if (data && data.length > 0) {
        // 2. 파일명에서 실제 Public URL 생성
        const urls = data
          .filter(file => file.name.includes('.')) // 시스템 파일을 제외한 실제 이미지 파일만 필터링
          .map(file => `${supabaseUrl}/storage/v1/object/public/drone_image/${file.name}`);
        
        // 3. 끊김 없는 무한 루프를 위해 동일 배열을 3번 반복해서 연결
        setDroneImages([...urls, ...urls, ...urls]);
      }
    } catch (err) {
      console.error("이미지 처리 중 에러 발생:", err);
    }
  }

  return (
    <div className="min-h-screen bg-white font-sans text-gray-800">
      {/* 상단 헤더: 클릭 시 메인(null)으로 이동 */}
      <header className="py-6 flex flex-col items-center border-b-4 border-green-400 mb-8">
        <div 
          onClick={() => setSelectedFarm(null)} 
          className="flex items-center gap-4 cursor-pointer hover:opacity-80 transition-all"
        >
          <img src="https://ynuxgbcgpxlsunlhulwi.supabase.co/storage/v1/object/sign/image/darby_logo_image.gif?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV84ODQ1NzQ1Zi1jNTQ3LTRiOGMtYjBhZi05M2Y1M2FlMTc4NmMiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJpbWFnZS9kYXJieV9sb2dvX2ltYWdlLmdpZiIsImlhdCI6MTc3NzI3MDc2NSwiZXhwIjoxODA4ODA2NzY1fQ.RIVP9s_2Nuajnxsozn8Ufq2SpwzLoenQqKzoyakQTbM" alt="다비육종 로고" className="h-12" />
          <h1 className="text-3xl font-bold text-gray-700">농장 관리 시스템</h1>
        </div>
      </header>

      {/* 농장 선택 네비게이션 */}
      <nav className="max-w-6xl mx-auto px-8 flex justify-center gap-8 mb-6">
        {farms.map((farm) => (
          <button
            key={farm.id}
            onClick={() => setSelectedFarm(farm)}
            className={`px-8 py-3 rounded-full font-semibold transition-all shadow-sm ${
              selectedFarm?.id === farm.id 
              ? 'bg-green-500 text-white' 
              : 'bg-white border-2 border-green-500 text-green-600 hover:bg-green-50'
            }`}
          >
            {farm.name}
          </button>
        ))}
      </nav>

      {/* 구분선 */}
      <div className="max-w-6xl mx-auto px-8 mb-10">
        <div className="w-full h-1 bg-green-500 opacity-20 rounded-full"></div>
      </div>

      <main className="max-w-7xl mx-auto px-8">
        <AnimatePresence mode="wait">
          {!selectedFarm ? (
            /* [첫 페이지] 드론 무한 슬라이드 */
            <motion.section
              key="main-banner"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="relative overflow-hidden bg-gray-50 py-12 rounded-3xl shadow-inner"
            >
              <div className="flex overflow-hidden">
                {droneImages.length > 0 ? (
                  <motion.div 
                    className="flex gap-8 px-8"
                    animate={{ x: [0, -2800] }} // 이미지 수에 따라 거리는 조정 가능
                    transition={{ 
                      duration: 60, // 속도를 조금 더 천천히 (60초) 하여 부드럽게 표현
                      repeat: Infinity, 
                      ease: "linear" 
                    }}
                  >
                    {droneImages.map((src, idx) => (
                      <motion.div
                        key={idx}
                        whileHover={{ scale: 1.05 }}
                        className="flex-shrink-0"
                      >
                        <img
                          src={src}
                          alt={`농장 드론뷰 ${idx}`}
                          className="h-72 w-[450px] object-cover rounded-2xl shadow-xl border-4 border-white"
                        />
                      </motion.div>
                    ))}
                  </motion.div>
                ) : (
                  <div className="w-full text-center py-24">
                    <p className="text-gray-400 animate-pulse text-lg">
                      농장 전경 이미지를 불러오는 중입니다...
                    </p>
                  </div>
                )}
              </div>
              <div className="mt-10 text-center">
                <p className="text-xl font-medium text-gray-500">
                  다비육종이 관리하는 스마트 친환경 농장 전경입니다.
                </p>
              </div>
            </motion.section>
          ) : (
            /* [상세 페이지] 선택 시 메시지 (우선 확인용) */
            <motion.div
              key="farm-detail"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-20 bg-white border border-green-100 rounded-3xl"
            >
              <h2 className="text-3xl font-bold text-green-700">{selectedFarm.name} 정보 페이지</h2>
              <p className="mt-4 text-gray-500 text-lg">농장 버튼을 다시 누르면 드론 배너가 나타납니다.</p>
              <button 
                onClick={() => setSelectedFarm(null)}
                className="mt-8 text-green-600 underline"
              >
                메인으로 돌아가기
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <footer className="mt-24 py-12 bg-gray-100 border-t border-green-100 text-center">
        <p className="text-gray-400 text-sm italic">다비육종 농장 정보 시스템 &copy; 2026</p>
      </footer>
    </div>
  );
}
