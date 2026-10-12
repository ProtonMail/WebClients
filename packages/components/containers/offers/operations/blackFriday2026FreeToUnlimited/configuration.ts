import { CYCLE, PLANS } from '@proton/payments/core/constants';

import { BlackFriday2026Layout } from '../../components/blackFriday2026/BlackFriday2026Layout';
import type { OfferConfig } from '../../interface';
import { topButton } from '../blackFriday2026constants';
import { offers } from '../blackFriday2026offers';

const { ID, featureCode, ref, getRef, dealName, couponCode, features, title, modalImage } = offers['free-to-unlimited'];

export const configuration: OfferConfig = {
    ID,
    title,
    images: { modalImage },
    featureCode,
    autoPopUp: 'one-time',
    canBeDisabled: true,
    deals: [
        {
            ref,
            getRef,
            dealName,
            couponCode,
            planIDs: {
                [PLANS.BUNDLE]: 1,
            },
            popular: 1,
            cycle: CYCLE.YEARLY,
            features,
        },
    ],
    topButton,
    layout: BlackFriday2026Layout,
};
