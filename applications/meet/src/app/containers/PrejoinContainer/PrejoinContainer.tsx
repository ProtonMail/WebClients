import React, { useEffect, useRef, useState } from 'react';
import { useHistory } from 'react-router-dom';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { ForkType, requestFork } from '@proton/shared/lib/authentication/fork';
import { APPS } from '@proton/shared/lib/constants';

import logo from '../../../assets/meet-logo.svg';
import { DeviceSettings } from '../../components/DeviceSettings/DeviceSettings';
import { JoiningRoomLoader } from '../../components/JoiningRoomLoader';
import { PreJoinDetails } from '../../components/PreJoinDetails/PreJoinDetails';
import { UserInfo } from '../../components/UserInfo';
import { defaultDisplayNameHooks } from '../../hooks/useDefaultDisplayName';
import { useDevices } from '../../hooks/useDevices';
import type { ParticipantSettings } from '../../types';
import { LoadingState } from '../../types';

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
}: PrejoinContainerProps) => {
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

    const history = useHistory();

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

    const handleSignIn = (returnUrl: string) =>
        requestFork({
            fromApp: APPS.PROTONMEET,
            forkType: ForkType.LOGIN,
            extra: {
                returnUrl: encodeURIComponent(returnUrl),
            },
        });

    return (
        <>
            {isLoading && <div className="w-full h-full absolute top-0 left-0 z-up" />}
            <div className="flex flex-nowrap w-full h-full items-center justify-center">
                <div
                    className="absolute top-custom left-custom"
                    style={{ '--top-custom': '0.75rem', '--left-custom': '2rem' }}
                >
                    <img src={logo} alt="" />
                </div>
                <div
                    className="absolute top-custom right-custom flex items-center gap-2"
                    style={{ '--top-custom': '0.75rem', '--right-custom': '2rem' }}
                >
                    <Button
                        className="action-button rounded-full border-none"
                        onClick={() => (guestMode ? handleSignIn('admin/create') : history.replace('/admin/create'))}
                        size="large"
                    >
                        {c('l10n_nightly Action').t`Schedule meeting`}
                    </Button>
                    {guestMode ? (
                        <Button
                            className="action-button rounded-full border-none"
                            onClick={() =>
                                handleSignIn(
                                    window.location.pathname.replace('/guest', '') +
                                        window.location.search +
                                        window.location.hash
                                )
                            }
                            size="large"
                        >
                            {c('l10n_nightly Action').t`Sign in`}
                        </Button>
                    ) : (
                        <UserInfo colorIndex={participantColorIndex.current} />
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
                        <>{loadingState === LoadingState.JoiningInProgress && <JoiningRoomLoader />}</>
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
