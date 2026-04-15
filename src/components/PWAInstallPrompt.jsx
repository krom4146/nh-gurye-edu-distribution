import React, { useState, useEffect } from 'react';
import { X, Share, Download } from 'lucide-react';

const PWAInstallPrompt = () => {
    const [deferredPrompt, setDeferredPrompt] = useState(null);
    const [isIOS, setIsIOS] = useState(false);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Check if it's iOS
        const userAgent = window.navigator.userAgent.toLowerCase();
        const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
        setIsIOS(isIosDevice);

        // Check if already in standalone mode
        const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;

        if (isStandalone) {
            return; // Don't show if already installed
        }

        if (isIosDevice) {
            // Show for iOS after a small delay
            const timer = setTimeout(() => setIsVisible(true), 1000);
            return () => clearTimeout(timer);
        }

        // Capture the install prompt for Android/Desktop
        const handleBeforeInstallPrompt = (e) => {
            e.preventDefault();
            setDeferredPrompt(e);
            setIsVisible(true);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        };
    }, []);

    const handleInstallClick = async () => {
        if (!deferredPrompt) return;

        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;

        if (outcome === 'accepted') {
            setDeferredPrompt(null);
            setIsVisible(false);
        }
    };

    if (!isVisible) return null;

    return (
        <div className="fixed bottom-4 left-4 right-4 z-50 bg-white rounded-xl shadow-2xl p-4 border border-gray-200 animate-in slide-in-from-bottom duration-500">
            <button
                onClick={() => setIsVisible(false)}
                className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
            >
                <X size={20} />
            </button>

            <div className="flex items-start gap-4 pr-6">
                <div className="bg-green-100 p-3 rounded-lg shrink-0">
                    {isIOS ? <Share className="text-green-600" size={24} /> : <Download className="text-green-600" size={24} />}
                </div>

                <div className="flex-1">
                    <h3 className="font-bold text-gray-900 mb-1">앱으로 설치하기</h3>
                    {isIOS ? (
                        <p className="text-sm text-gray-600 leading-relaxed">
                            아이폰은 <strong>Safari 브라우저</strong>에서만 설치가 가능합니다.<br />
                            하단 <span className="inline-block mx-1"><Share size={14} /></span> 공유 버튼을 누르고<br />
                            <span className="font-semibold">'홈 화면에 추가'</span>를 선택하세요.
                        </p>
                    ) : (
                        <div className="space-y-3">
                            <p className="text-sm text-gray-600">
                                더 빠르고 편리하게 이용하려면 앱을 설치하세요.
                            </p>
                            <button
                                onClick={handleInstallClick}
                                className="w-full bg-green-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-green-700 transition-colors active:bg-green-800"
                            >
                                설치하기
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PWAInstallPrompt;
