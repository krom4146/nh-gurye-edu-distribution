import React, { useState, useEffect } from 'react';
import { AlertTriangle, FileWarning, BookOpen } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import Loading from '../components/Loading';

const penalties = [
    { reason: '가. 교육원 내 무단음주 한 자', point: -6 },
    { reason: '나. 무단 결강자(시간당)', point: -2 },
    { reason: '다. 외출·외박 시 귀원 시간 무단 미준수자', point: -2 },
    { reason: '라. 고성방가 등 생활관 내에서 생활태도 불량자', point: -2 },
    { reason: '마. 각종 합동행사 무단 불참자', point: -2 },
    { reason: '바. 지시사항 불이행자', point: -2 },
    { reason: '사. 휴대전화 사용 등 학습태도 불량', point: -2 },
    { reason: '아. 금연구역에서의 흡연자', point: -2 },
    { reason: '자. 무단 지각자', point: -1 },
    { reason: '차. 복장불량자 (명찰 미패용, 슬리퍼 등)', point: -1 },
    { reason: '카. 생활관 사용(청소) 불량자 (침구미정리 등)', point: -1 },
    { reason: '타. 출석등록 미실시자', point: -1 },
];

import { useSettings } from '../context/SettingsContext';

const Rules = () => {
    const { settings, loading } = useSettings();

    if (loading) return <Loading />;

    return (
        <div className="space-y-6">
            {settings?.life_rules ? (
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <BookOpen className="text-nh-blue" />
                        생활 수칙 안내
                    </h2>
                    <div className="whitespace-pre-wrap text-gray-700 leading-relaxed font-medium">
                        {settings.life_rules}
                    </div>
                </div>
            ) : (
                <>
            {/* Warning Banner */}
            <div className="bg-red-50 border border-red-200 p-6 rounded-xl text-center">
                <AlertTriangle className="mx-auto text-red-600 mb-2" size={40} />
                <h2 className="text-xl font-bold text-red-700 mb-1">제17조 퇴교사유</h2>
                <div className="text-red-600 font-medium text-sm text-left inline-block mt-2 space-y-1">
                    <p>1. 생활성적 감점점수 10점 초과</p>
                    <p>2. 정당한 사유 없이 수업 거부</p>
                    <p>3. 고의로 교육질서를 문란케 한 자</p>
                    <p>4. 무단 외박·외출한 자</p>
                    <p>5. 도박, 절도, 폭력 행위를 한 자</p>
                </div>
            </div>

            {/* Penalty List */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 bg-gray-50 border-b border-gray-100 flex items-center gap-2">
                    <FileWarning className="text-gray-600" />
                    <h3 className="font-bold text-gray-800">벌점 기준표</h3>
                </div>
                <div className="overflow-x-auto">
                    <div className="divide-y divide-gray-100 min-w-max">
                        {penalties.map((item, index) => (
                            <div key={index} className="p-4 flex justify-between items-center gap-4 hover:bg-gray-50 transition-colors whitespace-nowrap">
                                <span className="text-gray-700 font-medium">{item.reason}</span>
                                <span className="text-red-600 font-bold bg-red-50 px-2 py-1 rounded text-sm">
                                    {item.point}점
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
                </>
            )}
        </div>
    );
};

export default Rules;
