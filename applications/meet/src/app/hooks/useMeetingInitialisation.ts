import { useMeetingTimeout } from './useMeetingTimeout';
import { usePaginationSizeUpdates } from './usePaginationSizeUpdates';
import { useScreenShareUpdates } from './useScreenShareUpdates';

export const useMeetingInitialisation = () => {
    usePaginationSizeUpdates();
    useScreenShareUpdates();
    useMeetingTimeout();
};
