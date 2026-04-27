'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { motion, AnimatePresence } from 'framer-motion';

// Supabase 설정 (환경변수 설정 필요)
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
  const [modalType, setModalType] = useState(null); // 'main', 'drone', 'gallery'
  const [galleryImages, setGalleryImages] = useState([]);

  useEffect(() => {
    fetchFarms();
    fetchDroneImages();
  }, []);

  // 농장 목록 가져오기
  async function fetchFarms() {
    const { data } = await supabase.from('farms').select('*');
    setFarms(data || []);
  }

  // 드론 이미지 랜덤 추출 (Storage)
  async function fetchDroneImages() {
    const { data, error } = await supabase.storage.from('drone_image').list();
    if (data) {
      const urls = data.map(file => 
        supabase.storage.from('drone_image').getPublicUrl(file.name).data.publicUrl
      );
      setDroneImages(urls.sort(() => Math.random() - 0.5));
    }
  }

  // 농장 클릭 시 상세 정보 및 건물 로드
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

  // 건물 클릭 시 방 정보 로드
  const handleBuildingClick = async (building) => {
    setSelectedBuilding(building);
    const { data } = await supabase.from('rooms').select('*').eq('building_id', building.id);
    setRooms(data || []);
  };

  // 부동산 현황도 갤러리 생성 (v2_1, v2_2... 규칙)
  const openGallery = (farmName) => {
    const prefixMap = {
      '도화종돈': 'darby_v2_',
      '디앤디종돈': 'd&d_v2_',
      '다원농장': 'dawon_v2_'
    };
    const prefix = prefixMap[farmName];
    // 최대 10장까지 체크하여 존재하는 이미지만 나열 (로직에 따라 조정 가능)
    const images = Array.from({ length: 10 }, (_, i) => 
      `${supabaseUrl}/storage/v1/object/public/farm-gallery/${prefix}${i + 1}.jpg`
    );
    setGalleryImages(images);
    setModalType('gallery');
    setIsModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-white font-sans text-gray-800">
      {/* Header */}
      <header className="py-6 flex flex-col items-center border-b-4 border-green-400">
        <div className="flex items-center gap-4">
          <img 
            src="https://ynuxgbcgpxlsunlhulwi.supabase.co/storage/v1/object/sign/image/darby_logo_image.gif?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV84ODQ1NzQ1Zi1jNTQ3LTRiOGMtYjBhZi05M2Y1M2FlMTc4NmMiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJpbWFnZS9kYXJieV9sb2dvX2ltYWdlLmdpZiIsImlhdCI6MTc3NzI3MDc2NSwiZXhwIjoxODA4ODA2NzY1fQ.RIVP9s_2Nuajnxsozn8Ufq2SpwzLoenQqKzoyakQTbM" 
            alt="Logo" 
            className="h-12"
          />
          <h1 className="text-3xl font-bold text-gray-700">농장 관리 시스템</h1>
        </div>
      </header>

      {/* Main Banner - Drone Images Marquee */}
      <section className="overflow-hidden bg-gray-50 py-10 relative">
        <div className="flex w-full overflow-hidden">
          <motion.div 
            className="flex gap-4 px-4"
            animate={{ x: [0, -1000] }}
            transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
          >
            {[...droneImages, ...droneImages].map((src, idx) => (
              <motion.img
                key={idx}
                src={src}
                whileHover={{ scale: 1.1, zIndex: 10 }}
                className="h-48 w-72 object-cover rounded-lg shadow-md cursor-pointer transition-all"
              />
            ))}
          </motion.div>
        </div>
      </section>

      {/* Farm Selection & Content */}
      <main className="max-w-6xl mx-auto p-8">
        <div className="flex justify-center gap-8 mb-12">
          {farms.map((farm) => (
            <button
              key={farm.id}
              onClick={() => handleFarmClick(farm)}
              className={`px-8 py-3 rounded-full font-semibold transition-all shadow-sm ${
                selectedFarm?.id === farm.id ? 'bg-green-500 text-white' : 'bg-white border-2 border-green-500 text-green-600 hover:bg-green-50'
              }`}
            >
              {farm.name}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {selectedFarm && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-white rounded-xl shadow-lg p-8 border border-green-100"
            >
              {/* Farm Info Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mb-12">
                <div className="text-center">
                  <img 
                    src={selectedFarm.main_image_url} 
                    alt="Main" 
                    className="w-full h-64 object-cover rounded-lg cursor-zoom-in shadow-md mb-2"
                    onClick={() => { setModalType('main'); setIsModalOpen(true); }}
                  />
                  <p className="text-sm text-gray-400 underline italic">사진 클릭 시 확대</p>
                </div>
                <div className="flex flex-col justify-center space-y-4 text-lg">
                  <p><strong>주소:</strong> {selectedFarm.address}</p>
                  <p><strong>농장장:</strong> {selectedFarm.manager_name}</p>
                  <p><strong>연락처:</strong> {selectedFarm.manager_contact}</p>
                  <div className="flex gap-3 pt-4">
                    <button 
                      onClick={() => { setModalType('drone'); setIsModalOpen(true); }}
                      className="bg-green-100 text-green-700 px-4 py-2 rounded hover:bg-green-200 transition"
                    >
                      🚁 드론 사진 보기
                    </button>
                    <button 
                      onClick={() => openGallery(selectedFarm.name)}
                      className="bg-blue-100 text-blue-700 px-4 py-2 rounded hover:bg-blue-200 transition"
                    >
                      🗺️ 부동산 현황도
                    </button>
                  </div>
                </div>
              </div>

              {/* Buildings Table */}
              <div className="mb-8">
                <h3 className="text-xl font-bold mb-4 border-l-4 border-green-500 pl-3">건물 현황</h3>
                <table className="w-full text-left border-collapse">
                  <thead className="bg-green-50 text-green-800">
                    <tr>
                      <th className="p-3 border">건물명</th>
                      <th className="p-3 border text-center">돈방 수</th>
                      <th className="p-3 border text-center">연면적</th>
                      <th className="p-3 border text-center">설명</th>
                    </tr>
                  </thead>
                  <tbody>
                    {buildings.map((b) => (
                      <tr 
                        key={b.id} 
                        onClick={() => handleBuildingClick(b)}
                        className="cursor-pointer hover:bg-gray-50 transition"
                      >
                        <td className="p-3 border font-medium">{b.building_name}</td>
                        <td className="p-3 border text-center">{b.room_count}</td>
                        <td className="p-3 border text-center">{b.total_area} ㎡</td>
                        <td className="p-3 border text-center text-gray-500">{b.description}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Room Details (Click to show) */}
              {selectedBuilding && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-6 p-6 bg-gray-50 rounded-lg">
                  <h4 className="font-bold text-green-700 mb-4 italic">[{selectedBuilding.building_name}] 세부 돈방 정보</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {rooms.map((r) => (
                      <div key={r.id} className="bg-white p-4 border rounded shadow-sm">
                        <p className="font-bold text-lg">{r.room_name}</p>
                        <p className="text-sm text-gray-600">사육면적: {r.breeding_area}㎡</p>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Image Zoom Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80 p-4">
          <button 
            onClick={() => setIsModalOpen(false)}
            className="absolute top-6 right-6 text-white text-4xl font-bold"
          >
            &times;
          </button>
          
          <div className="max-w-4xl max-h-screen overflow-y-auto bg-white rounded-lg p-4">
            {modalType === 'main' && <img src={selectedFarm?.main_image_url} className="w-full h-auto" />}
            {modalType === 'drone' && <img src={selectedFarm?.Drone_url} className="w-full h-auto" />}
            {modalType === 'gallery' && (
              <div className="space-y-4">
                <h2 className="text-2xl font-bold mb-4 text-center">{selectedFarm?.name} 부동산 현황도</h2>
                {galleryImages.map((url, i) => (
                  <img 
                    key={i} 
                    src={url} 
                    onError={(e) => (e.target.style.display = 'none')} 
                    className="w-full h-auto rounded border" 
                    alt={`현황도 ${i+1}`}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Footer Line */}
      <footer className="mt-20 border-t border-green-200 py-10 flex justify-center text-gray-400 text-sm">
        &copy; 2026 다비육종 Farm Management System. All rights reserved.
      </footer>
    </div>
  );
}
