import { useRef, useState } from 'react';

import { useLocalParticipant } from '@livekit/components-react';
import type { KrispNoiseFilterProcessor } from '@livekit/krisp-noise-filter';
import { KrispNoiseFilter } from '@livekit/krisp-noise-filter';
import type { LocalAudioTrack } from '@proton-meet/livekit-client';
import { Track } from '@proton-meet/livekit-client';

import { audioQuality } from '../qualityConstants';

export const useAudioToggle = () => {
    const [noiseFilter, setNoiseFilter] = useState(true);
    const { localParticipant } = useLocalParticipant();

    const noiseFilterProcessor = useRef<KrispNoiseFilterProcessor | null>(null);
    const audioContext = useRef<AudioContext | null>(null);
    const trackId = useRef<string | null>(null);

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
            noiseSuppression: false,
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
            if (trackId.current === audioTrack.id) {
                await noiseFilterProcessor.current?.setEnabled(true);
            } else {
                trackId.current = audioTrack.id;

                noiseFilterProcessor.current = KrispNoiseFilter();
                // @ts-ignore - webkitAudioContext is not available in all browsers
                audioContext.current = new (window.AudioContext || window.webkitAudioContext)();

                await audioTrack?.setAudioContext(audioContext.current);
                await audioTrack?.setProcessor(noiseFilterProcessor.current);
            }
        } else {
            await noiseFilterProcessor.current?.setEnabled(false);
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
