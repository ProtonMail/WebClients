import { useEffect, useRef, useState } from 'react';

import { useRoomContext } from '@livekit/components-react';
import { c } from 'ttag';

import { useMeetContext } from '../contexts/MeetContext';
import { useDevices } from '../hooks/useDevices';
import { DeviceSelect } from './DeviceSelect/DeviceSelect';

export const AudioSettings = () => {
    const { microphones, speakers } = useDevices();
    const room = useRoomContext();
    const audioRef = useRef<HTMLAudioElement | null>(null);

    const { audioDeviceId, setAudioDeviceId } = useMeetContext();

    const [activeOutputDeviceId, setActiveOutputDeviceId] = useState('');

    useEffect(() => {
        const audio = new Audio();
        audioRef.current = audio;

        if (audio.sinkId !== undefined) {
            // @ts-ignore
            setActiveOutputDeviceId(audio.sinkId || 'default');
        } else {
            setActiveOutputDeviceId('default');
        }

        return () => {
            audioRef.current = null;
        };
    }, []);

    const handleInputDeviceChange = async (value: string) => {
        await room.switchActiveDevice('audioinput', value);
        setAudioDeviceId(value);
    };

    const handleOutputDeviceChange = async (value: string) => {
        try {
            const audioElements = document.querySelectorAll('audio');
            for (const el of audioElements) {
                // @ts-ignore
                await el.setSinkId(value);
            }

            if (audioRef.current) {
                // @ts-ignore
                await audioRef.current.setSinkId(value);
            }

            setActiveOutputDeviceId(value);
        } catch (e) {
            console.error('Error setting audio output device:', e);
        }
    };

    return (
        <div className="flex flex-nowrap gap-2" onClick={(e) => e.stopPropagation()}>
            <div className="w-custom max-w-custom" style={{ '--w-custom': '20rem', '--max-w-custom': '20rem' }}>
                <DeviceSelect
                    value={audioDeviceId}
                    onValue={(value) => handleInputDeviceChange(value)}
                    icon="meet-microphone"
                    title={c('l10n_nightly Info').t`Audio`}
                    options={microphones.map((mic) => ({
                        value: mic.deviceId,
                        label: mic.label,
                    }))}
                />
            </div>

            <div className="w-custom max-w-custom" style={{ '--w-custom': '20rem', '--max-w-custom': '20rem' }}>
                <DeviceSelect
                    value={activeOutputDeviceId}
                    onValue={(value) => handleOutputDeviceChange(value)}
                    icon="meet-speaker"
                    title={c('l10n_nightly Info').t`Speaker`}
                    options={speakers.map((speaker) => ({
                        value: speaker.deviceId,
                        label: speaker.label,
                    }))}
                />
            </div>
        </div>
    );
};
