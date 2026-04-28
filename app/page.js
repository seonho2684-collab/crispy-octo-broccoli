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
  const [buildings, setBuildings] = useState([]);
  const [selectedBuilding, setSelectedBuilding] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [droneImages, setDroneImages] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState(null);
  const [galleryImages, setGalleryImages] = useState([]);

  useEffect(() => {
    fetchFarms();
    fetchDroneImages();
  }, []);

  async function fetchFarms() {
    const { data } = await supabase.from('farms').select('*');
    setFarms(data || []);
  }

  async function fetchDroneImages() {
    try {
      // 'drone_image' 버킷에서 파일 목록을 가져옵니다.
      const { data, error } = await supabase.storage.from(drone_image).list();
      
      if (error) {
        console.error("Storage 에러:", error.message);
        return;
      }

      if (data && data.length > 0) {
        const urls = data
          .filter(file => file.name.includes('.')) // 확장자가 있는 파일만 (폴더 제외)
          .map(file => {
            return `${supabaseUrl}/storage/v1/object/public/drone_image/${file.name}`;
          });
        
        // 무한 루프를 위해 배열을 넉넉히 복사
        setDroneImages([...urls, ...urls, ...urls]);
      }
    } catch (err) {
      console.error("이미지 로드 중 오류 발생:", err);
    }
  }

  const handleFarmClick = async (farm) => {
    if (selectedFarm?.id === farm.id) {
      setSelectedFarm(null);
      return;
    }
    setSelectedFarm(farm);
    const { data } = await supabase.from('buildings').select('*').eq('farm_id', farm.id);
    setBuildings(data || []);
    setSelectedBuilding(null);
  };

  const handleBuildingClick = async (building) => {
    setSelectedBuilding(building);
    const { data } = await supabase.from('rooms').select('*').eq('building_id', building.id);
    setRooms(data || []);
  };

  return (
    <div className="min-h-screen bg-white font-sans text-gray-800">
      {/* Header */}
      <header className="py-6 flex flex-col items-center border-b-4 border-green-400 mb-8">
        <div 
          onClick={() => setSelectedFarm(null)} 
          className="flex items-center gap-4 cursor-pointer hover:scale-105 transition-transform"
        >
          <img src="https://ynuxgbcgpxlsunlhulwi.supabase.co/storage/v1/object/sign/image/darby_logo_image.gif?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV84ODQ1NzQ1Zi1jNTQ3LTRiOGMtYjBhZi05M2Y1M2FlMTc4NmMiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJpbWFnZS9kYXJieV9sb2dvX2ltYWdlLmdpZiIsImlhdCI6MTc3NzI3MDc2NSwiZXhwIjoxODA4ODA2NzY1fQ.RIVP9s_2Nuajnxsozn8Ufq2SpwzLoenQqKzoyakQTbM" alt="Logo" className="h-12" />
          <h1 className="text-3xl font-bold text-gray-700">농장 관리 시스템</h1>
        </div>
      </header>

      {/* 농장 선택 버튼 (상시 노출) */}
      <nav className="max-w-6xl mx-auto px-8 flex justify-center gap-8 mb-4">
        {farms.map((farm) => (
          <button
            key={farm.id}
            onClick={() => handleFarmClick(farm)}
            className={`px-8 py-3 rounded-full font-semibold transition-all shadow-md ${
              selectedFarm?.id === farm.id ? 'bg-green-500 text-white border-green-500' : 'bg-white border-2 border-green-500 text-green-600 hover:bg-green-50'
            }`}
          >
            {farm.name}
          </button>
        ))}
      </nav>
      
      {/* 하단 녹색 줄 */}
      <div className="max-w-6xl mx-auto px-8">
        <div className="w-full h-1 bg-green-500 mb-8 opacity-20 rounded-full"></div>
      </div>

      {/* 콘텐츠 영역 */}
      <main className="max-w-6xl mx-auto px-8 pb-20">
        <AnimatePresence mode="wait">
          {!selectedFarm ? (
            /* [첫 화면] 드론 이미지 슬라이드 */
            <motion.section
              key="drone-banner"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="py-10 bg-gray-50 rounded-2xl overflow-hidden relative"
            >
              <div className="flex overflow-hidden">
                {droneImages.length > 0 ? (
                  <motion.div 
                    className="flex gap-6 px-6"
                    animate={{ x: [0, -2500] }}
                    transition={{ duration: 50, repeat: Infinity, ease: "linear" }}
                  >
                    {droneImages.map((src, idx) => (
                      <motion.img
                        key={idx}
                        src={src}
                        whileHover={{ scale: 1.05 }}
                        className="h-64 w-96 object-cover rounded-xl shadow-lg inline-block flex-shrink-0"
                      />
                    ))}
                  </motion.div>
                ) : (
                  <div className="w-full text-center text-gray-400 py-20 animate-pulse">
                    이미지를 불러올 수 없거나 버킷 정책(RLS)을 확인 중입니다...
                  </div>
                )}
              </div>
              <div className="text-center mt-8 text-gray-400 font-light">
                * 관리 중인 농장의 전경을 드론으로 촬영한 모습입니다.
              </div>
            </motion.section>
          ) : (
            /* [상세 화면] 농장 정보 */
            <motion.div
              key={selectedFarm.id}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className="bg-white rounded-2xl shadow-2xl p-10 border border-green-50"
            >
              {/* 기존 상세 정보 코드 동일 (중략 가능하나 가독성을 위해 핵심 유지) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-16">
                <div className="group">
                  <img src={selectedFarm.main_image_url} alt="Farm" className="w-full h-80 object-cover rounded-2xl shadow-md cursor-zoom-in group-hover:shadow-xl transition-all" onClick={() => { setModalType('main'); setIsModalOpen(true); }} />
                  <p className="text-center mt-3 text-sm text-gray-400 italic">이미지 클릭 시 확대</p>
                </div>
                <div className="flex flex-col justify-center space-y-6">
                  <h2 className="text-4xl font-extrabold text-green-800">{selectedFarm.name}</h2>
                  <div className="space-y-3 text-lg border-l-4 border-green-200 pl-6">
                    <p><strong>📍 주소:</strong> {selectedFarm.address}</p>
                    <p><strong>👤 농장장:</strong> {selectedFarm.manager_name}</p>
                    <p><strong>📞 연락처:</strong> {selectedFarm.manager_contact}</p>
                  </div>
                  <div className="flex gap-4 pt-4">
                    <button onClick={() => { setModalType('drone'); setIsModalOpen(true); }} className="flex-1 bg-green-600 text-white py-3 rounded-xl font-bold hover:bg-green-700 transition">🚁 드론 전경</button>
                    <button onClick={() => { setModalType('gallery'); setIsModalOpen(true); }} className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition">🗺️ 부동산 현황도</button>
                  </div>
                </div>
              </div>
              {/* ... 하단 테이블 생략 (기존과 동일하게 유지) ... */}
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
