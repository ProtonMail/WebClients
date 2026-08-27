import { useMeetEventSim } from '../dev/useMeetEventSim';
import { useBridges } from './bridges/useBridges';
import { useScreenShareUpdates } from './screenShare/useScreenShareUpdates';
import { useMeetingTimeout } from './useMeetingTimeout';
import { usePaginationSizeUpdates } from './usePaginationSizeUpdates';

export const useMeetingInitialisation = () => {
    useBridges();
    usePaginationSizeUpdates();
    useScreenShareUpdates();
    useMeetingTimeout();
    useMeetEventSim();
};
