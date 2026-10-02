import { type Dispatch, type MutableRefObject, type SetStateAction, useEffect, useRef, useState } from 'react';
import { useHistory } from 'react-router-dom';

import { useRoomContext } from '@livekit/components-react';
import { RejoinReasonInfo } from '@proton-meet/proton-meet-core';
import { ConnectionState, DisconnectReason, RoomEvent } from 'livekit-client';
import type { RemoteParticipant } from 'livekit-client';

import type { ReportMeetError } from '@proton/meet/hooks/useMeetErrorReporting';
import { useMeetDispatch, useMeetStore } from '@proton/meet/store/hooks';
import { resetChatAndReactions } from '@proton/meet/store/slices/chatAndReactionsSlice';
import { setIsReconnecting, setJoinedRoom } from '@proton/meet/store/slices/connectionSlice';
import {
    setMeetingEndedReason,
    setPreviousMeetingLink,
    setUpsellModalType,
} from '@proton/meet/store/slices/meetAppStateSlice';
import { selectIsLocalParticipantHost } from '@proton/meet/store/slices/participants/participantsSlice';
import { resetUiState } from '@proton/meet/store/slices/uiStateSlice';
import { UpsellModalTypes } from '@proton/meet/types/types';
import { SECOND } from '@proton/shared/lib/constants';

import { useMeetCoreClient } from '../../contexts/MeetCoreClientContext';
import { isValidMessageString } from '../../utils/isValidMessageString';
import { useStableCallback } from '../useStableCallback';

// Topic livekit-ops publishes the deletion reason on, right before deleting the room
export const ROOM_DELETED_TOPIC = 'room_deleted';
const MAX_MEETING_ENDED_REASON_LENGTH = 256;

interface UseRoomEventHandlersParams {
    joinedRoom: boolean;
    disallowHealthCheck: () => void;
    cleanupMlsState: () => void;
    stopPiP: () => Promise<void>;
    joinedRoomLoggedRef: MutableRefObject<boolean>;
    instantMeetingRef: MutableRefObject<boolean>;
    mlsSetupDone: MutableRefObject<boolean>;
    isReconnectingRef: MutableRefObject<boolean>;
    isExpiringRef: MutableRefObject<boolean>;
    meetingLinkRef: MutableRefObject<string | null>;
    meetingLinkNameRef: MutableRefObject<string>;
    triggerFullReconnectionRef: MutableRefObject<(reason: RejoinReasonInfo) => void>;
    reportMeetError: ReportMeetError;
}

export interface UseRoomEventHandlersResult {
    liveKitConnectionState: ConnectionState | null;
    setLiveKitConnectionState: Dispatch<SetStateAction<ConnectionState | null>>;
    showReconnectedMessage: boolean;
    setShowReconnectedMessage: Dispatch<SetStateAction<boolean>>;
}

