import { useEffect, useRef, useState } from 'react';
import { useHistory } from 'react-router-dom';

import type { ExternalE2EEKeyProvider, Room } from '@proton-meet/livekit-client';
import { ConnectionStateInfo, type GroupKeyInfo, MeetCoreErrorEnum } from '@proton-meet/proton-meet-core';
import { c } from 'ttag';

import useNotifications from '@proton/components/hooks/useNotifications';
import { useMeetErrorReporting } from '@proton/meet';
import { useCreateInstantMeeting } from '@proton/meet/hooks/useCreateInstantMeeting';
import { getMeetingLink } from '@proton/meet/utils/getMeetingLink';
import { getApiError } from '@proton/shared/lib/api/helpers/apiErrorHelper';
import { CustomPasswordState } from '@proton/shared/lib/interfaces/Meet';
import { message as sanitizeMessage } from '@proton/shared/lib/sanitize/purify';

import { ConnectionLostModal } from '../../components/ConnectionLostModal/ConnectionLostModal';
import { MeetingLockedModal } from '../../components/MeetingLockedModal/MeetingLockedModal';
import { PasswordPrompt } from '../../components/PasswordPrompt/PasswordPrompt';
import { MEETING_LOCKED_ERROR_CODE } from '../../constants';
import { MLSContext } from '../../contexts/MLSContext';
import { useMediaManagementContext } from '../../contexts/MediaManagementContext';
import { useWasmApp } from '../../contexts/WasmContext';
import type { SRPHandshakeInfo } from '../../hooks/srp/useMeetSrp';
import { useMeetingSetup } from '../../hooks/srp/useMeetingSetup';
import { useDependencySetup } from '../../hooks/useDependencySetup';
import { useLockMeeting } from '../../hooks/useLockMeeting';
import { useParticipantNameMap } from '../../hooks/useParticipantNameMap';
import { useWakeLock } from '../../hooks/useWakeLock';
import type { MLSGroupState } from '../../types';
import { LoadingState } from '../../types';
import { setupWasmDependencies } from '../../utils/wasmUtils';
import { MeetContainer } from '../MeetContainer';
import { PrejoinContainer } from '../PrejoinContainer/PrejoinContainer';

enum MeetingDecryptionReadinessStatus {
    UNINITIALIZED = 'uninitialized',
    INITIALIZED = 'initialized',
    READY_TO_DECRYPT = 'readyToDecrypt',
}

interface ProtonMeetContainerProps {
    guestMode?: boolean;
    room: Room;
    keyProvider: ExternalE2EEKeyProvider;
}

