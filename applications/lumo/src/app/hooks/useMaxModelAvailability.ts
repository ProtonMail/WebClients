import { useLumoPlan } from '../providers/LumoPlanProvider';
import { useDebugMaxModelOverride } from '../services/usageLimitsStore';
import { useLumoFlags } from './useLumoFlags';

/**
 * Whether Lumo Max can be selected for the current user segment.
 * Lumo+ always has access; guest/free depend on Unleash flags (off by default during high load).
 */
export const useMaxModelAvailability = () => {
    const { hasLumoPlus, isGuest } = useLumoPlan();
    const { maxAvailableFree, maxAvailableGuest } = useLumoFlags();
    const debugOverride = useDebugMaxModelOverride();

    const isMaxAvailableByFlag =
        debugOverride !== 'unavailable_high_load' && (hasLumoPlus || (isGuest ? maxAvailableGuest : maxAvailableFree));

    return { isMaxAvailableByFlag };
};
