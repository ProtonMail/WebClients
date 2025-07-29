import React, { useEffect, useRef, useState } from 'react';

import useFlag from '@proton/unleash/useFlag';

import { DeviceSettings } from '../../components/DeviceSettings/DeviceSettings';
import { JoiningRoomLoader } from '../../components/JoiningRoomLoader';
import { PageHeader } from '../../components/PageHeader/PageHeader';
import { PreJoinDetails } from '../../components/PreJoinDetails/PreJoinDetails';
import { defaultDisplayNameHooks } from '../../hooks/useDefaultDisplayName';
import { useDevices } from '../../hooks/useDevices';
import { LoadingState, type ParticipantSettings } from '../../types';

import './PrejoinContainer.scss';

interface PrejoinContainerProps {
    handleJoin: (settings: ParticipantSettings) => void;
    loadingState: LoadingState | null;
    isLoading: boolean;
    guestMode?: boolean;
    shareLink: string;
    roomName: string;
    roomId: string;
    instantMeeting: boolean;
    initialisedParticipantNameMap: boolean;
    participantNameMap: Record<string, string>;
}

export const PrejoinContainer = ({
    handleJoin,
    loadingState,
    isLoading,
    guestMode = false,
    shareLink,
    roomName,
    roomId,
    instantMeeting = false,
    initialisedParticipantNameMap,
    participantNameMap,
}: PrejoinContainerProps) => {
    const isScheduleInAdvanceEnabled = useFlag('ScheduleInAdvance');

    const [selectedCamera, setSelectedCamera] = useState<MediaDeviceInfo | null>(null);
    const [selectedMicrophone, setSelectedMicrophone] = useState<MediaDeviceInfo | null>(null);
    const [selectedAudioOutputDevice, setSelectedAudioOutputDevice] = useState<MediaDeviceInfo | null>(null);

    const { cameras, microphones, speakers, defaultCamera, defaultMicrophone, defaultSpeaker } = useDevices();

    const [isCameraEnabled, setIsCameraEnabled] = useState(false);
    const [isMicrophoneEnabled, setIsMicrophoneEnabled] = useState(false);

    const useDefaultDisplayName = guestMode
        ? defaultDisplayNameHooks.unauthenticated
        : defaultDisplayNameHooks.authenticated;

    const defaultDisplayName = useDefaultDisplayName();

    const [displayName, setDisplayName] = useState(defaultDisplayName);

    const participantColorIndex = useRef(Math.ceil(6 * Math.random()));

    useEffect(() => {
        setSelectedCamera(defaultCamera);
        setSelectedMicrophone(defaultMicrophone);
        setSelectedAudioOutputDevice(defaultSpeaker);
    }, [defaultCamera, defaultMicrophone, defaultSpeaker]);

    const handleJoinMeeting = ({ displayName }: { displayName: string }) => {
        handleJoin({
            displayName,
            audioDeviceId: selectedMicrophone?.deviceId as string,
            audioOutputDeviceId: selectedAudioOutputDevice?.deviceId as string,
            videoDeviceId: selectedCamera?.deviceId as string,
            isAudioEnabled: isMicrophoneEnabled,
            isVideoEnabled: isCameraEnabled,
            isFaceTrackingEnabled: false,
        });
    };

    return (
        <>
            {isLoading && <div className="w-full h-full absolute top-0 left-0 z-up" />}
            <div className="absolute w-full">
                <PageHeader isScheduleInAdvanceEnabled={isScheduleInAdvanceEnabled} guestMode={guestMode} />
            </div>
            <div className="flex flex-nowrap w-full h-full items-center justify-center">
                <div className="w-custom flex items-center" style={{ '--w-custom': '71rem' }}>
                    <DeviceSettings
                        isCameraEnabled={isCameraEnabled}
                        isMicrophoneEnabled={isMicrophoneEnabled}
                        onCameraToggle={() => setIsCameraEnabled(!isCameraEnabled)}
                        onMicrophoneToggle={() => setIsMicrophoneEnabled(!isMicrophoneEnabled)}
                        cameras={cameras}
                        microphones={microphones}
                        speakers={speakers}
                        selectedCameraId={selectedCamera?.deviceId as string}
                        selectedMicrophoneId={selectedMicrophone?.deviceId as string}
                        selectedAudioOutputDeviceId={selectedAudioOutputDevice?.deviceId as string}
                        onCameraChange={setSelectedCamera}
                        onMicrophoneChange={setSelectedMicrophone}
                        onAudioOutputDeviceChange={setSelectedAudioOutputDevice}
                        displayName={displayName}
                        colorIndex={participantColorIndex.current}
                    />
                    {isLoading ? (
                        <>
                            {loadingState === LoadingState.JoiningInProgress && (
                                <JoiningRoomLoader
                                    participantsLoaded={initialisedParticipantNameMap}
                                    participantCount={Object.keys(participantNameMap).length}
                                />
                            )}
                        </>
                    ) : (
                        <PreJoinDetails
                            roomName={roomName}
                            roomId={roomId}
                            displayName={displayName}
                            onDisplayNameChange={setDisplayName}
                            onJoinMeeting={handleJoinMeeting}
                            shareLink={shareLink}
                            instantMeeting={instantMeeting}
                        />
                    )}
                </div>
            </div>
        </>
    );
};
