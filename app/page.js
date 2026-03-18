"use client";

import { createClient } from '@supabase/supabase-js'
import { useState, useEffect } from 'react'
import { MapPin, User, Phone, ExternalLink, Building2, Globe, Layout, Loader2 } from 'lucide-react'

// 1. Supabase 클라이언트 설정
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export default function Home() {
  const [farms, setFarms] = useState([]);
  const [buildings, setBuildings] = useState([]);
  const [selectedFarm, setSelectedFarm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isClient, setIsClient] = useState(false);

  // 2. 데이터 불러오기
  useEffect(() => {
    setIsClient(true);
    async function fetchData() {
      try {
        const { data: f } = await supabase.from('farms').select('*');
        const { data: b } = await supabase.from('buildings').select('*');
        setFarms(f || []);
        setBuildings(b || []);
      } catch (error) {
        console.error('데이터 로딩 중 오류 발생:', error);
      } finally {
        setLoading(false);
      }
    }
    if (isClient) fetchData();
  }, [isClient]);

  if (!isClient) return null;

  // 선택된 농장의 건물들만 필터링
  const farmBuildings = buildings.filter(b => b.farm_id === selectedFarm?.id);

 // 카카오 위성지도 URL 생성 (가장 표준적인 mx, my 방식 사용)
  const getKakaoMapUrl = (farm) => {
    if (!farm.latitude || !farm.longitude) return null;
    
    // level=3 (확대), L=3과 동일한 효과
    // mx(경도), my(위도) 순서입니다.
    return `https://map2.daum.net/map/staticmap?mx=${farm.longitude}&my=${farm.latitude}&level=3&map_type=SKYVIEW&map_width=800&map_height=450&service=open`;
  };

  return (
    <main className="min-h-screen bg-slate-50 p-6 md:p-10 text-slate-900 font-sans">
      <header className="mb-12">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-green-600 rounded-xl flex items-center justify-center text-white">
            <Building2 size={24} />
          </div>
          <h1 className="text-3xl font-black tracking-tight italic">
            DOHWA <span className="text-green-600 font-light not-italic text-lg ml-1 border-l pl-3 border-slate-300">Smart Farm Manager</span>
          </h1>
        </div>
        
        {/* 농장 선택 버튼 목록 */}
        <div className="flex flex-wrap gap-3">
          {farms.map((farm) => (
            <button
              key={farm.id}
              onClick={() => setSelectedFarm(farm)}
              className={`px-6 py-3 rounded-2xl font-bold transition-all border-2 shadow-sm ${
                selectedFarm?.id === farm.id 
                ? 'bg-green-600 text-white border-green-600 shadow-green-200 scale-105' 
                : 'bg-white text-slate-600 border-white hover:border-green-200 hover:bg-green-50'
              }`}
            >
              {farm.name}
            </button>
          ))}
        </div>
      </header>

      {selectedFarm ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
          
          {/* [좌측 컬럼] 농장 정보 & 건물 내역 */}
          <div className="space-y-8">
            {/* 기본 정보 카드 */}
            <section className="bg-white p-8 rounded-[32px] shadow-sm border border-slate-100">
              <div className="flex justify-between items-start mb-8">
                <div>
                  <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tighter mb-1">Farm Profile</h2>
                  <p className="text-xs text-slate-400 font-medium">Detailed contact & location info</p>
                </div>
                {selectedFarm.Drone_url && (
                  <a 
                    href={selectedFarm.Drone_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 bg-green-50 text-green-700 px-4 py-2 rounded-xl text-sm font-bold hover:bg-green-100 transition-all border border-green-100"
                  >
                    <ExternalLink size={16} /> 드론 뷰 웹 링크
                  </a>
                )}
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center gap-4 bg-slate-50/50 p-4 rounded-2xl border border-slate-50">
                  <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm text-slate-400"><MapPin size={18} /></div>
                  <span className="font-medium text-slate-700">{selectedFarm.address}</span>
                </div>
                <div className="flex items-center gap-4 bg-slate-50/50 p-4 rounded-2xl border border-slate-50">
                  <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm text-slate-400"><User size={18} /></div>
                  <span className="font-medium text-slate-700">{selectedFarm.manager_name} 소장</span>
                </div>
                <div className="flex items-center gap-4 bg-slate-50/50 p-4 rounded-2xl border border-slate-50">
                  <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm text-slate-400"><Phone size={18} /></div>
                  <span className="font-medium text-slate-700 font-mono">{selectedFarm.manager_contact}</span>
                </div>
              </div>
            </section>

            {/* 건물 리스트 카드 */}
            <section className="bg-white p-8 rounded-[32px] shadow-sm border border-slate-100">
              <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tighter mb-6 flex items-center gap-2">
                <Building2 className="text-green-600" size={24} /> Buildings
              </h2>
              <div className="space-y-3">
                {farmBuildings.length > 0 ? farmBuildings.map((b) => (
                  <div key={b.id} className="p-5 flex justify-between items-center bg-slate-50/50 rounded-2xl border border-slate-50 group hover:border-green-200 transition-all">
                    <div>
                      <p className="font-bold text-slate-800 group-hover:text-green-600 transition-colors">{b.building_name}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{b.room_count}돈방 · {b.description}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-black text-slate-900 text-lg">{b.total_area?.toLocaleString()}㎡</p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase">Approx. {Math.round(b.total_area / 3.305)} py</p>
                    </div>
                  </div>
                )) : <div className="py-10 text-center text-slate-300">건물 정보가 등록되지 않았습니다.</div>}
              </div>
            </section>
          </div>

          {/* [우측 컬럼] 위성 사진 & 현황도 */}
          <div className="space-y-8">
            {/* 카카오 위성 사진 카드 */}
            <section className="bg-white p-8 rounded-[32px] shadow-sm border border-slate-100 overflow-hidden">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tighter flex items-center gap-2">
                  <Globe className="text-blue-500" size={24} /> Satellite
                </h2>
                {!selectedFarm.latitude && <span className="text-[10px] bg-rose-50 text-rose-500 px-2 py-1 rounded-md font-bold uppercase">No GPS Data</span>}
              </div>
            <div className="aspect-[16/9] rounded-2xl overflow-hidden border border-slate-100 bg-slate-100 shadow-inner group">
  {getKakaoMapUrl(selectedFarm) ? (
    <img 
      src={getKakaoMapUrl(selectedFarm)} 
      alt="카카오 위성사진" 
      className="w-full h-full object-cover"
      onError={(e) => {
        // 풍경 사진(unsplash) 주소를 지우고 에러 로그만 남깁니다.
        e.target.style.border = "4px solid red"; 
        console.error("카카오 지도 호출 에러: 도메인 혹은 키를 확인하세요.");
      }}
    />
  ) : (
    <div className="w-full h-full flex items-center justify-center text-slate-300">
      좌표 데이터가 없습니다.
    </div>
  )}
</div>
            </section>

            {/* 부동산 현황도 카드 */}
            <section className="bg-white p-8 rounded-[32px] shadow-sm border border-slate-100">
              <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tighter mb-6 flex items-center gap-2">
                <Layout size={24} className="text-orange-400" /> Site Plan
              </h2>
              <div className="rounded-2xl overflow-hidden border border-slate-100 bg-slate-50 shadow-inner">
                {selectedFarm.status_map_url ? (
                  <img 
                    src={selectedFarm.status_map_url} 
                    alt="부동산 현황도" 
                    className="w-full h-auto" 
                  />
                ) : (
                  <div className="py-24 text-center text-slate-300 text-xs font-bold uppercase tracking-widest italic">No image registered</div>
                )}
              </div>
            </section>
          </div>
        </div>
      ) : (
        /* 초기 선택 전 화면 */
        <div className="mt-10 text-center py-40 bg-white rounded-[64px] border-2 border-dashed border-slate-200 flex flex-col items-center justify-center">
          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-200 mb-6 border border-slate-100">
            <Building2 size={32} />
          </div>
          <p className="text-slate-300 font-black text-2xl uppercase tracking-[0.2em] italic">Select Farm to Manage</p>
          <p className="text-slate-400 text-sm mt-2 font-medium">관리할 농장을 선택하여 상세 정보를 확인하세요.</p>
        </div>
      )}
    </main>
  );
}
