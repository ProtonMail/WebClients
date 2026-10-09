import { getAppFromPathnameSafe } from '@proton/shared/lib/apps/slugHelper';
import type { APP_NAMES } from '@proton/shared/lib/constants';
import { APPS } from '@proton/shared/lib/constants';
import type { ProtonConfig } from '@proton/shared/lib/interfaces';

/**
 * The BF 2026 campaign runs in Mail, Calendar and Drive, plus the matching product dashboards in the
 * account app. Every offer shares this scope, so the check lives here rather than being repeated
 * per operation.
 *
 * `isCampaignApp` is a union, not a per-product gate: offers whose audience is defined by plan alone
 * show in any campaign app, and record which one in the tracking ref. Offers whose deal depends on the
 * product the user is in use `getCampaignScope` instead. Other apps that render the upsell (Docs, VPN
 * settings) are deliberately excluded, as is the account app with no product in the path.
 *
 * Pass is an entry point into the account app only: a user arriving at /pass/dashboard is in the
 * campaign, but the Pass app itself never shows it.
 */
export type CampaignScope = 'inbox' | 'drive' | 'pass';

const APP_SCOPES: Partial<Record<APP_NAMES, CampaignScope>> = {
    [APPS.PROTONMAIL]: 'inbox',
    [APPS.PROTONCALENDAR]: 'inbox',
    [APPS.PROTONDRIVE]: 'drive',
};

const ACCOUNT_ENTRY_SCOPES: Partial<Record<APP_NAMES, CampaignScope>> = {
    ...APP_SCOPES,
    [APPS.PROTONPASS]: 'pass',
};

export const getCampaignScope = (protonConfig: ProtonConfig, pathname: string): CampaignScope | undefined => {
    const { APP_NAME } = protonConfig;

    if (APP_NAME === APPS.PROTONACCOUNT) {
        const parentApp = getAppFromPathnameSafe(pathname);

        return parentApp ? ACCOUNT_ENTRY_SCOPES[parentApp] : undefined;
    }

    return APP_SCOPES[APP_NAME];
};

export const isCampaignApp = (protonConfig: ProtonConfig, pathname: string): boolean => {
    return getCampaignScope(protonConfig, pathname) !== undefined;
};
