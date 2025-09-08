import { c } from 'ttag';

import { FeatureCode } from '@proton/features/interface';
import { COUPON_CODES, CYCLE, PLANS, PLAN_NAMES } from '@proton/payments';

import { BackToSchoolLayout } from '../../components/backToSchool/BackToSchoolLayout';
import { getBackToSchoolTitle } from '../../helpers/backToSchool';
import type { OfferConfig } from '../../interface';

export const backToSchoolDuo: OfferConfig = {
    ID: 'back-to-school-duo',
    title: getBackToSchoolTitle,
    featureCode: FeatureCode.OfferBackToSchoolDuo,
    canBeDisabled: true,
    deals: [
        {
            ref: 'proton_sep_25_duo_web',
            dealName: PLAN_NAMES[PLANS.DUO],
            couponCode: COUPON_CODES.SEP25BUNDLESALE,
            planIDs: {
                [PLANS.DUO]: 1,
            },
            popular: 1,
            cycle: CYCLE.YEARLY,
            features: () => [
                { name: c('q3campaign_2025: Info').t`Individual accounts for you and a partner` },
                { name: c('q3campaign_2025: Info').t`1 TB data storage` },
                { name: c('q3campaign_2025: Info').t`All premium features of Mail, Pass, Drive, VPN, and Calendar` },
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
