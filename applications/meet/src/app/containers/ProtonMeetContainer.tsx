import { useEffect, useRef, useState } from 'react';
import { useHistory } from 'react-router-dom';

import { RoomContext } from '@livekit/components-react';
import type { ExternalE2EEKeyProvider, Room } from '@proton-meet/livekit-client';
import { ConnectionStateInfo, type GroupKeyInfo } from '@proton-meet/proton-meet-core';
import { c } from 'ttag';

import useNotifications from '@proton/components/hooks/useNotifications';
import { useMeetErrorReporting } from '@proton/meet';
import { useCreateInstantMeeting } from '@proton/meet/hooks/useCreateInstantMeeting';
import { getMeetingLink } from '@proton/meet/utils/getMeetingLink';
import { CustomPasswordState } from '@proton/shared/lib/interfaces/Meet';
import { message as sanitizeMessage } from '@proton/shared/lib/sanitize/purify';

import { ConnectionLostModal } from '../components/ConnectionLostModal/ConnectionLostModal';
import { PasswordPrompt } from '../components/PasswordPrompt/PasswordPrompt';
import { DevicePermissionsContext } from '../contexts/DevicePermissionsContext';
import { MLSContext } from '../contexts/MLSContext';
import { useWasmApp } from '../contexts/WasmContext';
import type { SRPHandshakeInfo } from '../hooks/srp/useMeetSrp';
import { useMeetingSetup } from '../hooks/srp/useMeetingSetup';
import { useDependencySetup } from '../hooks/useDependencySetup';
import { useDevicePermissionChangeListener } from '../hooks/useDevicePermissionChangeListener';
import { useMeetingJoin } from '../hooks/useMeetingJoin';
import { useParticipantNameMap } from '../hooks/useParticipantNameMap';
import { useWakeLock } from '../hooks/useWakeLock';
import { LoadingState, type ParticipantSettings } from '../types';
import { setupWasmDependencies } from '../utils/wasmUtils';
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

