import { useCallback, useEffect, useRef, useState } from 'react';
import { useHistory } from 'react-router-dom';

import { RoomContext } from '@livekit/components-react';
import type { Room } from 'livekit-client';
import { c } from 'ttag';

import { PasswordPrompt } from '../components/PasswordPrompt/PasswordPrompt';
import { DevicePermissionsContext } from '../contexts/DevicePermissionsContext';
import { useCreateInstantMeeting } from '../hooks/admin/useCreateInstantMeeting';
import type { SRPHandshakeInfo } from '../hooks/srp/useMeetSrp';
import { useMeetingSetup } from '../hooks/srp/useMeetingSetup';
import { useDevicePermissionChangeListener } from '../hooks/useDevicePermissionChangeListener';
import { useMeetingJoin } from '../hooks/useMeetingJoin';
import { useParticipantNameMap } from '../hooks/useParticipantNameMap';
import { CustomPasswordState } from '../response-types';
import { LoadingState, type ParticipantSettings } from '../types';
import { getMeetingLink } from '../utils/getMeetingLink';
import { MeetContainer } from './MeetContainer';
import { PrejoinContainer } from './PrejoinContainer/PrejoinContainer';

enum MeetingDecryptionReadinessStatus {
    UNINITIALIZED = 'uninitialized',
    INITIALIZED = 'initialized',
    READY_TO_DECRYPT = 'readyToDecrypt',
}

interface ProtonMeetContainerProps {
    guestMode?: boolean;
    instantMeeting?: boolean;
}

