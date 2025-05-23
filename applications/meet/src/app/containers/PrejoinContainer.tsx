import React, { useEffect, useState } from 'react';

import logo from '../../assets/meet-logo.svg';
import { DeviceSettings } from '../components/DeviceSettings/DeviceSettings';
import { PreJoinDetails } from '../components/PreJoinDetails/PreJoinDetails';
import { useDevices } from '../hooks/useDevices';
import type { ParticipantSettings } from '../types';

const defaultDisplayName = 'WEB TEST';
interface PrejoinContainerProps {
    onSettingsChange: (settings: ParticipantSettings) => void;
}

export const PrejoinContainer = ({ onSettingsChange }: PrejoinContainerProps) => {
    const [selectedCamera, setSelectedCamera] = useState<MediaDeviceInfo | null>(null);
    const [selectedMicrophone, setSelectedMicrophone] = useState<MediaDeviceInfo | null>(null);

    const { cameras, microphones, defaultCamera, defaultMicrophone } = useDevices();

    const [isCameraEnabled, setIsCameraEnabled] = useState(false);
    const [isMicrophoneEnabled, setIsMicrophoneEnabled] = useState(false);

    const [displayName, setDisplayName] = useState(defaultDisplayName);

    useEffect(() => {
        setSelectedCamera(defaultCamera);
        setSelectedMicrophone(defaultMicrophone);
    }, [defaultCamera, defaultMicrophone]);

    const handleJoinMeeting = ({ displayName, meetingLink }: { displayName: string; meetingLink: string }) => {
        const roomName = meetingLink.replace(`${process.env.LIVEKIT_URL}/`, '');

        onSettingsChange({
            displayName,
            roomName,
            audioDeviceId: selectedMicrophone?.deviceId as string,
            videoDeviceId: selectedCamera?.deviceId as string,
            isAudioEnabled: isMicrophoneEnabled,
            isVideoEnabled: isCameraEnabled,
            isFaceTrackingEnabled: false,
        });
    };

    const defaultMeetingLink = `${process.env.LIVEKIT_URL}/${process.env.LIVEKIT_DEFAULT_ROOM}`;

    return (
        <div
            className="flex flex-nowrap w-full h-full items-center justify-center"
            style={{
                gap: 100,
            }}
        >
            <div
                className="absolute top-custom left-custom"
                style={{ '--top-custom': '0.75rem', '--left-custom': '0.75rem' }}
            >
                <img src={logo} alt="logo" />
            </div>
            <DeviceSettings
                isCameraEnabled={isCameraEnabled}
                isMicrophoneEnabled={isMicrophoneEnabled}
                onCameraToggle={() => setIsCameraEnabled(!isCameraEnabled)}
                onMicrophoneToggle={() => setIsMicrophoneEnabled(!isMicrophoneEnabled)}
                cameras={cameras}
                microphones={microphones}
                selectedCameraId={selectedCamera?.deviceId as string}
                selectedMicrophoneId={selectedMicrophone?.deviceId as string}
                onCameraChange={setSelectedCamera}
                onMicrophoneChange={setSelectedMicrophone}
                displayName={displayName}
            />
            <PreJoinDetails
                defaultMeetingLink={defaultMeetingLink}
                displayName={displayName}
                onDisplayNameChange={setDisplayName}
                onJoinMeeting={handleJoinMeeting}
            />
        </div>
    );
};
