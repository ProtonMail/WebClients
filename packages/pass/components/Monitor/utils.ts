import { c } from 'ttag';

import { IcAlias } from '@proton/icons/icons/IcAlias';
import { IcCheckmark } from '@proton/icons/icons/IcCheckmark';
import { IcLock } from '@proton/icons/icons/IcLock';
import { IcPassShieldOk } from '@proton/icons/icons/IcPassShieldOk';
import { IcUser } from '@proton/icons/icons/IcUser';
import { IcUsersPlus } from '@proton/icons/icons/IcUsersPlus';
import { DARK_WEB_MONITORING_NAME, PROTON_SENTINEL_NAME } from '@proton/shared/lib/constants';

import { MAX_VAULT_MEMBERS } from '../../constants';
import type { PlanFeaturesType } from '../Upsell/types';

export const getPlanFeatures = (): PlanFeaturesType => ({
    individuals: [
        { icon: IcPassShieldOk, label: DARK_WEB_MONITORING_NAME },
        { icon: IcUser, label: PROTON_SENTINEL_NAME },
        { icon: IcLock, label: c('Feature').t`Integrated 2FA authenticator` },
        { icon: IcAlias, label: c('Feature').t`Unlimited hide-my-email aliases` },
        { icon: IcUsersPlus, label: c('Feature').t`Vault sharing (up to ${MAX_VAULT_MEMBERS} people)` },
    ],
    business: [
        { icon: IcUser, label: PROTON_SENTINEL_NAME },
        { icon: IcLock, label: c('new_plans: feature').t`Require 2FA for organization` },
        { icon: IcCheckmark, label: c('new_plans: feature').t`SSO integration` },
    ],
});
