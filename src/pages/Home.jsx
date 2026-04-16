import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Map, BookOpen, AlertCircle, CheckSquare, Coffee } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import Loading from '../components/Loading';

const MenuItem = ({ icon, label, to, color }) => {
    const navigate = useNavigate();
    const Icon = icon;
    return (
        <button
            onClick={() => navigate(to)}
            className="flex flex-col items-center justify-center p-6 bg-white/70 backdrop-blur-md rounded-xl shadow-sm hover:shadow-md transition-all active:scale-95 border border-gray-100 aspect-square"
        >
            <div className={`p-3 rounded-full ${color} text-white mb-3`}>
                <Icon size={32} />
            </div>
            <span className="font-medium text-gray-800 text-sm sm:text-base">{label}</span>
        </button>
    );
};


import { useSettings } from '../context/SettingsContext';


const Home = () => {
    const { settings, loading } = useSettings();

    if (loading) return <Loading />;

    return (
        <div className="space-y-6">
            {/* Banner Area */}
            <div className="text-center py-10 px-6 bg-black/40 backdrop-blur-md rounded-2xl shadow-xl border border-white/20 mb-8 mt-4">
                <div className="space-y-4">
                    <h2 className="text-2xl sm:text-3xl font-extrabold text-white drop-shadow-lg tracking-tight leading-snug whitespace-pre-wrap break-keep">
                        {settings?.slogan || '농협교육원에 오신 것을\n환영합니다'}
                    </h2>
                    <p className="text-sm sm:text-base text-gray-100 leading-loose whitespace-pre-wrap font-medium drop-shadow-md break-keep">
                        {settings?.main_description || '이곳에 교육원의 상세 설명이나 환영 문구가 표시됩니다.\n원하시는 내용을 관리자 페이지에서 입력해 주세요.'}
                    </p>
                </div>
            </div>

            {/* Main Menu Area */}
            <div className="space-y-4">

                {/* Grid Menu */}
                <div className="grid grid-cols-2 gap-4">
                    <MenuItem
                        icon={LogOut}
                        label="외출/외박 신청"
                        to="/outing"
                        color="bg-nh-blue"
                    />
                    <MenuItem
                        icon={Map}
                        label="시설 안내"
                        to="/facility"
                        color="bg-nh-green"
                    />
                    <MenuItem
                        icon={Coffee}
                        label="생활 안내"
                        to="/life"
                        color="bg-orange-400"
                    />
                    <MenuItem
                        icon={BookOpen}
                        label="생활 수칙"
                        to="/rules"
                        color="bg-red-500"
                    />
                    <MenuItem
                        icon={CheckSquare}
                        label="퇴실시 주의사항"
                        to="/bedding"
                        color="bg-indigo-500"
                    />
                    <MenuItem
                        icon={AlertCircle}
                        label="건의사항"
                        to="/suggestions"
                        color="bg-pink-500"
                    />
                </div>
            </div>
        </div>
    );
};

export default Home;
