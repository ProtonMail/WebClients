import { useChat } from './useChat';
import { useE2EE } from './useE2EE';
import { useLocalParticipantQualityControl } from './useLocalParticipantQualityControl';
import { usePaginationSizeUpdates } from './usePaginationSizeUpdates';
import { useParticipantNameMapUpdate } from './useParticipantNameMapUpdate';
import { useParticipantVideoControls } from './useParticipantVideoControls';
import { useScreenShareUpdates } from './useScreenShareUpdates';

export const useMeetingInitialisation = () => {
    useE2EE();
    useParticipantVideoControls();
    useChat();
    usePaginationSizeUpdates();
    useScreenShareUpdates();
    useLocalParticipantQualityControl();
    useParticipantNameMapUpdate();
};
