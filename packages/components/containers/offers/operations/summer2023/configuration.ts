import { FeatureCode } from '@proton/components/containers/features';
import { COUPON_CODES, CYCLE, PLANS } from '@proton/shared/lib/constants';

import { getMailDealFeatures, getUnlimitedDealFeatures } from '../../helpers/offerCopies';
import { OfferConfig } from '../../interface';
import Layout from './Layout';
import bannerImage from './upsell_anniversary.png';
import bannerImage2x from './upsell_anniversary@2x.png';

const config: OfferConfig = {
    ID: 'summer-2023',
    featureCode: FeatureCode.OfferSummer2023,
    autoPopUp: 'one-time',
    darkBackground: true,
    deals: [
        {
            ref: 'anniversary_offer-plus-12',
            planName: PLANS.MAIL,
            planIDs: {
                [PLANS.MAIL]: 1,
            },
            cycle: CYCLE.YEARLY,
            features: getMailDealFeatures,
            couponCode: COUPON_CODES.ANNIVERSARY23,
            star: '*',
        },
        {
            ref: 'anniversary_offer-plus-24',
            planName: PLANS.MAIL,
            planIDs: {
                [PLANS.MAIL]: 1,
            },
            cycle: CYCLE.TWO_YEARS,
            features: getMailDealFeatures,
            couponCode: COUPON_CODES.ANNIVERSARY23,
            star: '*',
        },
        {
            ref: 'anniversary_offer-un-12',
            planName: PLANS.BUNDLE,
            planIDs: {
                [PLANS.BUNDLE]: 1,
            },
            cycle: CYCLE.YEARLY,
            popular: 1,
            features: getUnlimitedDealFeatures,
            couponCode: COUPON_CODES.ANNIVERSARY23,
            star: '*',
        },
        {
            ref: 'anniversary_offer-un-24',
            planName: PLANS.BUNDLE,
            planIDs: {
                [PLANS.BUNDLE]: 1,
            },
            cycle: CYCLE.TWO_YEARS,
            popular: 1,
            features: getUnlimitedDealFeatures,
            couponCode: COUPON_CODES.ANNIVERSARY23,
            star: '*',
        },
    ],
    layout: Layout,
    images: {
        bannerImage,
        bannerImage2x,
    },
};

export default config;
