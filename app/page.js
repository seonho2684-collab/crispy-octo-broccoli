// app/page.js
"use client";

import { createClient } from '@supabase/supabase-js'
import { useState, useEffect } from 'react'
import { MapPin, User, Phone, X } from 'lucide-react'

// Supabase 클라이언트 설정 (반드시 자신의 Key로 변경하세요)
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export default function Home() {
  const [farms, setFarms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedFarm, setSelectedFarm] = useState(null); // 선택된 농장을 저장하는 State

  useEffect(() => {
    async function fetchFarms() {
      try {
        const { data, error } = await supabase.from('farms').select('*');
        if (error) throw error;
        setFarms(data || []);
      } catch (error) {
        console.error('농장 정보를 가져오는 중 에러 발생:', error.message);
      } finally {
        setLoading(setFarms);
      }
    }
    fetchFarms();
  }, []);

  if (loading) return <div className="p-10 text-center">로딩 중...</div>;

  return (
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

      {/* 1. 농장 상세 화면 (선택된 농장이 있을 때) */}
      {selectedFarm ? (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
          
          {/* 왼쪽: 기존 정보와 드론 사진 */}
          <div className="space-y-10">
            <section className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
              <h2 className="text-2xl font-bold mb-6">농장 기본 정보</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-gray-700">
                <div className="flex items-center gap-3"><MapPin className="text-green-600" /> 주소: {selectedFarm.address}</div>
                <div className="flex items-center gap-3"><User className="text-green-600" /> 관리자: {selectedFarm.manager_name}</div>
                <div className="flex items-center gap-3"><Phone className="text-green-600" /> 연락처: {selectedFarm.manager_contact}</div>
              </div>
            </section>

            <section className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
              <h2 className="text-2xl font-bold mb-6">농장 드론뷰 (배치도)</h2>
              <div className="aspect-[16/10] bg-gray-100 rounded-2xl overflow-hidden border border-gray-200">
                <img src={selectedFarm.main_image_url} alt={`${selectedFarm.name} 드론뷰`} className="w-full h-full object-cover" />
              </div>
            </section>
          </div>

          {/* 오른쪽: 건축물 대장 이미지 (image_0.png) */}
          <section className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm xl:sticky xl:top-10 h-fit">
            <h2 className="text-2xl font-bold mb-6">건축물 대장 및 세부 면적 요약</h2>
            <div className="border border-gray-200 rounded-2xl overflow-hidden shadow-inner bg-gray-50">
              {/* 실제 배포 시, 이 농장에 맞는 첨부 이미지 URL을 Supabase에 저장해서 가져와야 합니다. */}
              {/* 임시로 Unsplash 이미지를 사용합니다. */}
              <img 
                src="https://images.unsplash.com/photo-1594911771131-016259068098?q=80&w=1200" 
                alt="건축물 대장 첨부 이미지" 
                className="w-full h-auto"
              />
            </div>
            <p className="text-xs text-gray-400 mt-4 text-center">※ 이미지 내용은 Supabase에서 관리됩니다.</p>
          </section>

        </div>
      ) : (
        
        // 2. 메인 화면 (농장 목록)
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {farms.map((farm) => (
            <div 
              key={farm.id}
              onClick={() => setSelectedFarm(farm)} // 클릭 시 상세 화면으로 전환
              className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all cursor-pointer group"
            >
              <div className="aspect-video bg-gray-100 rounded-xl mb-5 overflow-hidden border border-gray-100">
                <img src={farm.main_image_url} alt={farm.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
              </div>
              <h3 className="text-2xl font-bold text-gray-950 mb-2">{farm.name}</h3>
              <p className="text-gray-600 text-sm line-clamp-1 flex items-center gap-1.5"><MapPin size={14} /> {farm.address}</p>
              <div className="mt-5 text-sm font-semibold text-green-600">상세 정보 보기 →</div>
            </div>
          ))}
        </div>
      )}
    </main>
  )
}
