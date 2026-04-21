import type { ReactNode } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import Price from '@proton/components/components/price/Price';
import StripedItem from '@proton/components/components/stripedList/StripedItem';
import { StripedList } from '@proton/components/components/stripedList/StripedList';
import type { Currency } from '@proton/payments';

import type { OfferFeature } from '../config/offerConfig';

interface OfferPlanCardProps {
    planDisplayName: string;
    features: OfferFeature[];
    currency: Currency;
    discountedMonthly: number;
    normalMonthly: number;
    cycleLabel: string;
    billingFootnote: ReactNode;
    onClaimOffer: () => void;
    isLoading: boolean;
}

const OfferPlanCard = ({
    planDisplayName,
    features,
    currency,
    discountedMonthly,
    normalMonthly,
    cycleLabel,
    billingFootnote,
    onClaimOffer,
    isLoading,
}: OfferPlanCardProps) => {
    const discountRate = Math.round((1 - discountedMonthly / normalMonthly) * 100);
    return (
        <div className="border border-primary rounded-xl p-6 h-full flex flex-column flex-1">
            <div className="flex items-center justify-space-between mb-0">
                <h2 className="h3 text-bold m-0">{planDisplayName}</h2>
                <span className="text-uppercase text-semibold text-xs rounded p-1 bg-success">
                    {c('Badge').t`Save ${discountRate}%`}
                </span>
            </div>
            <p className="color-weak mt-0 mb-2">{cycleLabel}</p>
            <div className="mb-0 flex items-baseline">
                <div style={{ fontSize: '2.75rem' }}>
                    <Price
                        currency={currency}
                        amountClassName="text-semibold"
                        wrapperClassName="inline-flex items-baseline"
                    >
                        {discountedMonthly}
                    </Price>
                </div>
                <span className="color-weak ml-1 text-lg">{c('Suffix').t`/month`}</span>
            </div>
            <div className="mb-4">
                <Price currency={currency} className="text-strike color-hint">
                    {normalMonthly}
                </Price>
            </div>
            <Button color="norm" className="w-full" onClick={onClaimOffer} loading={isLoading}>
                {c('Action').t`Claim offer`}
            </Button>
            <StripedList alternate="odd">
                {features.map(({ id, icon, text }) => {
                    return (
                        <StripedItem key={id} left={<span className="color-primary">{icon}</span>}>
                            {text}
                        </StripedItem>
                    );
                })}
            </StripedList>
            <p className="text-sm color-hint text-center mt-0">{billingFootnote}</p>
        </div>
    );
};

export default OfferPlanCard;
