import React, { useRef } from 'react';

import useFlag from '@proton/unleash/useFlag';
import clsx from '@proton/utils/clsx';

import { DeviceSettings } from '../../components/DeviceSettings/DeviceSettings';
import { JoiningRoomLoader } from '../../components/JoiningRoomLoader';
import { PageHeader } from '../../components/PageHeader/PageHeader';
import { PreJoinDetails } from '../../components/PreJoinDetails/PreJoinDetails';
import { useMediaManagementContext } from '../../contexts/MediaManagementContext';
import { LoadingState } from '../../types';

import './PrejoinContainer.scss';

interface PrejoinContainerProps {
    handleJoin: (displayName: string) => void;
    loadingState: LoadingState | null;
    isLoading: boolean;
    guestMode?: boolean;
    shareLink: string;
    roomName: string;
    roomId: string;
    instantMeeting: boolean;
    initialisedParticipantNameMap: boolean;
    participantNameMap: Record<string, string>;
    displayName: string;
    setDisplayName: (displayName: string) => void;
    isInstantJoin: boolean;
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
    displayName,
    setDisplayName,
    isInstantJoin,
}: PrejoinContainerProps) => {
    const isScheduleInAdvanceEnabled = useFlag('ScheduleInAdvance');

    const {
        cameras,
        microphones,
        speakers,
        defaultCamera,
        defaultMicrophone,
        defaultSpeaker,
        selectedCameraId: activeCameraDeviceId,
        selectedMicrophoneId: activeMicrophoneDeviceId,
        selectedAudioOutputDeviceId: activeAudioOutputDeviceId,
        initialCameraState,
        initialAudioState,
        setInitialCameraState,
        setInitialAudioState,
        switchActiveDevice,
    } = useMediaManagementContext();

    const participantColorIndex = useRef(Math.ceil(6 * Math.random()));

    const currentSelectedCamera = activeCameraDeviceId ?? defaultCamera?.deviceId;
    const currentSelectedMicrophone = activeMicrophoneDeviceId ?? defaultMicrophone?.deviceId;
    const currentSelectedAudioOutputDevice = activeAudioOutputDeviceId ?? defaultSpeaker?.deviceId;

    const handleJoinMeeting = (displayName: string) => {
        handleJoin(displayName);
    };

    const handleCameraChange = (camera: MediaDeviceInfo) => {
        void switchActiveDevice('videoinput', camera.deviceId);
    };

    const handleMicrophoneChange = (microphone: MediaDeviceInfo) => {
        void switchActiveDevice('audioinput', microphone.deviceId);
    };

    const handleAudioOutputDeviceChange = (speaker: MediaDeviceInfo) => {
        void switchActiveDevice('audiooutput', speaker.deviceId);
    };

    return (
        <>
            {isLoading && <div className="w-full h-full absolute top-0 left-0 z-up" />}
            <div className="absolute w-full meet-container-padding-x">
                <PageHeader
                    isScheduleInAdvanceEnabled={isScheduleInAdvanceEnabled}
                    guestMode={guestMode}
                    showAppSwitcher={false}
                    isInstantJoin={isInstantJoin}
                />
            </div>
            <div className="prejoin-container flex flex-column md:flex-row flex-nowrap w-full md:items-center md:justify-center">
                <div
                    className={clsx(
                        'prejoin-container-content w-full md:w-custom flex flex-column flex-nowrap lg:flex-row gap-2 *:min-size-auto md:items-center px-2 md:px-4',
                        isInstantJoin && 'justify-center'
                    )}
                    style={{ '--md-w-custom': '71rem' }}
                >
                    {!isInstantJoin && (
                        <DeviceSettings
                            isCameraEnabled={initialCameraState}
                            isMicrophoneEnabled={initialAudioState}
                            onCameraToggle={() => setInitialCameraState(!initialCameraState)}
                            onMicrophoneToggle={() => setInitialAudioState(!initialAudioState)}
                            cameras={cameras}
                            microphones={microphones}
                            speakers={speakers}
                            selectedCameraId={currentSelectedCamera}
                            selectedMicrophoneId={currentSelectedMicrophone}
                            selectedAudioOutputDeviceId={currentSelectedAudioOutputDevice}
                            onCameraChange={handleCameraChange}
                            onMicrophoneChange={handleMicrophoneChange}
                            onAudioOutputDeviceChange={handleAudioOutputDeviceChange}
                            displayName={displayName}
                            colorIndex={participantColorIndex.current}
                            isLoading={isLoading}
                        />
                    )}

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
