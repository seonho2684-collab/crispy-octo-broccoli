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

// 카카오 위성지도 URL 생성 (안정적인 WGS84 위도/경도 방식)
  const getKakaoMap = (farm) => {
    if (!farm.latitude || !farm.longitude) return null;
    
    // mx/my 대신 위도(lat), 경도(lng)를 직접 사용하는 URL 구조입니다.
    // L=확대레벨(1~14, 3이 적당), map_type=SKYVIEW(위성)
    return `https://map2.daum.net/map/staticmap?center=${farm.latitude},${farm.longitude}&level=3&map_type=SKYVIEW&width=800&height=450&service=open`;
  };

   return (
    <main className="min-h-screen bg-gray-50 p-6 md:p-10 text-gray-900 font-sans">
      <header className="mb-12">
        <h1 className="text-3xl font-bold mb-8 text-center text-green-700">🐷 양돈 농장 관리 시스템
     </h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
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

          //목록으로 돌아가기 버튼 추가
    <main className="min-h-screen bg-gray-50 p-6 md:p-10">
      <header className="flex items-center justify-between pb-8 mb-10 border-b border-gray-200">
        <h1 className="text-4xl font-extrabold text-gray-950 tracking-tight">도화종돈 <span className="text-gray-500 font-normal">(도화 본장)</span></h1>
        {selectedFarm && (
          <button 
            onClick={() => setSelectedFarm(null)} // 목록으로 돌아가기
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-full text-sm font-medium"
          >
            <X size={16} /> 목록으로
          </button>
        )}
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
