import { useEntitlementChecksForOrgAndUser } from '@proton/account/entitlementCatalog/hooks';
import { useUser } from '@proton/account/user/hooks';
import { tracker } from '@proton/telemetry-tracker/tracker';

import { getBYOEMobileAudience, getDaysSinceAccountCreation } from './dimensions';
import type { BYOEMobileConnectErrorType } from './events';
import {
    byoeMobileConnectFailed,
    byoeMobileConnectStarted,
    byoeMobileConnectSucceeded,
    byoeMobileSettingsListOnlyShown,
    byoeMobileSettingsView,
} from './events';

// The page runs in a webview inside the natives application. Users could close the page or leave very quickly.
// We want ot send events right away to avoid losing them.
const SEND_NOW = { delay: false, flushImmediately: true } as const;

export const useBYOEMobileTelemetry = () => {
    const [user, loadingUser] = useUser();
    const [entitlements, loadingEntitlements] = useEntitlementChecksForOrgAndUser();

    const isLoading = loadingUser || loadingEntitlements;

    const getBaseDimensions = () => {
        const audience = getBYOEMobileAudience(user, entitlements.isB2B);
        return audience ? { audience, daysSinceAccountCreation: getDaysSinceAccountCreation(user) } : undefined;
    };

    return {
        isLoading,
        trackSettingsView: () => {
            const base = getBaseDimensions();
            if (base) {
                tracker.emit(byoeMobileSettingsView, { dimensions: base }, SEND_NOW);
            }
        },
        trackSettingsListOnlyShown: () => {
            const base = getBaseDimensions();
            if (base) {
                tracker.emit(byoeMobileSettingsListOnlyShown, { dimensions: base }, SEND_NOW);
            }
        },
        trackConnectStarted: (importEmails: boolean) => {
            const base = getBaseDimensions();
            if (base) {
                tracker.emit(
                    byoeMobileConnectStarted,
                    { dimensions: { ...base, importMode: importEmails ? 'enabled' : 'disabled' } },
                    SEND_NOW
                );
            }
        },
        trackConnectFailed: (errorType: BYOEMobileConnectErrorType) => {
            const base = getBaseDimensions();
            if (base) {
                tracker.emit(byoeMobileConnectFailed, { dimensions: { ...base, errorType } }, SEND_NOW);
            }
        },
        trackConnectSucceeded: () => {
            const base = getBaseDimensions();
            if (base) {
                tracker.emit(byoeMobileConnectSucceeded, { dimensions: base }, SEND_NOW);
            }
        },
    };
};
