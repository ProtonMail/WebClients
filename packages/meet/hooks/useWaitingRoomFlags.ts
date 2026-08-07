import { useFlag } from '@proton/unleash/useFlag';

export const useIsWaitingRoomJoinEnabled = () => useFlag('MeetWaitingRoomJoin');

/**
 * Creation requires the join gate: a host must never enable a waiting room their own client cannot run,
 * otherwise guests queue up where nobody can admit them.
 */
export const useIsWaitingRoomCreationEnabled = () => {
    const isWaitingRoomJoinEnabled = useIsWaitingRoomJoinEnabled();
    const isWaitingRoomSettingEnabled = useFlag('MeetWaitingRoom');

    return isWaitingRoomSettingEnabled && isWaitingRoomJoinEnabled;
};
