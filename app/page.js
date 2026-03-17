"use client";

import { createClient } from '@supabase/supabase-js'
import { useState, useEffect } from 'react'
import { MapPin, User, Phone, ExternalLink, Building2 } from 'lucide-react'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export default function Home() {
  const [farms, setFarms] = useState([]);
  const [buildings, setBuildings] = useState([]);
  const [selectedFarm, setSelectedFarm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    async function fetchData() {
      try {
        const { data: farmData } = await supabase.from('farms').select('*');
        const { data: buildingData } = await supabase.from('buildings').select('*');
        setFarms(farmData || []);
        setBuildings(buildingData || []);
      } catch (error) {
        console.error('데이터 로딩 오류:', error);
      } finally {
        setLoading(false);
      }
    }
    if (isClient) fetchData();
  }, [isClient]);

  if (!isClient) return null;

  // 선택된 농장에 속한 건물들 필터링
  const farmBuildings = buildings.filter(b => b.farm_id === selectedFarm?.id);

  return (
    <main className="min-h-screen bg-gray-50 p-6 md:p-10 text-gray-900 font-sans">
      <header className="mb-10">
        <h1 className="text-3xl font-black tracking-tight mb-8">도화종돈 <span className="text-green-600 font-medium text-xl">농장 통합 관리</span></h1>
        
        {/* 상단 농장 이름 목록 (사진 없음) */}
        <div className="flex flex-wrap gap-3">
          {farms.map((farm) => (
            <button
              key={farm.id}
              onClick={() => setSelectedFarm(farm)}
              className={`px-6 py-3 rounded-xl font-bold transition-all border ${
                selectedFarm?.id === farm.id 
                ? 'bg-green-600 text-white border-green-600 shadow-md' 
                : 'bg-white text-gray-700 border-gray-200 hover:border-green-500 hover:text-green-600'
              }`}
            >
              {farm.name}
            </button>
          ))}
        </div>
      </header>

      {/* 농장 상세 정보 (농장을 클릭했을 때만 나타남) */}
      {selectedFarm ? (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* 1. 기본 정보 및 건물 내역 */}
            <div className="space-y-6">
              <section className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
                <div className="flex justify-between items-start mb-6">
                  <h2 className="text-2xl font-bold">기본 정보</h2>
                  {selectedFarm.main_image_url && (
                    <a 
                      href={selectedFarm.main_image_url} 
                      target="_blank" 
                      className="flex items-center gap-1.5 text-sm font-semibold text-green-600 hover:underline"
                    >
                      <ExternalLink size={16} /> 드론 뷰 링크
                    </a>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-xl"><MapPin size={18} className="text-gray-400" /> {selectedFarm.address}</div>
                  <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-xl"><User size={18} className="text-gray-400" /> {selectedFarm.manager_name}</div>
                  <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-xl"><Phone size={18} className="text-gray-400" /> {selectedFarm.manager_contact}</div>
                </div>
              </section>

              <section className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-2"><Building2 className="text-green-600" /> 건축물 세부 내역</h2>
                <div className="space-y-3">
                  {farmBuildings.length > 0 ? farmBuildings.map((b) => (
                    <div key={b.id} className="flex justify-between items-center p-4 border-b border-gray-50 last:border-0 hover:bg-gray-50 rounded-lg transition-colors">
                      <div>
                        <p className="font-bold text-gray-900">{b.building_name}</p>
                        <p className="text-xs text-gray-500">{b.room_count}개 돈방 / {b.description}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-mono font-bold text-green-700">{b.total_area?.toLocaleString()} ㎡</p>
                        <p className="text-[10px] text-gray-400">약 {Math.round(b.total_area / 3.305)}평</p>
                      </div>
                    </div>
                  )) : <p className="text-gray-400 text-center py-4">등록된 건물 정보가 없습니다.</p>}
                </div>
              </section>
            </div>

            {/* 2. 위성 사진 및 현황도 */}
            <div className="space-y-6">
              <section className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
                <h2 className="text-2xl font-bold mb-6">위성 사진</h2>
                <div className="aspect-video bg-gray-100 rounded-2xl overflow-hidden border border-gray-200">
                  <img 
                    src={selectedFarm.record_image_url || "https://images.unsplash.com/photo-1500382017468-9049fed747ef?q=80&w=1200"} 
                    alt="위성 사진" 
                    className="w-full h-full object-cover" 
                  />
                </div>
              </section>

              <section className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
                <h2 className="text-2xl font-bold mb-6">부동산 현황도</h2>
                <div className="rounded-2xl overflow-hidden border border-gray-200">
                  <img 
                    src={selectedFarm.status_map_url || "https://images.unsplash.com/photo-1541888946425-d81bb19480c5?q=80&w=800"} 
                    alt="부동산 현황도" 
                    className="w-full h-auto" 
                  />
                </div>
              </section>
            </div>
          </div>
        </div>
      ) : (
        /* 초기 안내 메시지 */
        <div className="mt-20 text-center py-20 bg-white rounded-[40px] border border-dashed border-gray-200">
          <p className="text-gray-400 font-medium text-lg">상단의 농장 이름을 클릭하여 상세 정보를 확인하세요.</p>
        </div>
      )}
    </main>
  );
}