export const ProtonMeetContainer = ({ guestMode = false, instantMeeting = false }: ProtonMeetContainerProps) => {
    const history = useHistory();
    const createInstantMeeting = useCreateInstantMeeting();

    const [decryptionReadinessStatus, setDecryptionReadinessStatus] = useState(
        MeetingDecryptionReadinessStatus.UNINITIALIZED
    );
    const { getRoomName, getHandshakeInfo, token, urlPassword } = useMeetingSetup();

    const join = useMeetingJoin();

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

    const [meetingDetails, setMeetingDetails] = useState({
        meetingId: token,
        meetingPassword: urlPassword,
        meetingName: '',
    });

    const [handshakeInfo, setHandshakeInfo] = useState<SRPHandshakeInfo | null>(null);

    const { getParticipants, participantNameMap } = useParticipantNameMap();

    const handleDevicePermissionChange = useCallback(
        (permissions: { camera?: PermissionState; microphone?: PermissionState }) => {
            setDevicePermissions((prevPermissions) => ({ ...prevPermissions, ...permissions }));
        },
        []
    );

    useDevicePermissionChangeListener(handleDevicePermissionChange);

    const submitPassword = async (customPassword: string) => {
        try {
            const roomName = await getRoomName({
                customPassword,
                urlPassword,
                token,
                handshakeInfo: handshakeInfo as SRPHandshakeInfo,
            });

            setDecryptionReadinessStatus(MeetingDecryptionReadinessStatus.READY_TO_DECRYPT);

            setMeetingDetails((prev) => ({
                ...prev,
                meetingName: roomName,
            }));

            return true;
        } catch (error) {
            return false;
        }
    };

    const handleHandsakeInfoFetch = useCallback(
        async (token: string) => {
            const handshakeInfo = await getHandshakeInfo(token);

            if (handshakeInfo?.CustomPassword === CustomPasswordState.PASSWORD_SET) {
                setDecryptionReadinessStatus(MeetingDecryptionReadinessStatus.INITIALIZED);

                return {
                    handshakeInfo,
                    readyToDecrypt: false,
                };
            }

            setDecryptionReadinessStatus(MeetingDecryptionReadinessStatus.READY_TO_DECRYPT);

            return {
                handshakeInfo,
                readyToDecrypt: true,
            };
        },
        [getHandshakeInfo]
    );

    const handleJoin = useCallback(
        async (participantSettings: ParticipantSettings, meetingToken: string = token) => {
            if (joiningInProgress) {
                return;
            }

            setParticipantSettings(participantSettings);
            setJoiningInProgress(true);

            try {
                const room = await join(participantSettings?.displayName as string, meetingToken);

                await getParticipants(meetingToken);

                roomRef.current = room;

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
        [joiningInProgress, setJoiningInProgress, participantSettings, join]
    );

    const joinInstantMeeting = useCallback(
        async (participantSettings: ParticipantSettings) => {
            setJoiningInProgress(true);

            const { id, passwordBase } = await createInstantMeeting({
                params: {
                    meetingName: c('l10n_nightly Info').t`Instant Meeting`,
                },
                isGuest: guestMode,
            });

            const handsakeResult = await handleHandsakeInfoFetch(id);

            const roomName = await getRoomName({
                token: id,
                customPassword: '',
                urlPassword: passwordBase,
                handshakeInfo: handsakeResult.handshakeInfo as SRPHandshakeInfo,
            });

            setMeetingDetails({
                meetingId: id,
                meetingPassword: passwordBase,
                meetingName: roomName,
            });

            await handleJoin(participantSettings, id);

            history.push(getMeetingLink(id, passwordBase));
        },
        [createInstantMeeting, handleJoin, getRoomName, guestMode]
    );

    const setup = async () => {
        if (instantMeeting) {
            setDecryptionReadinessStatus(MeetingDecryptionReadinessStatus.READY_TO_DECRYPT);

            return;
        }

        const { readyToDecrypt, handshakeInfo } = await handleHandsakeInfoFetch(token);

        if (readyToDecrypt) {
            const roomName = await getRoomName({
                token,
                customPassword: '',
                urlPassword,
                handshakeInfo: handshakeInfo as SRPHandshakeInfo,
            });

            setMeetingDetails((prev) => ({
                ...prev,
                meetingName: roomName,
            }));

            return;
        }

        setHandshakeInfo(handshakeInfo as SRPHandshakeInfo);
    };

    useEffect(() => {
        void setup();
    }, []);

    const handleLeave = useCallback(() => {
        void roomRef.current?.disconnect();
        setJoinedRoom(false);
    }, []);

    if (decryptionReadinessStatus === MeetingDecryptionReadinessStatus.UNINITIALIZED) {
        return null;
    }

    const shareLink = `${window.location.origin}${getMeetingLink(
        meetingDetails.meetingId,
        meetingDetails.meetingPassword
    )}`;

    return (
        <DevicePermissionsContext.Provider
            value={{ devicePermissions, setDevicePermissions: handleDevicePermissionChange }}
        >
            <div className="h-full w-full">
                {decryptionReadinessStatus === MeetingDecryptionReadinessStatus.INITIALIZED && (
                    <PasswordPrompt onPasswordSubmit={submitPassword} />
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
                            setAudioOutputDeviceId={(deviceId) =>
                                setParticipantSettings({ ...participantSettings, audioOutputDeviceId: deviceId })
                            }
                            handleLeave={handleLeave}
                            setParticipantSettings={setParticipantSettings}
                            shareLink={shareLink}
                            roomName={meetingDetails.meetingName as string}
                            participantNameMap={participantNameMap}
                            getParticipants={() => getParticipants(meetingDetails.meetingId as string)}
                            instantMeeting={instantMeeting}
                        />
                    </RoomContext.Provider>
                ) : (
                    <PrejoinContainer
                        handleJoin={instantMeeting ? joinInstantMeeting : handleJoin}
                        loadingState={LoadingState.JoiningInProgress}
                        isLoading={joiningInProgress}
                        guestMode={guestMode}
                        shareLink={shareLink}
                        roomName={meetingDetails.meetingName as string}
                        roomId={token}
                        instantMeeting={instantMeeting}
                    />
                )}
            </div>
        </DevicePermissionsContext.Provider>
    );
};
