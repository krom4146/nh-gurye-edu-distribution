import React from 'react';

const Placeholder = ({ title }) => (
    <div className="p-4 text-center">
        <h2 className="text-xl font-bold mb-4">{title}</h2>
        <p className="text-gray-500">준비 중입니다...</p>
    </div>
);

export default Placeholder;
