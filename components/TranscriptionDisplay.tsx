
import React, { useRef, useEffect } from 'react';

interface TranscriptionDisplayProps {
    transcription: string;
}

export const TranscriptionDisplay: React.FC<TranscriptionDisplayProps> = ({ transcription }) => {
    const displayRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (displayRef.current) {
            displayRef.current.scrollTop = displayRef.current.scrollHeight;
        }
    }, [transcription]);

    return (
        <div 
            ref={displayRef} 
            className="flex-grow w-full bg-black bg-opacity-30 rounded-lg p-6 shadow-inner overflow-y-auto"
        >
            <p className="text-lg sm:text-xl text-gray-200 leading-relaxed whitespace-pre-wrap">
                {transcription}
                <span className="inline-block w-2 h-5 bg-white ml-1 animate-pulse" />
            </p>
        </div>
    );
};
