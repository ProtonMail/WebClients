import { c } from 'ttag';

import { FeatureCode } from '@proton/components/containers/features';
import { COUPON_CODES, CYCLE, PLANS } from '@proton/shared/lib/constants';

import { getUnlimitedVPNFeatures } from '../../helpers/offerCopies';
import { OfferConfig } from '../../interface';
import Layout from './Layout';
import sideImage from './bf-vpn-50-halfpage.jpg';
import sideImage2x from './bf-vpn-50-halfpage@2x.jpg';

const config: OfferConfig = {
    ID: 'black-friday-vpn-1-deal-2022',
    autoPopUp: 'each-time',
    featureCode: FeatureCode.OfferBlackFridayVPN1Deal2022,
    images: {
        sideImage,
        sideImage2x,
    },
    deals: [
        {
            ref: 'bf_22_vpn_plus-2y-modal-u24',
            planName: PLANS.BUNDLE,
            planIDs: {
                [PLANS.BUNDLE]: 1,
            },
            cycle: CYCLE.TWO_YEARS,
            star: '1',
            couponCode: COUPON_CODES.MAIL_BLACK_FRIDAY_2022,
            features: getUnlimitedVPNFeatures,
            popular: true,
            header: () => c('specialoffer: Label').t`Limited time only`,
        },
    ],
    layout: Layout,
};

export default config;
