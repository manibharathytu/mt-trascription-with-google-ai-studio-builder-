
import { useState, useRef, useCallback, useEffect } from 'react';
import { GoogleGenAI, Modality, LiveSession, LiveServerMessage, Blob } from '@google/genai';

// Helper to encode audio data to base64
function encode(bytes: Uint8Array): string {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// Helper to create a Gemini API-compatible Blob from raw audio data
function createBlob(data: Float32Array): Blob {
  const l = data.length;
  const int16 = new Int16Array(l);
  for (let i = 0; i < l; i++) {
    // Clamp the value to be within the range of a 16-bit signed integer
    const s = Math.max(-1, Math.min(1, data[i]));
    int16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
  }
  return {
    data: encode(new Uint8Array(int16.buffer)),
    mimeType: 'audio/pcm;rate=16000',
  };
}

export const useTranscription = () => {
    const [isTranscribing, setIsTranscribing] = useState(false);
    const [statusMessage, setStatusMessage] = useState('Idle');
    const [transcriptionParts, setTranscriptionParts] = useState<string[]>([]);
    const [currentPart, setCurrentPart] = useState('');

    const sessionPromiseRef = useRef<Promise<LiveSession> | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);

    const fullTranscription = [...transcriptionParts, currentPart].join(' ').trim();

    const cleanup = useCallback(() => {
        streamRef.current?.getTracks().forEach(track => track.stop());
        scriptProcessorRef.current?.disconnect();
        audioContextRef.current?.close();
        sessionPromiseRef.current?.then(session => session.close()).catch(() => {});
        
        streamRef.current = null;
        scriptProcessorRef.current = null;
        audioContextRef.current = null;
        sessionPromiseRef.current = null;
    }, []);

    const startTranscription = useCallback(async () => {
        setIsTranscribing(true);
        setStatusMessage('Connecting...');
        setTranscriptionParts([]);
        setCurrentPart('');

        try {
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                throw new Error('Your browser does not support audio recording.');
            }

            streamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
            // FIX: Cast window to `any` to allow access to prefixed `webkitAudioContext` for broader browser compatibility, resolving the TypeScript error.
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
            
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
            
            sessionPromiseRef.current = ai.live.connect({
                model: 'gemini-2.5-flash-native-audio-preview-09-2025',
                callbacks: {
                    onopen: () => {
                        setStatusMessage('Listening...');
                        const source = audioContextRef.current!.createMediaStreamSource(streamRef.current!);
                        scriptProcessorRef.current = audioContextRef.current!.createScriptProcessor(4096, 1, 1);
                        
                        scriptProcessorRef.current.onaudioprocess = (event) => {
                            const inputData = event.inputBuffer.getChannelData(0);
                            const pcmBlob = createBlob(inputData);
                            sessionPromiseRef.current?.then((session) => {
                                session.sendRealtimeInput({ media: pcmBlob });
                            });
                        };
                        
                        source.connect(scriptProcessorRef.current);
                        scriptProcessorRef.current.connect(audioContextRef.current!.destination);
                    },
                    onmessage: (message: LiveServerMessage) => {
                        if (message.serverContent?.inputTranscription) {
                            const text = message.serverContent.inputTranscription.text;
                            // FIX: Append new transcription text instead of overwriting.
                            setCurrentPart(prev => prev + text);
                        }

                        if (message.serverContent?.turnComplete) {
                            setCurrentPart(prev => {
                                if (prev.trim()) {
                                    setTranscriptionParts(parts => [...parts, prev.trim()]);
                                }
                                return '';
                            });
                        }
                    },
                    onerror: (e: Error) => {
                        console.error('Gemini API Error:', e);
                        setStatusMessage(`Error: ${e.message}`);
                        cleanup();
                        setIsTranscribing(false);
                    },
                    onclose: () => {
                        // This can be triggered by the server.
                    },
                },
                config: {
                    responseModalities: [Modality.AUDIO],
                    inputAudioTranscription: {},
                }
            });

            await sessionPromiseRef.current;
        } catch (error) {
            console.error('Failed to start transcription:', error);
            setStatusMessage(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
            cleanup();
            setIsTranscribing(false);
        }
    }, [cleanup]);

    const stopTranscription = useCallback(() => {
        setIsTranscribing(false);
        setStatusMessage('Idle');
        cleanup();
    }, [cleanup]);

    useEffect(() => {
        return () => {
            cleanup();
        };
    }, [cleanup]);

    return {
        isTranscribing,
        statusMessage,
        transcription: fullTranscription,
        startTranscription,
        stopTranscription,
    };
};
