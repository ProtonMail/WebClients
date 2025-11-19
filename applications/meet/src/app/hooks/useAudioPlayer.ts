import { useCallback, useEffect, useRef } from 'react';

export const useAudioPlayer = (audioPath: string) => {
    const audioRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        const audio = new Audio(audioPath);
        audio.preload = 'auto';
        audio.load();
        audioRef.current = audio;

        return () => {
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current.src = '';
                audioRef.current = null;
            }
        };
    }, [audioPath]);

    const playAudio = useCallback(() => {
        if (!audioRef.current) {
            return;
        }

        audioRef.current.currentTime = 0;
        void audioRef.current.play();
    }, []);

    return { playAudio };
};
