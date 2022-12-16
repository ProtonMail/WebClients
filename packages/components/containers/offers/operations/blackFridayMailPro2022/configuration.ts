import { FeatureCode } from '@proton/components/containers/features';
import { COUPON_CODES, CYCLE, PLANS } from '@proton/shared/lib/constants';

import { getVisionaryFeatures } from '../../helpers/offerCopies';
import { OfferConfig } from '../../interface';
import Layout from './Layout';
import sideImage from './bf-mail-40-halfpage.jpg';
import sideImage2x from './bf-mail-40-halfpage@2x.jpg';

const config: OfferConfig = {
    ID: 'black-friday-mail-pro-2022',
    autoPopUp: 'one-time',
    featureCode: FeatureCode.OfferBlackFridayMailPro2022,
    images: {
        sideImage,
        sideImage2x,
    },
    deals: [
        {
            ref: 'bf_22_mail_unlimited-modal-v2',
            planName: PLANS.NEW_VISIONARY,
            planIDs: {
                [PLANS.NEW_VISIONARY]: 1,
            },
            cycle: CYCLE.TWO_YEARS,
            couponCode: COUPON_CODES.MAIL_BLACK_FRIDAY_2022,
            features: getVisionaryFeatures,
            star: '1',
            popular: true,
        },
    ],
    layout: Layout,
};

export default config;
