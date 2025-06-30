import type { RefObject } from 'react';
import { useEffect, useRef, useState } from 'react';

import { useRoomContext } from '@livekit/components-react';
import { c } from 'ttag';

import { Dropdown, DropdownSizeUnit } from '@proton/components';
import { IcCheckmark, IcMeetSpeakerAlt } from '@proton/icons';

import { OptionButton } from '../../atoms/CheckmarkButton/OptionButton';
import { useMeetContext } from '../../contexts/MeetContext';
import { useAudioToggle } from '../../hooks/useAudioToggle';
import { useDevices } from '../../hooks/useDevices';

import './AudioSettings.scss';

interface AudioSettingsProps {
    anchorRef?: RefObject<HTMLButtonElement>;
}

export const AudioSettings = ({ anchorRef }: AudioSettingsProps) => {
    const { microphones, speakers } = useDevices();
    const room = useRoomContext();
    const audioRef = useRef<HTMLAudioElement | null>(null);

    const { audioDeviceId, setAudioDeviceId } = useMeetContext();

    const [activeOutputDeviceId, setActiveOutputDeviceId] = useState<string | null>('');

    const toggleAudio = useAudioToggle();

    useEffect(() => {
        const audio = new Audio();
        audioRef.current = audio;

        if (audio.sinkId !== undefined) {
            setActiveOutputDeviceId(audio.sinkId || 'default');
        } else {
            setActiveOutputDeviceId('default');
        }

        return () => {
            audioRef.current = null;
        };
    }, []);

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
            setActiveOutputDeviceId(value);
        } catch (e) {
            console.error('Error setting audio output device:', e);
        }
    };

    return (
        <Dropdown
            className="audio-settings-dropdown border border-norm rounded-xl p-2"
            isOpen={true}
            anchorRef={anchorRef as RefObject<HTMLElement>}
            onClose={close}
            noCaret
            originalPlacement="top-start"
            availablePlacements={['top-start']}
            disableDefaultArrowNavigation
            onClick={(e) => e.stopPropagation()}
            size={{ width: DropdownSizeUnit.Dynamic, maxWidth: '27rem' }}
        >
            <div className="flex flex-column gap-2 m-4">
                <div className="flex flex-column">
                    <div className="text-sm color-weak">{c('l10n_nightly Info').t`Select a microphone`}</div>
                    {microphones.map((mic) => (
                        <OptionButton
                            key={mic.deviceId}
                            onClick={() => handleInputDeviceChange(mic.deviceId)}
                            showIcon={mic.deviceId === audioDeviceId}
                            label={mic.label}
                            Icon={IcCheckmark}
                        />
                    ))}
                </div>
                <div className="flex flex-column">
                    <div className="text-sm color-weak">{c('l10n_nightly Info').t`Select a speaker`}</div>
                    {speakers.map((speaker) => (
                        <OptionButton
                            key={speaker.deviceId}
                            showIcon={speaker.deviceId === activeOutputDeviceId}
                            label={speaker.label}
                            onClick={() => handleOutputDeviceChange(speaker.deviceId)}
                            Icon={IcCheckmark}
                        />
                    ))}
                </div>
                <hr />
                <OptionButton
                    label="Test microphone & speakers"
                    Icon={IcMeetSpeakerAlt}
                    showIcon={true}
                    onClick={() => {}}
                    iconSize={4}
                />
            </div>
        </Dropdown>
    );
};
