import { c } from 'ttag';

import { FeatureCode } from '@proton/features/interface';
import { COUPON_CODES, CYCLE, PLANS, PLAN_NAMES } from '@proton/payments';

import { BackToSchoolLayout } from '../../components/backToSchool/BackToSchoolLayout';
import { getBackToSchoolTitle } from '../../helpers/backToSchool';
import type { OfferConfig } from '../../interface';

export const backToSchoolBundle: OfferConfig = {
    ID: 'back-to-school-bundle',
    title: getBackToSchoolTitle,
    featureCode: FeatureCode.OfferBackToSchoolBundle,
    canBeDisabled: true,
    deals: [
        {
            ref: 'proton_sep_25_bundle_web',
            dealName: PLAN_NAMES[PLANS.BUNDLE],
            couponCode: COUPON_CODES.SEP25BUNDLESALE,
            planIDs: {
                [PLANS.BUNDLE]: 1,
            },
            popular: 1,
            cycle: CYCLE.YEARLY,
            features: () => [
                { name: c('q3campaign_2025: Info').t`All premium features of Mail, Pass, Drive, VPN, and Calendar` },
                { name: c('q3campaign_2025: Info').t`500 GB storage` },
                { name: c('q3campaign_2025: Info').t`Stronger protection against cyber threats` },
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
