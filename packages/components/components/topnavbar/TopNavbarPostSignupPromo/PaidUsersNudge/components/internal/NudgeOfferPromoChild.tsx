import { c } from 'ttag';

import Price from '@proton/components/components/price/Price';
import { useAutomaticCurrency } from '@proton/components/payments/client-extensions';

import type { PriceData } from '../../helpers/interface';

interface Props {
    prices: PriceData;
}

export const NudgeOfferPromoChild = ({ prices }: Props) => {
    const [currency] = useAutomaticCurrency();

    return prices?.savedAmount ? (
        <Price currency={currency} prefix={c('Offer').t`Save`} isDisplayedInSentence>
            {prices.savedAmount}
        </Price>
    ) : (
        c('Offer').t`Get the deal`
    );
};
