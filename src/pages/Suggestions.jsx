import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { format } from 'date-fns';
import { Lock, PenTool, ChevronLeft, Send, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Suggestions = () => {
    const navigate = useNavigate();
    const [suggestions, setSuggestions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState('list'); // 'list', 'write', 'detail'
    const [selectedPost, setSelectedPost] = useState(null);

    // Admin State
    const [isAdmin, setIsAdmin] = useState(false);
    const [showAdminLogin, setShowAdminLogin] = useState(false);

    // Write Form State
    const [formData, setFormData] = useState({
        title: '',
        content: '',
        isSecret: false,
        password: ''
    });

    // Password Prompt State
    const [inputPassword, setInputPassword] = useState('');
    const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);
    const [pendingPost, setPendingPost] = useState(null);

    // Admin Reply State
    const [replyContent, setReplyContent] = useState('');
    const [isSubmittingReply, setIsSubmittingReply] = useState(false);

    // Fetch Suggestions
    const fetchSuggestions = React.useCallback(async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('suggestions')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error("Error fetching suggestions:", error);
        } else {
            setSuggestions(data || []);
        }
        setLoading(false);
    }, []);

    useEffect(() => {
        fetchSuggestions();
    }, [fetchSuggestions]);

    // Handle Write Submit
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.title || !formData.content) {
            alert('제목과 내용을 입력해주세요.');
            return;
        }
        if (formData.isSecret && !formData.password) {
            alert('비밀글은 비밀번호가 필수입니다.');
            return;
        }

        try {
            const { error } = await supabase
                .from('suggestions')
                .insert([{
                    title: formData.title,
                    content: formData.content,
                    is_secret: formData.isSecret,
                    password: formData.isSecret ? formData.password : null
                }]);

            if (error) throw error;

            alert('등록되었습니다.');
            setFormData({ title: '', content: '', isSecret: false, password: '' });
            setView('list');
            fetchSuggestions();
        } catch (error) {
            console.error("Error submitting suggestion:", error);
            alert('오류가 발생했습니다.');
        }
    };

    // Handle Post Click
    const handlePostClick = (post) => {
        if (post.is_secret) {
            setPendingPost(post);
            setInputPassword('');
            setShowPasswordPrompt(true);
        } else {
            setSelectedPost(post);
            setReplyContent(post.admin_reply || '');
            setView('detail');
        }
    };

    // Handle Password Verification
    const verifyPassword = () => {
        if (showAdminLogin) {
            if (inputPassword === 'nacf1660') {
                setIsAdmin(true);
                setShowAdminLogin(false);
                setShowPasswordPrompt(false);
                alert('관리자 모드가 활성화되었습니다.');
            } else {
                alert('관리자 비밀번호가 일치하지 않습니다.');
            }
            return;
        }

        if (!pendingPost) return;

        // Master Key Logic
        if (inputPassword === 'nacf1660' || inputPassword === pendingPost.password) {
            setSelectedPost(pendingPost);
            setReplyContent(pendingPost.admin_reply || '');
            setView('detail');
            setShowPasswordPrompt(false);
            setPendingPost(null);
        } else {
            alert('비밀번호가 일치하지 않습니다.');
        }
    };

    // Handle Admin Reset
    const handleReset = async () => {
        if (!window.confirm('정말로 모든 건의사항을 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.')) return;

        try {
            const { error } = await supabase
                .from('suggestions')
                .delete()
                .neq('id', 0); // Delete all

            if (error) throw error;

            alert('모든 건의사항이 삭제되었습니다.');
            fetchSuggestions();
        } catch (error) {
            console.error("Error resetting suggestions:", error);
            alert('초기화 중 오류가 발생했습니다.');
        }
    };

    // Handle Reply Submit
    const handleReplySubmit = async () => {
        if (!replyContent.trim()) {
            alert('답변 내용을 입력해주세요.');
            return;
        }

        setIsSubmittingReply(true);
        try {
            const { error } = await supabase
                .from('suggestions')
                .update({
                    admin_reply: replyContent,
                    admin_reply_created_at: new Date().toISOString()
                })
                .eq('id', selectedPost.id);

            if (error) throw error;

            alert('답변이 등록되었습니다.');

            // Update local state
            setSelectedPost({
                ...selectedPost,
                admin_reply: replyContent,
                admin_reply_created_at: new Date().toISOString()
            });

            // Update list state
            setSuggestions(suggestions.map(s =>
                s.id === selectedPost.id
                    ? { ...s, admin_reply: replyContent, admin_reply_created_at: new Date().toISOString() }
                    : s
            ));

        } catch (error) {
            console.error("Error submitting reply:", error);
            alert('답변 등록 중 오류가 발생했습니다.');
        } finally {
            setIsSubmittingReply(false);
        }
    };

    const openAdminLogin = () => {
        if (isAdmin) {
            setIsAdmin(false);
            alert('관리자 모드가 해제되었습니다.');
        } else {
            setInputPassword('');
            setShowAdminLogin(true);
            setShowPasswordPrompt(true);
        }
    };

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    {view !== 'list' && (
                        <button onClick={() => setView('list')} className="p-1 hover:bg-gray-100 rounded">
                            <ChevronLeft size={24} />
                        </button>
                    )}
                    <h2 className="text-xl font-bold text-gray-800">건의사항 게시판</h2>
                </div>
                <div className="flex items-center gap-2">
                    {view === 'list' && (
                        <button
                            onClick={() => setView('write')}
                            className="bg-nh-blue text-white px-3 py-2 rounded-lg text-sm font-bold flex items-center gap-1 shadow-sm hover:bg-blue-700"
                        >
                            <PenTool size={16} />
                            글쓰기
                        </button>
                    )}
                    <button
                        onClick={openAdminLogin}
                        className={`p-2 rounded-full ${isAdmin ? 'bg-nh-blue text-white' : 'text-gray-400 hover:bg-gray-100'}`}
                    >
                        <Lock size={20} />
                    </button>
                </div>
            </div>

            {/* Admin Controls */}
            {isAdmin && view === 'list' && (
                <div className="bg-red-50 border border-red-200 p-3 rounded-lg flex justify-between items-center mb-4">
                    <span className="font-bold text-red-700 text-sm">관리자 모드</span>
                    <button
                        onClick={handleReset}
                        className="flex items-center gap-1 bg-red-600 text-white px-3 py-1.5 rounded hover:bg-red-700 text-xs font-bold"
                    >
                        <RefreshCw size={14} />
                        게시판 초기화
                    </button>
                </div>
            )}

            {/* List View */}
            {view === 'list' && (
                <div className="space-y-3">
                    {loading ? (
                        <p className="text-center text-gray-500 py-8">로딩 중...</p>
                    ) : suggestions.length === 0 ? (
                        <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                            <p className="text-gray-400">등록된 건의사항이 없습니다.</p>
                        </div>
                    ) : (
                        suggestions.map((post) => (
                            <div
                                key={post.id}
                                onClick={() => handlePostClick(post)}
                                className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 active:scale-[0.99] transition-transform cursor-pointer"
                            >
                                <div className="flex justify-between items-start mb-1">
                                    <h3 className="font-bold text-gray-800 line-clamp-1 flex-1">
                                        {post.title}
                                    </h3>
                                    {post.is_secret && <Lock size={16} className="text-gray-400 ml-2 flex-shrink-0" />}
                                </div>
                                <div className="flex justify-between items-center text-xs text-gray-500">
                                    <span>{format(new Date(post.created_at), 'yyyy.MM.dd HH:mm')}</span>
                                    <div className="flex gap-2">
                                        {post.admin_reply && (
                                            <span className="text-nh-blue font-medium">답변완료</span>
                                        )}
                                        {post.is_secret && <span className="text-orange-500">비밀글</span>}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}

            {/* Write View */}
            {view === 'write' && (
                <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">제목</label>
                            <input
                                type="text"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                className="w-full p-3 border border-gray-200 rounded-lg focus:border-nh-blue focus:ring-1 focus:ring-nh-blue outline-none"
                                placeholder="제목을 입력하세요"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">내용</label>
                            <textarea
                                value={formData.content}
                                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                                className="w-full p-3 border border-gray-200 rounded-lg h-40 resize-none focus:border-nh-blue focus:ring-1 focus:ring-nh-blue outline-none"
                                placeholder="내용을 입력하세요"
                            />
                        </div>

                        <div className="bg-gray-50 p-3 rounded-lg space-y-3">
                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="isSecret"
                                    checked={formData.isSecret}
                                    onChange={(e) => setFormData({ ...formData, isSecret: e.target.checked })}
                                    className="w-4 h-4 text-nh-blue rounded border-gray-300 focus:ring-nh-blue"
                                />
                                <label htmlFor="isSecret" className="text-sm font-medium text-gray-700 select-none cursor-pointer">
                                    비밀글로 작성하기
                                </label>
                            </div>

                            {formData.isSecret && (
                                <div className="animate-in fade-in slide-in-from-top-2 duration-200">
                                    <input
                                        type="password"
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        className="w-full p-2 border border-gray-200 rounded bg-white text-sm"
                                        placeholder="비밀번호 설정 (필수)"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">* 관리자와 본인만 확인할 수 있습니다.</p>
                                </div>
                            )}
                        </div>

                        <button
                            type="submit"
                            className="w-full bg-nh-blue text-white py-3 rounded-lg font-bold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                        >
                            <Send size={18} />
                            등록하기
                        </button>
                    </form>
                </div>
            )}

            {/* Detail View */}
            {view === 'detail' && selectedPost && (
                <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 space-y-4">
                    <div className="border-b border-gray-100 pb-3">
                        <h3 className="text-lg font-bold text-gray-800 mb-1">{selectedPost.title}</h3>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                            <span>{format(new Date(selectedPost.created_at), 'yyyy.MM.dd HH:mm')}</span>
                            {selectedPost.is_secret && (
                                <span className="flex items-center gap-1 text-orange-500 bg-orange-50 px-1.5 py-0.5 rounded">
                                    <Lock size={10} /> 비밀글
                                </span>
                            )}
                        </div>
                    </div>
                    <div className="min-h-[200px] text-gray-700 whitespace-pre-wrap leading-relaxed">
                        {selectedPost.content}
                    </div>

                    {/* Admin Reply Section */}
                    {(selectedPost.admin_reply || isAdmin) && (
                        <div className="mt-6 pt-6 border-t border-gray-100">
                            <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                                <span className="bg-nh-blue text-white text-xs px-2 py-1 rounded-full">Admin</span>
                                관리자 답변
                            </h4>

                            {isAdmin ? (
                                <div className="space-y-3">
                                    <textarea
                                        value={replyContent}
                                        onChange={(e) => setReplyContent(e.target.value)}
                                        className="w-full p-3 border border-gray-200 rounded-lg h-32 resize-none focus:border-nh-blue focus:ring-1 focus:ring-nh-blue outline-none bg-gray-50"
                                        placeholder="관리자 답변을 입력하세요..."
                                    />
                                    <div className="flex justify-end">
                                        <button
                                            onClick={handleReplySubmit}
                                            disabled={isSubmittingReply}
                                            className="bg-nh-blue text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-blue-700 disabled:opacity-50"
                                        >
                                            {isSubmittingReply ? '등록 중...' : '답변 등록'}
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="bg-gray-50 p-4 rounded-xl text-gray-700 whitespace-pre-wrap leading-relaxed border border-gray-100">
                                    {selectedPost.admin_reply}
                                    <div className="text-right mt-2 text-xs text-gray-400">
                                        {format(new Date(selectedPost.admin_reply_created_at || new Date()), 'yyyy.MM.dd HH:mm')}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                    <button
                        onClick={() => setView('list')}
                        className="w-full border border-gray-300 text-gray-600 py-2.5 rounded-lg font-medium hover:bg-gray-50"
                    >
                        목록으로 돌아가기
                    </button>
                </div>
            )}

            {/* Password Prompt Modal */}
            {showPasswordPrompt && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white w-full max-w-xs p-6 rounded-xl shadow-xl animate-in zoom-in-95 duration-200">
                        <div className="text-center mb-4">
                            <div className="inline-flex items-center justify-center w-12 h-12 bg-orange-100 text-orange-500 rounded-full mb-2">
                                <Lock size={24} />
                            </div>
                            <h3 className="text-lg font-bold text-gray-800">
                                {showAdminLogin ? '관리자 로그인' : '비밀글입니다'}
                            </h3>
                            <p className="text-sm text-gray-500">비밀번호를 입력해주세요.</p>
                        </div>
                        <input
                            type="password"
                            value={inputPassword}
                            onChange={(e) => setInputPassword(e.target.value)}
                            className="w-full p-3 border border-gray-200 rounded-lg mb-3 text-center text-lg tracking-widest"
                            placeholder="****"
                            autoFocus
                        />
                        <div className="flex gap-2">
                            <button
                                onClick={() => {
                                    setShowPasswordPrompt(false);
                                    setShowAdminLogin(false);
                                }}
                                className="flex-1 py-2.5 text-gray-500 bg-gray-100 rounded-lg font-medium hover:bg-gray-200"
                            >
                                취소
                            </button>
                            <button
                                onClick={verifyPassword}
                                className="flex-1 py-2.5 text-white bg-nh-blue rounded-lg font-bold hover:bg-blue-700"
                            >
                                확인
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Suggestions;
