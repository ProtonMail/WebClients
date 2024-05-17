import { c } from 'ttag';

import type { PlanFeaturesType } from '@proton/pass/components/Upsell/types';
import { MAX_VAULT_MEMBERS } from '@proton/pass/constants';
import { PROTON_SENTINEL_NAME } from '@proton/shared/lib/constants';

export const getPlanFeatures = (): PlanFeaturesType => ({
    individuals: [
        { icon: 'pass-shield-ok', label: c('Feature').t`Dark Web Monitoring` },
        { icon: 'user', label: PROTON_SENTINEL_NAME },
        { icon: 'lock', label: c('Feature').t`Integrated 2FA authenticator` },
        { icon: 'alias', label: c('Feature').t`Unlimited hide-my-email aliases` },
        { icon: 'users-plus', label: c('Feature').t`Vault sharing (up to ${MAX_VAULT_MEMBERS} people)` },
    ],
    business: [
        { icon: 'user', label: PROTON_SENTINEL_NAME },
        { icon: 'lock', label: c('new_plans: feature').t`Require 2FA for organization` },
        { icon: 'checkmark', label: c('new_plans: feature').t`SSO integration (coming soon)` },
    ],
});
