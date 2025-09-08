import { c } from 'ttag';

import { FeatureCode } from '@proton/features/interface';
import { COUPON_CODES, CYCLE, PLANS, PLAN_NAMES } from '@proton/payments';

import { BackToSchoolLayout } from '../../components/backToSchool/BackToSchoolLayout';
import { getBackToSchoolTitle } from '../../helpers/backToSchool';
import type { OfferConfig } from '../../interface';

export const backToSchoolMailPlusToYearly: OfferConfig = {
    ID: 'back-to-school-mail-plus-to-yearly',
    title: getBackToSchoolTitle,
    featureCode: FeatureCode.OfferBackToSchoolMailPlusToYearly,
    canBeDisabled: true,
    deals: [
        {
            ref: 'proton_sep_25_mail_1m_web',
            dealName: PLAN_NAMES[PLANS.MAIL],
            couponCode: COUPON_CODES.SEP25SALE,
            planIDs: {
                [PLANS.MAIL]: 1,
            },
            popular: 1,
            cycle: CYCLE.YEARLY,
            features: () => [
                { name: c('q3campaign_2025: Info').t`15 GB storage` },
                { name: c('q3campaign_2025: Info').t`Unlimited folders, labels, and filters` },
                { name: c('q3campaign_2025: Info').t`Use your own email domain` },
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
