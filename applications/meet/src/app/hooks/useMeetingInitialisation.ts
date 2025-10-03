import { useChat } from './useChat';
import { usePaginationSizeUpdates } from './usePaginationSizeUpdates';
import { useParticipantAudioControls } from './useParticipantAudioControls';
import { useParticipantNameMapUpdate } from './useParticipantNameMapUpdate';
import { useParticipantVideoControls } from './useParticipantVideoControls';
import { useScreenShareUpdates } from './useScreenShareUpdates';

export const useMeetingInitialisation = () => {
    useParticipantVideoControls();
    useParticipantAudioControls();
    useChat();
    usePaginationSizeUpdates();
    useScreenShareUpdates();
    useParticipantNameMapUpdate();
};
