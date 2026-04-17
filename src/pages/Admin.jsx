import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

const Admin = () => {
    const [settings, setSettings] = useState({
        center_name: '',
        slogan: '',
        main_description: '',
        bg_image_url: '',
        operation_password: '', // 추가된 필드
        facility_map_url: '',
        facility_info_1: '',
        facility_info_2: '',
        facility_info_3: '',
        facility_info_4: '',
        facility_info_5: '',
        facility_info_6: '',
        facility_info_7: '',
        facility_info_8: '',
        meal_schedule: '',
        meal_guide: '',
        complaint_info: '',
        rest_rules: '',
        smoking_rules: '',
        life_rules: '',
        checkout_banner_text: '',
        checkout_img_1: '',
        checkout_img_2: '',
        checkout_img_3: '',
        checkout_img_4: '',
        checkout_checklist: '',
        outing_start_time: '18:00',
        outing_end_time: '22:55'
    });
    const [loading, setLoading] = useState(true);
    const [imageFile, setImageFile] = useState(null);
    const [facilityMapFile, setFacilityMapFile] = useState(null);
    const [checkoutImgFiles, setCheckoutImgFiles] = useState([null, null, null, null]);
    const [isSaving, setIsSaving] = useState(false);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [passwordInput, setPasswordInput] = useState('');

    useEffect(() => {
        fetchSettings();
    }, []);

    async function fetchSettings() {
        try {
            const { data, error } = await supabase
                .from('site_settings')
                .select('*')
                .single();

            if (data) setSettings(data);
        } catch (error) {
            console.error('Error loading settings:', error);
        } finally {
            setLoading(false);
        }
    }

    async function updateSettings() {
        setIsSaving(true);
        let finalBgImageUrl = settings.bg_image_url;

        if (imageFile) {
            const fileExt = imageFile.name.split('.').pop();
            const fileName = `${Math.random()}.${fileExt}`;
            const filePath = `backgrounds/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('images')
                .upload(filePath, imageFile);

            if (uploadError) {
                console.error(uploadError);
                alert('이미지 업로드에 실패했습니다.');
                setIsSaving(false);
                return;
            }

            const { data: { publicUrl } } = supabase.storage
                .from('images')
                .getPublicUrl(filePath);

            finalBgImageUrl = publicUrl;
        }

        let finalFacilityMapUrl = settings.facility_map_url;

        if (facilityMapFile) {
            const fileExt = facilityMapFile.name.split('.').pop();
            const fileName = `map_${Math.random()}.${fileExt}`;
            const filePath = `backgrounds/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('images')
                .upload(filePath, facilityMapFile);

            if (uploadError) {
                console.error(uploadError);
                alert('시설안내 조감도 이미지 업로드에 실패했습니다.');
                setIsSaving(false);
                return;
            }

            const { data: { publicUrl } } = supabase.storage
                .from('images')
                .getPublicUrl(filePath);

            finalFacilityMapUrl = publicUrl;
        }

        let finalCheckoutImgUrls = [
            settings.checkout_img_1,
            settings.checkout_img_2,
            settings.checkout_img_3,
            settings.checkout_img_4
        ];

        for (let i = 0; i < 4; i++) {
            if (checkoutImgFiles[i]) {
                const fileExt = checkoutImgFiles[i].name.split('.').pop();
                const fileName = `checkout_${i}_${Math.random()}.${fileExt}`;
                const filePath = `backgrounds/${fileName}`;

                const { error: uploadError } = await supabase.storage
                    .from('images')
                    .upload(filePath, checkoutImgFiles[i]);

                if (uploadError) {
                    console.error(uploadError);
                    alert(`퇴실안내 이미지 ${i+1} 업로드에 실패했습니다.`);
                    setIsSaving(false);
                    return;
                }

                const { data: { publicUrl } } = supabase.storage
                    .from('images')
                    .getPublicUrl(filePath);

                finalCheckoutImgUrls[i] = publicUrl;
            }
        }

        // id 컬럼은 자동 생성(GENERATED ALWAYS)이므로 전송되는 데이터에서 제외합니다.
        const { id, checkout_info, facility_info, ...dataToSave } = settings;
        const payload = {
            ...dataToSave,
            bg_image_url: finalBgImageUrl,
            facility_map_url: finalFacilityMapUrl,
            checkout_img_1: finalCheckoutImgUrls[0],
            checkout_img_2: finalCheckoutImgUrls[1],
            checkout_img_3: finalCheckoutImgUrls[2],
            checkout_img_4: finalCheckoutImgUrls[3]
        };

        const { error } = await supabase
            .from('site_settings')
            .update(payload)
            .eq('id', 1); // 항상 1번 행을 업데이트 하도록 고정

        if (error) {
            alert('저장 중 오류가 발생했습니다.');
        } else {
            setSettings({ id: 1, ...payload });
            setSettings({ id: 1, ...payload });
            setImageFile(null); // Clear selected files after save
            setFacilityMapFile(null);
            setCheckoutImgFiles([null, null, null, null]);
            alert('성공적으로 저장되었습니다!');
        }
        setIsSaving(false);
    }

//  if (loading) return <div className="p-8 font-medium text-gray-600">데이터를 불러오는 중...</div>;

    const handleLogin = (e) => {
        e.preventDefault();
        const expectedPwd = import.meta.env.VITE_ADMIN_PASSWORD;
        if (passwordInput === expectedPwd) {
            setIsAuthenticated(true);
        } else {
            alert('비밀번호가 일치하지 않습니다.');
        }
    };

    if (!isAuthenticated) {
        return (
            <div className="min-h-[80vh] flex items-center justify-center p-4">
                <form onSubmit={handleLogin} className="bg-white/90 backdrop-blur-md p-8 rounded-xl shadow-lg border border-white/20 max-w-sm w-full">
                    <h2 className="text-xl font-bold text-gray-800 mb-6 text-center">관리자 로그인</h2>
                    <input
                        type="password"
                        placeholder="비밀번호를 입력하세요"
                        value={passwordInput}
                        onChange={(e) => setPasswordInput(e.target.value)}
                        className="w-full border border-gray-300 rounded-md p-3 mb-4 focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                    <button type="submit" className="w-full bg-blue-600 text-white font-bold py-3 rounded-md hover:bg-blue-700 transition shadow-md">
                        확인
                    </button>
                </form>
            </div>
        );
    }

    if (loading) return <div className="p-8 font-medium text-gray-600">데이터를 불러오는 중...</div>;

    return (
        <div className="p-8 max-w-2xl mx-auto space-y-6">
            <h1 className="text-2xl font-bold mb-2">🚩 교육원 앱 관리자 페이지</h1>

            {/* 앱 기본 설정 */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <h2 className="text-xl font-bold text-gray-800 mb-4 border-b border-gray-100 pb-2">앱 기본 설정</h2>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">교육원 명칭</label>
                        <input
                            type="text"
                            className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                            value={settings.center_name}
                            onChange={(e) => setSettings({ ...settings, center_name: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">메인 슬로건</label>
                        <input
                            type="text"
                            className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                            value={settings.slogan || ''}
                            onChange={(e) => setSettings({ ...settings, slogan: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">메인 상세 설명(긴 문구)</label>
                        <textarea
                            className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                            rows="3"
                            value={settings.main_description || ''}
                            onChange={(e) => setSettings({ ...settings, main_description: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">배경 이미지 업로드</label>
                        {settings.bg_image_url && (
                            <div className="mb-2">
                                <img src={settings.bg_image_url} alt="현재 배경" className="h-32 w-auto object-cover rounded shadow-sm border border-gray-200" />
                                <p className="text-xs text-gray-500 mt-1">현재 적용된 이미지</p>
                            </div>
                        )}
                        <input
                            type="file"
                            accept="image/*"
                            className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 border border-gray-300 rounded-md p-2"
                            onChange={(e) => setImageFile(e.target.files[0])}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">외출/외박 신청 시작 시간</label>
                            <input
                                type="time"
                                className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                                value={settings.outing_start_time || '18:00'}
                                onChange={(e) => setSettings({ ...settings, outing_start_time: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">외출/외박 신청 종료 시간</label>
                            <input
                                type="time"
                                className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                                value={settings.outing_end_time || '22:55'}
                                onChange={(e) => setSettings({ ...settings, outing_end_time: e.target.value })}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">관리자 운영 비밀번호 (외출/건의사항 등)</label>
                        <input
                            type="text"
                            className="mt-1 block w-full border border-gray-300 rounded-md p-2 bg-yellow-50"
                            value={settings.operation_password || ''}
                            onChange={(e) => setSettings({ ...settings, operation_password: e.target.value })}
                            placeholder="운영 비밀번호를 입력해주세요"
                        />
                        <p className="text-xs text-gray-500 mt-1">* '/admin' 비밀번호와 별개로, 앱 내 관리자 기능 사용 시 요구되는 비번입니다.</p>
                    </div>
                </div>
            </div>

            {/* 시설안내 설정 */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <h2 className="text-xl font-bold text-gray-800 mb-4 border-b border-gray-100 pb-2">시설안내 설정 (조감도 및 범례)</h2>
                <div className="space-y-4">
                    <div className="mb-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">조감도 이미지 업로드</label>
                        {settings.facility_map_url && (
                            <div className="mb-2">
                                <img src={settings.facility_map_url} alt="현재 조감도" className="h-40 w-auto object-cover rounded shadow-sm border border-gray-200" />
                                <p className="text-xs text-gray-500 mt-1">현재 적용된 조감도</p>
                            </div>
                        )}
                        <input
                            type="file"
                            accept="image/*"
                            className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100 border border-gray-300 rounded-md p-2"
                            onChange={(e) => setFacilityMapFile(e.target.files[0])}
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        {[1, 2, 3, 4, 5, 6, 7, 8].map((num) => (
                            <div key={num}>
                                <label className="block text-sm font-medium text-gray-700">[{num}] 마커 설명</label>
                                <textarea
                                    className="mt-1 block w-full border border-gray-300 rounded-md p-2 text-sm"
                                    rows="2"
                                    value={settings[`facility_info_${num}`] || ''}
                                    onChange={(e) => setSettings({ ...settings, [`facility_info_${num}`]: e.target.value })}
                                    placeholder={`${num}번 시설 설명을 입력하세요`}
                                />
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* 생활안내 설정 */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <h2 className="text-xl font-bold text-gray-800 mb-4 border-b border-gray-100 pb-2">생활안내 설정</h2>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">식사 시간표</label>
                        <textarea
                            className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                            value={settings.meal_schedule || ''}
                            onChange={(e) => setSettings({ ...settings, meal_schedule: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">식사 가이드</label>
                        <textarea
                            className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                            value={settings.meal_guide || ''}
                            onChange={(e) => setSettings({ ...settings, meal_guide: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">불편사항 접수</label>
                        <textarea
                            className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                            value={settings.complaint_info || ''}
                            onChange={(e) => setSettings({ ...settings, complaint_info: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">휴식/정숙</label>
                        <textarea
                            className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                            value={settings.rest_rules || ''}
                            onChange={(e) => setSettings({ ...settings, rest_rules: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">흡연 구역 안내</label>
                        <textarea
                            className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                            value={settings.smoking_rules || ''}
                            onChange={(e) => setSettings({ ...settings, smoking_rules: e.target.value })}
                        />
                    </div>
                </div>
            </div>

            {/* 생활수칙 설정 */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <h2 className="text-xl font-bold text-gray-800 mb-4 border-b border-gray-100 pb-2">생활수칙 설정</h2>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">생활 수칙 (벌점 기준표 등)</label>
                        <textarea
                            className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                            rows="6"
                            value={settings.life_rules || ''}
                            onChange={(e) => setSettings({ ...settings, life_rules: e.target.value })}
                        />
                    </div>
                </div>
            </div>

            {/* 퇴실 안내 설정 */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <h2 className="text-xl font-bold text-gray-800 mb-4 border-b border-gray-100 pb-2">퇴실 안내 설정</h2>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">배너 문구</label>
                        <input
                            type="text"
                            className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                            value={settings.checkout_banner_text || ''}
                            onChange={(e) => setSettings({ ...settings, checkout_banner_text: e.target.value })}
                            placeholder="예: 퇴실 전 아래 항목들을 꼭 확인해주세요!"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">안내 사진 업로드 (최대 4장)</label>
                        <div className="grid grid-cols-2 gap-4">
                            {[0, 1, 2, 3].map((idx) => (
                                <div key={idx} className="p-3 border border-gray-200 rounded-lg bg-gray-50">
                                    <span className="text-xs font-bold text-gray-600 block mb-2">사진 {idx + 1}</span>
                                    {settings[`checkout_img_${idx+1}`] && (
                                        <img src={settings[`checkout_img_${idx+1}`]} alt={`미리보기 ${idx+1}`} className="w-full h-24 object-cover rounded mb-2" />
                                    )}
                                    <input
                                        type="file"
                                        accept="image/*"
                                        className="w-full text-xs"
                                        onChange={(e) => {
                                            const newFiles = [...checkoutImgFiles];
                                            newFiles[idx] = e.target.files[0];
                                            setCheckoutImgFiles(newFiles);
                                        }}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">체크리스트 관리</label>
                        <p className="text-xs text-gray-500 mb-1">엔터(줄바꿈)로 각 항목을 구분하여 입력하세요.</p>
                        <textarea
                            className="mt-1 block w-full border border-gray-300 rounded-md p-2 text-sm"
                            rows="5"
                            value={settings.checkout_checklist || ''}
                            onChange={(e) => setSettings({ ...settings, checkout_checklist: e.target.value })}
                            placeholder="1. 이불 (전체 배출)&#13;&#10;2. 개인 소지품 확인"
                        />
                    </div>
                </div>
            </div>

            <button
                onClick={updateSettings}
                disabled={isSaving}
                className={`w-full font-bold py-3 rounded-md transition text-white shadow-md ${isSaving ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 hover:shadow-lg'}`}
            >
                {isSaving ? '이미지 업로드 및 설정 저장 중...' : '설정 저장하기'}
            </button>
        </div>
    );
};

export default Admin;