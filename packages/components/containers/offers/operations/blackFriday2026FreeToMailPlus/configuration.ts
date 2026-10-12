import { CYCLE, PLANS } from '@proton/payments/core/constants';

import { BlackFriday2026Layout } from '../../components/blackFriday2026/BlackFriday2026Layout';
import type { OfferConfig } from '../../interface';
import { topButton } from '../blackFriday2026constants';
import { offers } from '../blackFriday2026offers';

const { ID, featureCode, ref, dealName, couponCode, features, title, modalImage } = offers['free-to-mail-plus'];

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
            dealName,
            couponCode,
            planIDs: {
                [PLANS.MAIL]: 1,
            },
            popular: 1,
            cycle: CYCLE.YEARLY,
            features,
        },
    ],
    topButton,
    layout: BlackFriday2026Layout,
};
