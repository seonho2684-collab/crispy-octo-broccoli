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
  const [droneImages, setDroneImages] = useState([]);

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
      const { data, error } = await supabase.storage.from('drone_image').list('', {
        limit: 50, // 너무 많으면 로딩이 길어지므로 50장 내외가 적당합니다.
      });

      if (data && data.length > 0) {
        const urls = data
          .filter(file => file.name.includes('.'))
          .map(file => {
            const { data: { publicUrl } } = supabase.storage.from('drone_image').getPublicUrl(file.name);
            return publicUrl;
          });
        // 3줄로 나누기 위해 넉넉히 복사
        setDroneImages([...urls, ...urls, ...urls]);
      }
    } catch (err) {
      console.error("이미지 로딩 에러:", err);
    }
  }

  // 3줄 슬라이드를 위한 이미지 배열 분할
  const rows = useMemo(() => {
    if (droneImages.length === 0) return [[], [], []];
    const third = Math.ceil(droneImages.length / 3);
    return [
      droneImages.slice(0, third),
      droneImages.slice(third, third * 2),
      droneImages.slice(third * 2)
    ];
  }, [droneImages]);

  return (
    <div className="min-h-screen bg-white font-sans text-gray-800">
      {/* Header */}
      <header className="py-6 flex flex-col items-center border-b-4 border-green-400 mb-8">
        <div onClick={() => setSelectedFarm(null)} className="flex items-center gap-4 cursor-pointer hover:opacity-80 transition-all">
          <img src="https://ynuxgbcgpxlsunlhulwi.supabase.co/storage/v1/object/public/image/darby_logo_image.gif" alt="Logo" className="h-12" />
          <h1 className="text-3xl font-bold text-gray-700">농장 관리 시스템</h1>
        </div>
      </header>

      {/* Navigation */}
      <nav className="max-w-6xl mx-auto px-8 flex justify-center gap-8 mb-6">
        {farms.map((farm) => (
          <button
            key={farm.id}
            onClick={() => setSelectedFarm(farm)}
            className={`px-8 py-3 rounded-full font-semibold transition-all shadow-sm ${
              selectedFarm?.id === farm.id ? 'bg-green-500 text-white' : 'bg-white border-2 border-green-500 text-green-600 hover:bg-green-50'
            }`}
          >
            {farm.name}
          </button>
        ))}
      </nav>

      <main className="max-w-[1600px] mx-auto px-4">
        <AnimatePresence mode="wait">
          {!selectedFarm ? (
            /* [메인 배너] 3줄 무한 슬라이드 */
            <motion.section
              key="3row-banner"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col gap-4 py-4 bg-gray-50 rounded-3xl overflow-hidden"
            >
              {rows.map((rowImages, rowIndex) => (
                <div key={rowIndex} className="flex overflow-hidden relative h-40">
                  <motion.div 
                    className="flex gap-4 px-2"
                    // 각 줄마다 방향과 속도를 다르게 설정
                    animate={{ x: rowIndex === 1 ? [-2000, 0] : [0, -2000] }}
                    transition={{ 
                      duration: rowIndex === 1 ? 50 : 65, 
                      repeat: Infinity, 
                      ease: "linear" 
                    }}
                    style={{ willChange: "transform" }}
                  >
                    {rowImages.map((src, idx) => (
                      <img
                        key={idx}
                        src={src}
                        loading="lazy" // 로딩 속도 개선을 위한 레이지 로딩
                        className="h-40 w-64 object-cover rounded-xl shadow-md border-2 border-white flex-shrink-0"
                        alt="농장 전경"
                      />
                    ))}
                  </motion.div>
                </div>
              ))}
              <div className="mt-6 text-center text-gray-500 font-medium">
                스마트 농장 관리 시스템 - 드론 아카이브
              </div>
            </motion.section>
          ) : (
            /* [상세 페이지] 임시 정보창 */
            <motion.div key="farm-detail" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-3xl shadow-2xl p-10 border border-green-50 min-h-[500px]">
              <h2 className="text-4xl font-extrabold text-green-800 mb-6">{selectedFarm.name}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <img src={selectedFarm.main_image_url} className="rounded-2xl shadow-lg h-80 w-full object-cover" alt="농장 메인" />
                <div className="flex flex-col justify-center space-y-4 text-xl">
                  <p>📍 {selectedFarm.address}</p>
                  <p>👤 {selectedFarm.manager_name}</p>
                  <p>📞 {selectedFarm.manager_contact}</p>
                  <button onClick={() => setSelectedFarm(null)} className="mt-8 bg-green-500 text-white py-3 rounded-xl hover:bg-green-600 transition shadow-lg">메인으로 이동</button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <footer className="mt-20 py-10 text-center text-gray-400 text-sm">
        다비육종 농장 관리 시스템 &copy; 2026
      </footer>
    </div>
  );
}
