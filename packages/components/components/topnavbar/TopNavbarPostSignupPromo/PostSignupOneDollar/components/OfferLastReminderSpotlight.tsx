import { type ReactNode } from 'react';

import { c } from 'ttag';

import { PLANS, PLAN_NAMES } from '@proton/payments';

import type { SUPPORTED_PRODUCTS } from '../interface';

interface Props {
    product: SUPPORTED_PRODUCTS;
    imgSrc: string;
    pricingTitle: ReactNode;
}

export const OfferLastReminderSpotlight = ({ pricingTitle, imgSrc, product }: Props) => {
    const plan = PLAN_NAMES[product === 'mail' ? PLANS.MAIL : PLANS.DRIVE];
    const description = c('Offer').t`Last chance to get 80% off your first month of ${plan}.`;

    return (
        <div className="flex flex-nowrap items-start gap-4">
            <div className="shrink-0">
                <img alt="" src={imgSrc} className="w-custom" style={{ '--w-custom': '2.75rem' }} />
            </div>
            <div>
                <h2 className="text-lg text-bold m-0 mb-1">{c('Offer').jt`${pricingTitle} offer expires today!`}</h2>
                <p className="m-0">{description}</p>
            </div>
        </div>
    );
};
