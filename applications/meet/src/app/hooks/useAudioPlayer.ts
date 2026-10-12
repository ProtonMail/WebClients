import { useCallback, useEffect, useRef } from 'react';

import { useMeetSelector } from '@proton/meet/store/hooks';
import { selectActiveAudioOutputId } from '@proton/meet/store/slices/deviceManagementSlice/selectors';
import noop from '@proton/utils/noop';

import { supportsSetSinkId } from '../utils/browser';

type AudioElementWithSinkId = HTMLAudioElement & { setSinkId?: (sinkId: string) => Promise<void> };

/**
 * Plays a short sound on the output device the meeting audio is currently rendered to.
 */
export const useAudioPlayer = (audioPath: string) => {
    const audioRef = useRef<AudioElementWithSinkId | null>(null);
    const activeAudioOutputDeviceId = useMeetSelector(selectActiveAudioOutputId);

    useEffect(() => {
        const audio: AudioElementWithSinkId = new Audio(audioPath);
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

    // Pinned ahead of playback so a sound is not delayed by the switch. A failed switch keeps the
    // previous sink, and the meeting output falling back to another device re-runs this effect.
    useEffect(() => {
        const audio = audioRef.current;
        if (!audio || activeAudioOutputDeviceId === null || !supportsSetSinkId()) {
            return;
        }

        audio.setSinkId?.(activeAudioOutputDeviceId).catch(noop);
    }, [audioPath, activeAudioOutputDeviceId]);

    const playAudio = useCallback(() => {
        if (!audioRef.current) {
            return;
        }

        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(noop);
    }, []);

    return { playAudio };
};
