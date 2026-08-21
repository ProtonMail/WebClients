import { useEffect, useState } from 'react';

import { useLocalParticipant } from '@livekit/components-react';
import { Track } from 'livekit-client';

import { useMeetSelector } from '@proton/meet/store/hooks';
import {
    selectMicrophonePermission,
    selectSelectedMicrophoneId,
} from '@proton/meet/store/slices/deviceManagementSlice/selectors';

import { useMediaManagementContext } from '../contexts/MediaManagementProvider/MediaManagementContext';
import { useAnalyserLevel } from './useAnalyserLevel';

export const useMicrophoneVolumeDirect = (isMicOn: boolean, throttleMs: number = 100) => {
    const { getMicrophoneVolumeAnalysis, initializeMicrophoneVolumeAnalysis, cleanupMicrophoneVolumeAnalysis } =
        useMediaManagementContext();
    const selectedMicrophoneId = useMeetSelector(selectSelectedMicrophoneId);
    const micPermission = useMeetSelector(selectMicrophonePermission);

    const isCapturing = isMicOn && micPermission === 'granted';

    useEffect(() => {
        if (!isCapturing) {
            void cleanupMicrophoneVolumeAnalysis();
            return;
        }

        // An init that is still in flight when this is torn down discards its own stream.
        void initializeMicrophoneVolumeAnalysis(selectedMicrophoneId ?? null);

        return () => {
            void cleanupMicrophoneVolumeAnalysis();
        };
    }, [isCapturing, selectedMicrophoneId, initializeMicrophoneVolumeAnalysis, cleanupMicrophoneVolumeAnalysis]);

    return useAnalyserLevel({
        getAnalysis: getMicrophoneVolumeAnalysis,
        isActive: isCapturing,
        throttleMs,
    });
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
