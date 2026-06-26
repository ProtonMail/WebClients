import { useLumoFlags } from './useLumoFlags';
import { useLumoPlan } from '../providers/LumoPlanProvider';

/**
 * Whether Lumo Max can be selected for the current user segment.
 * Lumo+ always has access; guest/free depend on Unleash flags (off by default during high load).
 */
export const useMaxModelAvailability = () => {
    const { hasLumoPlus, isGuest } = useLumoPlan();
    const { maxAvailableFree, maxAvailableGuest } = useLumoFlags();

    const isMaxAvailableByFlag = hasLumoPlus || (isGuest ? maxAvailableGuest : maxAvailableFree);

    return { isMaxAvailableByFlag };
};
