import { c } from 'ttag';

import { FeatureCode } from '@proton/features/interface';
import { COUPON_CODES, CYCLE, PLANS, PLAN_NAMES } from '@proton/payments';

import { BackToSchoolLayout } from '../../components/backToSchool/BackToSchoolLayout';
import { getBackToSchoolTitle } from '../../helpers/backToSchool';
import type { OfferConfig } from '../../interface';

export const backToSchoolVPNPlusToYearly: OfferConfig = {
    ID: 'back-to-school-vpn-plus-to-yearly',
    title: getBackToSchoolTitle,
    featureCode: FeatureCode.OfferBackToSchoolVPNPlusToYearly,
    autoPopUp: 'one-time',
    canBeDisabled: true,
    deals: [
        {
            ref: 'proton_sep_25_vpn_1m_web',
            dealName: PLAN_NAMES[PLANS.VPN2024],
            couponCode: COUPON_CODES.SEP25SALE,
            planIDs: {
                [PLANS.VPN2024]: 1,
            },
            popular: 1,
            cycle: CYCLE.YEARLY,
            features: () => [
                { name: c('q3campaign_2025: Info').t`Connect 10 devices at once` },
                { name: c('q3campaign_2025: Info').t`Access 15,000+ servers in 120+ countries` },
                { name: c('q3campaign_2025: Info').t`Enjoy the fastest VPN speeds` },
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
