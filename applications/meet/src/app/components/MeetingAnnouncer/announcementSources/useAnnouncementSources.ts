import type { ConnectionAnnouncementState } from '../types';
import { useChatAnnouncements } from './useChatAnnouncements';
import { useConnectionAnnouncements } from './useConnectionAnnouncements';
import { useHandRaiseAnnouncements } from './useHandRaiseAnnouncements';
import { useHostMuteAnnouncements } from './useHostMuteAnnouncements';
import { useParticipantAnnouncements } from './useParticipantAnnouncements';
import { useReactionAnnouncements } from './useReactionAnnouncements';
import { useRecordingAnnouncements } from './useRecordingAnnouncements';

// Registration point: to announce a new event, add its source hook here.
export const useAnnouncementSources = (connectionState: ConnectionAnnouncementState) => {
    useParticipantAnnouncements();
    useHandRaiseAnnouncements();
    useReactionAnnouncements();
    useRecordingAnnouncements();
    useChatAnnouncements();
    useHostMuteAnnouncements();
    useConnectionAnnouncements(connectionState);
};
