import { t } from 'ttag';

import { UserPassPlan } from '@proton/pass/types/api/plan';

export const tUserPassPlan = (passPlan: UserPassPlan) => {
    switch (passPlan) {
        case UserPassPlan.FREE:
            return t`Free`;
        case UserPassPlan.PLUS:
            return t`Unlimited`;
        case UserPassPlan.TRIAL:
            return t`Free Trial`;
    }
};
