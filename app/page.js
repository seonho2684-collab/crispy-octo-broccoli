'use client';

import { useState, useEffect, useMemo } from 'react';
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
      const { data, error } = await supabase.storage.from('drone_image').list('', { limit: 40 });
      if (data && data.length > 0) {
        const urls = data
          .filter(file => file.name.includes('.'))
          .map(file => {
            const { data: { publicUrl } } = supabase.storage.from('drone_image').getPublicUrl(file.name);
            return publicUrl;
          });
        setDroneImages([...urls, ...urls]); // 무한 루프용 복사
      }
    } catch (err) {
      console.error("드론 이미지 로드 실패:", err);
    }
  }

  // 2단 구성을 위한 이미지 분할
  const droneRows = useMemo(() => {
    if (droneImages.length === 0) return [[], []];
    const half = Math.ceil(droneImages.length / 2);
    return [droneImages.slice(0, half), droneImages.slice(half)];
  }, [droneImages]);

  const handleFarmClick = async (farm) => {
    if (selectedFarm?.id === farm.id) {
      setSelectedFarm(null);
      return;
    }
    setSelectedFarm(farm);
    const { data } = await supabase.from('buildings').select('*').eq('farm_id', farm.id);
    setBuildings(data || []);
    setSelectedBuilding(null);
    setRooms([]);
  };

  const handleBuildingClick = async (building) => {
    if (selectedBuilding?.id === building.id) {
      setSelectedBuilding(null);
      setRooms([]);
      return;
    }
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
      {/* Header */}
      <header className="py-6 flex flex-col items-center border-b-4 border-green-400 mb-8 sticky top-0 bg-white z-40 shadow-sm">
        <div 
          onClick={() => setSelectedFarm(null)} 
          className="flex items-center gap-4 cursor-pointer hover:scale-105 transition-transform"
        >
          <img src="https://ynuxgbcgpxlsunlhulwi.supabase.co/storage/v1/object/public/image/darby_logo_image.gif" alt="Logo" className="h-12" />
          <h1 className="text-3xl font-bold text-gray-700">농장 관리 시스템</h1>
        </div>
      </header>

      {/* Farm Selector */}
      <nav className="max-w-6xl mx-auto px-8 flex justify-center gap-8 mb-4">
        {farms.map((farm) => (
          <button
            key={farm.id}
            onClick={() => handleFarmClick(farm)}
            className={`px-10 py-3 rounded-full font-bold transition-all shadow-md text-lg ${
              selectedFarm?.id === farm.id ? 'bg-green-600 text-white' : 'bg-white border-2 border-green-500 text-green-600 hover:bg-green-50'
            }`}
          >
            {farm.name}
          </button>
        ))}
      </nav>

      <div className="max-w-6xl mx-auto px-8 mb-12">
        <div className="w-full h-1 bg-green-500 opacity-20 rounded-full"></div>
      </div>

      <main className="max-w-7xl mx-auto px-8 pb-20">
        <AnimatePresence mode="wait">
          {!selectedFarm ? (
            /* [첫 화면] 2단 대형 드론 슬라이드 */
            <motion.section
              key="drone-main"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex flex-col gap-8 py-10 bg-gray-50 rounded-3xl overflow-hidden shadow-inner"
            >
              {droneRows.map((row, idx) => (
                <div key={idx} className="flex overflow-hidden relative">
                  <motion.div 
                    className="flex gap-8 px-4"
                    animate={{ x: idx === 0 ? [0, -2500] : [-2500, 0] }}
                    transition={{ duration: 70, repeat: Infinity, ease: "linear" }}
                  >
                    {row.map((src, i) => (
                      <img
                        key={i}
                        src={src}
                        loading="lazy"
                        className="h-72 w-[500px] object-cover rounded-2xl shadow-xl border-4 border-white flex-shrink-0 transition-transform hover:scale-105"
                        alt="농장 드론 전경"
                      />
                    ))}
                  </motion.div>
                </div>
              ))}
              <div className="text-center mt-10">
                <h2 className="text-2xl font-bold text-gray-400 italic">"혁신적인 스마트 팜, 다비육종이 함께합니다"</h2>
              </div>
            </motion.section>
          ) : (
            /* [상세 화면] 농장 상세 정보 */
            <motion.div
              key={selectedFarm.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl shadow-2xl p-10 border border-green-50"
            >
              {/* 상단: 이미지 및 기본 정보 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-16">
                <div className="relative group">
                  <img 
                    src={selectedFarm.main_image_url} 
                    alt="Farm Main" 
                    className="w-full h-96 object-cover rounded-2xl shadow-lg cursor-zoom-in group-hover:shadow-2xl transition-all"
                    onClick={() => { setModalType('main'); setIsModalOpen(true); }}
                  />
                  <div className="absolute bottom-4 right-4 bg-black/50 text-white px-4 py-1 rounded-full text-sm backdrop-blur-sm">클릭 시 확대</div>
                </div>
                <div className="flex flex-col justify-center space-y-6">
                  <h2 className="text-5xl font-black text-green-800">{selectedFarm.name}</h2>
                  <div className="space-y-4 text-xl border-l-8 border-green-500 pl-8 py-2 bg-green-50/50 rounded-r-2xl">
                    <p><strong>📍 주소:</strong> {selectedFarm.address}</p>
                    <p><strong>👤 농장장:</strong> {selectedFarm.manager_name}</p>
                    <p><strong>📞 연락처:</strong> {selectedFarm.manager_contact}</p>
                  </div>
                  <div className="flex gap-4 pt-6">
                    <button onClick={() => { setModalType('drone'); setIsModalOpen(true); }} className="flex-1 bg-green-600 text-white py-4 rounded-2xl font-bold text-lg hover:bg-green-700 shadow-lg transition transform hover:-translate-y-1">🚁 드론 전경 사진</button>
                    <button onClick={() => openGallery(selectedFarm.name)} className="flex-1 bg-blue-600 text-white py-4 rounded-2xl font-bold text-lg hover:bg-blue-700 shadow-lg transition transform hover:-translate-y-1">🗺️ 부동산 현황도</button>
                  </div>
                </div>
              </div>

              {/* 하단: 건물 현황 테이블 */}
              <div className="mb-12">
                <h3 className="text-2xl font-bold mb-6 flex items-center gap-3">
                  <span className="w-3 h-8 bg-green-500 rounded-full"></span> 건물 및 사육 현황
                </h3>
                <div className="overflow-hidden rounded-2xl border border-gray-200 shadow-sm">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-green-600 text-white text-lg">
                      <tr>
                        <th className="p-5">건물명</th>
                        <th className="p-5 text-center">돈방 수</th>
                        <th className="p-5 text-center">총 면적 (㎡)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {buildings.map((b) => (
                        <tr 
                          key={b.id} 
                          onClick={() => handleBuildingClick(b)}
                          className={`cursor-pointer transition-colors ${selectedBuilding?.id === b.id ? 'bg-green-50' : 'hover:bg-gray-50'}`}
                        >
                          <td className="p-5 font-bold text-gray-700 text-lg">{b.building_name}</td>
                          <td className="p-5 text-center text-lg">{b.room_count}개</td>
                          <td className="p-5 text-center text-lg font-mono text-green-700">{b.total_area}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 세부 돈방 정보 (클릭 시 펼쳐짐) */}
              <AnimatePresence>
                {selectedBuilding && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }} 
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="p-8 bg-gray-50 rounded-2xl border-2 border-dashed border-green-200">
                      <h4 className="font-bold text-green-800 mb-6 text-xl flex items-center gap-2">
                        🏢 {selectedBuilding.building_name} - 상세 돈방 리스트
                      </h4>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                        {rooms.map((r) => (
                          <div key={r.id} className="bg-white p-4 rounded-xl shadow-sm border border-green-100 flex flex-col items-center">
                            <p className="font-black text-gray-800 text-lg">{r.room_name}</p>
                            <div className="w-full h-0.5 bg-green-100 my-2"></div>
                            <p className="text-sm text-green-600 font-bold">{r.breeding_area} ㎡</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* 이미지 확대 모달 */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4 backdrop-blur-md">
          <button onClick={() => setIsModalOpen(false)} className="fixed top-8 right-8 text-white text-6xl hover:text-green-400 z-[110]">&times;</button>
          
          <div className="max-w-6xl w-full bg-white rounded-3xl p-8 overflow-y-auto max-h-[90vh] shadow-2xl">
            {modalType === 'main' && <img src={selectedFarm?.main_image_url} className="w-full rounded-xl shadow-lg" />}
            {modalType === 'drone' && <img src={selectedFarm?.Drone_url} className="w-full rounded-xl shadow-lg" />}
            {modalType === 'gallery' && (
              <div className="space-y-8">
                <h2 className="text-3xl font-black text-center text-green-800 border-b pb-6">{selectedFarm?.name} 부동산 현황도</h2>
                <div className="flex flex-col gap-6">
                  {galleryImages.map((url, i) => (
                    <img 
                      key={i} 
                      src={url} 
                      onError={(e) => (e.target.style.display = 'none')} 
                      className="w-full rounded-2xl shadow-md border"
                      alt="현황도"
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <footer className="mt-20 py-12 bg-gray-900 text-center text-gray-500">
        <p className="text-lg">다비육종 농장 관리 시스템 &copy; 2026. All Rights Reserved.</p>
        <p className="text-sm mt-2 font-light">본 시스템은 스마트 농장 관리 표준 가이드를 준수합니다.</p>
      </footer>
    </div>
  );
}
