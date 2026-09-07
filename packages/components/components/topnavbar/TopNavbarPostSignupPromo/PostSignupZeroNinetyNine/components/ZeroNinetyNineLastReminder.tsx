import type { ReactNode } from 'react';

import { c } from 'ttag';

import { PLANS, PLAN_NAMES } from '@proton/payments/core/constants';
import mailOfferSpotlight from '@proton/styles/assets/img/permanent-offer/mail_offer_spotlight.svg';

interface Props {
    pricingTitle: ReactNode;
}

export const ZeroNinetyNineLastReminder = ({ pricingTitle }: Props) => {
    const plan = PLAN_NAMES[PLANS.MAIL];

    return (
        <div className="flex flex-nowrap items-start gap-4">
            <div className="shrink-0">
                <img alt="" src={mailOfferSpotlight} className="w-custom" style={{ '--w-custom': '2.75rem' }} />
            </div>
            <div>
                <h2 className="text-lg text-bold m-0 mb-1">{c('Offer').jt`${pricingTitle} offer expires today!`}</h2>
                <p className="m-0">{c('Offer').t`Last chance to get your first month of ${plan} at this price.`}</p>
            </div>
        </div>
    );
};
