export type JoinRequestChangeInfo = 0 | 1; // 0 = Added, 1 = Removed

type JoinDecisionCallback = (requestId: string, admitted: boolean) => void;
type JoinRequestCallback = (
    change: JoinRequestChangeInfo,
    requestId: string,
    participantUid: string,
    expiresAt: number
) => void;

interface WaitingRoomCallbackRegistry {
    onJoinDecision?: JoinDecisionCallback;
    onJoinRequest?: JoinRequestCallback;
}

const registry: WaitingRoomCallbackRegistry = {};

export const setWaitingRoomJoinDecisionCallback = (cb: JoinDecisionCallback) => {
    registry.onJoinDecision = cb;
};

export const clearWaitingRoomJoinDecisionCallback = () => {
    registry.onJoinDecision = undefined;
};

export const setWaitingRoomJoinRequestCallback = (cb: JoinRequestCallback) => {
    registry.onJoinRequest = cb;
};

export const clearWaitingRoomJoinRequestCallback = () => {
    registry.onJoinRequest = undefined;
};

export const emitWaitingRoomJoinDecision = (requestId: string, admitted: boolean) => {
    registry.onJoinDecision?.(requestId, admitted);
};

export const emitWaitingRoomJoinRequest = (
    change: JoinRequestChangeInfo,
    requestId: string,
    participantUid: string,
    expiresAt: number
) => {
    registry.onJoinRequest?.(change, requestId, participantUid, expiresAt);
};
