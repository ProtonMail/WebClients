import { useRef, useState } from 'react';

import { useLocalParticipant } from '@livekit/components-react';
import type { KrispNoiseFilterProcessor } from '@livekit/krisp-noise-filter';
import { KrispNoiseFilter, isKrispNoiseFilterSupported } from '@livekit/krisp-noise-filter';
import { Track } from 'livekit-client';

import { DEFAULT_DEVICE_ID } from '../constants';
import { audioQuality } from '../qualityConstants';
import type { SwitchActiveDevice } from '../types';
import { isAudioSessionAvailable, setAudioSessionType } from '../utils/ios-audio-session';

const isAdvancedNoiseFilterSupported = isKrispNoiseFilterSupported();

export const useAudioToggle = (
    activeMicrophoneDeviceId: string,
    switchActiveDevice: SwitchActiveDevice,
    initialAudioState: boolean,
    systemDefaultMicrophone: MediaDeviceInfo
) => {
    const [noiseFilter, setNoiseFilter] = useState(isAdvancedNoiseFilterSupported);
    const { isMicrophoneEnabled, localParticipant } = useLocalParticipant();

    const noiseFilterProcessor = useRef<KrispNoiseFilterProcessor | null>(null);
    const audioContext = useRef<AudioContext | null>(null);
    const trackId = useRef<string | null>(null);

    const toggleInProgress = useRef(false);
    const currentDeviceId = useRef<string | null>(null);

    const toggleAudio = async (
        params: {
            isEnabled?: boolean;
            audioDeviceId?: string | null;
            enableNoiseFilter?: boolean;
            preserveCache?: boolean;
        } = {}
    ) => {
        // Get current mute state from the actual track (more reliable than a ref)
        const currentAudioPublication = [...localParticipant.audioTrackPublications.values()].find(
            (item) => item.kind === Track.Kind.Audio && item.source !== Track.Source.ScreenShare
        );
        const currentMuteState = currentAudioPublication?.isMuted ?? !initialAudioState;

        const {
            isEnabled = !currentMuteState, // Use actual track state, fallback to initialAudioState if no track exists yet
            audioDeviceId = activeMicrophoneDeviceId,
            enableNoiseFilter = noiseFilter,
            preserveCache,
        } = params;

        const deviceId = audioDeviceId === DEFAULT_DEVICE_ID ? systemDefaultMicrophone.deviceId : audioDeviceId;

        if (toggleInProgress.current || !deviceId) {
            return;
        }

        toggleInProgress.current = true;

        // On iOS Safari, we need to let the system decide which device to use by not specifying a deviceId constraint.
        // The audioSession workaround will ensure the correct external device (AirPods, wired headset) is selected.
        const useIOSWorkaround = isAudioSessionAvailable();

        const audio = {
            ...(useIOSWorkaround ? {} : { deviceId: { exact: deviceId as string } }),
            autoGainControl: true,
            echoCancellation: true,
            noiseSuppression: enableNoiseFilter,
        };

        try {
            // Get existing audio track and publication
            const audioPublication = [...localParticipant.audioTrackPublications.values()].find(
                (item) => item.kind === Track.Kind.Audio && item.source !== Track.Source.ScreenShareAudio
            );
            const audioTrack = audioPublication?.audioTrack;

            // Check if we're just toggling mute state (not changing devices or noise filter settings)
            const isDeviceChanging = currentDeviceId.current !== deviceId;
            const isJustTogglingMute = audioTrack && !isDeviceChanging && enableNoiseFilter === noiseFilter;

            if (isJustTogglingMute) {
                // Fast path: just mute/unmute the existing track
                if (isEnabled) {
                    await audioTrack.unmute();
                } else {
                    await audioTrack.mute();
                }
            } else {
                // Need to recreate track (device change, noise filter change, or no track exists)
                // Apply iOS Safari audioSession workaround before enabling microphone
                // This ensures the correct device is selected and audio routing is correct
                if (useIOSWorkaround) {
                    setAudioSessionType('auto');
                }

                // Always create and publish the track (even if we want it muted)
                // This keeps iOS audio playback working and enables fast unmute
                await localParticipant.setMicrophoneEnabled(true, audio, {
                    audioPreset: {
                        maxBitrate: audioQuality,
                    },
                });

                if (useIOSWorkaround) {
                    setAudioSessionType('play-and-record');
                }

                currentDeviceId.current = deviceId;

                // Now mute/unmute the newly created track based on desired state
                const newAudioPublication = [...localParticipant.audioTrackPublications.values()].find(
                    (item) => item.kind === Track.Kind.Audio && item.source !== Track.Source.ScreenShare
                );
                const newAudioTrack = newAudioPublication?.audioTrack;

                if (newAudioTrack) {
                    if (isEnabled) {
                        await newAudioTrack.unmute();
                    } else {
                        await newAudioTrack.mute();
                    }
                }
            }

            await switchActiveDevice({
                deviceType: 'audioinput',
                deviceId,
                isSystemDefaultDevice: audioDeviceId === DEFAULT_DEVICE_ID,
                preserveDefaultDevice: !!preserveCache,
            });

            const currentAudioTrack = [...localParticipant.audioTrackPublications.values()].find(
                (item) => item.kind === Track.Kind.Audio && item.source !== Track.Source.ScreenShare && item.audioTrack
            )?.audioTrack;

            if (!currentAudioTrack) {
                return;
            }

            if (enableNoiseFilter && isEnabled && audioDeviceId && isAdvancedNoiseFilterSupported) {
                if (trackId.current === currentAudioTrack.id) {
                    void noiseFilterProcessor.current?.setEnabled(true);
                } else {
                    trackId.current = currentAudioTrack.id;

                    noiseFilterProcessor.current = KrispNoiseFilter();
                    // @ts-ignore - webkitAudioContext is not available in all browsers
                    audioContext.current = new (window.AudioContext || window.webkitAudioContext)();

                    void currentAudioTrack?.setAudioContext(audioContext.current);
                    void currentAudioTrack?.setProcessor(noiseFilterProcessor.current);
                }
            } else {
                void noiseFilterProcessor.current?.setEnabled(false);
            }

            setNoiseFilter(enableNoiseFilter);
        } catch (error) {
            throw error;
        } finally {
            toggleInProgress.current = false;
        }
    };

    const toggleNoiseFilter = async () => {
        if (isMicrophoneEnabled) {
            await toggleAudio({
                isEnabled: isMicrophoneEnabled,
                enableNoiseFilter: !noiseFilter,
                preserveCache: true,
            });
        } else {
            setNoiseFilter((prev) => !prev);
        }
    };

    // Check actual mute state, not just publication state
    const audioPublication = [...localParticipant.audioTrackPublications.values()].find(
        (item) => item.kind === Track.Kind.Audio && item.source !== Track.Source.ScreenShare
    );

    // If track exists but is muted, we're effectively "disabled"
    const isAudioEnabled = isMicrophoneEnabled && !audioPublication?.isMuted;

    return { toggleAudio, noiseFilter, toggleNoiseFilter, isAudioEnabled };
};
