// farm-admin/app/page.js 에 저장할 최종 코드
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

async function fetchFarms() {
    const { data, error } = await supabase.from('farms').select('*');
    
    // 이 두 줄을 추가해서 브라우저 콘솔(F12)을 다시 확인해 보세요.
    console.log("가져온 데이터:", data);
    if (error) console.log("에러 발생:", error);
    
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
      {/* text-3-xl을 text-3xl로 수정했습니다 */}
      <h1 className="text-3xl font-bold mb-8 text-center text-green-700">🐷 다비육종 농장 관리 시스템</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
        {farms.map((farm) => (
          <div 
            key={farm.id} 
            onClick={() => handleFarmClick(farm)}
            className="cursor-pointer bg-white rounded-xl shadow-md overflow-hidden hover:ring-2 ring-green-500 transition-all"
          >
            {/* 이미지가 없을 경우를 대비해 기본 UI 처리 */}
            <div className="w-full h-48 bg-gray-200 overflow-hidden">
              <img src={farm.main_image_url} alt={farm.name} className="w-full h-full object-cover" />
            </div>
            <div className="p-4 text-center font-bold text-xl">{farm.name}</div>
          </div>
        ))}
      </div>

      {selectedFarm && (
        <div className="max-w-5xl mx-auto bg-white p-8 rounded-2xl shadow-lg border border-gray-100">
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
              <h2 className="text-3xl font-bold text-gray-800 border-b pb-2">{selectedFarm.name}</h2>
              <div className="text-gray-700 space-y-2">
                <p>📍 <b>주소:</b> {selectedFarm.address}</p>
                <p>👤 <b>농장장:</b> {selectedFarm.manager_name}</p>
                <p>📞 <b>연락처:</b> {selectedFarm.manager_contact}</p>
              </div>
            </div>
          </div>

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
                      <td className="p-3 border border-gray-200 text-center">{b.total_area?.toLocaleString()} m²</td>
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
