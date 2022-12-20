import { FeatureCode } from '@proton/components/containers/features';
import LifetimeDeal from '@proton/components/containers/offers/operations/blackFridayVPN3Deal2022/lifetimeDeal';
import { COUPON_CODES, CYCLE, PLANS } from '@proton/shared/lib/constants';

import { getUnlimitedVPNFeatures, getVPNPlusFeatures } from '../../helpers/offerCopies';
import { OfferConfig } from '../../interface';
import Layout from './Layout';
import sideImage from './bf-vpn-40-halfpage.jpg';
import sideImage2x from './bf-vpn-40-halfpage@2x.jpg';

const config: OfferConfig = {
    ID: 'black-friday-vpn-2-deal-2022',
    autoPopUp: 'each-time',
    featureCode: FeatureCode.OfferBlackFridayVPN2Deal2022,
    images: {
        sideImage,
        sideImage2x,
    },
    deals: [
        {
            ref: 'bf_22_vpn_plus-1y-modal-v30',
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
            ref: 'bf_22_vpn_plus-1y-modal-u24',
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
