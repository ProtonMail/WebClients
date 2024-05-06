import { c } from 'ttag';

import type { IconName } from '@proton/components/index';
import { MAX_VAULT_MEMBERS } from '@proton/pass/constants';
import { PROTON_SENTINEL_NAME } from '@proton/shared/lib/constants';

export const getMonitorUpsellFeatures = (): { icon: IconName; label: string }[] => [
    { icon: 'pass-shield-ok', label: c('Feature').t`Dark Web Monitoring` },
    { icon: 'user', label: PROTON_SENTINEL_NAME },
    { icon: 'lock', label: c('Feature').t`Integrated 2FA authenticator` },
    { icon: 'alias', label: c('Feature').t`Unlimited hide-my-email aliases` },
    { icon: 'users-plus', label: c('Feature').t`Vault sharing (up to ${MAX_VAULT_MEMBERS} people)` },
];
