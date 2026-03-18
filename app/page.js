'use client';
import { createClient } from '@supabase/supabase-js';
import { useEffect, useState } from 'react';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function FarmPage() {
  const [farms, setFarms] = useState([]);
  const [selectedFarm, setSelectedFarm] = useState(null);
  const [buildings, setBuildings] = useState([]);
  const [isZoomed, setIsZoomed] = useState(false);

  useEffect(() => {
    fetchFarms();
  }, []);

  // [작업 1] 카카오 지도 SDK 로드 (403 에러 방지를 위해 스크립트 방식 사용)
  useEffect(() => {
    const kakaoKey = process.env.NEXT_PUBLIC_KAKAO_MAP_KEY;
    if (!kakaoKey) return;

    const script = document.createElement("script");
    // autoload=false를 붙여야 안정적으로 로드됩니다.
    script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${kakaoKey}&autoload=false`;
    script.async = true;
    document.head.appendChild(script);

    script.onload = () => {
      window.kakao.maps.load(() => {
        if (selectedFarm?.latitude) {
          renderMap(selectedFarm.latitude, selectedFarm.longitude);
        }
      });
    };
  }, [selectedFarm]);

  // [작업 2] 지도 렌더링 함수
  const renderMap = (lat, lng) => {
    const container = document.getElementById('kakao-map');
    if (!container) return;
    
    const options = {
      center: new window.kakao.maps.LatLng(lat, lng),
      level: 3,
      mapTypeId: window.kakao.maps.MapTypeId.HYBRID // 위성+도로 혼합 모드
    };
    new window.kakao.maps.Map(container, options);
  };

  async function fetchFarms() {
    const { data, error } = await supabase.from('farms').select('*');
    if (error) console.error('Farms fetch error:', error);
    setFarms(data || []);
  }

  async function handleFarmClick(farm) {
    setSelectedFarm(farm);
    const { data, error } = await supabase
      .from('buildings')
      .select('*')
      .eq('farm_id', farm.id);
    if (error) console.error('Buildings fetch error:', error);
    setBuildings(data || []);
  }

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      {/* 제목: 이전 스타일 유지 */}
      <h1 className="text-3xl font-bold mb-8 text-center text-green-700">🐷 양돈 농장 관리 시스템</h1>

      {/* 농장 선택 그리드: 이전 스타일 유지 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
        {farms.map((farm) => (
          <div 
            key={farm.id} 
            onClick={() => handleFarmClick(farm)}
            className="cursor-pointer bg-white rounded-xl shadow-md overflow-hidden hover:ring-2 ring-green-500 transition-all"
          >
            <div className="w-full h-48 bg-gray-200 overflow-hidden">
              <img src={farm.main_image_url} alt={farm.name} className="w-full h-full object-cover" />
            </div>
            <div className="p-4 text-center font-bold text-xl">{farm.name}</div>
          </div>
        ))}
      </div>

      {selectedFarm && (
        <div className="max-w-5xl mx-auto bg-white p-8 rounded-2xl shadow-lg border border-gray-100">
          
          {/* 상단 농장 프로필 섹션 */}
          <div className="flex flex-col md:flex-row gap-8 mb-8">
            <div className="flex-1 relative">
              <img 
                src={selectedFarm.main_image_url} 
                className={`rounded-lg cursor-zoom-in transition-all duration-300 ${isZoomed ? 'fixed inset-0 m-auto z-50 scale-125 w-auto max-h-[80vh] shadow-2xl' : 'w-full'}`}
                onClick={() => setIsZoomed(!isZoomed)}
                alt="농장 이미지"
              />
              {isZoomed && <div className="fixed inset-0 bg-black/70 z-40" onClick={() => setIsZoomed(false)}></div>}
              <p className="text-sm text-gray-400 mt-2 text-center italic">사진 클릭 시 확대/축소</p>
            </div>

            <div className="flex-1 space-y-4">
              <div className="flex justify-between items-center border-b pb-2">
                <h2 className="text-3xl font-bold text-gray-800">{selectedFarm.name}</h2>
                {selectedFarm.Drone_url && (
                  <a href={selectedFarm.Drone_url} target="_blank" className="text-xs text-blue-500 underline font-bold">드론 뷰 보기</a>
                )}
              </div>
              <div className="text-gray-700 space-y-2">
                <p>📍 <b>주소:</b> {selectedFarm.address}</p>
                <p>👤 <b>농장장:</b> {selectedFarm.manager_name}</p>
                <p>📞 <b>연락처:</b> {selectedFarm.manager_contact}</p>
              </div>
            </div>
          </div>

          <hr className="my-10" />

          {/* 위성 사진 및 부동산 현황도 (이전 디자인 레이아웃 반영) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            <div>
              <h3 className="text-lg font-bold mb-4 text-blue-600">🌐 위성 사진 (Kakao)</h3>
              <div className="w-full aspect-video bg-gray-100 rounded-lg overflow-hidden border">
                {selectedFarm.latitude ? (
                  <div id="kakao-map" className="w-full h-full"></div>
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">좌표 없음</div>
                )}
              </div>
            </div>
            <div>
              <h3 className="text-lg font-bold mb-4 text-orange-600">🗺️ 부동산 현황도</h3>
              <div className="w-full aspect-video bg-gray-100 rounded-lg overflow-hidden border flex items-center justify-center">
                {selectedFarm.status_map_url ? (
                  <img src={selectedFarm.status_map_url} alt="현황도" className="w-full h-full object-contain" />
                ) : (
                  <p className="text-gray-400 text-sm">현황도 이미지 없음</p>
                )}
              </div>
            </div>
          </div>

          {/* 건물 상세 내역: 이전 스타일 유지 */}
          <div className="mt-10">
            <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">🏠 건물별 세부 내역</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse border border-gray-200">
                <thead>
                  <tr className="bg-green-50">
                    <th className="p-3 border border-gray-200">건물명</th>
                    <th className="p-3 border border-gray-200 text-center">돈방 개수</th>
                    <th className="p-3 border border-gray-200 text-center">세부 면적</th>
                    <th className="p-3 border border-gray-200">상세 설명</th>
                  </tr>
                </thead>
                <tbody>
                  {buildings.map((b) => (
                    <tr key={b.id} className="hover:bg-gray-50 transition-colors">
                      <td className="p-3 border border-gray-200 font-medium">{b.building_name}</td>
                      <td className="p-3 border border-gray-200 text-center">{b.room_count}개</td>
                      <td className="p-3 border border-gray-200 text-center">{b.total_area} m²</td>
                      <td className="p-3 border border-gray-200 text-gray-600 text-sm whitespace-pre-line">{b.description}</td>
                    </tr>
                  ))}
                  {buildings.length === 0 && (
                    <tr>
                      <td colSpan="4" className="p-10 text-center text-gray-400">등록된 건물 정보가 없습니다.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
