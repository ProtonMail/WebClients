import { useCallback, useEffect, useRef, useState } from 'react';

import { RoomContext } from '@livekit/components-react';
import { Room } from 'livekit-client';

import { PasswordPrompt } from '../components/PasswordPrompt/PasswordPrompt';
import { DevicePermissionsContext } from '../contexts/DevicePermissionsContext';
import { useMeetingSetup } from '../hooks/srp/useMeetingSetup';
import { useDevicePermissionChangeListener } from '../hooks/useDevicePermissionChangeListener';
import { useParticipantNameMap } from '../hooks/useParticipantNameMap';
import { useQualityLevel } from '../hooks/useQualityLevel';
import { qualityConstants } from '../qualityConstants';
import { CustomPasswordState } from '../response-types';
import { LoadingState, type ParticipantSettings, QualityScenarios } from '../types';
import { getE2EEOptions } from '../utils/getE2EEOptions';
import { MeetContainer } from './MeetContainer';
import { PrejoinContainer } from './PrejoinContainer';

const ROOM_KEY = process.env.LIVEKIT_ROOM_KEY as string;

enum MeetingDecryptionReadinessStatus {
    UNINITIALIZED = 'uninitialized',
    INITIALIZED = 'initialized',
    READY_TO_DECRYPT = 'readyToDecrypt',
}

interface ProtonMeetContainerProps {
    guestMode?: boolean;
}

export const ProtonMeetContainer = ({ guestMode = false }: ProtonMeetContainerProps) => {
    const [customPassword, setCustomPassword] = useState('');

    const [decryptionReadinessStatus, setDecryptionReadinessStatus] = useState(
        MeetingDecryptionReadinessStatus.UNINITIALIZED
    );
    const { getRoomName, getAcccessDetails, getHandshakeInfo, token, urlPassword } = useMeetingSetup();

    const roomRef = useRef<Room | null>(null);

    const [participantSettings, setParticipantSettings] = useState<ParticipantSettings | null>(null);

    const [devicePermissions, setDevicePermissions] = useState<{
        camera: PermissionState;
        microphone: PermissionState;
    }>({
        camera: 'prompt',
        microphone: 'prompt',
    });

    const [joiningInProgress, setJoiningInProgress] = useState(false);
    const [joinedRoom, setJoinedRoom] = useState(false);

    const [roomName, setRoomName] = useState('');

    const defaultQuality = useQualityLevel();

    const defaultResolution = qualityConstants[QualityScenarios.Default][defaultQuality];

    const { getParticipants, participantNameMap } = useParticipantNameMap(token);

    const handleDevicePermissionChange = useCallback(
        (permissions: { camera?: PermissionState; microphone?: PermissionState }) => {
            setDevicePermissions((prevPermissions) => ({ ...prevPermissions, ...permissions }));
        },
        []
    );

    useDevicePermissionChangeListener(handleDevicePermissionChange);

    const handleJoin = useCallback(
        async (participantSettings: ParticipantSettings) => {
            if (joiningInProgress) {
                return;
            }

            setParticipantSettings(participantSettings);
            setJoiningInProgress(true);

            try {
                const e2eeOptions = await getE2EEOptions(ROOM_KEY);

                const room = new Room({
                    ...e2eeOptions,
                    videoCaptureDefaults: {
                        resolution: defaultResolution.resolution,
                    },
                    publishDefaults: {
                        videoEncoding: defaultResolution.encoding,
                    },
                });

                const { websocketUrl, accessToken } = await getAcccessDetails(
                    participantSettings?.displayName as string
                );

                await room.connect(websocketUrl, accessToken);

                await getParticipants();

                roomRef.current = room;

                setJoiningInProgress(false);
                setJoinedRoom(true);
            } catch (error) {
                if (error instanceof Error) {
                    window.alert(error.message);
                } else {
                    window.alert('An unknown error occurred');
                }
            } finally {
                setJoiningInProgress(false);
            }
        },
        [joiningInProgress, setJoiningInProgress, participantSettings]
    );

    const handleLeave = useCallback(() => {
        void roomRef.current?.disconnect();
        setJoinedRoom(false);
    }, []);

    const handleRoomNameFetch = useCallback(async () => {
        const roomName = await getRoomName(customPassword);

        setRoomName(roomName);
    }, [getRoomName, customPassword]);

    const shareLink = `${window.location.origin}/join/${token}#${urlPassword}`;

    const handleHandsakeInfoFetch = useCallback(async () => {
        const customPasswordConfig = await getHandshakeInfo();

        if (customPasswordConfig === CustomPasswordState.PASSWORD_SET) {
            setDecryptionReadinessStatus(MeetingDecryptionReadinessStatus.INITIALIZED);

            return;
        }

        setDecryptionReadinessStatus(MeetingDecryptionReadinessStatus.READY_TO_DECRYPT);
    }, [getHandshakeInfo]);

    useEffect(() => {
        void handleHandsakeInfoFetch();
    }, []);

    useEffect(() => {
        if (decryptionReadinessStatus === MeetingDecryptionReadinessStatus.READY_TO_DECRYPT) {
            void handleRoomNameFetch();
        }
    }, [handleRoomNameFetch, decryptionReadinessStatus]);

    if (decryptionReadinessStatus === MeetingDecryptionReadinessStatus.UNINITIALIZED) {
        return null;
    }

    return (
        <DevicePermissionsContext.Provider
            value={{ devicePermissions, setDevicePermissions: handleDevicePermissionChange }}
        >
            <div className="h-full w-full">
                {decryptionReadinessStatus === MeetingDecryptionReadinessStatus.INITIALIZED && (
                    <PasswordPrompt
                        onPasswordSubmit={(password) => {
                            setCustomPassword(password);
                            setDecryptionReadinessStatus(MeetingDecryptionReadinessStatus.READY_TO_DECRYPT);
                        }}
                    />
                )}
                {joinedRoom && roomRef.current && participantSettings ? (
                    <RoomContext.Provider value={roomRef.current}>
                        <MeetContainer
                            participantSettings={participantSettings}
                            setAudioDeviceId={(deviceId) =>
                                setParticipantSettings({ ...participantSettings, audioDeviceId: deviceId })
                            }
                            setVideoDeviceId={(deviceId) =>
                                setParticipantSettings({ ...participantSettings, videoDeviceId: deviceId })
                            }
                            handleLeave={handleLeave}
                            setParticipantSettings={setParticipantSettings}
                            shareLink={shareLink}
                            roomName={roomName}
                            participantNameMap={participantNameMap}
                            getParticipants={getParticipants}
                        />
                    </RoomContext.Provider>
                ) : (
                    <PrejoinContainer
                        handleJoin={handleJoin}
                        loadingState={LoadingState.JoiningInProgress}
                        isLoading={joiningInProgress}
                        guestMode={guestMode}
                        shareLink={shareLink}
                        roomName={roomName}
                        roomId={token}
                    />
                )}
            </div>
        </DevicePermissionsContext.Provider>
    );
};
