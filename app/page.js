'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { motion, AnimatePresence } from 'framer-motion';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function FarmManagementPage() {
  const [farms, setFarms] = useState([]);
  const [selectedFarm, setSelectedFarm] = useState(null);
  const [droneImages, setDroneImages] = useState([]);
  const [isLoading, setIsLoading] = useState(true); // 로딩 상태 추가

  useEffect(() => {
    fetchInitialData();
  }, []);

  async function fetchInitialData() {
    setIsLoading(true);
    await Promise.all([fetchFarms(), fetchDroneImages()]);
    setIsLoading(false);
  }

  async function fetchFarms() {
    const { data } = await supabase.from('farms').select('*');
    setFarms(data || []);
  }

  async function fetchDroneImages() {
    try {
      console.log("1. 이미지 목록 요청 시작...");
      // 버킷 안의 모든 파일을 가져옵니다.
      const { data, error } = await supabase.storage.from('drone_image').list('', {
        limit: 100,
        offset: 0
      });

      if (error) {
        console.error("2. 에러 발생:", error.message);
        return;
      }

      if (data && data.length > 0) {
        console.log("3. 찾은 파일 개수:", data.length);
        
        const urls = data
          .filter(file => file.name.includes('.')) // 파일명이 있는 것만 (폴더 제외)
          .map(file => {
            const { data: { publicUrl } } = supabase.storage.from('drone_image').getPublicUrl(file.name);
            return publicUrl;
          });

        console.log("4. 생성된 이미지 URL들:", urls);
        // 무한 슬라이드를 위해 3배 복사
        setDroneImages([...urls, ...urls, ...urls]);
      } else {
        console.warn("2. 버킷에 사진이 하나도 없습니다.");
      }
    } catch (err) {
      console.error("3. 예상치 못한 오류:", err);
    }
  }

  return (
    <div className="min-h-screen bg-white font-sans text-gray-800">
      <header className="py-6 flex flex-col items-center border-b-4 border-green-400 mb-8">
        <div 
          onClick={() => setSelectedFarm(null)} 
          className="flex items-center gap-4 cursor-pointer hover:opacity-80 transition-all"
        >
          <img src="https://ynuxgbcgpxlsunlhulwi.supabase.co/storage/v1/object/public/image/darby_logo_image.gif" alt="Logo" className="h-12" />
          <h1 className="text-3xl font-bold text-gray-700">농장 관리 시스템</h1>
        </div>
      </header>

      <nav className="max-w-6xl mx-auto px-8 flex justify-center gap-8 mb-10">
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

      <main className="max-w-7xl mx-auto px-8">
        <AnimatePresence mode="wait">
          {!selectedFarm ? (
            <motion.section
              key="main-banner"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="relative overflow-hidden bg-gray-50 py-12 rounded-3xl shadow-inner min-h-[400px] flex flex-col justify-center items-center"
            >
              {droneImages.length > 0 ? (
                <div className="flex overflow-hidden w-full">
                  <motion.div 
                    className="flex gap-8 px-8"
                    animate={{ x: [0, -2500] }}
                    transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
                  >
                    {droneImages.map((src, idx) => (
                      <motion.img
                        key={idx}
                        src={src}
                        whileHover={{ scale: 1.05 }}
                        className="h-72 w-[450px] object-cover rounded-2xl shadow-xl border-4 border-white flex-shrink-0"
                        onError={(e) => {
                            console.error(`이미지 로드 실패: ${src}`);
                            e.target.style.display = 'none';
                        }}
                      />
                    ))}
                  </motion.div>
                </div>
              ) : (
                <div className="text-center py-20">
                  <p className="text-gray-400 text-lg mb-4">
                    {isLoading ? "농장 전경 이미지를 불러오고 있습니다..." : "현재 표시할 드론 이미지가 없습니다."}
                  </p>
                  {/* 디버깅 팁 제공 */}
                  {!isLoading && (
                    <p className="text-xs text-gray-300">
                      팁: Storage 버킷 이름(drone_image)과 정책(Policy)을 확인해 주세요.
                    </p>
                  )}
                </div>
              )}
              <div className="mt-10 text-center text-xl font-medium text-gray-500">
                다비육종이 관리하는 스마트 친환경 농장 전경입니다.
              </div>
            </motion.section>
          ) : (
            <motion.div key="farm-detail" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20 bg-white border border-green-100 rounded-3xl">
              <h2 className="text-4xl font-bold text-green-700">{selectedFarm.name}</h2>
              <p className="mt-6 text-gray-500 text-xl">상세 정보 시스템 준비 중...</p>
              <button onClick={() => setSelectedFarm(null)} className="mt-10 bg-green-500 text-white px-6 py-2 rounded-lg">뒤로 가기</button>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
