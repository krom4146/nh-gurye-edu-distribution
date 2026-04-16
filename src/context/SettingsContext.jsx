import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

const SettingsContext = createContext(null);

export const SettingsProvider = ({ children }) => {
    const [settings, setSettings] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                if (!supabase) {
                    setLoading(false);
                    return;
                }
                const { data, error } = await supabase.from('site_settings').select('*').single();
                if (data) setSettings(data);
                if (error && error.code !== 'PGRST116') {
                    console.error('Error fetching settings:', error);
                }
            } catch (error) {
                console.error('Error in fetchSettings:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchSettings();
    }, []);

    return (
        <SettingsContext.Provider value={{ settings, loading }}>
            {children}
        </SettingsContext.Provider>
    );
};

export const useSettings = () => {
    const context = useContext(SettingsContext);
    if (!context) {
        throw new Error('useSettings must be used within a SettingsProvider');
    }
    return context;
};
