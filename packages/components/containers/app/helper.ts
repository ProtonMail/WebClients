import { versionCookieAtLoad } from '../../hooks/useEarlyAccess';

/**
 * Session tracking is quite spammy. Notably it sends an event on each route change. Only enabling it on certain environments for now.
 */
export const getSessionTrackingEnabled = () => {
    return ['alpha', 'relaunch'].includes(versionCookieAtLoad as any);
};
