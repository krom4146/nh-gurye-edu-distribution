import React, { useState, useEffect } from 'react';
import { CheckSquare, Square } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import Loading from '../components/Loading';

import { useSettings } from '../context/SettingsContext';

const Bedding = () => {
    const { settings, loading } = useSettings();
    const [checked, setChecked] = useState({});

    if (loading) return <Loading />;

    const toggleCheck = (idx) => {
        setChecked(prev => ({ ...prev, [idx]: !prev[idx] }));
    };

    // Calculate dynamic checklist items (split by line)
    const checklistItems = settings?.checkout_checklist 
        ? settings.checkout_checklist.split('\n').filter(item => item.trim() !== '')
        : [];
        
    const images = [
        settings?.checkout_img_1,
        settings?.checkout_img_2,
        settings?.checkout_img_3,
        settings?.checkout_img_4,
    ].filter(Boolean); // Only truthy URLs

    return (
        <div className="space-y-6">
            <div className="bg-white/80 backdrop-blur-md p-6 rounded-xl shadow-sm border border-white/20">
                <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <CheckSquare className="text-nh-blue" />
                    퇴실 시 주의사항
                </h2>
                
                {settings?.checkout_banner_text && (
                    <div className="md:text-lg mb-6 whitespace-pre-wrap text-red-700 font-bold leading-relaxed p-4 bg-red-100/80 backdrop-blur-sm rounded-lg border border-red-200 text-center">
                        {settings.checkout_banner_text}
                    </div>
                )}

                {images.length > 0 && (
                    <div className="grid grid-cols-2 gap-3 mb-6">
                        {images.map((imgUrl, idx) => (
                            <div key={idx} className="rounded-lg overflow-hidden border border-gray-200/50 shadow-sm aspect-square bg-gray-50 flex items-center justify-center">
                                <img src={imgUrl} alt={`퇴실 안내 사진 ${idx + 1}`} className="w-full h-full object-cover" />
                            </div>
                        ))}
                    </div>
                )}

                {checklistItems.length > 0 && (
                    <div className="space-y-3">
                        {checklistItems.map((text, idx) => (
                            <button
                                key={idx}
                                onClick={() => toggleCheck(idx)}
                                className="w-full flex items-start gap-3 p-3 rounded-lg bg-white/60 hover:bg-white/90 shadow-sm border border-white/40 transition-colors text-left"
                            >
                                <div className={`mt-0.5 ${checked[idx] ? 'text-nh-green' : 'text-gray-400'}`}>
                                    {checked[idx] ? <CheckSquare size={24} /> : <Square size={24} />}
                                </div>
                                <span className={`font-medium ${checked[idx] ? 'line-through text-gray-400' : 'text-gray-800'}`}>
                                    {text.trim()}
                                </span>
                            </button>
                        ))}
                    </div>
                )}
            </div>

            <div className="text-center text-xs text-white/80 drop-shadow-md pb-4">
                모든 항목을 확인 후 퇴실해주세요.
            </div>
        </div>
    );
};

export default Bedding;
