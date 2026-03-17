"use client";

import { createClient } from '@supabase/supabase-js'
import { useState, useEffect } from 'react'
import { MapPin, User, Phone, X } from 'lucide-react'

// 환경 변수 체크 (에러 방지)
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export default function Home() {
  const [farms, setFarms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedFarm, setSelectedFarm] = useState(null);
  const [isClient, setIsClient] = useState(false); // 클라이언트 렌더링 확인용

  // 1. 서버-클라이언트 불일치(Hydration) 에러 방지
  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    async function fetchFarms() {
      if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
        console.error("환경 변수가 설정되지 않았습니다.");
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase.from('farms').select('*');
        if (error) throw error;
        setFarms(data || []);
      } catch (error) {
        console.error('데이터 조회 오류:', error.message);
      } finally {
        setLoading(false);
      }
    }
    
    if (isClient) fetchFarms();
  }, [isClient]);

  // 클라이언트가 아니면 빈 화면 반환 (에러 방지 핵심)
  if (!isClient) return <div className="p-10 text-center">준비 중...</div>;
  if (loading) return <div className="p-10 text-center text-gray-500">농장 정보를 불러오는 중입니다...</div>;

  return (
    <main className="min-h-screen bg-gray-50 p-6 md:p-10 text-gray-900">
      <header className="flex items-center justify-between pb-8 mb-10 border-b border-gray-200">
        <h1 className="text-3xl font-extrabold tracking-tight">
          양돈 농장 <span className="text-green-600">관리 시스템</span>
        </h1>
        {selectedFarm && (
          <button 
            onClick={() => setSelectedFarm(null)}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 hover:bg-gray-50 rounded-full text-sm font-medium shadow-sm"
          >
            <X size={16} /> 목록으로
          </button>
        )}
      </header>

      {/* 농장 상세 화면 */}
      {selectedFarm ? (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
          <div className="space-y-8">
            <section className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
              <h2 className="text-2xl font-bold mb-6">기본 정보</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-center gap-3"><MapPin className="text-green-600" size={20} /> {selectedFarm.address}</div>
                <div className="flex items-center gap-3"><User className="text-green-600" size={20} /> {selectedFarm.manager_name}</div>
                <div className="flex items-center gap-3"><Phone className="text-green-600" size={20} /> {selectedFarm.manager_contact}</div>
              </div>
            </section>
            
            <section className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
              <h2 className="text-2xl font-bold mb-6">드론 뷰</h2>
              <img src={selectedFarm.main_image_url} alt="농장 전경" className="w-full h-auto rounded-xl" />
            </section>
          </div>

          <section className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm h-fit">
            <h2 className="text-2xl font-bold mb-6">건축물 현황도</h2>
            <img 
              src={selectedFarm.record_image_url || "https://images.unsplash.com/photo-1541888946425-d81bb19480c5?q=80&w=800"} 
              alt="현황도" 
              className="w-full h-auto rounded-xl border border-gray-100"
            />
          </section>
        </div>
      ) : (
        /* 농장 목록 화면 */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {farms.length > 0 ? (
            farms.map((farm) => (
              <div 
                key={farm.id}
                onClick={() => setSelectedFarm(farm)}
                className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all cursor-pointer group"
              >
                <div className="aspect-video bg-gray-50 rounded-2xl mb-5 overflow-hidden border border-gray-100">
                  <img src={farm.main_image_url} alt={farm.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                </div>
                <h3 className="text-2xl font-bold mb-2">{farm.name}</h3>
                <p className="text-gray-500 text-sm truncate">{farm.address}</p>
              </div>
            ))
          ) : (
            <div className="col-span-full p-20 text-center bg-white rounded-3xl border border-dashed border-gray-200 text-gray-400">
              등록된 농장 정보가 없습니다. Supabase를 확인해 주세요.
            </div>
          )}
        </div>
      )}
    </main>
  )
}
