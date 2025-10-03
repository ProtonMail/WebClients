import type { RefObject } from 'react';

import type { PopperPosition } from '@proton/components/components/popper/interface';

import { useMediaManagementContext } from '../../contexts/MediaManagementContext';
import { supportsSetSinkId } from '../../utils/browser';
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
        toggleAudio,
        microphones,
        speakers,
        switchActiveDevice,
        isAudioEnabled,
    } = useMediaManagementContext();

    const handleInputDeviceChange = async (value: string | null) => {
        if (!value) {
            void toggleAudio({ isEnabled: false, audioDeviceId: null });
            return;
        }

        await toggleAudio({ audioDeviceId: value, isEnabled: isAudioEnabled });
    };

    const handleOutputDeviceChange = async (value: string | null) => {
        try {
            if (!supportsSetSinkId()) {
                return;
            }
            await switchActiveDevice('audiooutput', value === null ? '' : value);

            const audioElements = document.querySelectorAll('audio');

            await Promise.all([...audioElements].map((el) => el.setSinkId(value as string)));
        } catch (e) {
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
            microphones={microphones}
            speakers={speakers}
            onClose={onClose}
            anchorPosition={anchorPosition}
        />
    );
};
