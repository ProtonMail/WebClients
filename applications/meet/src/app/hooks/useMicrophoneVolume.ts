import { useEffect, useRef, useState } from 'react';

import { useLocalParticipant } from '@livekit/components-react';
import { Track } from 'livekit-client';

import { useMediaManagementContext } from '../contexts/MediaManagementProvider/MediaManagementContext';

const calculateRms = (data: Uint8Array<ArrayBuffer>): number => {
    let sum = 0;
    for (let i = 0; i < data.length; i++) {
        const normalized = (data[i] - 128) / 128;
        sum += normalized * normalized;
    }
    const rms = Math.sqrt(sum / data.length);

    return Math.pow(Math.min(rms, 1), 0.5);
};

export const useMicrophoneVolumeDirect = (isMicOn: boolean, throttleMs: number = 100) => {
    const {
        getMicrophoneVolumeAnalysis,
        initializeMicrophoneVolumeAnalysis,
        cleanupMicrophoneVolumeAnalysis,
        selectedMicrophoneId,
    } = useMediaManagementContext();
    const [volume, setVolume] = useState(0);
    const rafRef = useRef<number | null>(null);
    const lastUpdateRef = useRef<number>(0);
    const mountedRef = useRef(true);
    const deviceIdRef = useRef<string | null>(null);

    useEffect(() => {
        if (!isMicOn) {
            setVolume(0);
            cleanupMicrophoneVolumeAnalysis();
            return;
        }

        mountedRef.current = true;

        lastUpdateRef.current = 0;

        const cleanup = () => {
            mountedRef.current = false;
            if (rafRef.current !== null) {
                cancelAnimationFrame(rafRef.current);
                rafRef.current = null;
            }
            cleanupMicrophoneVolumeAnalysis();
        };

        const updateVolume = () => {
            const { analyser, dataArray } = getMicrophoneVolumeAnalysis();
            if (!mountedRef.current || !analyser || !dataArray) {
                return;
            }

            analyser.getByteTimeDomainData(dataArray as Uint8Array<ArrayBuffer>);
            const rms = calculateRms(dataArray as Uint8Array<ArrayBuffer>);

            const now = Date.now();
            if (now - lastUpdateRef.current >= throttleMs) {
                setVolume(rms);
                lastUpdateRef.current = now;
            }

            rafRef.current = requestAnimationFrame(updateVolume);
        };

        const initialize = async () => {
            const currentDeviceId = selectedMicrophoneId ?? null;
            deviceIdRef.current = currentDeviceId;

            await initializeMicrophoneVolumeAnalysis(currentDeviceId);

            if (!mountedRef.current || deviceIdRef.current !== currentDeviceId) {
                return;
            }

            const { analyser, dataArray } = getMicrophoneVolumeAnalysis();
            if (analyser && dataArray) {
                rafRef.current = requestAnimationFrame(updateVolume);
            } else {
                setVolume(0);
            }
        };

        void initialize();

        return cleanup;
    }, [
        isMicOn,
        throttleMs,
        selectedMicrophoneId,
        getMicrophoneVolumeAnalysis,
        initializeMicrophoneVolumeAnalysis,
        cleanupMicrophoneVolumeAnalysis,
    ]);

    return volume;
};

export const useMicrophoneVolume = (isMicOn: boolean, throttleMs: number = 100) => {
    const { localParticipant } = useLocalParticipant();
    const [volume, setVolume] = useState(0);

    const liveKitMicTrack = localParticipant
        ? [...localParticipant.trackPublications.values()].find(
              (track) => track.kind === Track.Kind.Audio && track.source === Track.Source.Microphone
          )
        : null;

    const hasLiveKitTrack = !!liveKitMicTrack?.track;

    useEffect(() => {
        if (!isMicOn || !hasLiveKitTrack || !localParticipant) {
            setVolume(0);
            return;
        }

        const interval = setInterval(() => {
            const audioLevel = localParticipant.audioLevel;
            setVolume(Math.pow(audioLevel, 0.5));
        }, throttleMs);

        return () => {
            clearInterval(interval);
        };
    }, [isMicOn, throttleMs, hasLiveKitTrack, localParticipant]);

    return volume;
};
