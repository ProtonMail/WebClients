import { c } from 'ttag';

import Price from '@proton/components/components/price/Price';

import type { PriceData } from '../../helpers/interface';

interface Props {
    prices: PriceData;
}

export const NudgeOfferPromoChild = ({ prices }: Props) => {
    return prices?.savedAmount ? (
        <Price currency={prices.currency} prefix={c('Offer').t`Save`} isDisplayedInSentence>
            {prices.savedAmount}
        </Price>
    ) : (
        c('Offer').t`Get the deal`
    );
};
