import { useContext } from 'react';

import { LiveAnnouncerContext } from './LiveAnnouncerProvider';
import type { AnnounceFn } from './types';

const noop: AnnounceFn = () => {};

/**
 * Returns a no-op when rendered without a provider (e.g. when the app has announcements
 * turned off, or for components mounted outside the LiveAnnouncerProvider subtree).
 */
export const useAnnounce = (): AnnounceFn => {
    const context = useContext(LiveAnnouncerContext);
    return context?.announce ?? noop;
};

const noopSetSuspend = (_suspend: boolean) => {};

/**
 * Setter to suspend/resume non-critical announcements from a descendant of the provider.
 * Returns a no-op when rendered without a provider.
 */
export const useSetSuspendNonCritical = () => {
    const context = useContext(LiveAnnouncerContext);
    return context?.setSuspendNonCritical ?? noopSetSuspend;
};
