"use client";

import { createClient } from '@supabase/supabase-js'
import { useState, useEffect } from 'react'
import { MapPin, User, Phone, ExternalLink, Building2, Globe, Layout } from 'lucide-react'

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
        const { data: f } = await supabase.from('farms').select('*');
        const { data: b } = await supabase.from('buildings').select('*');
        setFarms(f || []);
        setBuildings(b || []);
      } catch (error) {
        console.error('데이터 로딩 오류:', error);
      } finally {
        setLoading(false);
      }
    }
    if (isClient) fetchData();
  }, [isClient]);

  if (!isClient) return null;

  const farmBuildings = buildings.filter(b => b.farm_id === selectedFarm?.id);

  // 카카오 위성지도 URL 생성
  const getKakaoMap = (farm) => {
    if (!farm.latitude || !farm.longitude) return null;
    return `https://map2.daum.net/map/staticmap?mx=${farm.longitude}&my=${farm.latitude}&level=3&map_type=SKYVIEW&map_width=800&map_height=450&service=open`;
  };

  return (
    <main className="min-h-screen bg-slate-50 p-6 md:p-10 text-slate-900 font-sans">
      <header className="mb-12">
        <h1 className="text-3xl font-black mb-8 tracking-tight">
          도화종돈 <span className="text-green-600 font-medium text-lg ml-2">Smart Farm Manager</span>
        </h1>
        
        {/* 상단 농장 이름 목록 */}
        <div className="flex flex-wrap gap-3">
          {farms.map((farm) => (
            <button
              key={farm.id}
              onClick={() => setSelectedFarm(farm)}
              className={`px-6 py-3 rounded-2xl font-bold transition-all border-2 ${
                selectedFarm?.id === farm.id 
                ? 'bg-green-600 text-white border-green-600 shadow-lg scale-105' 
                : 'bg-white text-slate-600 border-white hover:border-green-200 hover:bg-green-50'
              }`}
            >
              {farm.name}
            </button>
          ))}
        </div>
      </header>

      {selectedFarm ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-5 duration-700">
          
          {/* 왼쪽 컬럼: 기본 정보 및 건물 내역 */}
          <div className="space-y-8">
            <section className="bg-white p-8 rounded-[32px] shadow-sm border border-slate-100">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold italic text-slate-800">Farm Info.</h2>
                {selectedFarm.Drone_url && (
                  <a 
                    href={selectedFarm.Drone_url} 
                    target="_blank" 
                    rel="noreferrer"
                    className="text-green-600 flex items-center gap-1.5 text-sm font-bold bg-green-50 px-3 py-1.5 rounded-full hover:bg-green-100 transition-colors"
                  >
                    <ExternalLink size={16} /> 드론 뷰 웹 링크
                  </a>
                )}
              </div>
              <div className="space-y-4 text-sm">
                <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <MapPin size={20} className="text-slate-400" /> {selectedFarm.address}
                </div>
                <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <User size={20} className="text-slate-400" /> {selectedFarm.manager_name}
                </div>
                <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <Phone size={20} className="text-slate-400" /> {selectedFarm.manager_contact}
                </div>
              </div>
            </section>

            <section className="bg-white p-8 rounded-[32px] shadow-sm border border-slate-100">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <Building2 className="text-green-600" /> 건축물 세부 내역
              </h2>
              <div className="divide-y divide-slate-50">
                {farmBuildings.length > 0 ? farmBuildings.map((b) => (
                  <div key={b.id} className="py-4 flex justify-between items-center group">
                    <div>
                      <p className="font-bold text-slate-800 group-hover:text-green-600 transition-colors">{b.building_name}</p>
                      <p className="text-xs text-slate-400">{b.room_count}돈방 · {b.description}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-black text-slate-900">{b.total_area?.toLocaleString()} ㎡</p>
                      <p className="text-[10px] text-slate-400">약 {Math.round(b.total_area / 3.305)}평</p>
                    </div>
                  </div>
                )) : <p className="text-slate-400 py-4 text-center">건물 정보가 없습니다.</p>}
              </div>
            </section>
          </div>

          {/* 오른쪽 컬럼: 위성 사진 및 부동산 현황도 */}
          <div className="space-y-8">
            <section className="bg-white p-8 rounded-[32px] shadow-sm border border-slate-100">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <Globe className="text-blue-500" /> 위성 사진 (Kakao)
                </h2>
                {!selectedFarm.latitude && (
                  <span className="text-xs text-rose-500 font-medium">좌표 미등록</span>
                )}
              </div>
              <div className="aspect-[16/9] rounded-2xl overflow-hidden border border-slate-100 bg-slate-50 shadow-inner">
                {getKakaoMap(selectedFarm) ? (
                  <img src={getKakaoMap(selectedFarm)} alt="카카오 위성사진" className="w-full h-full object-cover transition-transform hover:scale-105 duration-500" />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 text-sm p-6 text-center">
                    <p>위도(latitude)와 경도(longitude) 데이터가 없습니다.</p>
                  </div>
                )}
              </div>
            </section>

            <section className="bg-white p-8 rounded-[32px] shadow-sm border border-slate-100">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <Layout size={24} className="text-orange-400" /> 부동산 현황도
              </h2>
              <div className="rounded-2xl overflow-hidden border border-slate-100 bg-slate-50">
                {selectedFarm.status_map_url ? (
                  <img src={selectedFarm.status_map_url} alt="부동산 현황도" className="w-full h-auto" />
                ) : (
                  <div className="p-20 text-center text-slate-300 text-sm">등록된 현황도 이미지가 없습니다.</div>
                )}
              </div>
            </section>
          </div>
        </div>
      ) : (
        /* 초기 화면 */
        <div className="mt-20 text-center py-32 bg-white rounded-[48px] border-2 border-dashed border-slate-200">
          <p className="text-slate-400 font-bold text-xl italic uppercase tracking-widest">Select a Farm to View Details</p>
        </div>
      )}
    </main>
  );
}
