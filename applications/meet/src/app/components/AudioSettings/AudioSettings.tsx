import type { RefObject } from 'react';
import { useEffect } from 'react';

import { useRoomContext } from '@livekit/components-react';

import { useMeetContext } from '../../contexts/MeetContext';
import { useDevices } from '../../hooks/useDevices';
import { supportsSetSinkId } from '../../utils/browser';
import { AudioSettingsDropdown } from './AudioSettingsDropdown';

interface AudioSettingsProps {
    anchorRef?: RefObject<HTMLButtonElement>;
}

export const AudioSettings = ({ anchorRef }: AudioSettingsProps) => {
    const { microphones, speakers, defaultMicrophone, defaultSpeaker } = useDevices();
    const room = useRoomContext();

    const { audioDeviceId, setAudioDeviceId, audioOutputDeviceId, setAudioOutputDeviceId, toggleAudio } =
        useMeetContext();

    useEffect(() => {
        if (microphones.length > 0) {
            const isDeviceAvailable = audioDeviceId ? microphones.find((m) => m.deviceId === audioDeviceId) : null;
            if (!audioDeviceId || !isDeviceAvailable) {
                const deviceToSelect = defaultMicrophone || microphones[0];
                if (deviceToSelect) {
                    setAudioDeviceId(deviceToSelect.deviceId);
                }
            }
        }
    }, [audioDeviceId, microphones, defaultMicrophone, setAudioDeviceId]);

    useEffect(() => {
        if (speakers.length > 0) {
            const isDeviceAvailable = audioOutputDeviceId
                ? speakers.find((s) => s.deviceId === audioOutputDeviceId)
                : null;
            if (!audioOutputDeviceId || !isDeviceAvailable) {
                const deviceToSelect = defaultSpeaker || speakers[0];
                if (deviceToSelect) {
                    setAudioOutputDeviceId(deviceToSelect.deviceId);
                }
            }
        }
    }, [audioOutputDeviceId, speakers, defaultSpeaker, setAudioOutputDeviceId]);

    const handleInputDeviceChange = async (value: string | null) => {
        if (!value) {
            void toggleAudio({ isEnabled: false, audioDeviceId: null });
            setAudioDeviceId(value);
            return;
        }

        await room.switchActiveDevice('audioinput', value);

        setAudioDeviceId(value, true);
    };

    const handleOutputDeviceChange = async (value: string | null) => {
        try {
            if (!supportsSetSinkId()) {
                return;
            }
            await room.switchActiveDevice('audiooutput', value === null ? '' : value);
            setAudioOutputDeviceId(value, true);

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
        />
    );
};
