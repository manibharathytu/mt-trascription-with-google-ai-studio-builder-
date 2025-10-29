
import React from 'react';

interface ControlButtonProps {
    onClick: () => void;
    disabled: boolean;
    children: React.ReactNode;
    variant: 'start' | 'stop';
}

export const ControlButton: React.FC<ControlButtonProps> = ({
    onClick,
    disabled,
    children,
    variant
}) => {
    const baseClasses = "w-full max-w-xs px-8 py-4 text-lg font-semibold text-white rounded-full shadow-lg transform transition-transform duration-200 focus:outline-none focus:ring-4 focus:ring-opacity-50 disabled:opacity-50 disabled:cursor-not-allowed";
    
    const variantClasses = {
        start: 'bg-green-600 hover:bg-green-700 active:scale-95 focus:ring-green-400',
        stop: 'bg-red-600 hover:bg-red-700 active:scale-95 focus:ring-red-400',
    };

    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={`${baseClasses} ${variantClasses[variant]}`}
        >
            {children}
        </button>
    );
};