export const ProtonMeetContainer = ({ guestMode = false }: ProtonMeetContainerProps) => {
    useWakeLock();

    useDependencySetup(guestMode);

    const { createNotification } = useNotifications();

    const reportMeetError = useMeetErrorReporting();

    const history = useHistory();
    const createInstantMeeting = useCreateInstantMeeting();

    const [decryptionReadinessStatus, setDecryptionReadinessStatus] = useState(
        MeetingDecryptionReadinessStatus.UNINITIALIZED
    );

    const currentKeyRef = useRef<string | null>(null);

    const [password, setPassword] = useState('');
    const [invalidPassphrase, setInvalidPassphrase] = useState(false);

    const { getRoomName, initHandshake, token, urlPassword } = useMeetingSetup();

    const instantMeetingRef = useRef(!token);

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

    const [connectionLost, setConnectionLost] = useState(false);

    const { getParticipants, participantNameMap, participantsMap, resetParticipantNameMap } = useParticipantNameMap();

    const [initialisedParticipantNameMap, setInitialisedParticipantNameMap] = useState(false);

    const joinBlockedRef = useRef(false);

    const refetchedParticipantNameMapRef = useRef(false);

    const handleDevicePermissionChange = (permissions: { camera?: PermissionState; microphone?: PermissionState }) => {
        setDevicePermissions((prevPermissions) => ({ ...prevPermissions, ...permissions }));
    };

    const loadingStartTimeRef = useRef(0);

    const keyProviderRef = useRef<ExternalE2EEKeyProvider | null>(null);

    const wasmApp = useWasmApp();

    useDevicePermissionChangeListener(handleDevicePermissionChange);

    const mlsSetupDone = useRef(false);
    const startHealthCheck = useRef(false);

    const notifications = useNotifications();

    const getGroupKeyInfo = async () => {
        try {
            const newGroupKeyInfo = (await wasmApp?.getGroupKey()) as GroupKeyInfo;
            currentKeyRef.current = newGroupKeyInfo.key;
            return { key: newGroupKeyInfo.key, epoch: newGroupKeyInfo.epoch };
        } catch (err: any) {
            reportMeetError('Error while calling getGroupKeyInfo', err);
            throw err;
        }
    };

    const onNewGroupKeyInfo = async (key: string, epoch: bigint) => {
        try {
            await keyProviderRef.current?.setKey(key, epoch);
        } catch (err) {
            reportMeetError('Could not set new encryption key', err);
        }
    };

    const handleMlsSetup = async (meetingLinkName: string, accessToken: string) => {
        if (!mlsSetupDone.current) {
            mlsSetupDone.current = true;

            setupWasmDependencies({ getGroupKeyInfo, onNewGroupKeyInfo });
        }

        if (!wasmApp) {
            return;
        }

        await wasmApp.joinMeetingWithAccessToken(accessToken, meetingLinkName);

        await wasmApp.setMlsGroupUpdateHandler();

        const groupKeyData = await wasmApp.getGroupKey();

        currentKeyRef.current = groupKeyData.key;

        startHealthCheck.current = true;

        return groupKeyData;
    };

    const handleKeyUpdate = async (keyProvider: ExternalE2EEKeyProvider) => {
        keyProviderRef.current = keyProvider;
    };

    useEffect(() => {
        let timeout: NodeJS.Timeout | null = null;

        const checkConnection = async () => {
            let isWebsocketHasReconnected = false;
            if (wasmApp?.getWsState && startHealthCheck.current) {
                try {
                    isWebsocketHasReconnected = await wasmApp.isWebsocketHasReconnected();
                    const connectionStatus = await wasmApp.getWsState();

                    if (connectionStatus !== ConnectionStateInfo.Reconnecting) {
                        try {
                            const isMlsUpToDate = await wasmApp.isMlsUpToDate();

                            if (!isMlsUpToDate) {
                                setConnectionLost(true);
                            }
                        } catch (error) {
                            reportMeetError('Failed to check MLS status', error);
                            setConnectionLost(true);
                        }
                    } else {
                        setConnectionLost(false);
                    }
                } catch (error) {
                    reportMeetError('Failed to get connection status', error);
                }
            }

            // If the websocket has reconnected, check the connection every 5 seconds.
            // Otherwise, check the connection every 30 seconds to avoid overwhelming the server.
            timeout = setTimeout(checkConnection, isWebsocketHasReconnected ? 5_000 : 30_000);
        };

        void checkConnection();

        return () => {
            if (timeout) {
                clearTimeout(timeout);
            }
        };
    }, []);

    useEffect(() => {
        const intervalId = setInterval(async () => {
            if (wasmApp && startHealthCheck.current) {
                try {
                    const groupKeyData = await wasmApp.getGroupKey();
                    const isKeyChanged = groupKeyData.key !== currentKeyRef.current;
                    if (isKeyChanged) {
                        await onNewGroupKeyInfo(groupKeyData.key, groupKeyData.epoch);
                        currentKeyRef.current = groupKeyData.key;
                    }
                } catch (error) {
                    reportMeetError('Failed to check groupKey', error);
                }
            }
        }, 3000);

        return () => clearInterval(intervalId);
    }, []);

    const submitPassword = async () => {
        try {
            setInvalidPassphrase(false);

            const handshakeInfo = await initHandshake(token);

            const roomName = await getRoomName({
                customPassword: password,
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
            setInvalidPassphrase(true);
            return false;
        }
    };

    const handleHandsakeInfoFetch = async (token: string) => {
        try {
            const handshakeInfo = await initHandshake(token);

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
        } catch {
            notifications.createNotification({
                type: 'error',
                text: c('Error').t`The meeting link you are trying to access does not exist or may have been deleted.`,
                expiration: 20000,
            });

            if (!guestMode) {
                history.push('/dashboard');
            }

            return {};
        }
    };

    const handleJoin = async (participantSettings: ParticipantSettings, meetingToken: string = token) => {
        setParticipantSettings(participantSettings);

        try {
            try {
                await getParticipants(meetingToken);
            } catch (error) {
                console.error(error);
            } finally {
                setInitialisedParticipantNameMap(true);
            }

            const sanitizedParticipantName = sanitizeMessage(participantSettings?.displayName as string);

            const room = await join({
                participantName: sanitizedParticipantName,
                meetingId: meetingToken,
                setupMls: handleMlsSetup,
                setupKeyUpdate: handleKeyUpdate,
            });

            await getParticipants(meetingToken);

            roomRef.current = room;

            room.on('disconnected', () => {
                instantMeetingRef.current = false;
                mlsSetupDone.current = false;
                startHealthCheck.current = false;

                setInitialisedParticipantNameMap(false);
                setJoinedRoom(false);
            });

            setJoinedRoom(true);
            setJoiningInProgress(false);
        } catch (error: any) {
            reportMeetError('Failed to join meeting', error);

            createNotification({
                type: 'error',
                text: error.message ?? c('Error').t`Failed to join meeting. Please try again later`,
            });

            setJoiningInProgress(false);
            joinBlockedRef.current = false;
        }
    };

    const joinInstantMeeting = async (participantSettings: ParticipantSettings) => {
        if (joinBlockedRef.current) {
            return;
        }
        setJoiningInProgress(true);

        joinBlockedRef.current = true;

        loadingStartTimeRef.current = Date.now();

        const { id, passwordBase } = await createInstantMeeting({
            params: {},
            isGuest: guestMode,
        });

        const handsakeResult = await handleHandsakeInfoFetch(id);

        if (!handsakeResult) {
            return;
        }

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

        joinBlockedRef.current = false;
    };

    const joinMeeting = async (participantSettings: ParticipantSettings, meetingToken: string = token) => {
        if (joinBlockedRef.current) {
            return;
        }

        setJoiningInProgress(true);

        joinBlockedRef.current = true;

        loadingStartTimeRef.current = Date.now();

        const handshakeInfo = await initHandshake(meetingToken);

        if (!handshakeInfo) {
            return;
        }

        let roomName = '';

        try {
            roomName = await getRoomName({
                token: meetingToken,
                customPassword: password,
                urlPassword,
                handshakeInfo: handshakeInfo as SRPHandshakeInfo,
            });
        } catch {
            notifications.createNotification({
                type: 'error',
                text: c('Error').t`The meeting password is incorrect`,
            });

            setJoiningInProgress(false);
            joinBlockedRef.current = false;

            return;
        }

        setMeetingDetails((prev) => ({
            ...prev,
            meetingName: roomName,
        }));

        await handleJoin(participantSettings, meetingToken);

        joinBlockedRef.current = false;
    };

    const setup = async () => {
        if (instantMeetingRef.current) {
            setDecryptionReadinessStatus(MeetingDecryptionReadinessStatus.READY_TO_DECRYPT);

            return;
        }

        await handleHandsakeInfoFetch(token);
    };

    useEffect(() => {
        void setup();
    }, []);

    const handleLeave = () => {
        instantMeetingRef.current = false;
        void roomRef.current?.disconnect();
        resetParticipantNameMap();
        void wasmApp?.leaveMeeting();
        mlsSetupDone.current = false; // need to set mls again after leave meeting
        startHealthCheck.current = false;

        setInitialisedParticipantNameMap(false);
        setJoinedRoom(false);
    };

    const handleEndMeeting = async () => {
        if (!wasmApp) {
            return;
        }

        try {
            await wasmApp.endMeeting();
        } catch (err) {
            reportMeetError('Unable to end meeting for all', err);
        }

        // Always perform cleanup regardless of endMeeting success/failure
        instantMeetingRef.current = false;
        resetParticipantNameMap();
        mlsSetupDone.current = false; // need to set mls again after leave meeting
        setInitialisedParticipantNameMap(false);
        setJoinedRoom(false);
    };

    useEffect(() => {
        const handleUnload = () => {
            try {
                void wasmApp?.leaveMeeting();
            } catch (error) {
                reportMeetError('Error leaving meeting', error);
            }
        };

        window.addEventListener('unload', handleUnload);
        return () => {
            window.removeEventListener('unload', handleUnload);
        };
    }, []);

    useEffect(() => {
        if (refetchedParticipantNameMapRef.current) {
            return;
        }

        if (
            joinedRoom &&
            roomRef.current &&
            !participantNameMap[roomRef.current?.localParticipant.identity as string]
        ) {
            refetchedParticipantNameMapRef.current = true;
            void getParticipants(token);
        }
    }, [getParticipants, token, participantNameMap, joinedRoom]);

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
            <MLSContext.Provider value={{ mls: wasmApp }}>
                <div className="h-full w-full">
                    {decryptionReadinessStatus === MeetingDecryptionReadinessStatus.INITIALIZED && (
                        <PasswordPrompt
                            password={password}
                            setPassword={setPassword}
                            onPasswordSubmit={submitPassword}
                            invalidPassphrase={invalidPassphrase}
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
                                setAudioOutputDeviceId={(deviceId) =>
                                    setParticipantSettings({
                                        ...participantSettings,
                                        audioOutputDeviceId: deviceId,
                                    })
                                }
                                handleLeave={handleLeave}
                                handleEndMeeting={handleEndMeeting}
                                setParticipantSettings={setParticipantSettings}
                                shareLink={shareLink}
                                roomName={meetingDetails.meetingName as string}
                                participantNameMap={participantNameMap}
                                participantsMap={participantsMap}
                                getParticipants={() => getParticipants(meetingDetails.meetingId as string)}
                                instantMeeting={instantMeetingRef.current}
                                passphrase={password}
                                guestMode={guestMode}
                            />
                        </RoomContext.Provider>
                    ) : (
                        <PrejoinContainer
                            handleJoin={instantMeetingRef.current ? joinInstantMeeting : joinMeeting}
                            loadingState={LoadingState.JoiningInProgress}
                            isLoading={joiningInProgress}
                            guestMode={guestMode}
                            shareLink={shareLink}
                            roomName={meetingDetails.meetingName as string}
                            roomId={token}
                            instantMeeting={instantMeetingRef.current}
                            initialisedParticipantNameMap={initialisedParticipantNameMap}
                            participantNameMap={participantNameMap}
                        />
                    )}
                    {connectionLost && <ConnectionLostModal onClose={() => setConnectionLost(false)} />}
                </div>
            </MLSContext.Provider>
        </DevicePermissionsContext.Provider>
    );
};
