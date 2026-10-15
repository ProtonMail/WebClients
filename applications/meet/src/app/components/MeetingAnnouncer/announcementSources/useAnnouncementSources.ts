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

interface AnnouncementSourcesOptions {
    connectionState: ConnectionAnnouncementState;
}

// Registration point: to announce a new event, add its source hook here.
export const useAnnouncementSources = ({ connectionState }: AnnouncementSourcesOptions) => {
    useParticipantAnnouncements();
    useHandRaiseAnnouncements();
    useReactionAnnouncements();
    useRecordingAnnouncements();
    useChatAnnouncements();
    useHostMuteAnnouncements();
    useConnectionAnnouncements(connectionState);
    useScreenShareAnnouncements();
    useMeetingTimeoutAnnouncements();
    useBackgroundEffectAnnouncements();
};
