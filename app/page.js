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

  // 드론 이미지 가져오기 로직 보완
  async function fetchDroneImages() {
    try {
      const { data, error } = await supabase.storage.from('drone_image').list('', {
        limit: 20,
        offset: 0,
        sortBy: { column: 'name', order: 'asc' },
      });

      if (error) throw error;

      if (data) {
        const urls = data
          .filter(file => file.name !== '.emptyFolderPlaceholder') // 빈 폴더 파일 제외
          .map(file => {
            const { data: publicUrlData } = supabase.storage.from('drone_image').getPublicUrl(file.name);
            return publicUrlData.publicUrl;
          });
        
        // 무한 슬라이드를 위해 이미지를 3번 반복해서 배열 생성
        setDroneImages([...urls, ...urls, ...urls]);
      }
    } catch (err) {
      console.error("드론 이미지를 불러오지 못했습니다:", err);
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

  const openGallery = (farmName) => {
    const prefixMap = { '도화종돈': 'darby_v2_', '디앤디종돈': 'd&d_v2_', '다원농장': 'dawon_v2_' };
    const prefix = prefixMap[farmName] || 'farm_v2_';
    const images = Array.from({ length: 15 }, (_, i) => 
      `${supabaseUrl}/storage/v1/object/public/farm-gallery/${prefix}${i + 1}.jpg`
    );
    setGalleryImages(images);
    setModalType('gallery');
    setIsModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-white font-sans text-gray-800">
      {/* Header - 제목/로고 클릭 시 메인으로 이동 */}
      <header className="py-6 flex flex-col items-center border-b-4 border-green-400">
        <div 
          onClick={() => setSelectedFarm(null)} // 클릭 시 선택된 농장 초기화 (첫 화면 이동)
          className="flex items-center gap-4 cursor-pointer hover:opacity-70 transition-all"
        >
          <img 
            src="https://ynuxgbcgpxlsunlhulwi.supabase.co/storage/v1/object/sign/image/darby_logo_image.gif?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV84ODQ1NzQ1Zi1jNTQ3LTRiOGMtYjBhZi05M2Y1M2FlMTc4NmMiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJpbWFnZS9kYXJieV9sb2dvX2ltYWdlLmdpZiIsImlhdCI6MTc3NzI3MDc2NSwiZXhwIjoxODA4ODA2NzY1fQ.RIVP9s_2Nuajnxsozn8Ufq2SpwzLoenQqKzoyakQTbM" 
            alt="Logo" 
            className="h-12"
          />
          <h1 className="text-3xl font-bold text-gray-700">농장 관리 시스템</h1>
        </div>
      </header>

      {/* Main Banner - 드론 이미지 슬라이드 (첫 화면에서만 보이고 싶다면 {!selectedFarm && ...}) */}
      <section className="overflow-hidden bg-gray-50 py-10">
        <div className="relative flex overflow-hidden">
          {droneImages.length > 0 ? (
            <motion.div 
              className="flex gap-4 px-4 whitespace-nowrap"
              animate={{ x: [0, -2000] }}
              transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
            >
              {droneImages.map((src, idx) => (
                <motion.img
                  key={idx}
                  src={src}
                  whileHover={{ scale: 1.1, zIndex: 10 }}
                  className="h-48 w-72 object-cover rounded-lg shadow-md cursor-pointer inline-block"
                />
              ))}
            </motion.div>
          ) : (
            <div className="w-full text-center text-gray-400 py-10">드론 이미지를 불러오는 중입니다...</div>
          )}
        </div>
      </section>

      {/* 농장 선택 버튼 영역 */}
      <main className="max-w-6xl mx-auto p-8">
        <div className="flex justify-center gap-8 mb-4">
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
        
        {/* 하단 녹색 줄 추가 */}
        <div className="w-full h-1 bg-green-500 mb-12 rounded-full opacity-30"></div>

        <AnimatePresence mode="wait">
          {selectedFarm && (
            <motion.div
              key={selectedFarm.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-white rounded-xl shadow-xl p-8 border border-green-100"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mb-12">
                <div className="text-center">
                  <img 
                    src={selectedFarm.main_image_url} 
                    alt="Main" 
                    className="w-full h-72 object-cover rounded-lg cursor-zoom-in shadow-lg mb-2"
                    onClick={() => { setModalType('main'); setIsModalOpen(true); }}
                  />
                  <p className="text-sm text-gray-400 underline italic">사진 클릭 시 확대</p>
                </div>
                <div className="flex flex-col justify-center space-y-4 text-lg">
                  <h2 className="text-3xl font-bold text-green-700 mb-2">{selectedFarm.name}</h2>
                  <p><strong>📍 주소:</strong> {selectedFarm.address}</p>
                  <p><strong>👤 농장장:</strong> {selectedFarm.manager_name}</p>
                  <p><strong>📞 연락처:</strong> {selectedFarm.manager_contact}</p>
                  <div className="flex gap-3 pt-6">
                    <button onClick={() => { setModalType('drone'); setIsModalOpen(true); }} className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 shadow-md transition">🚁 드론 사진</button>
                    <button onClick={() => openGallery(selectedFarm.name)} className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 shadow-md transition">🗺️ 부동산 현황도</button>
                  </div>
                </div>
              </div>

              {/* 건물 현황 테이블 */}
              <div className="mb-10">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <span className="w-2 h-6 bg-green-500 rounded"></span> 건물 및 사육 현황
                </h3>
                <table className="w-full text-left border-collapse overflow-hidden rounded-lg shadow-sm border">
                  <thead className="bg-green-50 text-green-900">
                    <tr>
                      <th className="p-4 border-b">건물명</th>
                      <th className="p-4 border-b text-center">돈방 수</th>
                      <th className="p-4 border-b text-center">총 면적</th>
                    </tr>
                  </thead>
                  <tbody>
                    {buildings.map((b) => (
                      <tr 
                        key={b.id} 
                        onClick={() => handleBuildingClick(b)}
                        className={`cursor-pointer transition-colors ${selectedBuilding?.id === b.id ? 'bg-green-100' : 'hover:bg-gray-50'}`}
                      >
                        <td className="p-4 border-b font-medium">{b.building_name}</td>
                        <td className="p-4 border-b text-center">{b.room_count}</td>
                        <td className="p-4 border-b text-center">{b.total_area}㎡</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* 세부 돈방 정보 (클릭 시 나타남) */}
              {selectedBuilding && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="p-6 bg-gray-50 rounded-xl border border-dashed border-green-300">
                  <h4 className="font-bold text-green-800 mb-4 italic">🏢 {selectedBuilding.building_name} - 세부 돈방 정보</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {rooms.map((r) => (
                      <div key={r.id} className="bg-white p-4 rounded-lg shadow-sm border border-green-50">
                        <p className="font-bold text-gray-700 text-center">{r.room_name}</p>
                        <div className="w-full h-px bg-gray-100 my-2"></div>
                        <p className="text-xs text-gray-500 text-center">면적: {r.breeding_area}㎡</p>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* 이미지 확대 모달 */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black bg-opacity-95 p-4 overflow-y-auto">
          <button 
            onClick={() => setIsModalOpen(false)}
            className="fixed top-8 right-8 text-white text-5xl font-light hover:text-green-400 z-[110]"
          >
            &times;
          </button>
          
          <div className="max-w-5xl w-full bg-white rounded-lg p-6 my-auto shadow-2xl">
            {modalType === 'main' && <img src={selectedFarm?.main_image_url} className="w-full rounded" />}
            {modalType === 'drone' && <img src={selectedFarm?.Drone_url} className="w-full rounded" />}
            {modalType === 'gallery' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-center border-b pb-4 text-green-800">{selectedFarm?.name} 부동산 현황도</h2>
                <div className="flex flex-col gap-4 overflow-y-auto max-h-[70vh] px-2">
                  {galleryImages.map((url, i) => (
                    <img 
                      key={i} 
                      src={url} 
                      onError={(e) => (e.target.style.display = 'none')} 
                      className="w-full rounded-lg shadow border"
                      alt="현황도"
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <footer className="mt-20 py-10 bg-gray-50 border-t border-green-200 text-center text-gray-400 text-sm">
        <p>다비육종 농장 관리 시스템 &copy; 2026. All Rights Reserved.</p>
      </footer>
    </div>
  );
}
