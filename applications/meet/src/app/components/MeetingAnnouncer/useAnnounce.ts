import { useContext } from 'react';

import { MeetingAnnouncerContext } from './MeetingAnnouncerContext';
import type { AnnounceFn } from './types';

const noop: AnnounceFn = () => {};

/**
 * Returns a no-op when rendered without a provider (e.g. when the accessibility-announcements
 * flag is disabled, or for components mounted outside the MeetingAnnouncer subtree).
 */
export const useAnnounce = (): AnnounceFn => {
    const context = useContext(MeetingAnnouncerContext);
    return context?.announce ?? noop;
};

const noopSetSuspend = (_suspend: boolean) => {};

/**
 * Setter to suspend/resume non-critical announcements from a descendant of the provider.
 * Returns a no-op when rendered without a provider (e.g. accessibility flag disabled).
 */
export const useSetSuspendNonCritical = () => {
    const context = useContext(MeetingAnnouncerContext);
    return context?.setSuspendNonCritical ?? noopSetSuspend;
};
