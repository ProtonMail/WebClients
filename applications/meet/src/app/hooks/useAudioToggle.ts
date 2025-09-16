import { useRef, useState } from 'react';

import { useLocalParticipant } from '@livekit/components-react';
import { KrispNoiseFilter } from '@livekit/krisp-noise-filter';
import type { LocalAudioTrack } from '@proton-meet/livekit-client';
import { Track } from '@proton-meet/livekit-client';

import { audioQuality } from '../qualityConstants';

export const useAudioToggle = () => {
    const [noiseFilter, setNoiseFilter] = useState(true);
    const { localParticipant } = useLocalParticipant();

    const toggleInProgress = useRef(false);

    const toggleAudio = async ({
        isEnabled,
        audioDeviceId,
        enableNoiseFilter = noiseFilter,
    }: {
        isEnabled: boolean;
        audioDeviceId: string | null;
        enableNoiseFilter?: boolean;
    }) => {
        if (toggleInProgress.current) {
            return;
        }

        toggleInProgress.current = true;

        const audio = {
            deviceId: { exact: audioDeviceId as string },
            autoGainControl: true,
            echoCancellation: true,
        };

        await localParticipant.setMicrophoneEnabled(
            isEnabled && !!audioDeviceId,
            audioDeviceId ? audio : undefined,
            isEnabled
                ? {
                      audioPreset: {
                          maxBitrate: audioQuality,
                      },
                  }
                : undefined
        );

        const audioTrack = [...localParticipant.trackPublications.values()].find(
            (item) => item.kind === Track.Kind.Audio && item.source !== Track.Source.ScreenShare
        )?.track as LocalAudioTrack;

        if (enableNoiseFilter && isEnabled && audioDeviceId) {
            // Set audio context before applying processor
            // @ts-ignore - webkitAudioContext is not available in all browsers
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            await audioTrack?.setAudioContext(audioContext);
            await audioTrack?.setProcessor(KrispNoiseFilter());
        } else {
            await audioTrack?.stopProcessor();
        }

        setNoiseFilter(enableNoiseFilter);

        toggleInProgress.current = false;
    };

    const toggleNoiseFilter = async ({ isEnabled, audioDeviceId }: { isEnabled: boolean; audioDeviceId: string }) => {
        if (isEnabled) {
            await toggleAudio({ isEnabled: isEnabled, audioDeviceId: audioDeviceId, enableNoiseFilter: !noiseFilter });
        } else {
            setNoiseFilter((prev) => !prev);
        }
    };

    return { toggleAudio, noiseFilter, toggleNoiseFilter };
};
