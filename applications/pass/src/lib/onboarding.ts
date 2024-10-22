import { store } from 'proton-pass-web/app/Store/store';

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
} from '@proton/pass/lib/onboarding/rules';
import { createOnboardingService } from '@proton/pass/lib/onboarding/service';

export const onboarding = createOnboardingService({
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
        createB2BRule(store),
        createMonitorLearnMoreRule(),
        createAliasTrashConfirmRule(),
    ],
});
