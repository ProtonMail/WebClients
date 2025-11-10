import { type RefObject, useMemo } from 'react';

import type { PopperPosition } from '@proton/components/components/popper/interface';

import { useMediaManagementContext } from '../../contexts/MediaManagementContext';
import { useDeviceLoading } from '../../hooks/useDeviceLoading';
import { supportsSetSinkId } from '../../utils/browser';
import { filterDevices, isDefaultDevice } from '../../utils/device-utils';
import { AudioSettingsDropdown } from './AudioSettingsDropdown';

interface AudioSettingsProps {
    anchorRef: RefObject<HTMLButtonElement>;
    onClose: () => void;
    anchorPosition?: PopperPosition;
}

export const AudioSettings = ({ anchorRef, onClose, anchorPosition }: AudioSettingsProps) => {
    const {
        selectedMicrophoneId: audioDeviceId,
        selectedAudioOutputDeviceId: audioOutputDeviceId,
        microphoneState,
        speakerState,
        toggleAudio,
        microphones,
        speakers,
        switchActiveDevice,
        isAudioEnabled,
    } = useMediaManagementContext();

    const { isLoading, withLoading } = useDeviceLoading();

    const filteredMicrophones = useMemo(() => filterDevices(microphones), [microphones]);
    const filteredSpeakers = useMemo(() => filterDevices(speakers), [speakers]);

    const handleInputDeviceChange = async (value: string | null) => {
        if (!value) {
            await toggleAudio({ isEnabled: false, audioDeviceId: null });
            return;
        }

        await toggleAudio({ audioDeviceId: value, isEnabled: isAudioEnabled });
    };

    const handleOutputDeviceChange = async (value: string | null) => {
        try {
            if (!supportsSetSinkId()) {
                return;
            }
            await switchActiveDevice({
                deviceType: 'audiooutput',
                deviceId: value === null ? '' : value,
                isSystemDefaultDevice: isDefaultDevice(value),
            });

            const audioElements = document.querySelectorAll('audio');

            await Promise.all([...audioElements].map((el) => el.setSinkId(value as string)));
        } catch (e) {
            // eslint-disable-next-line no-console
            console.error('Error setting audio output device:', e);
        }
    };

    return (
        <AudioSettingsDropdown
            anchorRef={anchorRef}
            handleInputDeviceChange={handleInputDeviceChange}
            handleOutputDeviceChange={handleOutputDeviceChange}
            audioDeviceId={audioDeviceId}
            activeOutputDeviceId={audioOutputDeviceId}
            microphoneState={microphoneState}
            speakerState={speakerState}
            microphones={filteredMicrophones}
            speakers={filteredSpeakers}
            onClose={onClose}
            anchorPosition={anchorPosition}
            isMicrophoneLoading={(deviceId) => isLoading('microphone', deviceId)}
            isSpeakerLoading={(deviceId) => isLoading('speaker', deviceId)}
            withMicrophoneLoading={(deviceId, operation) => withLoading('microphone', deviceId, operation)}
            withSpeakerLoading={(deviceId, operation) => withLoading('speaker', deviceId, operation)}
        />
    );
};
