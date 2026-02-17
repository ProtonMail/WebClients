import { useRef } from 'react';

import { getItem, removeItem, setItem } from '@proton/shared/lib/helpers/storage';
import clsx from '@proton/utils/clsx';

import { DeviceSettings } from '../../components/DeviceSettings/DeviceSettings';
import { JoiningRoomLoader } from '../../components/JoiningRoomLoader';
import { OpenDesktopAppBanner } from '../../components/OpenDesktopAppBanner/OpenDesktopAppBanner';
import { PageHeader } from '../../components/PageHeader/PageHeader';
import { PreJoinDetails } from '../../components/PreJoinDetails/PreJoinDetails';
import { useMediaManagementContext } from '../../contexts/MediaManagementProvider/MediaManagementContext';
import { LoadingState } from '../../types';
import { getDisplayNameStorageKey } from '../../utils/storage';

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
    participantsCount: number | null;
    displayName: string;
    setDisplayName: (displayName: string) => void;
    isInstantJoin: boolean;
    userId?: string;
    isPersonalRoom?: boolean;
    isLoadingMeetings?: boolean;
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
    participantsCount,
    displayName,
    setDisplayName,
    isInstantJoin,
    userId,
    isPersonalRoom = false,
    isLoadingMeetings = false,
}: PrejoinContainerProps) => {
    // check if a custom display name is already stored for the user
    const hasStoredDisplayName = getItem(getDisplayNameStorageKey(guestMode, userId)) != null;

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

    const handleJoinMeeting = (displayName: string, keepOnDevice: boolean) => {
        const storageKey = getDisplayNameStorageKey(guestMode, userId);

        if (keepOnDevice && displayName.trim()) {
            setItem(storageKey, displayName);
        } else {
            removeItem(storageKey);
        }

        handleJoin(displayName);
    };

    const handleCameraChange = async (camera: MediaDeviceInfo, isDefaultDevice: boolean) => {
        await switchActiveDevice({
            deviceType: 'videoinput',
            deviceId: camera.deviceId,
            isSystemDefaultDevice: isDefaultDevice,
        });
    };

    const handleMicrophoneChange = async (microphone: MediaDeviceInfo, isDefaultDevice: boolean) => {
        await switchActiveDevice({
            deviceType: 'audioinput',
            deviceId: microphone.deviceId,
            isSystemDefaultDevice: isDefaultDevice,
        });
    };

    const handleAudioOutputDeviceChange = async (speaker: MediaDeviceInfo, isDefaultDevice: boolean) => {
        await switchActiveDevice({
            deviceType: 'audiooutput',
            deviceId: speaker.deviceId,
            isSystemDefaultDevice: isDefaultDevice,
        });
    };

    return (
        <>
            {roomId && !guestMode && <OpenDesktopAppBanner meetingLink={shareLink} />}
            {isLoading && <div className="w-full h-full absolute top-0 left-0 z-up" />}
            <div className="absolute w-full meet-container-padding-x">
                <PageHeader guestMode={guestMode} showAppSwitcher={false} isInstantJoin={isInstantJoin} />
            </div>
            <div className="prejoin-container flex flex-column md:flex-row flex-nowrap w-full md:items-center md:justify-center meet-container-padding-x">
                <div
                    className={clsx(
                        'prejoin-container-content w-full md:w-custom xl:w-custom flex flex-column flex-nowrap lg:flex-row gap-2 *:min-size-auto md:items-center px-2 md:px-4',
                        isInstantJoin && 'justify-center'
                    )}
                    style={{ '--md-w-custom': '71rem', '--xl-w-custom': '76rem' }}
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
                                <JoiningRoomLoader participantCount={participantsCount} />
                            )}
                        </>
                    ) : (
                        <PreJoinDetails
                            roomName={roomName}
                            roomId={roomId}
                            displayName={displayName}
                            keepDisplayName={hasStoredDisplayName}
                            onDisplayNameChange={setDisplayName}
                            onJoinMeeting={handleJoinMeeting}
                            isPersonalRoom={isPersonalRoom}
                            shareLink={shareLink}
                            instantMeeting={instantMeeting}
                            isLoadingMeetings={isLoadingMeetings}
                        />
                    )}
                </div>
            </div>
        </>
    );
};
