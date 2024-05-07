import { store } from 'proton-pass-web/app/Store/store';

import {
    createB2BRule,
    createBlackFridayRule,
    createMonitorLearnMoreRule,
    createPendingShareAccessRule,
    createSecurityRule,
    createTrialRule,
} from '@proton/pass/lib/onboarding/rules';
import { createOnboardingService } from '@proton/pass/lib/onboarding/service';

export const onboarding = createOnboardingService({
    storage: localStorage,
    rules: [
        createPendingShareAccessRule(store),
        createTrialRule(store),
        createBlackFridayRule(store),
        createSecurityRule(store),
        createB2BRule(store),
        createMonitorLearnMoreRule(),
    ],
});
