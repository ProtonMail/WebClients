import { useFlag } from '@proton/unleash/useFlag';

export const useIsCustomBackgroundsEnabled = () => useFlag('MeetCustomVirtualBackground');
