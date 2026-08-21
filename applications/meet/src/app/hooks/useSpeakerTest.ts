import { useCallback, useEffect, useRef, useState } from 'react';

import { useMeetSelector } from '@proton/meet/store/hooks';
import { selectJoiningInProgress } from '@proton/meet/store/slices/connectionSlice';

import { supportsSetSinkId } from '../utils/browser';

const TEST_SOUND_PATH = '/assets/sounds/speaker_test.wav';

type AudioElementWithSinkId = HTMLAudioElement & { setSinkId?: (sinkId: string) => Promise<void> };

/**
 * Plays a test sound on the selected speaker so the user can check their output device.
 *
 * @param speakerDeviceId `null` means the system default device
 */
export const useSpeakerTest = (speakerDeviceId: string | null) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [hasFailed, setHasFailed] = useState(false);

    const audioRef = useRef<AudioElementWithSinkId | null>(null);

    const stopTestSound = useCallback(() => {
        audioRef.current?.pause();
    }, []);

    const joiningInProgress = useMeetSelector(selectJoiningInProgress);

    useEffect(() => {
        const audio: AudioElementWithSinkId = new Audio(TEST_SOUND_PATH);
        // Only the metadata is fetched upfront, the sound itself streams on the first play.
        audio.preload = 'metadata';
        audioRef.current = audio;

        const onPlaybackStopped = () => setIsPlaying(false);
        audio.addEventListener('ended', onPlaybackStopped);
        audio.addEventListener('pause', onPlaybackStopped);

        return () => {
            audio.removeEventListener('ended', onPlaybackStopped);
            audio.removeEventListener('pause', onPlaybackStopped);
            audio.pause();
            audio.src = '';
            audioRef.current = null;
        };
    }, []);

    // The meeting should start on a silent output.
    useEffect(() => {
        if (joiningInProgress) {
            stopTestSound();
        }
    }, [joiningInProgress, stopTestSound]);

    // The sink is only applied when playback starts, so a sound kept across a switch would keep
    // playing on the previous speaker.
    const testedSpeakerIdRef = useRef(speakerDeviceId);

    useEffect(() => {
        if (testedSpeakerIdRef.current !== speakerDeviceId) {
            testedSpeakerIdRef.current = speakerDeviceId;
            stopTestSound();
        }
    }, [speakerDeviceId, stopTestSound]);

    const playTestSound = useCallback(async () => {
        const audio = audioRef.current;
        if (!audio || joiningInProgress) {
            return;
        }

        try {
            if (supportsSetSinkId()) {
                await audio.setSinkId?.(speakerDeviceId ?? '');
            }

            audio.currentTime = 0;
            setHasFailed(false);
            setIsPlaying(true);
            await audio.play();
        } catch (error) {
            setIsPlaying(false);
            setHasFailed(true);
        }
    }, [speakerDeviceId, joiningInProgress]);

    return { isPlaying, hasFailed, playTestSound, stopTestSound };
};
