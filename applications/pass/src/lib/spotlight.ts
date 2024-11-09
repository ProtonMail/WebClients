import { store } from 'proton-pass-web/app/Store/store';
import { SPOTLIGHT_STORAGE_KEY, getSpotlightStorageKey } from 'proton-pass-web/lib/storage';

import { authStore } from '@proton/pass/lib/auth/store';
import {
    createAliasSyncEnableRule,
    createB2BRule,
    createBlackFriday2024Rule,
    createMonitorLearnMoreRule,
    createPendingShareAccessRule,
    createSecurityRule,
    createTrialRule,
    createUserRenewalRule,
    createWelcomeRule,
} from '@proton/pass/lib/spotlight/rules';
import type { SpotlightProxy } from '@proton/pass/lib/spotlight/service';
import { createSpotlightService } from '@proton/pass/lib/spotlight/service';
import { prop } from '@proton/pass/utils/fp/lens';
import { pipe } from '@proton/pass/utils/fp/pipe';
import { logger } from '@proton/pass/utils/logger';

export const migrate = (activeStorageKey: string) => {
    if (activeStorageKey !== SPOTLIGHT_STORAGE_KEY) {
        const legacy = localStorage.getItem(SPOTLIGHT_STORAGE_KEY);
        const active = localStorage.getItem(activeStorageKey);

        if (legacy) {
            logger.info(`[Onboarding] Migrated spotlight data to "${activeStorageKey}"`);
            localStorage.removeItem(SPOTLIGHT_STORAGE_KEY);
            if (!active) localStorage.setItem(activeStorageKey, legacy);
        }
    }
};

export const spotlight = createSpotlightService({
    getStorageKey: () => getSpotlightStorageKey(authStore.getLocalID()),
    migrate,
    storage: localStorage,
    rules: [
        /* The order below defines the priority for spotlight display (first rule with `when` returning `true`).
         * Rules displayed as spotlight should be defined above the "invisible" rules
         * otherwise they may never be displayed, as an "invisible" rule may return `true` first */
        createPendingShareAccessRule(store),
        createTrialRule(store),
        createBlackFriday2024Rule(store),
        createSecurityRule(store),
        createAliasSyncEnableRule(store),
        createUserRenewalRule(store),

        /* "Invisible" rules not displayed as spotlight should be defined at the bottom */
        createWelcomeRule(),
        createB2BRule(store),
        createMonitorLearnMoreRule(),
    ],
});

export const spotlightProxy: SpotlightProxy = {
    check: pipe(spotlight.checkMessage, prop('enabled')),
    acknowledge: spotlight.acknowledge,
};
