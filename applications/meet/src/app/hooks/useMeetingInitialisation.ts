import { useChat } from './useChat';
import { useMeetingTimeout } from './useMeetingTimeout';
import { usePaginationSizeUpdates } from './usePaginationSizeUpdates';
import { useScreenShareUpdates } from './useScreenShareUpdates';

export const useMeetingInitialisation = () => {
    useChat();
    usePaginationSizeUpdates();
    useScreenShareUpdates();
    useMeetingTimeout();
};
