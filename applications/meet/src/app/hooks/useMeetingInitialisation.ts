import { useMeetEventSim } from '../dev/useMeetEventSim';
import { useBridges } from './bridges/useBridges';
import { useMeetingTimeout } from './useMeetingTimeout';
import { usePaginationSizeUpdates } from './usePaginationSizeUpdates';
import { useScreenShareUpdates } from './useScreenShareUpdates';

export const useMeetingInitialisation = () => {
    useBridges();
    usePaginationSizeUpdates();
    useScreenShareUpdates();
    useMeetingTimeout();
    useMeetEventSim();
};
