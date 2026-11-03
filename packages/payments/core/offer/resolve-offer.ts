import type { Plan } from '@proton/shared/lib/payments/plan/interface';

import type { PLANS } from '../constants';
import type { Currency, Cycle } from '../interface';

export interface ResolvedOffer {
    name: string;
    discountedAmount: number;
    defaultAmount: number;
    discountPercent: number;
    expired: boolean;
}

export type ResolvedPromotion =
    { kind: 'offer'; offer: ResolvedOffer } | { kind: 'coupon'; coupon: string } | { kind: 'none' };

interface ResolveOfferParams {
    plans: Plan[];
    planName: PLANS;
    cycle: Cycle;
    currency: Currency;
    offerName: string;
    whenEvaluate?: Date;
}

export const resolveOffer = ({
    plans,
    planName,
    cycle,
    currency,
    offerName,
    whenEvaluate = new Date(),
}: ResolveOfferParams): ResolvedOffer | undefined => {
    const plan = plans.find((candidate) => candidate.Name === planName && candidate.Currency === currency);
    const offer = plan?.Offers?.find((candidate) => candidate.Name.toLowerCase() === offerName.toLowerCase());
    const discountedAmount = offer?.Pricing[cycle];
    const defaultAmount = plan?.DefaultPricing?.[cycle] ?? plan?.Pricing[cycle];

    if (!offer || discountedAmount === undefined || !defaultAmount) {
        return undefined;
    }

    const nowInSeconds = whenEvaluate.getTime() / 1000;

    return {
        name: offer.Name,
        discountedAmount,
        defaultAmount,
        discountPercent: Math.round((1 - discountedAmount / defaultAmount) * 100),
        expired: offer.EndTime <= nowInSeconds || offer.StartTime > nowInSeconds,
    };
};

/** An offer that resolves wins over a coupon, expired or not. */
export const resolvePromotion = ({ offer, coupon }: { offer?: ResolvedOffer; coupon?: string }): ResolvedPromotion => {
    if (offer) {
        return { kind: 'offer', offer };
    }

    return coupon ? { kind: 'coupon', coupon } : { kind: 'none' };
};
