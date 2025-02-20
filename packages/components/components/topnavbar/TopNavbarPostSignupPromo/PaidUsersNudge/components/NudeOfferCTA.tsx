import { c } from 'ttag';

import Price from '@proton/components/components/price/Price';
import { useAutomaticCurrency } from '@proton/components/payments/client-extensions';

import { type PriceData, VariantsValues } from '../components/interface';

interface CTAContentProps {
    variant?: string;
    prices?: PriceData;
}

export const NudeOfferCTA = ({ variant, prices }: CTAContentProps) => {
    const [currency] = useAutomaticCurrency();

    if (prices?.savedAmount && variant === VariantsValues.money) {
        return (
            <Price currency={currency} prefix={c('Offer').t`Save`} isDisplayedInSentence>
                {prices.savedAmount}
            </Price>
        );
    }

    if (variant === VariantsValues.percentage && prices?.savedPercentage) {
        return c('Offer').t`Save ${prices.savedPercentage}%`;
    }

    return c('Offer').t`Get the deal`;
};
