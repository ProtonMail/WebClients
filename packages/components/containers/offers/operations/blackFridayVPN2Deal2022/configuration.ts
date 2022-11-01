import { FeatureCode } from '@proton/components/containers/features';
import LifetimeDeal from '@proton/components/containers/offers/operations/blackFridayVPN3Deal2022/lifetimeDeal';
import { COUPON_CODES, CYCLE, PLANS } from '@proton/shared/lib/constants';

import { getUnlimitedVPNFeatures, getVPNPlusFeatures } from '../../helpers/offerCopies';
import { OfferConfig } from '../../interface';
import Layout from './Layout';

const config: OfferConfig = {
    ID: 'black-friday-vpn-2-deal-2022',
    autoPopUp: 'each-time',
    featureCode: FeatureCode.OfferBlackFridayVPN2Deal2022,
    deals: [
        {
            ref: 'bf_22_vpn_offers-modal-vpn30',
            planName: PLANS.VPN,
            planIDs: {
                [PLANS.VPN]: 1,
            },
            cycle: CYCLE.THIRTY,
            couponCode: COUPON_CODES.VPN_BLACK_FRIDAY_2022,
            features: getVPNPlusFeatures,
            popular: true,
            header: LifetimeDeal,
        },
        {
            ref: 'bf_22_vpn_offers-modal-b2',
            planName: PLANS.BUNDLE,
            planIDs: {
                [PLANS.BUNDLE]: 1,
            },
            star: '1',
            cycle: CYCLE.TWO_YEARS,
            couponCode: COUPON_CODES.MAIL_BLACK_FRIDAY_2022,
            features: getUnlimitedVPNFeatures,
        },
    ],
    layout: Layout,
};

export default config;
