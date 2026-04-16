import React from 'react';
import { Loader2 } from 'lucide-react';

const Loading = ({ message = '데이터를 불러오는 중...' }) => {
    return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4 p-8">
            <div className="relative">
                <div className="absolute inset-0 bg-nh-blue/20 blur-xl rounded-full scale-150 animate-pulse"></div>
                <Loader2 className="w-12 h-12 text-nh-blue animate-spin relative z-10" />
            </div>
            <p className="text-gray-500 font-medium animate-pulse">
                {message}
            </p>
        </div>
    );
};

export default Loading;
