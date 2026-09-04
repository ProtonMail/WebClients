import { useMeetEventSim } from '../dev/useMeetEventSim';
import { useBridges } from './bridges/useBridges';
import { useScreenShareUpdates } from './screenShare/useScreenShareUpdates';
import { useActiveSpeakerUpdates } from './useActiveSpeakerUpdates';
import { useMeetingTimeout } from './useMeetingTimeout';
import { usePaginationSizeUpdates } from './usePaginationSizeUpdates';

export const useMeetingInitialisation = () => {
    useBridges();
    usePaginationSizeUpdates();
    useScreenShareUpdates();
    useActiveSpeakerUpdates();
    useMeetingTimeout();
    useMeetEventSim();
};
