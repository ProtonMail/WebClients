import { CYCLE, PLANS } from '@proton/payments';

import { SpringSale2026Layout } from '../../components/springSale2026/SpringSale2026Layout';
import type { OfferConfig } from '../../interface';
import { getModalTitle, topButton } from '../springSale2026constants';
import { offers } from '../springSale2026offers';

const OFFER_NAME = 'pass-plus-retention';

const { ID, featureCode, ref, dealName, couponCode, features } = offers[OFFER_NAME];

export const configuration: OfferConfig = {
    ID,
    title: getModalTitle,
    featureCode,
    autoPopUp: 'one-time',
    canBeDisabled: true,
    deals: [
        {
            ref,
            dealName,
            couponCode,
            planIDs: {
                [PLANS.PASS]: 1,
            },
            popular: 1,
            cycle: CYCLE.YEARLY,
            features,
        },
    ],
    topButton,
    layout: SpringSale2026Layout,
};
