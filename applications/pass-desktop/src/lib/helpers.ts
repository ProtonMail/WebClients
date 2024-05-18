import { type PassConfig } from '@proton/pass/hooks/usePassConfig';
import { APPS } from '@proton/shared/lib/constants';
import { getAppUrlFromApiUrl } from '@proton/shared/lib/helpers/url';

/* Keep localhost in dev mode, use a valid Sentry host in prod.
 * Overrides default sentry host which doesn't support file:// URLs */
export const getSentryHost = ({ API_URL }: PassConfig): string => {
    if (window.location.host.startsWith('localhost')) return window.location.host;
    return getAppUrlFromApiUrl(API_URL, APPS.PROTONPASS).host;
};