export const useRoomEventHandlers = ({
    joinedRoom,
    disallowHealthCheck,
    cleanupMlsState,
    stopPiP,
    joinedRoomLoggedRef,
    instantMeetingRef,
    mlsSetupDone,
    isReconnectingRef,
    isExpiringRef,
    meetingLinkRef,
    meetingLinkNameRef,
    triggerFullReconnectionRef,
    reportMeetError,
}: UseRoomEventHandlersParams): UseRoomEventHandlersResult => {
    const room = useRoomContext();
    const dispatch = useMeetDispatch();
    const store = useMeetStore();
    const history = useHistory();
    const meetCoreClient = useMeetCoreClient();

    const [liveKitConnectionState, setLiveKitConnectionState] = useState<ConnectionState | null>(null);
    const [showReconnectedMessage, setShowReconnectedMessage] = useState(false);

    const liveKitConnectionStateRef = useRef<ConnectionState | null>(null);
    const meetingEndedReasonRef = useRef<string | null>(null);

    const handleConnectionStateChanged = useStableCallback((state: ConnectionState) => {
        const previousState = liveKitConnectionStateRef.current;
        liveKitConnectionStateRef.current = state;
        setLiveKitConnectionState(state);

        if (
            state === ConnectionState.Connected &&
            previousState !== null &&
            previousState !== ConnectionState.Connected
        ) {
            setShowReconnectedMessage(true);
            setTimeout(() => {
                setShowReconnectedMessage(false);
                // Don't clear state immediately - let MLS health check run first
                setTimeout(() => {
                    setLiveKitConnectionState(null);
                    liveKitConnectionStateRef.current = null;
                }, SECOND);
            }, 3 * SECOND);
        } else if (state === ConnectionState.Connected) {
            setShowReconnectedMessage(false);
        }
    });

    const handleDataReceived = useStableCallback(
        (
            // eslint-disable-next-line @protontech/enforce-uint8array-arraybuffer/enforce-uint8array-arraybuffer
            payload: Uint8Array,
            participant?: RemoteParticipant,
            _kind?: unknown,
            topic?: string
        ) => {
            // Ignore participants publishing on the same topic to avoid impersonation
            if (topic !== ROOM_DELETED_TOPIC || participant) {
                return;
            }

            const reason = new TextDecoder().decode(payload).trim();
            if (!reason || reason.length > MAX_MEETING_ENDED_REASON_LENGTH || !isValidMessageString(reason)) {
                return;
            }

            meetingEndedReasonRef.current = reason;
            dispatch(
                setMeetingEndedReason({
                    reason,
                    isLocalParticipantHost: selectIsLocalParticipantHost(store.getState()),
                })
            );
        }
    );

    const handleDisconnected = useStableCallback((reason?: DisconnectReason) => {
        // STATE_MISMATCH is recoverable — trigger full reconnection flow
        if (reason === DisconnectReason.STATE_MISMATCH) {
            // Don't call leaveMeeting here, performFullReconnection will await it
            disallowHealthCheck();
            dispatch(setIsReconnecting(true));
            dispatch(setJoinedRoom(false));
            setLiveKitConnectionState(null);
            setShowReconnectedMessage(false);
            liveKitConnectionStateRef.current = null;
            joinedRoomLoggedRef.current = false;
            cleanupMlsState();
            dispatch(resetChatAndReactions());
            dispatch(resetUiState());
            triggerFullReconnectionRef.current(RejoinReasonInfo.LivekitStateMismatch);
            return;
        }

        instantMeetingRef.current = false;
        mlsSetupDone.current = false;
        disallowHealthCheck();

        dispatch(setJoinedRoom(false));
        setLiveKitConnectionState(null);
        setShowReconnectedMessage(false);
        liveKitConnectionStateRef.current = null;

        joinedRoomLoggedRef.current = false;
        // Skip leaveMeeting when performFullReconnection is active, it will await it properly.
        if (!isReconnectingRef.current) {
            void meetCoreClient.leaveMeeting();
        }
        void stopPiP();

        cleanupMlsState();

        dispatch(resetChatAndReactions());
        dispatch(resetUiState());

        if (reason === DisconnectReason.ROOM_DELETED) {
            if (!isExpiringRef.current) {
                dispatch(setPreviousMeetingLink(meetingLinkRef.current));
                dispatch(setUpsellModalType(UpsellModalTypes.MeetingEnded));
            }
            isExpiringRef.current = false;
        } else if (reason === DisconnectReason.PARTICIPANT_REMOVED) {
            dispatch(setPreviousMeetingLink(meetingLinkRef.current));
            dispatch(setUpsellModalType(UpsellModalTypes.RemovedFromMeeting));
        } else if (reason !== undefined && reason !== DisconnectReason.CLIENT_INITIATED) {
            reportMeetError('Room disconnected unexpectedly', { context: { error: DisconnectReason[reason] } });
        }
        meetingLinkNameRef.current = '';

        if (reason === DisconnectReason.ROOM_DELETED || reason === DisconnectReason.PARTICIPANT_REMOVED) {
            history.push('/dashboard');
        }
    });

    useEffect(() => {
        if (!joinedRoom) {
            return;
        }

        meetingEndedReasonRef.current = null;
        dispatch(setMeetingEndedReason(null));

        room.on(RoomEvent.ConnectionStateChanged, handleConnectionStateChanged);
        room.on(RoomEvent.DataReceived, handleDataReceived);
        room.on(RoomEvent.Disconnected, handleDisconnected);

        return () => {
            room.off(RoomEvent.ConnectionStateChanged, handleConnectionStateChanged);
            room.off(RoomEvent.DataReceived, handleDataReceived);
            room.off(RoomEvent.Disconnected, handleDisconnected);
        };
    }, [joinedRoom, room, dispatch, handleConnectionStateChanged, handleDataReceived, handleDisconnected]);

    return {
        liveKitConnectionState,
        setLiveKitConnectionState,
        showReconnectedMessage,
        setShowReconnectedMessage,
    };
};
