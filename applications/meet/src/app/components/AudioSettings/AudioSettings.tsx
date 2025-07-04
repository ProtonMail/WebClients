import type { RefObject } from 'react';

import { useRoomContext } from '@livekit/components-react';

import { useMeetContext } from '../../contexts/MeetContext';
import { useAudioToggle } from '../../hooks/useAudioToggle';
import { useDevices } from '../../hooks/useDevices';
import { AudioSettingsDropdown } from './AudioSettingsDropdown';

interface AudioSettingsProps {
    anchorRef?: RefObject<HTMLButtonElement>;
}

export const AudioSettings = ({ anchorRef }: AudioSettingsProps) => {
    const { microphones, speakers } = useDevices();
    const room = useRoomContext();

    const { audioDeviceId, setAudioDeviceId, audioOutputDeviceId, setAudioOutputDeviceId } = useMeetContext();

    const toggleAudio = useAudioToggle();

    const handleInputDeviceChange = async (value: string | null) => {
        if (!value) {
            void toggleAudio({ isEnabled: false, audioDeviceId: null });
            setAudioDeviceId(value);
            return;
        }

        await room.switchActiveDevice('audioinput', value);

        setAudioDeviceId(value);
    };

    const handleOutputDeviceChange = async (value: string | null) => {
        try {
            await room.switchActiveDevice('audiooutput', value === null ? '' : value);
            setAudioOutputDeviceId(value);

            const audioElements = document.querySelectorAll('audio');
            for (const el of audioElements) {
                await el.setSinkId(value as string);
            }
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
        />
    );
};
