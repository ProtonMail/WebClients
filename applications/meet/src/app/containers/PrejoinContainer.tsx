import React, { useEffect, useState } from 'react';

import { Button } from '@proton/atoms';

import logo from '../../assets/meet-logo.svg';
import { DeviceSettings } from '../components/DeviceSettings/DeviceSettings';
import { JoiningRoomLoader } from '../components/JoiningRoomLoader';
import { PreJoinDetails } from '../components/PreJoinDetails/PreJoinDetails';
import { UserInfo } from '../components/UserInfo';
import { defaultDisplayNameHooks } from '../hooks/useDefaultDisplayName';
import { useDevices } from '../hooks/useDevices';
import type { ParticipantSettings } from '../types';
import { LoadingState } from '../types';

interface PrejoinContainerProps {
    handleJoin: (settings: ParticipantSettings) => void;
    loadingState: LoadingState | null;
    isLoading: boolean;
    guestMode?: boolean;
    shareLink: string;
    roomName: string;
}

export const PrejoinContainer = ({
    handleJoin,
    loadingState,
    isLoading,
    guestMode = false,
    shareLink,
    roomName,
}: PrejoinContainerProps) => {
    const [selectedCamera, setSelectedCamera] = useState<MediaDeviceInfo | null>(null);
    const [selectedMicrophone, setSelectedMicrophone] = useState<MediaDeviceInfo | null>(null);

    const { cameras, microphones, defaultCamera, defaultMicrophone } = useDevices();

    const [isCameraEnabled, setIsCameraEnabled] = useState(false);
    const [isMicrophoneEnabled, setIsMicrophoneEnabled] = useState(false);

    const useDefaultDisplayName = guestMode
        ? defaultDisplayNameHooks.unauthenticated
        : defaultDisplayNameHooks.authenticated;

    const defaultDisplayName = useDefaultDisplayName();

    const [displayName, setDisplayName] = useState(defaultDisplayName);

    useEffect(() => {
        setSelectedCamera(defaultCamera);
        setSelectedMicrophone(defaultMicrophone);
    }, [defaultCamera, defaultMicrophone]);

    const handleJoinMeeting = ({ displayName }: { displayName: string }) => {
        handleJoin({
            displayName,
            audioDeviceId: selectedMicrophone?.deviceId as string,
            videoDeviceId: selectedCamera?.deviceId as string,
            isAudioEnabled: isMicrophoneEnabled,
            isVideoEnabled: isCameraEnabled,
            isFaceTrackingEnabled: false,
        });
    };

    return (
        <div className="flex flex-nowrap w-full h-full items-center justify-center">
            <div
                className="absolute top-custom left-custom"
                style={{ '--top-custom': '0.75rem', '--left-custom': '2rem' }}
            >
                <img src={logo} alt="logo" />
            </div>
            <div
                className="absolute top-custom right-custom"
                style={{ '--top-custom': '0.75rem', '--right-custom': '2rem' }}
            >
                {guestMode ? (
                    <Button
                        shape="ghost"
                        onClick={() =>
                            window.location.assign(window.location.origin.replace('meet', 'account') + '/login')
                        }
                        className="rounded-full"
                    >
                        Sign in
                    </Button>
                ) : (
                    <UserInfo />
                )}
            </div>
            <div className="w-custom flex items-center" style={{ '--w-custom': '71rem' }}>
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
                {isLoading ? (
                    <>{loadingState === LoadingState.JoiningInProgress && <JoiningRoomLoader />}</>
                ) : (
                    <PreJoinDetails
                        roomName={roomName}
                        displayName={displayName}
                        onDisplayNameChange={setDisplayName}
                        onJoinMeeting={handleJoinMeeting}
                        shareLink={shareLink}
                    />
                )}
            </div>
        </div>
    );
};
