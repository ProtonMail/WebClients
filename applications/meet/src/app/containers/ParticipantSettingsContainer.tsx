import React, { useEffect, useState } from 'react';

import { Button } from '@proton/atoms/index';
import { InputFieldTwo, Option, SelectTwo, Toggle } from '@proton/components/index';

import { VideoPreview } from '../components/VideoPreview';
import { useDevices } from '../hooks/useDevices';
import type { ParticipantSettings } from '../types';

const shouldAllowExperimentalFaceCrop = process.env.EXPERIMENTAL_FACE_CROP === 'true';

interface ParticipantSettingsContainerProps {
    onSettingsChange: (settings: ParticipantSettings) => void;
}

export const ParticipantSettingsContainer = ({ onSettingsChange }: ParticipantSettingsContainerProps) => {
    const [selectedCamera, setSelectedCamera] = useState<MediaDeviceInfo | null>(null);
    const [selectedMicrophone, setSelectedMicrophone] = useState<MediaDeviceInfo | null>(null);

    const { cameras, microphones, defaultCamera, defaultMicrophone } = useDevices();

    const [isCameraEnabled, setIsCameraEnabled] = useState(false);
    const [isMicrophoneEnabled, setIsMicrophoneEnabled] = useState(false);
    const [isFaceTrackingEnabled, setIsFaceTrackingEnabled] = useState(false);

    const [participantName, setParticipantName] = useState('WEB-TEST');
    const [roomName, setRoomName] = useState('Proton-Meet-For-MSA');
    useEffect(() => {
        setSelectedCamera(defaultCamera);
        setSelectedMicrophone(defaultMicrophone);
    }, [defaultCamera, defaultMicrophone]);

    const handleJoinMeeting = () => {
        onSettingsChange({
            displayName: participantName,
            audioDeviceId: selectedMicrophone?.deviceId as string,
            videoDeviceId: selectedCamera?.deviceId as string,
            isAudioEnabled: isMicrophoneEnabled,
            isVideoEnabled: isCameraEnabled,
            isFaceTrackingEnabled: isFaceTrackingEnabled,
            roomName,
        });
    };

    return (
        <div
            style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
                width: 600,
                height: 400,
                alignItems: 'center',
                justifyContent: 'center',
                margin: 'auto',
            }}
        >
            <div style={{ width: 320, height: 240, position: 'relative' }}>
                <VideoPreview isCameraEnabled={isCameraEnabled} />
                <div
                    style={{
                        position: 'absolute',
                        bottom: 0,
                        width: '100%',
                        display: 'flex',
                        justifyContent: 'center',
                        gap: 8,
                    }}
                >
                    <Button onClick={() => setIsCameraEnabled((prev) => !prev)} size="small">
                        {isCameraEnabled ? 'Disable Camera' : 'Enable Camera'}
                    </Button>
                    <Button onClick={() => setIsMicrophoneEnabled(!isMicrophoneEnabled)} size="small">
                        {isMicrophoneEnabled ? 'Disable Microphone' : 'Enable Microphone'}
                    </Button>
                </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: 320 }}>
                <div>
                    <InputFieldTwo value={participantName} onChange={(e) => setParticipantName(e.target.value)} />
                </div>
                <div>
                    <InputFieldTwo value={roomName} onChange={(e) => setRoomName(e.target.value)} />
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                    <SelectTwo
                        value={selectedMicrophone?.deviceId}
                        onValue={(value) =>
                            setSelectedMicrophone(microphones.find((c) => c.deviceId === value) || null)
                        }
                        size={{ width: '150px', maxWidth: '150px' }}
                    >
                        {microphones.map((c) => (
                            <Option key={c.deviceId} value={c.deviceId} title={c.label} />
                        ))}
                    </SelectTwo>
                    <SelectTwo
                        value={selectedCamera?.deviceId}
                        onValue={(value) => setSelectedCamera(cameras.find((c) => c.deviceId === value) || null)}
                        size={{ width: '150px', maxWidth: '150px' }}
                    >
                        {cameras.map((c) => (
                            <Option key={c.deviceId} value={c.deviceId} title={c.label} />
                        ))}
                    </SelectTwo>
                </div>
            </div>
            {shouldAllowExperimentalFaceCrop && (
                <div>
                    Experimental
                    <div>
                        <Toggle
                            id="toggle-label"
                            checked={isFaceTrackingEnabled}
                            onChange={() => {
                                setIsFaceTrackingEnabled(!isFaceTrackingEnabled);
                            }}
                        >
                            Enable auto crop
                        </Toggle>
                    </div>
                </div>
            )}
            <div style={{ display: 'flex' }}>
                <Button color="norm" onClick={() => handleJoinMeeting()}>
                    Join Meeting
                </Button>
            </div>
        </div>
    );
};
