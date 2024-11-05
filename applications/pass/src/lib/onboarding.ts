import { store } from 'proton-pass-web/app/Store/store';
import { ONBOARDING_STORAGE_KEY, getOnboardingStorageKey } from 'proton-pass-web/lib/storage';

import { authStore } from '@proton/pass/lib/auth/store';
import {
    createAliasSyncEnableRule,
    createAliasTrashConfirmRule,
    createB2BRule,
    createBlackFriday2024Rule,
    createFamilyPlanPromo2024Rule,
    createMonitorLearnMoreRule,
    createPendingShareAccessRule,
    createSecurityRule,
    createTrialRule,
    createWelcomeRule,
} from '@proton/pass/lib/onboarding/rules';
import { createOnboardingService } from '@proton/pass/lib/onboarding/service';
import { logger } from '@proton/pass/utils/logger';

export const migrate = (activeStorageKey: string) => {
    if (activeStorageKey !== ONBOARDING_STORAGE_KEY) {
        const legacy = localStorage.getItem(ONBOARDING_STORAGE_KEY);
        const active = localStorage.getItem(activeStorageKey);

        if (legacy) {
            logger.info(`[Onboarding] Migrated onboarding data to "${activeStorageKey}"`);
            localStorage.removeItem(ONBOARDING_STORAGE_KEY);
            if (!active) localStorage.setItem(activeStorageKey, legacy);
        }
    }
};

export const onboarding = createOnboardingService({
    getStorageKey: () => getOnboardingStorageKey(authStore.getLocalID()),
    migrate,
    storage: localStorage,
    rules: [
        /* The order below defines the priority for spotlight display (first rule with `when` returning `true`).
         * Rules displayed as spotlight should be defined above the "invisible" rules
         * otherwise they may never be displayed, as an "invisible" rule may return `true` first */
        createPendingShareAccessRule(store),
        createTrialRule(store),
        createBlackFriday2024Rule(store),
        createFamilyPlanPromo2024Rule(store),
        createSecurityRule(store),
        createAliasSyncEnableRule(store),

        /* "Invisible" rules not displayed as spotlight should be defined at the bottom */
        createWelcomeRule(),
        createB2BRule(store),
        createMonitorLearnMoreRule(),
        createAliasTrashConfirmRule(),
    ],
});
