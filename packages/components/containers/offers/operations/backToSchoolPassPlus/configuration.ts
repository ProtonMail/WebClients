import { c } from 'ttag';

import { FeatureCode } from '@proton/features/interface';
import { COUPON_CODES, CYCLE, PLANS, PLAN_NAMES } from '@proton/payments';
import { DARK_WEB_MONITORING_NAME } from '@proton/shared/lib/constants';

import { BackToSchoolLayout } from '../../components/backToSchool/BackToSchoolLayout';
import { getBackToSchoolTitle } from '../../helpers/backToSchool';
import type { OfferConfig } from '../../interface';

export const backToSchoolPassPlus: OfferConfig = {
    ID: 'back-to-school-pass-plus',
    title: getBackToSchoolTitle,
    featureCode: FeatureCode.OfferBackToSchoolPassPlus,
    autoPopUp: 'one-time',
    canBeDisabled: true,
    deals: [
        {
            ref: 'proton_sep_25_pass_web',
            dealName: PLAN_NAMES[PLANS.PASS],
            couponCode: COUPON_CODES.SEP25SALE,
            planIDs: {
                [PLANS.PASS]: 1,
            },
            popular: 1,
            cycle: CYCLE.YEARLY,
            features: () => [
                { name: c('q3campaign_2025: Info').t`Unlimited hide-my-email aliases` },
                { name: c('q3campaign_2025: Info').t`Built-in 2FA authenticator` },
                { name: DARK_WEB_MONITORING_NAME },
                { name: c('q3campaign_2025: Info').t`Secure link, vault & item sharing` },
            ],
        },
    ],
    topButton: {
        // TODO: appearance, variant
        shape: 'outline',
        getCTAContent: () => {
            // translator: button in the top right corner of the app (outside the modal)
            return c('q3campaign_2025: Action').t`END-OF-SUMMER SALE`;
        },
        icon: 'gift',
        iconSize: 4,
        gradient: false,
        variant: '',
    },
    layout: BackToSchoolLayout,
};
