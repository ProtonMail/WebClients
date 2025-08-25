import { useEffect, useRef, useState } from 'react';

function calculateRms(data: Uint8Array<ArrayBuffer>) {
    let sum = 0;
    for (let i = 0; i < data.length; i++) {
        const val = (data[i] - 128) / 128;
        sum += val * val;
    }
    return Math.sqrt(sum / data.length);
}

function startMicVolumeAnalysis(
    setVolume: (v: number) => void,
    throttleMs: number,
    lastUpdateRef: React.MutableRefObject<number>
) {
    let audioContext: AudioContext | null = null;
    let raf: number | null = null;
    let stream: MediaStream | null = null;

    const cleanup = () => {
        if (audioContext) {
            audioContext.close();
            audioContext = null;
        }
        if (raf) {
            cancelAnimationFrame(raf);
            raf = null;
        }
        if (stream) {
            stream.getTracks().forEach((track) => track.stop());
            stream = null;
        }
    };

    navigator.mediaDevices
        .getUserMedia({ audio: true })
        .then((mediaStream) => {
            stream = mediaStream;
            audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();

            const analyser = audioContext.createAnalyser();
            analyser.fftSize = 256;

            const source = audioContext.createMediaStreamSource(mediaStream);
            source.connect(analyser);

            const dataArray = new Uint8Array(analyser.frequencyBinCount);

            function updateVolume() {
                analyser.getByteTimeDomainData(dataArray);
                const rms = calculateRms(dataArray);

                const now = Date.now();
                if (now - lastUpdateRef.current > throttleMs) {
                    setVolume(Math.pow(rms, 0.5));
                    lastUpdateRef.current = now;
                }
                raf = requestAnimationFrame(updateVolume);
            }
            updateVolume();
        })
        .catch(() => {
            setVolume(0);
        });

    return cleanup;
}

export const useMicrophoneVolume = (isMicOn: boolean, throttleMs: number = 100) => {
    const [volume, setVolume] = useState(0);
    const lastUpdateRef = useRef<number>(0);

    useEffect(() => {
        if (!isMicOn) {
            setVolume(0);
            return;
        }

        const cleanup = startMicVolumeAnalysis(setVolume, throttleMs, lastUpdateRef);

        return () => {
            cleanup();
        };
    }, [isMicOn, throttleMs]);

    return volume;
};
