import React, { useEffect, useRef, useState } from 'react';

import useFlag from '@proton/unleash/useFlag';

import { DeviceSettings } from '../../components/DeviceSettings/DeviceSettings';
import { JoiningRoomLoader } from '../../components/JoiningRoomLoader';
import { PageHeader } from '../../components/PageHeader/PageHeader';
import { PreJoinDetails } from '../../components/PreJoinDetails/PreJoinDetails';
import { defaultDisplayNameHooks } from '../../hooks/useDefaultDisplayName';
import { useDevices } from '../../hooks/useDevices';
import { LoadingState, type ParticipantSettings } from '../../types';
import { saveAudioDevice, saveAudioOutputDevice, saveVideoDevice } from '../../utils/deviceStorage';

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

    const { cameras, microphones, speakers, defaultCamera, defaultMicrophone, defaultSpeaker } = useDevices();

    const [selectedCamera, setSelectedCamera] = useState<MediaDeviceInfo | null>(defaultCamera);
    const [selectedMicrophone, setSelectedMicrophone] = useState<MediaDeviceInfo | null>(defaultMicrophone);
    const [selectedAudioOutputDevice, setSelectedAudioOutputDevice] = useState<MediaDeviceInfo | null>(defaultSpeaker);

    useEffect(() => {
        if (cameras.length > 0) {
            const isDeviceAvailable = selectedCamera
                ? cameras.find((c) => c.deviceId === selectedCamera.deviceId)
                : null;
            if (!selectedCamera || !isDeviceAvailable) {
                const deviceToSelect = defaultCamera || cameras[0];
                if (deviceToSelect) {
                    setSelectedCamera(deviceToSelect);
                }
            }
        }
    }, [defaultCamera, selectedCamera, cameras]);

    useEffect(() => {
        if (microphones.length > 0) {
            const isDeviceAvailable = selectedMicrophone
                ? microphones.find((m) => m.deviceId === selectedMicrophone.deviceId)
                : null;
            if (!selectedMicrophone || !isDeviceAvailable) {
                const deviceToSelect = defaultMicrophone || microphones[0];
                if (deviceToSelect) {
                    setSelectedMicrophone(deviceToSelect);
                }
            }
        }
    }, [defaultMicrophone, selectedMicrophone, microphones]);

    useEffect(() => {
        if (speakers.length > 0) {
            const isDeviceAvailable = selectedAudioOutputDevice
                ? speakers.find((s) => s.deviceId === selectedAudioOutputDevice.deviceId)
                : null;
            if (!selectedAudioOutputDevice || !isDeviceAvailable) {
                const deviceToSelect = defaultSpeaker || speakers[0];
                if (deviceToSelect) {
                    setSelectedAudioOutputDevice(deviceToSelect);
                }
            }
        }
    }, [defaultSpeaker, selectedAudioOutputDevice, speakers]);

    const [isCameraEnabled, setIsCameraEnabled] = useState(false);
    const [isMicrophoneEnabled, setIsMicrophoneEnabled] = useState(false);

    const useDefaultDisplayName = guestMode
        ? defaultDisplayNameHooks.unauthenticated
        : defaultDisplayNameHooks.authenticated;

    const defaultDisplayName = useDefaultDisplayName();

    const [displayName, setDisplayName] = useState(defaultDisplayName);

    const participantColorIndex = useRef(Math.ceil(6 * Math.random()));

    const currentSelectedCamera = selectedCamera ?? defaultCamera;
    const currentSelectedMicrophone = selectedMicrophone ?? defaultMicrophone;
    const currentSelectedAudioOutputDevice = selectedAudioOutputDevice ?? defaultSpeaker;

    const handleJoinMeeting = ({ displayName }: { displayName: string }) => {
        handleJoin({
            displayName,
            audioDeviceId: currentSelectedMicrophone?.deviceId as string,
            audioOutputDeviceId: currentSelectedAudioOutputDevice?.deviceId as string,
            videoDeviceId: currentSelectedCamera?.deviceId as string,
            isAudioEnabled: isMicrophoneEnabled,
            isVideoEnabled: isCameraEnabled,
        });
    };

    const handleCameraChange = (camera: MediaDeviceInfo) => {
        setSelectedCamera(camera);
        saveVideoDevice(camera.deviceId);
    };

    const handleMicrophoneChange = (microphone: MediaDeviceInfo) => {
        setSelectedMicrophone(microphone);
        saveAudioDevice(microphone.deviceId);
    };

    const handleAudioOutputDeviceChange = (speaker: MediaDeviceInfo) => {
        setSelectedAudioOutputDevice(speaker);
        saveAudioOutputDevice(speaker.deviceId);
    };

    return (
        <>
            {isLoading && <div className="w-full h-full absolute top-0 left-0 z-up" />}
            <div className="absolute w-full">
                <PageHeader isScheduleInAdvanceEnabled={isScheduleInAdvanceEnabled} guestMode={guestMode} />
            </div>
            <div className="prejoin-container flex flex-column md:flex-row flex-nowrap w-full md:items-center md:justify-center">
                <div
                    className="prejoin-container-content w-full md:w-custom flex flex-column lg:flex-row gap-2 lg:gap-0 md:items-center"
                    style={{ '--md-w-custom': '71rem' }}
                >
                    <DeviceSettings
                        isCameraEnabled={isCameraEnabled}
                        isMicrophoneEnabled={isMicrophoneEnabled}
                        onCameraToggle={() => setIsCameraEnabled(!isCameraEnabled)}
                        onMicrophoneToggle={() => setIsMicrophoneEnabled(!isMicrophoneEnabled)}
                        cameras={cameras}
                        microphones={microphones}
                        speakers={speakers}
                        selectedCameraId={currentSelectedCamera?.deviceId as string}
                        selectedMicrophoneId={currentSelectedMicrophone?.deviceId as string}
                        selectedAudioOutputDeviceId={currentSelectedAudioOutputDevice?.deviceId as string}
                        onCameraChange={handleCameraChange}
                        onMicrophoneChange={handleMicrophoneChange}
                        onAudioOutputDeviceChange={handleAudioOutputDeviceChange}
                        displayName={displayName}
                        colorIndex={participantColorIndex.current}
                        isLoading={isLoading}
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
