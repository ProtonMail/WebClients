import { useChat } from './useChat';
import { useDynamicDeviceHandling } from './useDynamicDeviceHandling';
import { useE2EE } from './useE2EE';
import { useLocalParticipantQualityControl } from './useLocalParticipantQualityControl';
import { useMediaDeviceSetup } from './useMediaDeviceSetup';
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
    useMediaDeviceSetup();
    useParticipantNameMapUpdate();
    useDynamicDeviceHandling();
};
