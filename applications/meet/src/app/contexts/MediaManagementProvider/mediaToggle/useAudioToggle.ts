import { useEffect, useMemo, useRef, useState } from 'react';

import { useLocalParticipant, useRoomContext } from '@livekit/components-react';
import type { KrispNoiseFilterProcessor } from '@livekit/krisp-noise-filter';
import { KrispNoiseFilter, isKrispNoiseFilterSupported } from '@livekit/krisp-noise-filter';
import { Track } from 'livekit-client';
import throttle from 'lodash/throttle';

import { useMeetErrorReporting } from '@proton/meet/hooks/useMeetErrorReporting';

import { DEFAULT_DEVICE_ID } from '../../../constants';
import { useStableCallback } from '../../../hooks/useStableCallback';
import { audioQuality } from '../../../qualityConstants';
import type { SwitchActiveDevice } from '../../../types';
import { isAudioSessionAvailable, setAudioSessionType } from '../../../utils/ios-audio-session';
import { ERRORS_SIGNALING_POTENTIAL_STALE_DEVICE_STATE } from './constants';

const isAdvancedNoiseFilterSupported = isKrispNoiseFilterSupported();

export const useAudioToggle = (
    activeMicrophoneDeviceId: string,
    switchActiveDevice: SwitchActiveDevice,
    initialAudioState: boolean,
    systemDefaultMicrophone: MediaDeviceInfo,
    microphones: MediaDeviceInfo[]
) => {
    const reportError = useMeetErrorReporting();
    const [noiseFilter, setNoiseFilter] = useState(isAdvancedNoiseFilterSupported);
    const { isMicrophoneEnabled, localParticipant } = useLocalParticipant();

    const noiseFilterProcessor = useRef<KrispNoiseFilterProcessor | null>(null);
    const audioContext = useRef<AudioContext | null>(null);
    const trackId = useRef<string | null>(null);

    const toggleInProgress = useRef(false);
    const currentDeviceId = useRef<string | null>(null);

    const room = useRoomContext();

    const getCurrentPublication = () => {
        return [...room.localParticipant.audioTrackPublications.values()].find(
            (item) =>
                item.kind === Track.Kind.Audio &&
                item.source !== Track.Source.ScreenShare &&
                item.source !== Track.Source.ScreenShareAudio &&
                item.audioTrack
        );
    };

    const tearDownNoiseFilter = async () => {
        const publication = getCurrentPublication();
        const audioTrack = publication?.audioTrack;

        if (audioTrack?.getProcessor()) {
            await audioTrack.stopProcessor();
        }

        if (audioContext.current) {
            await noiseFilterProcessor.current?.setEnabled(false);
            noiseFilterProcessor.current = null;
            await audioContext.current.close();
            audioContext.current = null;
        }
        trackId.current = null;
        noiseFilterProcessor.current = null;
    };

    const setupNoiseFilter = async () => {
        const publication = getCurrentPublication();
        const currentAudioTrack = publication?.audioTrack;

        if (!currentAudioTrack || !isAdvancedNoiseFilterSupported || trackId.current === currentAudioTrack.id) {
            return;
        }

        await tearDownNoiseFilter();

        trackId.current = currentAudioTrack.id;

        noiseFilterProcessor.current = KrispNoiseFilter();
        // @ts-ignore - webkitAudioContext is not available in all browsers
        audioContext.current = new (window.AudioContext || window.webkitAudioContext)();

        try {
            await currentAudioTrack?.setAudioContext(audioContext.current);
            await currentAudioTrack?.setProcessor(noiseFilterProcessor.current);
        } catch (error) {
            // Clean up on failure to prevent AudioContext leak
            await audioContext.current?.close().catch(() => {});
            audioContext.current = null;
            noiseFilterProcessor.current = null;
            trackId.current = null;
            throw error;
        }
    };

    useEffect(() => {
        return () => {
            void tearDownNoiseFilter();
        };
    }, []);

    const toggleAudio = useStableCallback(
        async (
            params: {
                isEnabled?: boolean;
                audioDeviceId?: string | null;
                preserveCache?: boolean;
                recoveringFromError?: boolean;
            } = {}
        ) => {
            let toggleResult = false;

            // Get current mute state from the actual track (more reliable than a ref)
            const currentAudioPublication = getCurrentPublication();
            const currentMuteState = currentAudioPublication?.isMuted ?? !initialAudioState;

            const {
                isEnabled = !currentMuteState, // Use actual track state, fallback to initialAudioState if no track exists yet
                audioDeviceId = activeMicrophoneDeviceId,
                preserveCache,
                recoveringFromError = false,
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
                echoCancellation: { ideal: true },
                autoGainControl: { ideal: true },
                noiseSuppression: isAdvancedNoiseFilterSupported ? false : noiseFilter,
                channelCount: { ideal: 1 },
                dtx: false,
            };

            try {
                // Get existing audio track and publication
                const audioPublication = getCurrentPublication();
                const audioTrack = audioPublication?.audioTrack;

                // Check if we're just toggling mute state (not changing devices or noise filter settings)
                const isDeviceChanging = currentDeviceId.current !== deviceId;
                const isJustTogglingMute = audioTrack && !isDeviceChanging;

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
                            priority: 'high',
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
                    (item) =>
                        item.kind === Track.Kind.Audio && item.source !== Track.Source.ScreenShare && item.audioTrack
                )?.audioTrack;

                if (!currentAudioTrack) {
                    return;
                }

                if (isEnabled && audioDeviceId && isAdvancedNoiseFilterSupported) {
                    if (noiseFilter) {
                        await setupNoiseFilter();
                    }

                    if (noiseFilter && noiseFilterProcessor.current && !noiseFilterProcessor.current.isEnabled()) {
                        await noiseFilterProcessor.current.setEnabled(true);
                    }
                }

                toggleResult = true;
            } catch (error) {
                reportError('Failed to toggle audio', error);
                // eslint-disable-next-line no-console
                console.error(error);

                const isPotentialStaleDeviceState = ERRORS_SIGNALING_POTENTIAL_STALE_DEVICE_STATE.includes(
                    (error as Error)?.name
                );

                // Recovering from potential stale device state
                if (
                    !recoveringFromError &&
                    isPotentialStaleDeviceState &&
                    microphones.length > 0 &&
                    microphones[0].deviceId !== deviceId
                ) {
                    toggleInProgress.current = false;

                    const recoveryResult = (await toggleAudio({
                        isEnabled,
                        audioDeviceId: microphones[0].deviceId,
                        recoveringFromError: true,
                        preserveCache: false,
                    })) as boolean;
                    toggleResult = recoveryResult ?? false;
                }
            } finally {
                toggleInProgress.current = false;
            }

            return toggleResult;
        }
    );

    const toggleNoiseFilter = async () => {
        if (isMicrophoneEnabled) {
            const newValue = !noiseFilter;

            if (!noiseFilterProcessor.current && newValue) {
                await setupNoiseFilter();
            }

            if (noiseFilterProcessor.current) {
                await noiseFilterProcessor.current?.setEnabled(newValue);
            }

            setNoiseFilter(newValue);
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

    const throttledToggleAudio = useMemo(
        () => throttle(toggleAudio, 750, { leading: true, trailing: true }),
        [toggleAudio]
    );

    return { toggleAudio: throttledToggleAudio, noiseFilter, toggleNoiseFilter, isAudioEnabled };
};
