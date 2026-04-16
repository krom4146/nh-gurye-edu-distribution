import React, { useState, useEffect } from 'react';
import { MapPin } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import Loading from '../components/Loading';
import facilityMap from '../assets/facility_map.jpg';

const markerColors = [
    'bg-blue-100 text-blue-700',
    'bg-yellow-100 text-yellow-700',
    'bg-green-100 text-green-700',
    'bg-purple-100 text-purple-700',
    'bg-orange-100 text-orange-700',
    'bg-red-100 text-red-700',
    'bg-teal-100 text-teal-700',
    'bg-indigo-100 text-indigo-700'
];

import { useSettings } from '../context/SettingsContext';


const Facility = () => {
    const { settings, loading } = useSettings();

    if (loading) return <Loading />;

    return (
        <div className="space-y-6">
            <div className="bg-white/80 backdrop-blur-md rounded-xl shadow-sm border border-white/20 overflow-hidden">
                <img 
                    src={settings?.facility_map_url || facilityMap} 
                    alt="시설 안내도" 
                    className="w-full h-auto object-cover opacity-90" 
                />
            </div>

            <div className="grid grid-cols-1 gap-3">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((num, i) => {
                    const infoText = settings?.[`facility_info_${num}`];
                    // 만약 DB 값이 비어있다면 해당 카드는 화면에 나타나지 않게 처리
                    if (!infoText || infoText.trim() === '') return null;

                    return (
                        <div key={num} className="flex items-center p-4 bg-white/80 backdrop-blur-md rounded-lg shadow-sm border border-white/20 transition-all hover:bg-white/90">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg mr-4 shrink-0 ${markerColors[i]}`}>
                                {num}
                            </div>
                            <div className="text-sm font-medium text-gray-800 whitespace-pre-wrap leading-relaxed">
                                {infoText}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default Facility;
