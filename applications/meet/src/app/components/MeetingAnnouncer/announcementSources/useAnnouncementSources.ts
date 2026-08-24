import type { ConnectionAnnouncementState } from '../types';
import { useBackgroundEffectAnnouncements } from './useBackgroundEffectAnnouncements';
import { useChatAnnouncements } from './useChatAnnouncements';
import { useConnectionAnnouncements } from './useConnectionAnnouncements';
import { useHandRaiseAnnouncements } from './useHandRaiseAnnouncements';
import { useHostMuteAnnouncements } from './useHostMuteAnnouncements';
import { useMeetingTimeoutAnnouncements } from './useMeetingTimeoutAnnouncements';
import { useParticipantAnnouncements } from './useParticipantAnnouncements';
import { useReactionAnnouncements } from './useReactionAnnouncements';
import { useRecordingAnnouncements } from './useRecordingAnnouncements';
import { useScreenShareAnnouncements } from './useScreenShareAnnouncements';
import { useTurnRelayAnnouncements } from './useTurnRelayAnnouncements';

interface AnnouncementSourcesOptions {
    connectionState: ConnectionAnnouncementState;
    isUsingTurnRelay: boolean;
}

// Registration point: to announce a new event, add its source hook here.
export const useAnnouncementSources = ({ connectionState, isUsingTurnRelay }: AnnouncementSourcesOptions) => {
    useParticipantAnnouncements();
    useHandRaiseAnnouncements();
    useReactionAnnouncements();
    useRecordingAnnouncements();
    useChatAnnouncements();
    useHostMuteAnnouncements();
    useConnectionAnnouncements(connectionState);
    useScreenShareAnnouncements();
    useMeetingTimeoutAnnouncements();
    useTurnRelayAnnouncements(isUsingTurnRelay);
    useBackgroundEffectAnnouncements();
};
