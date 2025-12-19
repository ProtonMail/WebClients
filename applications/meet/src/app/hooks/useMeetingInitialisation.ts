import { useChat } from './useChat';
import { usePaginationSizeUpdates } from './usePaginationSizeUpdates';
import { useScreenShareUpdates } from './useScreenShareUpdates';

export const useMeetingInitialisation = () => {
    useChat();
    usePaginationSizeUpdates();
    useScreenShareUpdates();
};
