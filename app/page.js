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

  // [작업 1] 카카오 지도 SDK 로드
  useEffect(() => {
    const kakaoKey = process.env.NEXT_PUBLIC_KAKAO_MAP_KEY;
    if (!kakaoKey) return;

    // 기존 스크립트 중복 방지
    const existingScript = document.getElementById('kakao-map-script');
    if (!existingScript) {
      const script = document.createElement("script");
      script.id = 'kakao-map-script';
      script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${kakaoKey}&autoload=false`;
      script.async = true;
      document.head.appendChild(script);

      script.onload = () => {
        if (selectedFarm?.latitude) {
          window.kakao.maps.load(() => renderMap(selectedFarm.latitude, selectedFarm.longitude));
        }
      };
    } else if (selectedFarm?.latitude && window.kakao && window.kakao.maps) {
      window.kakao.maps.load(() => renderMap(selectedFarm.latitude, selectedFarm.longitude));
    }
  }, [selectedFarm]);

  // [작업 2] 지도 렌더링 함수
  const renderMap = (lat, lng) => {
    const container = document.getElementById('kakao-map');
    if (!container || !window.kakao) return;
    
    const options = {
      center: new window.kakao.maps.LatLng(lat, lng),
      level: 3,
      mapTypeId: window.kakao.maps.MapTypeId.HYBRID
    };
    const map = new window.kakao.maps.Map(container, options);
    
    // 마커 추가 (선택 사항)
    const markerPosition = new window.kakao.maps.LatLng(lat, lng);
    const marker = new window.kakao.maps.Marker({ position: markerPosition });
    marker.setMap(map);
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
      <h1 className="text-3xl font-bold mb-8 text-center text-green-700">🐷 양돈 농장 관리 시스템</h1>

      {/* 농장 선택 버튼 목록: 사진 제거 및 버튼 스타일로 변경 */}
      <div className="flex flex-wrap justify-center gap-4 mb-12">
        {farms.map((farm) => (
          <button 
            key={farm.id} 
            onClick={() => handleFarmClick(farm)}
            className={`px-8 py-4 rounded-xl font-bold text-lg shadow-sm transition-all border-2 ${
              selectedFarm?.id === farm.id 
              ? 'bg-green-600 text-white border-green-600 scale-105 shadow-md' 
              : 'bg-white text-gray-700 border-white hover:border-green-300 hover:bg-green-50'
            }`}
          >
            {farm.name}
          </button>
        ))}
      </div>

      {selectedFarm && (
        <div className="max-w-5xl mx-auto bg-white p-8 rounded-2xl shadow-lg border border-gray-100">
          
          <div className="flex flex-col md:flex-row gap-8 mb-8">
            <div className="flex-1 relative">
              <img 
                src={selectedFarm.main_image_url} 
                className={`rounded-lg cursor-zoom-in transition-all duration-300 ${isZoomed ? 'fixed inset-0 m-auto z-50 scale-110 w-auto max-h-[85vh] shadow-2xl' : 'w-full h-64 object-cover'}`}
                onClick={() => setIsZoomed(!isZoomed)}
                alt="농장 이미지"
              />
              {isZoomed && <div className="fixed inset-0 bg-black/70 z-40" onClick={() => setIsZoomed(false)}></div>}
              <p className="text-xs text-gray-400 mt-2 text-center italic">사진 클릭 시 확대</p>
            </div>

            <div className="flex-1 space-y-4">
              <div className="flex justify-between items-center border-b-2 border-green-100 pb-2">
                <h2 className="text-3xl font-bold text-gray-800">{selectedFarm.name}</h2>
                {selectedFarm.Drone_url && (
                  <a href={selectedFarm.Drone_url} target="_blank" className="bg-blue-50 text-blue-600 px-3 py-1 rounded-lg text-xs font-bold hover:bg-blue-100 transition-colors">
                    🚁 드론 뷰 웹 링크
                  </a>
                )}
              </div>
              <div className="text-gray-700 space-y-3 pt-2">
                <p>📍 <b>주소:</b> {selectedFarm.address}</p>
                <p>👤 <b>농장장:</b> {selectedFarm.manager_name}</p>
                <p>📞 <b>연락처:</b> {selectedFarm.manager_contact}</p>
              </div>
            </div>
          </div>

          <hr className="my-10 border-gray-100" />

          {/* 위성 사진 및 부동산 현황도 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            <div>
              <h3 className="text-lg font-bold mb-4 text-blue-600 flex items-center gap-2">🌐 위성 사진 (Kakao)</h3>
              <div className="w-full aspect-video bg-gray-50 rounded-xl overflow-hidden border border-gray-100 shadow-inner">
                {selectedFarm.latitude ? (
                  <div id="kakao-map" className="w-full h-full"></div>
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm italic">좌표 정보가 없습니다.</div>
                )}
              </div>
            </div>
            <div>
              <h3 className="text-lg font-bold mb-4 text-orange-600 flex items-center gap-2">🗺️ 부동산 현황도</h3>
              <div className="w-full aspect-video bg-gray-50 rounded-xl overflow-hidden border border-gray-100 flex items-center justify-center shadow-inner">
                {selectedFarm.status_map_url ? (
                  <img src={selectedFarm.status_map_url} alt="현황도" className="w-full h-full object-contain p-2" />
                ) : (
                  <p className="text-gray-400 text-sm italic">현황도 이미지가 없습니다.</p>
                )}
              </div>
            </div>
          </div>

          {/* 건물 상세 내역 */}
          <div className="mt-10">
            <h3 className="text-xl font-bold mb-4 text-gray-800 border-l-4 border-green-50 pl-3">🏠 건물별 세부 내역</h3>
            <div className="overflow-x-auto rounded-xl border border-gray-100">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-green-50 text-green-800">
                    <th className="p-4 border-b">건물명</th>
                    <th className="p-4 border-b text-center">돈방 개수</th>
                    <th className="p-4 border-b text-center">세부 면적</th>
                    <th className="p-4 border-b">상세 설명</th>
                  </tr>
                </thead>
                <tbody>
                  {buildings.map((b) => (
                    <tr key={b.id} className="hover:bg-gray-50 transition-colors border-b last:border-0 border-gray-50">
                      <td className="p-4 font-bold text-gray-700">{b.building_name}</td>
                      <td className="p-4 text-center">{b.room_count}개</td>
                      <td className="p-4 text-center font-mono">{b.total_area?.toLocaleString()} m²</td>
                      <td className="p-4 text-gray-600 text-sm whitespace-pre-line leading-relaxed">{b.description}</td>
                    </tr>
                  ))}
                  {buildings.length === 0 && (
                    <tr>
                      <td colSpan="4" className="p-16 text-center text-gray-400 font-medium">등록된 건물 정보가 없습니다.</td>
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
