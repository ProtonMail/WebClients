import { useCallback, useRef } from 'react';

import { isAudioSessionAvailable, withIOSAudioSessionWorkaround } from '../utils/ios-audio-session';

export const useMicrophoneVolumeAnalysis = () => {
    const initSequenceRef = useRef(0);
    const microphoneVolumeAnalysisRef = useRef<{
        audioContext: AudioContext | null;
        stream: MediaStream | null;
        analyser: AnalyserNode | null;
        dataArray: Uint8Array<ArrayBuffer> | null;
    }>({
        audioContext: null,
        stream: null,
        analyser: null,
        dataArray: null,
    });

    const cleanupMicrophoneVolumeAnalysis = useCallback(async () => {
        initSequenceRef.current += 1;

        if (microphoneVolumeAnalysisRef.current.audioContext) {
            await microphoneVolumeAnalysisRef.current.audioContext.close().catch(() => undefined);
            microphoneVolumeAnalysisRef.current.audioContext = null;
        }
        if (microphoneVolumeAnalysisRef.current.stream) {
            microphoneVolumeAnalysisRef.current.stream.getTracks().forEach((track) => track.stop());
            microphoneVolumeAnalysisRef.current.stream = null;
        }
        microphoneVolumeAnalysisRef.current.analyser = null;
        microphoneVolumeAnalysisRef.current.dataArray = null;
    }, []);

    const initializeMicrophoneVolumeAnalysis = useCallback(
        async (deviceId: string | null) => {
            await cleanupMicrophoneVolumeAnalysis();
            const initSequence = initSequenceRef.current;

            try {
                const useIOSWorkaround = isAudioSessionAvailable();
                const audioConstraints = useIOSWorkaround
                    ? { audio: true }
                    : { audio: deviceId ? { deviceId: { exact: deviceId } } : true };

                const stream = await withIOSAudioSessionWorkaround(async () =>
                    navigator.mediaDevices.getUserMedia(audioConstraints)
                );

                const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
                const audioContext = new AudioContextClass();

                const analyser = audioContext.createAnalyser();
                analyser.fftSize = 256;

                const source = audioContext.createMediaStreamSource(stream);
                source.connect(analyser);

                const dataArray = new Uint8Array(analyser.fftSize);

                if (audioContext.state === 'suspended') {
                    await audioContext.resume().catch(() => undefined);
                }

                if (initSequence !== initSequenceRef.current) {
                    stream.getTracks().forEach((track: MediaStreamTrack) => track.stop());
                    await audioContext.close().catch(() => undefined);
                    return;
                }

                microphoneVolumeAnalysisRef.current = {
                    audioContext,
                    stream,
                    analyser,
                    dataArray: dataArray as Uint8Array<ArrayBuffer>,
                };
            } catch (error) {
                await cleanupMicrophoneVolumeAnalysis();
            }
        },
        [cleanupMicrophoneVolumeAnalysis]
    );

    const getMicrophoneVolumeAnalysis = useCallback(() => {
        const { analyser, dataArray } = microphoneVolumeAnalysisRef.current;
        return { analyser, dataArray };
    }, []);

    return {
        getMicrophoneVolumeAnalysis,
        initializeMicrophoneVolumeAnalysis,
        cleanupMicrophoneVolumeAnalysis,
    };
};
