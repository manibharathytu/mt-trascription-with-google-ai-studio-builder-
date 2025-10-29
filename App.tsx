
import React from 'react';
import { useTranscription } from './hooks/useTranscription';
import { ControlButton } from './components/ControlButton';
import { TranscriptionDisplay } from './components/TranscriptionDisplay';

const App: React.FC = () => {
    const {
        isTranscribing,
        statusMessage,
        transcription,
        startTranscription,
        stopTranscription,
    } = useTranscription();

    const getStatusIndicator = () => {
        let color = 'bg-gray-500';
        let animate = false;
        if (statusMessage === 'Connecting...') {
            color = 'bg-yellow-500';
            animate = true;
        } else if (statusMessage === 'Listening...') {
            color = 'bg-red-500';
            animate = true;
        } else if (statusMessage.startsWith('Error')) {
            color = 'bg-red-700';
        }

        return (
            <div className="flex items-center justify-center space-x-2">
                <span className={`relative flex h-3 w-3`}>
                    <span className={`absolute inline-flex h-full w-full rounded-full ${color} ${animate ? 'animate-ping' : ''} opacity-75`}></span>
                    <span className={`relative inline-flex rounded-full h-3 w-3 ${color}`}></span>
                </span>
                <span className="text-gray-400">{statusMessage}</span>
            </div>
        );
    };

    return (
        <div className="flex flex-col h-screen bg-gradient-to-br from-gray-900 to-gray-800 font-sans p-4 sm:p-6 md:p-8">
            <header className="text-center mb-6">
                <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
                    Real-time Multilingual Transcriber
                </h1>
                <p className="text-gray-400 mt-2">Powered by Gemini</p>
            </header>

            <main className="flex-grow flex flex-col w-full max-w-4xl mx-auto">
                <TranscriptionDisplay transcription={transcription} />
            </main>

            <footer className="w-full max-w-4xl mx-auto pt-6">
                <div className="flex flex-col items-center space-y-4">
                    {getStatusIndicator()}
                    {!isTranscribing ? (
                        <ControlButton
                            onClick={startTranscription}
                            disabled={isTranscribing}
                            variant="start"
                        >
                            Start Transcribing
                        </ControlButton>
                    ) : (
                        <ControlButton
                            onClick={stopTranscription}
                            disabled={!isTranscribing}
                            variant="stop"
                        >
                            Stop Transcribing
                        </ControlButton>
                    )}
                </div>
            </footer>
        </div>
    );
};

export default App;
