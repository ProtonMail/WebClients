import { useCallback, useEffect, useRef, useState } from 'react';
import { useHistory } from 'react-router-dom';

import { RoomContext } from '@livekit/components-react';
import type { ExternalE2EEKeyProvider, Room } from '@proton-meet/livekit-client';
import type { GroupKeyInfo } from '@proton-meet/proton-meet-core';
import init, { App, ConnectionStateInfo } from '@proton-meet/proton-meet-core';
import meetCorePkg from '@proton-meet/proton-meet-core/package.json';
import { c } from 'ttag';

import { useAuthentication, useNotifications } from '@proton/components';
import { useCreateInstantMeeting } from '@proton/meet/hooks/useCreateInstantMeeting';
import { CustomPasswordState } from '@proton/meet/types/response-types';
import { getMeetingLink } from '@proton/meet/utils/getMeetingLink';
import { getPersistedSession } from '@proton/shared/lib/authentication/persistedSessionStorage';
import { message as sanitizeMessage } from '@proton/shared/lib/sanitize/purify';
import useFlag from '@proton/unleash/useFlag';

import { ConnectionLostModal } from '../components/ConnectionLostModal/ConnectionLostModal';
import { PasswordPrompt } from '../components/PasswordPrompt/PasswordPrompt';
import { DevicePermissionsContext } from '../contexts/DevicePermissionsContext';
import { MLSContext } from '../contexts/MLSContext';
import type { SRPHandshakeInfo } from '../hooks/srp/useMeetSrp';
import { useMeetingSetup } from '../hooks/srp/useMeetingSetup';
import { useDependencySetup } from '../hooks/useDependencySetup';
import { useDevicePermissionChangeListener } from '../hooks/useDevicePermissionChangeListener';
import { useMeetingJoin } from '../hooks/useMeetingJoin';
import { useParticipantNameMap } from '../hooks/useParticipantNameMap';
import { useWakeLock } from '../hooks/useWakeLock';
import { LoadingState, type ParticipantSettings } from '../types';
import { setupMounStorage, setupWasmDependencies } from '../utils/wasmUtils';
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

    const history = useHistory();
    const createInstantMeeting = useCreateInstantMeeting();

    const [decryptionReadinessStatus, setDecryptionReadinessStatus] = useState(
        MeetingDecryptionReadinessStatus.UNINITIALIZED
    );

    const currentKeyRef = useRef<string | null>(null);

    const [password, setPassword] = useState('');
    const [invalidPassphrase, setInvalidPassphrase] = useState(false);

    const { getRoomName, getHandshakeInfo, token, urlPassword } = useMeetingSetup();

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

    const handleDevicePermissionChange = useCallback(
        (permissions: { camera?: PermissionState; microphone?: PermissionState }) => {
            setDevicePermissions((prevPermissions) => ({ ...prevPermissions, ...permissions }));
        },
        []
    );

    const loadingStartTimeRef = useRef(0);

    const wasmAppRef = useRef<App | null>(null);

    const keyProviderRef = useRef<ExternalE2EEKeyProvider | null>(null);

    useDevicePermissionChangeListener(handleDevicePermissionChange);

    const authentication = useAuthentication();

    const persistedSession = getPersistedSession(authentication.localID);
    const userID = persistedSession?.UserID ?? '';
    const uid = authentication.UID;

    const mlsEnabled = useFlag('EnableE2EE');
    const mlsSetupDone = useRef(false);
    const startHealthCheck = useRef(false);

    const notifications = useNotifications();

    const getGroupKeyInfo = async () => {
        try {
            const newGroupKeyInfo = (await wasmAppRef.current?.getGroupKey()) as GroupKeyInfo;
            currentKeyRef.current = newGroupKeyInfo.key;
            return { key: newGroupKeyInfo.key, epoch: newGroupKeyInfo.epoch };
        } catch (err: any) {
            console.error('Error while calling getGroupKeyInfo');
            throw err;
        }
    };

    const onNewGroupKeyInfo = async (key: string, epoch: bigint) => {
        console.log('Calling onNewGroupKeyInfo');
        try {
            await keyProviderRef.current?.setKey(key, epoch);
        } catch (err) {
            console.error('Could not set new encryption key');
        }
    };

    const handleMlsSetup = useCallback(
        async (meetingLinkName: string, accessToken: string) => {
            const baseHostName = window.location.hostname.split('.').slice(1).join('.');

            const mlsSubdomain = baseHostName.includes('proton.me') ? 'meet-mls' : 'mls';

            const env = `${window.location.origin}/api`;
            const appVersion = 'web-meet@0.0.1';
            const userAgent = navigator.userAgent;
            const dbPath = '';
            const wsHost = `${mlsSubdomain}.${baseHostName}`;

            if (!mlsSetupDone.current) {
                await init();

                setupMounStorage();
                console.log('proton-meet-core:', meetCorePkg.version);
                console.log('appVersion:', appVersion);
                wasmAppRef.current = await new App(env, appVersion, userAgent, dbPath, wsHost, userID ?? '', uid ?? '');

                mlsSetupDone.current = true;

                setupWasmDependencies({ getGroupKeyInfo, onNewGroupKeyInfo });
            }

            if (!wasmAppRef.current) {
                return;
            }

            await wasmAppRef.current.joinMeetingWithAccessToken(accessToken, meetingLinkName);

            await wasmAppRef.current.setMlsGroupUpdateHandler();

            const groupKeyData = await wasmAppRef.current.getGroupKey();

            currentKeyRef.current = groupKeyData.key;

            startHealthCheck.current = true;

            return groupKeyData;
        },
        [participantSettings, token]
    );

    const handleKeyUpdate = useCallback(async (keyProvider: ExternalE2EEKeyProvider) => {
        keyProviderRef.current = keyProvider;
        console.log('Successfully set new keyProvider');
    }, []);

    useEffect(() => {
        let timeout: NodeJS.Timeout | null = null;

        const checkConnection = async () => {
            if (wasmAppRef.current?.getWsState && startHealthCheck.current) {
                try {
                    const connectionStatus = await wasmAppRef.current.getWsState();

                    if (connectionStatus !== ConnectionStateInfo.Reconnecting) {
                        try {
                            const isMlsUpToDate = await wasmAppRef.current.isMlsUpToDate();

                            if (!isMlsUpToDate) {
                                setConnectionLost(true);
                            }
                        } catch (error) {
                            console.error('Failed to check MLS status:', error);
                            setConnectionLost(true);
                        }
                    } else {
                        setConnectionLost(false);
                        console.log('Websocket is reconnecting');
                    }
                } catch (error) {
                    console.error('Failed to get connection status:', error);
                }
            }

            timeout = setTimeout(checkConnection, 5000);
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
            if (wasmAppRef.current && startHealthCheck.current) {
                try {
                    const groupKeyData = await wasmAppRef.current.getGroupKey();
                    const isKeyChanged = groupKeyData.key !== currentKeyRef.current;
                    if (isKeyChanged) {
                        console.info('MLSgroup updated, update to align the latest status.');

                        await onNewGroupKeyInfo(groupKeyData.key, groupKeyData.epoch);
                        currentKeyRef.current = groupKeyData.key;
                    }
                } catch (error) {
                    console.error('Failed to check groupKey:', error);
                }
            }
        }, 3000);

        return () => clearInterval(intervalId);
    }, []);

    const submitPassword = async () => {
        try {
            setInvalidPassphrase(false);

            const handshakeInfo = await getHandshakeInfo(token);

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

    const handleHandsakeInfoFetch = useCallback(
        async (token: string) => {
            try {
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
            } catch {
                notifications.createNotification({
                    type: 'error',
                    text: c('meet_2025 Error')
                        .t`The meeting link you are trying to access does not exist or may have been deleted.`,
                    expiration: 20000,
                });

                if (!guestMode) {
                    history.push('/dashboard');
                }

                return {};
            }
        },
        [getHandshakeInfo]
    );

    const handleJoin = useCallback(
        async (participantSettings: ParticipantSettings, meetingToken: string = token) => {
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
                    setupMls: mlsEnabled ? handleMlsSetup : undefined,
                    setupKeyUpdate: mlsEnabled ? handleKeyUpdate : undefined,
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
                createNotification({
                    type: 'error',
                    text: error.message ?? c('meet_2025 Error').t`Failed to join meeting. Please try again later`,
                });

                setJoiningInProgress(false);
                joinBlockedRef.current = false;
            }
        },
        [joiningInProgress, setJoiningInProgress, participantSettings, join]
    );

    const joinInstantMeeting = useCallback(
        async (participantSettings: ParticipantSettings) => {
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
        },
        [createInstantMeeting, handleJoin, getRoomName, guestMode]
    );

    const joinMeeting = useCallback(
        async (participantSettings: ParticipantSettings, meetingToken: string = token) => {
            if (joinBlockedRef.current) {
                return;
            }

            setJoiningInProgress(true);

            joinBlockedRef.current = true;

            loadingStartTimeRef.current = Date.now();

            const handshakeInfo = await getHandshakeInfo(meetingToken);

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
                    text: c('meet_2025 Error').t`The meeting password is incorrect`,
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
        },
        [handleJoin, getRoomName, getHandshakeInfo, urlPassword, password]
    );

    const setup = useCallback(async () => {
        if (instantMeetingRef.current) {
            setDecryptionReadinessStatus(MeetingDecryptionReadinessStatus.READY_TO_DECRYPT);

            return;
        }

        await handleHandsakeInfoFetch(token);
    }, [handleHandsakeInfoFetch, token]);

    useEffect(() => {
        void setup();
    }, []);

    const handleLeave = useCallback(() => {
        instantMeetingRef.current = false;
        void roomRef.current?.disconnect();
        resetParticipantNameMap();
        void wasmAppRef.current?.leaveMeeting();
        mlsSetupDone.current = false; // need to set mls again after leave meeting
        startHealthCheck.current = false;

        setInitialisedParticipantNameMap(false);
        setJoinedRoom(false);
    }, [resetParticipantNameMap]);

    const handleEndMeeting = useCallback(async () => {
        await wasmAppRef.current
            ?.endMeeting()
            .then(() => {
                instantMeetingRef.current = false;
                resetParticipantNameMap();
                mlsSetupDone.current = false; // need to set mls again after leave meeting
                setInitialisedParticipantNameMap(false);
                setJoinedRoom(false);
            })
            .catch(() => {
                throw new Error('Unable to end meeting for all');
            });
    }, [resetParticipantNameMap]);

    useEffect(() => {
        const handleUnload = () => {
            try {
                void wasmAppRef.current?.leaveMeeting();
            } catch (error) {
                console.error('leave meeting error', error);
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
            <MLSContext.Provider value={{ mls: wasmAppRef.current }}>
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
                                    setParticipantSettings({ ...participantSettings, audioOutputDeviceId: deviceId })
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
