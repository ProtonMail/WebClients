import { c } from 'ttag';

import { FeatureCode } from '@proton/features';
import { COUPON_CODES, CYCLE, PLANS, PLAN_NAMES } from '@proton/shared/lib/constants';

import { getMailPlus2024InboxFeatures } from '../../helpers/offerCopies';
import type { OfferConfig } from '../../interface';
import Layout from './Layout';
import sideImage from './mail-trial-400x1200.jpg';
import sideImage2x from './mail-trial-800x2400.jpg';
import { getCTAContent } from './text';

const config = {
    ID: 'mail-trial-2024',
    featureCode: FeatureCode.OfferMailTrial2024,
    autoPopUp: 'one-time',
    deals: [
        {
            // eslint-disable-next-line custom-rules/deprecate-spacing-utility-classes
            ref: 'try_24_mail_free-modal-m1',
            dealName: PLAN_NAMES[PLANS.MAIL],
            planIDs: {
                [PLANS.MAIL]: 1,
            },
            cycle: CYCLE.MONTHLY,
            couponCode: COUPON_CODES.TRYMAILPLUS2024,
            features: getMailPlus2024InboxFeatures,
            getCTAContent,
            popular: 1, // to get solid CTA
            dealSuffixPrice: () => c('mailtrial2024: Info').t`for the first month`,
            suffixOnNewLine: true,
        },
    ],
    layout: Layout,
    hideDealTitle: true,
    hideDealPriceInfos: true,
    hideDiscountBubble: true,
    topButton: {
        gradient: false,
        iconGradient: false,
        getCTAContent: () => c('mailtrial2024: Action').t`Special Offer`,
    },
    images: {
        sideImage,
        sideImage2x,
    },
} satisfies OfferConfig;

export default config;
