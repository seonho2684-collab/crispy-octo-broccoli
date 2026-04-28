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
  const [droneImages, setDroneImages] = useState([]); // 메인 슬라이드용
  const [farmSpecificDrones, setFarmSpecificDrones] = useState([]); // 농장 상세용
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState(null);
  const [selectedImgUrl, setSelectedImgUrl] = useState('');
  const [galleryImages, setGalleryImages] = useState([]);

  useEffect(() => {
    fetchFarms();
    fetchMainDroneImages();
  }, []);

  async function fetchFarms() {
    const { data } = await supabase.from('farms').select('*');
    setFarms(data || []);
  }

  // 첫 화면용 전체 드론 이미지 로드
  async function fetchMainDroneImages() {
    const { data } = await supabase.storage.from('drone_image').list();
    if (data) {
      const urls = data
        .filter(f => f.name.includes('.'))
        .map(file => supabase.storage.from('drone_image').getPublicUrl(file.name).data.publicUrl);
      setDroneImages(urls);
    }
  }

  // 2단 구성을 위한 이미지 분할
  const droneRows = useMemo(() => {
    if (droneImages.length === 0) return [[], []];
    const half = Math.ceil(droneImages.length / 2);
    return [droneImages.slice(0, half), droneImages.slice(half)];
  }, [droneImages]);

  // 농장 상세 드론 이미지 로드 (이름 규칙: darby_1.jpg 등)
  const fetchSpecificDroneImages = (farmName) => {
    const prefixMap = { '도화종돈': 'darby_', '디앤디종돈': 'd&d_', '다원농장': 'dawon_' };
    const prefix = prefixMap[farmName] || 'farm_';
    // 최대 20장까지 생성하여 존재하는 이미지만 필터링 (onError로 처리)
    const images = Array.from({ length: 20 }, (_, i) => 
      `${supabaseUrl}/storage/v1/object/public/drone_image/${prefix}${i + 1}.jpg`
    );
    setFarmSpecificDrones(images);
  };

  const handleFarmClick = async (farm) => {
    if (selectedFarm?.id === farm.id) {
      setSelectedFarm(null);
      return;
    }
    setSelectedFarm(farm);
    fetchSpecificDroneImages(farm.name);
    const { data } = await supabase.from('buildings').select('*').eq('farm_id', farm.id);
    setBuildings(data || []);
    setSelectedBuilding(null);
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
    const prefix = prefixMap[farmName] || 'v2_';
    const images = Array.from({ length: 15 }, (_, i) => 
      `${supabaseUrl}/storage/v1/object/public/farm-gallery/${prefix}${i + 1}.jpg`
    );
    setGalleryImages(images);
    setModalType('gallery');
    setIsModalOpen(true);
  };

  const zoomImage = (url) => {
    setSelectedImgUrl(url);
    setModalType('single');
    setIsModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-white font-sans text-gray-800">
      {/* Header */}
      <header className="py-6 flex flex-col items-center border-b-4 border-green-400 bg-white sticky top-0 z-40 shadow-sm">
        <div onClick={() => setSelectedFarm(null)} className="flex items-center gap-4 cursor-pointer">
          <img 
            src="https://ynuxgbcgpxlsunlhulwi.supabase.co/storage/v1/object/sign/image/darby_logo_image.gif?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV84ODQ1NzQ1Zi1jNTQ3LTRiOGMtYjBhZi05M2Y1M2FlMTc4NmMiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJpbWFnZS9kYXJieV9sb2dvX2ltYWdlLmdpZiIsImlhdCI6MTc3NzM0MjMwNSwiZXhwIjoxODA4ODc4MzA1fQ.WP8y2Oej3J8NJRFZVm8E3Ik8icD9yJCdRRcCEkyAn-8" 
            alt="Logo" className="h-12" 
          />
          <h1 className="text-3xl font-bold text-gray-700">농장 관리 시스템</h1>
        </div>
      </header>

      {/* Farm Selection */}
      <nav className="max-w-6xl mx-auto px-8 flex justify-center gap-8 py-8">
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

      <main className="max-w-7xl mx-auto px-8 pb-20">
        <AnimatePresence mode="wait">
          {!selectedFarm ? (
            /* [메인] 2단 드론 슬라이드 */
            <motion.section key="main" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-8 overflow-hidden py-10">
              {droneRows.map((row, idx) => (
                <div key={idx} className="flex overflow-hidden">
                  <motion.div 
                    className="flex gap-6 px-4"
                    animate={{ x: idx === 0 ? [0, -1500] : [-1500, 0] }}
                    transition={{ duration: 50, repeat: Infinity, ease: "linear" }}
                  >
                    {[...row, ...row].map((src, i) => (
                      <img key={i} src={src} onClick={() => zoomImage(src)} className="h-64 w-[450px] object-cover rounded-2xl shadow-xl cursor-zoom-in border-4 border-white" />
                    ))}
                  </motion.div>
                </div>
              ))}
            </motion.section>
          ) : (
            /* [상세] 농장 상세 정보 */
            <motion.div key="detail" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-12">
              <div className="bg-white rounded-3xl shadow-xl p-10 border border-green-50 grid grid-cols-1 md:grid-cols-2 gap-12">
                <img src={selectedFarm.main_image_url} onClick={() => zoomImage(selectedFarm.main_image_url)} className="w-full h-80 object-cover rounded-2xl shadow-md cursor-zoom-in" />
                <div className="flex flex-col justify-center space-y-6">
                  <h2 className="text-5xl font-black text-green-800">{selectedFarm.name}</h2>
                  <div className="text-xl space-y-3 bg-green-50 p-6 rounded-2xl border-l-8 border-green-500">
                    <p><strong>📍 주소:</strong> {selectedFarm.address}</p>
                    <p><strong>👤 농장장:</strong> {selectedFarm.manager_name}</p>
                    <p><strong>📞 연락처:</strong> {selectedFarm.manager_contact}</p>
                  </div>
                  <div className="flex gap-4">
                    <button onClick={() => openGallery(selectedFarm.name)} className="flex-1 bg-blue-600 text-white py-4 rounded-xl font-bold shadow-lg hover:bg-blue-700 transition">🗺️ 부동산 현황도 보기</button>
                  </div>
                </div>
              </div>

              {/* 농장 전용 드론 사진첩 */}
              <section>
                <h3 className="text-2xl font-bold mb-6 flex items-center gap-2">🚁 {selectedFarm.name} 전경 사진</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {farmSpecificDrones.map((url, i) => (
                    <img 
                      key={i} src={url} onClick={() => zoomImage(url)} 
                      onError={(e) => (e.target.style.display = 'none')}
                      className="h-48 w-full object-cover rounded-xl shadow cursor-zoom-in hover:scale-105 transition" 
                    />
                  ))}
                </div>
              </section>

              {/* 건물 현황 테이블 */}
              <section className="bg-white rounded-2xl shadow-lg overflow-hidden border">
                <h3 className="text-2xl font-bold p-6 bg-gray-50 border-b">🏢 건물 및 돈방 현황</h3>
                <table className="w-full text-left">
                  <thead className="bg-green-600 text-white">
                    <tr>
                      <th className="p-4">건물명</th>
                      <th className="p-4 text-center">돈방 수</th>
                      <th className="p-4 text-center">면적(㎡)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {buildings.map((b) => (
                      <tr key={b.id} onClick={() => handleBuildingClick(b)} className={`cursor-pointer border-b hover:bg-green-50 ${selectedBuilding?.id === b.id ? 'bg-green-50 font-bold' : ''}`}>
                        <td className="p-4">{b.building_name}</td>
                        <td className="p-4 text-center">{b.room_count}</td>
                        <td className="p-4 text-center">{b.total_area}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </section>

              {/* 세부 돈방 정보 */}
              <AnimatePresence>
                {selectedBuilding && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="bg-gray-100 p-8 rounded-2xl grid grid-cols-2 md:grid-cols-5 gap-4">
                    {rooms.map((r) => (
                      <div key={r.id} className="bg-white p-4 rounded-lg shadow-sm text-center">
                        <p className="font-bold text-green-700">{r.room_name}</p>
                        <p className="text-xs text-gray-500">{r.breeding_area} ㎡</p>
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* 공용 확대 모달 */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4" onClick={() => setIsModalOpen(false)}>
          <div className="max-w-6xl w-full max-h-[90vh] overflow-y-auto bg-white rounded-2xl p-6" onClick={e => e.stopPropagation()}>
            {modalType === 'single' && <img src={selectedImgUrl} className="w-full h-auto rounded-lg shadow-2xl" />}
            {modalType === 'gallery' && (
              <div className="space-y-6">
                <h2 className="text-3xl font-bold text-center text-green-800">{selectedFarm?.name} 현황도</h2>
                <div className="grid gap-6">
                  {galleryImages.map((url, i) => (
                    <img key={i} src={url} onError={(e) => (e.target.style.display = 'none')} className="w-full border rounded-lg shadow" />
                  ))}
                </div>
              </div>
            )}
            <button onClick={() => setIsModalOpen(false)} className="mt-6 w-full py-4 bg-gray-800 text-white rounded-xl font-bold text-lg">닫기</button>
          </div>
        </div>
      )}
    </div>
  );
}