export const ProtonMeetContainer = ({ guestMode = false, room, keyProvider }: ProtonMeetContainerProps) => {
    useWakeLock();

    useDependencySetup(guestMode);

    const { initializeDevices } = useMediaManagementContext();

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
    const [isMeetingLockedModalOpen, setIsMeetingLockedModalOpen] = useState(false);

    const { getRoomName, initHandshake, token, urlPassword, getAccessDetails } = useMeetingSetup();

    const { toggleMeetingLock, isMeetingLocked } = useLockMeeting();

    const instantMeetingRef = useRef(!token);

    const [displayName, setDisplayName] = useState('');

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

    const loadingStartTimeRef = useRef(0);
    const [mlsGroupState, setMlsGroupState] = useState<MLSGroupState | null>(null);

    const keyProviderRef = useRef<ExternalE2EEKeyProvider | null>(null);

    const wasmApp = useWasmApp();

    const mlsSetupDone = useRef(false);
    const startHealthCheck = useRef(false);
    const accessTokenRef = useRef<string | null>(null);

    const notifications = useNotifications();

    const getGroupKeyInfo = async () => {
        try {
            const newGroupKeyInfo = (await wasmApp?.getGroupKey()) as GroupKeyInfo;
            currentKeyRef.current = newGroupKeyInfo.key;
            const displayCode = await wasmApp?.getGroupDisplayCode();
            setMlsGroupState({
                displayCode: displayCode?.full_code || null,
                epoch: newGroupKeyInfo.epoch,
            });
            return { key: newGroupKeyInfo.key, epoch: newGroupKeyInfo.epoch };
        } catch (err: any) {
            reportMeetError('Error while calling getGroupKeyInfo', err);
            throw err;
        }
    };

    const onNewGroupKeyInfo = async (key: string, epoch: bigint) => {
        try {
            await keyProviderRef.current?.setKey(key, epoch);
            const displayCode = await wasmApp?.getGroupDisplayCode();
            setMlsGroupState({ displayCode: displayCode?.full_code || null, epoch: epoch });
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

        try {
            await wasmApp.joinMeetingWithAccessToken(accessToken, meetingLinkName);

            await wasmApp.setMlsGroupUpdateHandler();

            const groupKeyData = await wasmApp.getGroupKey();

            currentKeyRef.current = groupKeyData.key;

            const displayCode = await wasmApp?.getGroupDisplayCode();
            setMlsGroupState({ displayCode: displayCode?.full_code || null, epoch: groupKeyData.epoch });

            startHealthCheck.current = true;

            return groupKeyData;
        } catch (error) {
            switch (error) {
                // TODO: Show a custom error message to the user for each error
                case MeetCoreErrorEnum.MlsServerVersionNotSupported:
                    throw new Error(
                        c('Error')
                            .t`This meeting is on an older version, the host must end it and refresh Meet to restart with the latest version.`
                    );
                case MeetCoreErrorEnum.MaxRetriesReached:
                case MeetCoreErrorEnum.MlsGroupError:
                case MeetCoreErrorEnum.HttpClientError:
                default:
                    console.error(error);
                    throw new Error(c('Error').t`Failed to join meeting. Please try again later.`);
            }
        }
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

    const handleMeetingIsLockedError = async () => {
        setIsMeetingLockedModalOpen(true);
    };

    const handleJoin = async (displayName: string, meetingToken: string = token) => {
        setDisplayName(displayName);

        try {
            try {
                await getParticipants(meetingToken);
            } catch (error) {
                console.error(error);
            } finally {
                setInitialisedParticipantNameMap(true);
            }

            const sanitizedParticipantName = sanitizeMessage(displayName);

            const { websocketUrl, accessToken } = await getAccessDetails({
                displayName: sanitizedParticipantName,
                token: meetingToken,
            });

            const { key: groupKey, epoch } = (await handleMlsSetup(meetingToken, accessToken)) || {};

            await keyProvider.setKey(groupKey as string, epoch);

            await handleKeyUpdate(keyProvider);

            // Turning auto subscribe off so we have better control over the quality of the tracks
            await room.connect(websocketUrl, accessToken, {
                autoSubscribe: false,
            });

            await room.setE2EEEnabled(true);

            await initializeDevices();

            await getParticipants(meetingToken);

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

            setJoiningInProgress(false);
            joinBlockedRef.current = false;

            const { code } = getApiError(error);
            if (code === MEETING_LOCKED_ERROR_CODE) {
                await handleMeetingIsLockedError();
                return;
            }

            createNotification({
                type: 'error',
                text: error.message ?? c('Error').t`Failed to join meeting. Please try again later`,
            });
        }
    };

    const joinInstantMeeting = async (displayName: string) => {
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

        await handleJoin(displayName, id);

        history.push(getMeetingLink(id, passwordBase));

        joinBlockedRef.current = false;
    };

    const joinMeeting = async (displayName: string, meetingToken: string = token) => {
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

        await handleJoin(displayName, meetingToken);

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
        void room.disconnect();
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

    const handleMeetingLockToggle = async (enable: boolean) => {
        await toggleMeetingLock(enable, token, accessTokenRef.current as string);
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

        if (joinedRoom && room && !participantNameMap[room.localParticipant.identity as string]) {
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
                {isMeetingLockedModalOpen && <MeetingLockedModal onClose={() => setIsMeetingLockedModalOpen(false)} />}
                {joinedRoom && room && displayName ? (
                    <MeetContainer
                        displayName={displayName}
                        handleLeave={handleLeave}
                        handleEndMeeting={handleEndMeeting}
                        shareLink={shareLink}
                        roomName={meetingDetails.meetingName as string}
                        participantNameMap={participantNameMap}
                        participantsMap={participantsMap}
                        getParticipants={() => getParticipants(meetingDetails.meetingId as string)}
                        instantMeeting={instantMeetingRef.current}
                        passphrase={password}
                        guestMode={guestMode}
                        handleMeetingLockToggle={handleMeetingLockToggle}
                        isMeetingLocked={isMeetingLocked}
                        mlsGroupState={mlsGroupState}
                    />
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
    );
};
