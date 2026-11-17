import { useFlag } from '@proton/unleash/useFlag';

export const useIsWaitingRoomCreationEnabled = () => useFlag('MeetWaitingRoom');
