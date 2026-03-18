'use client';
import { createClient } from '@supabase/supabase-js';
import { useEffect, useState } from 'react';
import { Globe, ExternalLink, Layout, MapPin, User, Phone, Building2 } from 'lucide-react';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function FarmPage() {
  const [farms, setFarms] = useState([]);
  const [selectedFarm, setSelectedFarm] = useState(null);
  const [buildings, setBuildings] = useState([]);
  const [isZoomed, setIsZoomed] = useState(false);
  const [map, setMap] = useState(null); // 카카오 지도 객체 저장용

  useEffect(() => {
    fetchFarms();
  }, []);

  // ---------------------------------------------------------
  // [작업 1] 카카오 지도 SDK 로드 및 초기화
  // ---------------------------------------------------------
  useEffect(() => {
    // 1. 스크립트 태그 생성
    const script = document.createElement("script");
    script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${process.env.NEXT_PUBLIC_KAKAO_MAP_KEY}&autoload=false`;
    script.async = true;
    document.head.appendChild(script);

    script.onload = () => {
      // 2. SDK 로드 완료 후 실행
      window.kakao.maps.load(() => {
        if (selectedFarm?.latitude && !map) {
          const container = document.getElementById('kakao-map');
          const options = {
            center: new window.kakao.maps.LatLng(selectedFarm.latitude, selectedFarm.longitude),
            level: 3,
            mapTypeId: window.kakao.maps.MapTypeId.HYBRID // 위성+도로명 모드
          };
          const newMap = new window.kakao.maps.Map(container, options);
          setMap(newMap);
        }
      });
    };
  }, [selectedFarm]);

  // ---------------------------------------------------------
  // [작업 2] 농장 선택 시 지도 위치 업데이트
  // ---------------------------------------------------------
  useEffect(() => {
    if (map && selectedFarm?.latitude) {
      const moveLatLon = new window.kakao.maps.LatLng(selectedFarm.latitude, selectedFarm.longitude);
      map.setCenter(moveLatLon);
      map.setMapTypeId(window.kakao.maps.MapTypeId.HYBRID);
    }
  }, [selectedFarm, map]);

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

      {/* 농장 리스트 그리드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
        {farms.map((farm) => (
          <div 
            key={farm.id} 
            onClick={() => handleFarmClick(farm)}
            className={`cursor-pointer bg-white rounded-xl shadow-md overflow-hidden hover:ring-2 ring-green-500 transition-all ${selectedFarm?.id === farm.id ? 'ring-2 ring-green-600' : ''}`}
          >
            <div className="w-full h-48 bg-gray-200 overflow-hidden">
              <img src={farm.main_image_url} alt={farm.name} className="w-full h-full object-cover" />
            </div>
            <div className="p-4 text-center font-bold text-xl">{farm.name}</div>
          </div>
        ))}
      </div>

      {selectedFarm && (
        <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
          
          {/* 상단 정보 영역: 기본정보 + 위성사진 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* [작업 3] 기본 정보 카드 */}
            <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100 space-y-6">
              <div className="flex justify-between items-start">
                <h2 className="text-3xl font-bold text-gray-800 border-b-4 border-green-500 pb-1">{selectedFarm.name}</h2>
                {/* 드론 뷰 링크 버튼 */}
                {selectedFarm.Drone_url && (
                  <a 
                    href={selectedFarm.Drone_url} 
                    target="_blank" 
                    className="flex items-center gap-1.5 bg-blue-50 text-blue-600 px-4 py-2 rounded-xl text-sm font-bold hover:bg-blue-100 transition-all"
                  >
                    <ExternalLink size={16} /> 드론 뷰
                  </a>
                )}
              </div>

              <div className="text-gray-700 space-y-4 pt-2">
                <p className="flex items-center gap-3">
                  <MapPin className="text-gray-400" size={20} /> <b>주소:</b> {selectedFarm.address}
                </p>
                <p className="flex items-center gap-3">
                  <User className="text-gray-400" size={20} /> <b>농장장:</b> {selectedFarm.manager_name}
                </p>
                <p className="flex items-center gap-3">
                  <Phone className="text-gray-400" size={20} /> <b>연락처:</b> {selectedFarm.manager_contact}
                </p>
              </div>

              {/* 메인 이미지 확대 기능 */}
              <div className="relative pt-4">
                <img 
                  src={selectedFarm.main_image_url} 
                  className={`rounded-lg cursor-zoom-in transition-all duration-300 ${isZoomed ? 'fixed inset-0 m-auto z-50 scale-110 w-auto max-h-[90vh] shadow-2xl' : 'w-full h-48 object-cover'}`}
                  onClick={() => setIsZoomed(!isZoomed)}
                  alt="농장 이미지"
                />
                {isZoomed && <div className="fixed inset-0 bg-black/70 z-40" onClick={() => setIsZoomed(false)}></div>}
                {!isZoomed && <p className="text-[10px] text-gray-400 mt-2 text-right italic">사진 클릭 시 확대</p>}
              </div>
            </div>

            {/* [작업 4] 카카오 위성지도 카드 */}
            <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Globe className="text-blue-500" size={22} /> 위성 사진 (Kakao)
              </h3>
              <div className="aspect-video bg-gray-100 rounded-xl overflow-hidden border border-gray-200">
                {selectedFarm.latitude ? (
                  <div id="kakao-map" className="w-full h-full" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">좌표 데이터가 없습니다.</div>
                )}
              </div>
            </div>
          </div>

          {/* 하단 영역: 건물 리스트 + 부동산 현황도 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* [작업 5] 건물별 세부 내역 테이블 */}
            <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100">
              <h3 className="text-xl font-bold mb-6 flex items-center gap-2 uppercase tracking-tight">
                <Building2 className="text-green-600" size={22} /> 상세 건물 내역
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-widest">
                      <th className="p-3 border-b">건물명</th>
                      <th className="p-3 border-b text-center">돈방</th>
                      <th className="p-3 border-b text-center">면적</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    {buildings.map((b) => (
                      <tr key={b.id} className="hover:bg-green-50 transition-colors border-b border-gray-50">
                        <td className="p-3 font-semibold text-gray-800">{b.building_name}</td>
                        <td className="p-3 text-center">{b.room_count}개</td>
                        <td className="p-3 text-center font-mono">{b.total_area} m²</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* [작업 6] 부동산 현황도 카드 */}
            <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100">
              <h3 className="text-xl font-bold mb-6 flex items-center gap-2 uppercase tracking-tight">
                <Layout className="text-orange-500" size={22} /> 부동산 현황도
              </h3>
              <div className="rounded-xl overflow-hidden border border-gray-100 bg-gray-50">
                {selectedFarm.status_map_url ? (
                  <img src={selectedFarm.status_map_url} alt="현황도" className="w-full h-auto shadow-inner" />
                ) : (
                  <div className="py-20 text-center text-gray-300 italic text-sm">등록된 현황도 이미지가 없습니다.</div>
                )}
              </div>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
