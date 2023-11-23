import {
    createBlackFridayRule,
    createPendingShareAccessRule,
    createSecurityRule,
    createTrialRule,
} from '@proton/pass/lib/onboarding/rules';
import { createOnboardingService } from '@proton/pass/lib/onboarding/service';

import { store } from '../app/Store/store';

export const onboarding = createOnboardingService({
    storage: localStorage,
    rules: [
        createPendingShareAccessRule(store),
        createBlackFridayRule(store),
        createTrialRule(store),
        createSecurityRule(store),
    ],
});
