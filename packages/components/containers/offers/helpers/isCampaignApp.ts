import { getAppFromPathnameSafe } from '@proton/shared/lib/apps/slugHelper';
import type { APP_NAMES } from '@proton/shared/lib/constants';
import { APPS } from '@proton/shared/lib/constants';
import type { ProtonConfig } from '@proton/shared/lib/interfaces';

/**
 * The Q3 campaign runs in Mail, Calendar and Drive, plus the matching product dashboards in the
 * account app. Every offer shares this scope, so the check lives here rather than being repeated
 * per operation.
 *
 * Note this is a union, not a per-product gate: the audiences are defined by plan, not by app, so a
 * Drive Plus user reading their mail is eligible. Which app they were in is recorded in the tracking
 * ref instead. Other apps that render the upsell (Docs, VPN settings) are deliberately excluded, as
 * is the account app with no product in the path.
 */
const CAMPAIGN_APPS = new Set<APP_NAMES>([APPS.PROTONMAIL, APPS.PROTONCALENDAR, APPS.PROTONDRIVE]);

export const isCampaignApp = (protonConfig: ProtonConfig, pathname: string): boolean => {
    const { APP_NAME } = protonConfig;

    if (APP_NAME === APPS.PROTONACCOUNT) {
        const parentApp = getAppFromPathnameSafe(pathname);

        return !!parentApp && CAMPAIGN_APPS.has(parentApp);
    }

    return CAMPAIGN_APPS.has(APP_NAME);
};
