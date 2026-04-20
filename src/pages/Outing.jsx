import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import { format } from 'date-fns';
import { Lock, LogOut, CheckCircle, RefreshCw } from 'lucide-react';
import Loading from '../components/Loading';
import { useSettings } from '../context/SettingsContext';

const Outing = () => {
    const [isAdmin, setIsAdmin] = useState(false);
    const [password, setPassword] = useState('');
    const [showAdminLogin, setShowAdminLogin] = useState(false);

    // Current Request State
    const [currentRequestId, setCurrentRequestId] = useState(() => {
        return localStorage.getItem('current_request_id');
    });
    const [currentRequestData, setCurrentRequestData] = useState(null);

    // Form State
    const [formData, setFormData] = useState({
        studentId: '',
        name: '',
        type: '외출', // 외출 or 외박
        destination: ''
    });

    const [outings, setOutings] = useState([]);
    const [loading, setLoading] = useState(true);

    const { settings } = useSettings();

    // Time Restriction Check
    const isTimeAllowed = () => {
        const startTimeStr = settings?.outing_start_time || '18:00';
        const endTimeStr = settings?.outing_end_time || '22:55';

        const [startH, startM] = startTimeStr.split(':').map(Number);
        const [endH, endM] = endTimeStr.split(':').map(Number);

        const startTotal = startH * 60 + startM;
        const endTotal = endH * 60 + endM;

        const now = new Date();
        const currentTime = now.getHours() * 60 + now.getMinutes();

        let allowed = false;
        if (startTotal <= endTotal) {
            // Same day range (e.g., 18:00 - 22:55)
            allowed = currentTime >= startTotal && currentTime <= endTotal;
        } else {
            // Overnight range (e.g., 22:00 - 08:00 next day)
            allowed = currentTime >= startTotal || currentTime <= endTotal;
        }

        return {
            allowed,
            start: startTimeStr,
            end: endTimeStr
        };
    };

    // Fetch current request status if ID exists
    useEffect(() => {
        if (!supabase) {
            console.error("Supabase client not initialized");
            return;
        }
        const fetchCurrentRequest = async () => {
            if (!currentRequestId) return;

            const { data, error } = await supabase
                .from('stay_requests')
                .select('*')
                .eq('id', currentRequestId)
                .single();

            if (error) {
                console.error("Error fetching current request:", error);
                // If error (e.g., deleted), clear local storage
                if (error.code === 'PGRST116') { // JSON object requested, multiple (or no) rows returned
                    localStorage.removeItem('current_request_id');
                    setCurrentRequestId(null);
                }
            } else {
                setCurrentRequestData(data);
                // If returned, clear local storage (optional, but per requirement we show form if returned)
                // However, requirement says: "If status is 'returned' or ID is missing, show form".
                // So we just keep the data to show history or status, but UI will decide what to show.
            }
        };

        fetchCurrentRequest();
    }, [currentRequestId]);

    const fetchStayRequests = useCallback(async () => {
        if (!isAdmin || !supabase) return;
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('stay_requests')
                .select('*')
                .neq('status', 'returned') // Filter out returned items
                .order('created_at', { ascending: false });

            if (error) {
                console.error("Error fetching outings:", error);
            } else {
                setOutings(data || []);
            }
        } catch (error) {
            console.error("Unexpected error fetching outings:", error);
        } finally {
            setLoading(false);
        }
    }, [isAdmin]);

    // Admin: Fetch all outings
    useEffect(() => {
        if (!isAdmin) return;

        fetchStayRequests();

        // Real-time subscription for Admin
        if (!supabase) return;
        const subscription = supabase
            .channel('stay_requests_channel')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'stay_requests' }, () => {
                fetchStayRequests();
            })
            .subscribe();

        return () => {
            subscription.unsubscribe();
        };
    }, [isAdmin, fetchStayRequests]);


    const handleSubmit = async (e) => {
        e.preventDefault();

        const { allowed, start, end } = isTimeAllowed();
        if (!allowed && !isAdmin) {
            alert(`신청 가능 시간이 아닙니다. (${start} ~ ${end})`);
            return;
        }

        if (!formData.studentId || !formData.name || !formData.destination) {
            alert('모든 항목을 입력해주세요.');
            return;
        }

        try {
            if (!supabase) throw new Error("Supabase client not initialized");

            const { data, error } = await supabase
                .from('stay_requests')
                .insert([
                    {
                        student_id: formData.studentId,
                        name: formData.name,
                        type: formData.type,
                        destination: formData.destination,
                        status: 'active'
                    }
                ])
                .select()
                .single();

            if (error) throw error;

            // Save ID to localStorage
            localStorage.setItem('current_request_id', data.id);
            setCurrentRequestId(data.id);
            setCurrentRequestData(data);

            setFormData({ ...formData, type: '외출', destination: '' });
            alert('신청이 완료되었습니다.');
        } catch (error) {
            console.error("Error adding document: ", error);
            alert(`오류가 발생했습니다: ${error.message || JSON.stringify(error)}`);
        }
    };

    // Student Return Handler
    const handleReturn = async () => {
        if (!window.confirm('복귀하시겠습니까?')) return;

        try {
            if (!supabase) throw new Error("Supabase client not initialized");

            const { error } = await supabase
                .from('stay_requests')
                .update({
                    status: 'returned',
                    returned_at: new Date().toISOString()
                })
                .eq('id', currentRequestId);

            if (error) throw error;

            // Update local state
            setCurrentRequestData(prev => ({ ...prev, status: 'returned', returned_at: new Date().toISOString() }));
            alert('복귀 처리가 완료되었습니다.');
        } catch (error) {
            console.error("Error updating document: ", error);
            alert(`오류가 발생했습니다: ${error.message}`);
        }
    };

    // Admin Return Handler
    const handleAdminReturn = async (id) => {
        try {
            if (!supabase) throw new Error("Supabase client not initialized");

            // Optimistic Update: Immediately filter out the item to improve UX
            setOutings(prev => prev.filter(item => item.id !== id));

            const { error } = await supabase
                .from('stay_requests')
                .update({
                    status: 'returned',
                    returned_at: new Date().toISOString()
                })
                .eq('id', id);

            if (error) {
                // If error occurs, refresh to restore correct state
                fetchStayRequests();
                throw error;
            }

            // Explicitly refresh to ensure sync with server
            fetchStayRequests();
        } catch (error) {
            console.error("Error updating document: ", error);
            alert('복귀 처리 중 오류가 발생했습니다.');
        }
    };

    const handleAdminLogin = () => {
        const opPassword = settings?.operation_password || '1234';
        if (password === opPassword) {
            setIsAdmin(true);
            setShowAdminLogin(false);
            setPassword('');
        } else {
            alert('비밀번호가 틀렸습니다.');
        }
    };

    const handleReset = async () => {
        if (!window.confirm('정말로 모든 데이터를 초기화하시겠습니까?')) return;

        try {
            if (!supabase) throw new Error("Supabase client not initialized");
            // Delete all rows
            const { error } = await supabase
                .from('stay_requests')
                .delete()
                .neq('id', 0); // Delete all where id is not 0 (effectively all)

            if (error) throw error;
            alert('초기화되었습니다.');
            setOutings([]);
        } catch (error) {
            console.error("Error resetting data: ", error);
            alert(`초기화 중 오류가 발생했습니다: ${error.message || '알 수 없는 오류'}\n(데이터베이스 삭제 권한이 있는지 확인해주세요)`);
        }
    };

    // Determine View Mode
    const isReturned = currentRequestData?.status === 'returned';
    const showForm = !currentRequestId || isReturned;

    // Check if Supabase is initialized
    if (!supabase) {
        return (
            <div className="p-6 text-center space-y-4">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-2">
                    <span className="text-3xl">⚠️</span>
                </div>
                <h2 className="text-xl font-bold text-gray-800">서비스 연결 오류</h2>
                <p className="text-gray-600">
                    데이터베이스 연결 설정이 되어있지 않습니다.<br />
                    관리자에게 문의해주세요.
                </p>
                <p className="text-xs text-gray-400 bg-gray-100 p-2 rounded">
                    Error: Supabase client not initialized.<br />
                    Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-800">
                    {isAdmin ? '외출/외박 관리 (관리자)' : '외출/외박 신청'}
                </h2>
                <button
                    onClick={() => isAdmin ? setIsAdmin(false) : setShowAdminLogin(!showAdminLogin)}
                    className={`p-2 rounded-full ${isAdmin ? 'bg-nh-blue text-white' : 'text-gray-400 hover:bg-gray-100'}`}
                >
                    <Lock size={20} />
                </button>
            </div>

            {/* Admin Login Modal/Area */}
            {showAdminLogin && !isAdmin && (
                <div className="bg-gray-100 p-4 rounded-lg flex gap-2">
                    <input
                        type="password"
                        placeholder="관리자 비밀번호"
                        className="flex-1 p-2 border rounded"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                    <button
                        onClick={handleAdminLogin}
                        className="bg-nh-blue text-white px-4 py-2 rounded font-bold"
                    >
                        확인
                    </button>
                </div>
            )}

            {/* Admin View: Status List & Controls */}
            {isAdmin ? (
                <div className="space-y-4">
                    <div className="bg-red-50 border border-red-200 p-4 rounded-lg flex justify-between items-center">
                        <span className="font-bold text-red-700">관리자 기능</span>
                        <button
                            onClick={handleReset}
                            className="flex items-center gap-2 bg-red-600 text-white px-3 py-1.5 rounded hover:bg-red-700 text-sm"
                        >
                            <RefreshCw size={16} />
                            데이터 초기화
                        </button>
                    </div>

                    <div className="space-y-3">
                        <h3 className="font-bold text-lg text-gray-800 px-1">현황 리스트</h3>
                        {loading ? (
                            <Loading message="내역을 불러오는 중..." />
                        ) : outings.length === 0 ? (
                            <div className="text-center py-8 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                                <p className="text-gray-400">신청 내역이 없습니다.</p>
                            </div>
                        ) : (
                            outings.map((item) => (
                                <div key={item.id} className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 flex justify-between items-center">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className={`text-xs px-1.5 py-0.5 rounded ${item.type === '외박' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                                                {item.type}
                                            </span>
                                            <span className="font-bold text-gray-800">{item.name}</span>
                                            <span className="text-sm text-gray-500">({item.student_id})</span>
                                        </div>
                                        <div className="text-xs text-gray-500">
                                            <span className="mr-2">📍 {item.destination}</span>
                                            <span>🕒 {format(new Date(item.created_at), 'yyyy-MM-dd HH:mm')} 출발</span>
                                        </div>
                                    </div>

                                    {item.status === 'active' ? (
                                        <button
                                            onClick={() => handleAdminReturn(item.id)}
                                            className="text-nh-blue font-bold text-sm border border-nh-blue px-2 py-1 rounded hover:bg-blue-50"
                                        >
                                            외출중 (복귀처리)
                                        </button>
                                    ) : (
                                        <div className="flex flex-col items-end">
                                            <span className="flex items-center gap-1 text-green-600 text-sm font-medium">
                                                <CheckCircle size={14} /> 복귀완료
                                            </span>
                                            <span className="text-xs text-gray-400">
                                                {item.returned_at ? format(new Date(item.returned_at), 'yyyy-MM-dd HH:mm') : ''}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            ) : (
                <>
                    {/* Student View */}
                    {showForm ? (
                        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
                            <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                                <LogOut size={20} className="text-nh-blue" />
                                신청서 작성
                            </h3>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs text-gray-500 mb-1">교번</label>
                                        <input
                                            type="text"
                                            value={formData.studentId}
                                            onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                                            className="w-full p-2 border border-gray-200 rounded focus:border-nh-blue focus:ring-1 focus:ring-nh-blue outline-none transition-colors"
                                            placeholder="예: 12"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-gray-500 mb-1">성명</label>
                                        <input
                                            type="text"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            className="w-full p-2 border border-gray-200 rounded focus:border-nh-blue focus:ring-1 focus:ring-nh-blue outline-none transition-colors"
                                            placeholder="홍길동"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs text-gray-500 mb-1">구분</label>
                                    <div className="flex gap-2">
                                        {['외출', '외박'].map((type) => (
                                            <button
                                                key={type}
                                                type="button"
                                                onClick={() => setFormData({ ...formData, type })}
                                                className={`flex-1 py-2 rounded border ${formData.type === type ? 'bg-nh-blue text-white border-nh-blue' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}
                                            >
                                                {type}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs text-gray-500 mb-1">목적지</label>
                                    <input
                                        type="text"
                                        value={formData.destination}
                                        onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                                        className="w-full p-2 border border-gray-200 rounded focus:border-nh-blue focus:ring-1 focus:ring-nh-blue outline-none transition-colors"
                                        placeholder="예: OO시 OO동"
                                    />
                                </div>

                                {isTimeAllowed().allowed ? (
                                    <button
                                        type="submit"
                                        className="w-full bg-nh-green text-white py-3 rounded-lg font-bold hover:bg-green-600 transition-colors shadow-sm active:scale-[0.98]"
                                    >
                                        출발하기 (신청)
                                    </button>
                                ) : (
                                    <div className="space-y-2">
                                        <button
                                            type="button"
                                            disabled
                                            className="w-full bg-gray-300 text-gray-500 py-3 rounded-lg font-bold cursor-not-allowed"
                                        >
                                            현재 신청 불가
                                        </button>
                                        <p className="text-xs text-red-500 text-center mt-2">
                                            * 현재는 신청 가능 시간이 아닙니다 ({isTimeAllowed().start} ~ {isTimeAllowed().end})
                                        </p>
                                    </div>
                                )}
                            </form>
                        </div>
                    ) : (
                        /* Active Status View (Return Mode) */
                        <div className="space-y-4">
                            <div className="bg-blue-50 border border-blue-200 p-6 rounded-xl text-center space-y-4">
                                <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-full shadow-sm mb-2">
                                    <span className="text-3xl">🏃</span>
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-gray-800 mb-1">
                                        {currentRequestData?.type} 중입니다
                                    </h3>
                                    <p className="text-gray-500 text-sm">
                                        안전하게 다녀오세요!
                                    </p>
                                </div>

                                <div className="bg-white p-4 rounded-lg text-left space-y-2 text-sm text-gray-600">
                                    <div className="flex justify-between">
                                        <span>신청자</span>
                                        <span className="font-bold text-gray-800">{currentRequestData?.name} ({currentRequestData?.student_id})</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>목적지</span>
                                        <span className="font-bold text-gray-800">{currentRequestData?.destination}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>출발시간</span>
                                        <span className="font-bold text-gray-800">
                                            {currentRequestData?.created_at && format(new Date(currentRequestData.created_at), 'yyyy-MM-dd HH:mm')}
                                        </span>
                                    </div>
                                </div>

                                <button
                                    onClick={handleReturn}
                                    className="w-full bg-nh-blue text-white py-3 rounded-lg font-bold hover:bg-blue-700 transition-colors shadow-sm active:scale-[0.98] flex items-center justify-center gap-2"
                                >
                                    <CheckCircle size={20} />
                                    복귀하기
                                </button>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default Outing;
