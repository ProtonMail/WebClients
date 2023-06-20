import { FeatureCode } from '@proton/components/containers/features';
import { COUPON_CODES, CYCLE, PLANS } from '@proton/shared/lib/constants';

import { getMailDealFeatures, getUnlimitedDealFeatures } from '../../helpers/offerCopies';
import { OfferConfig } from '../../interface';
import Layout from './Layout';
import bannerImage from './upsell_mail-plus-free-trial.png';
import bannerImage2x from './upsell_mail-plus-free-trial@2x.png';

const config: OfferConfig = {
    ID: 'summer-2023',
    featureCode: FeatureCode.OfferSummer2023,
    autoPopUp: 'one-time',
    canBeDisabled: true,
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
        },
        {
            ref: 'anniversary_offer-un-12',
            planName: PLANS.BUNDLE,
            planIDs: {
                [PLANS.BUNDLE]: 1,
            },
            cycle: CYCLE.YEARLY,
            popular: true,
            features: getUnlimitedDealFeatures,
            couponCode: COUPON_CODES.ANNIVERSARY23,
        },
        {
            ref: 'anniversary_offer-un-24',
            planName: PLANS.BUNDLE,
            planIDs: {
                [PLANS.BUNDLE]: 1,
            },
            cycle: CYCLE.TWO_YEARS,
            popular: true,
            features: getUnlimitedDealFeatures,
            couponCode: COUPON_CODES.ANNIVERSARY23,
        },
    ],
    layout: Layout,
    images: {
        bannerImage,
        bannerImage2x,
    },
};

export default config;
