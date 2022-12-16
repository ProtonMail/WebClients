import { c } from 'ttag';

import { FeatureCode } from '@proton/components/containers/features';
import { COUPON_CODES, CYCLE, PLANS } from '@proton/shared/lib/constants';

import { getUnlimitedDealFeatures } from '../../helpers/offerCopies';
import { OfferConfig } from '../../interface';
import Layout from './Layout';
import sideImage from './bf-mail-40-halfpage.jpg';
import sideImage2x from './bf-mail-40-halfpage@2x.jpg';

const config: OfferConfig = {
    ID: 'black-friday-mail-2022',
    autoPopUp: 'one-time',
    featureCode: FeatureCode.OfferBlackFridayMail2022,
    images: {
        sideImage,
        sideImage2x,
    },
    deals: [
        {
            ref: 'bf_22_mail_plus-modal-u2',
            planName: PLANS.BUNDLE,
            planIDs: {
                [PLANS.BUNDLE]: 1,
            },
            cycle: CYCLE.TWO_YEARS,
            couponCode: COUPON_CODES.MAIL_BLACK_FRIDAY_2022,
            features: getUnlimitedDealFeatures,
            star: '1',
            popular: true,
            header: () => c('specialoffer: Label').t`Offer ends soon`,
        },
    ],
    layout: Layout,
};

export default config;
