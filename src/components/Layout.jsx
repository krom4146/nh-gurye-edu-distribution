import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Home, LogOut, ChevronLeft } from 'lucide-react';
import PWAInstallPrompt from './PWAInstallPrompt';
import { useSettings } from '../context/SettingsContext';

const Layout = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const isHome = location.pathname === '/';
    const { settings, loading } = useSettings();

    useEffect(() => {
        if (settings?.bg_image_url) {
            document.body.style.backgroundImage = `linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.4)), url(${settings.bg_image_url})`;
            document.body.style.backgroundSize = 'cover';
            document.body.style.backgroundPosition = 'center';
            document.body.style.backgroundAttachment = 'fixed';
            document.body.style.backgroundRepeat = 'no-repeat';
        } else {
            document.body.style.backgroundImage = 'none';
        }
        
        return () => {
            document.body.style.backgroundImage = 'none';
        };
    }, [settings?.bg_image_url]);

    return (
        <div className="app-container bg-transparent min-h-screen max-w-md mx-auto shadow-2xl relative flex flex-col">
            {/* Header */}
            <header className="bg-nh-blue text-white p-4 flex items-center justify-between sticky top-0 z-50">
                <div className="flex items-center gap-2">
                    {!isHome && (
                        <button onClick={() => navigate(-1)} className="p-1 hover:bg-white/10 rounded">
                            <ChevronLeft size={24} />
                        </button>
                    )}
                    <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
                        <img src="/logo.png" alt="Logo" className="h-5" />
                        <h1 className="text-lg font-bold">
                            {settings?.center_name || '농협교육원'}
                        </h1>
                    </div>
                </div>
                <button onClick={() => navigate('/')} className="p-1 hover:bg-white/10 rounded">
                    <Home size={24} />
                </button>
            </header>

            {/* Main Content */}
            <main className="p-4 pb-20">
                <Outlet />
            </main>

            {/* Footer (Optional) */}
            <footer className="bg-black/20 backdrop-blur-sm p-4 text-center text-xs text-white/70 mt-auto">
                © {settings?.center_name || '농협교육원'}
            </footer>

            <PWAInstallPrompt />
        </div>
    );
};


export default Layout;
