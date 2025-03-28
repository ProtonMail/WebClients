import { useEffect } from 'react';

import { c } from 'ttag';

import Price from '@proton/components/components/price/Price';
import { useAutomaticCurrency } from '@proton/components/payments/client-extensions';
import { FeatureCode } from '@proton/features/interface';
import useFeature from '@proton/features/useFeature';

import { type PriceData } from '../../helpers/interface';

interface Props {
    imgSrc: string;
    prices: PriceData;
}

export const NudgeOfferSpotlight = ({ imgSrc, prices }: Props) => {
    const { update } = useFeature(FeatureCode.MailPaidUserNudgeTimestamp);
    const [currency] = useAutomaticCurrency();

    useEffect(() => {
        const date = Date.now() / 1000;
        void update(date);
    }, []);

    return (
        <div className="flex flex-nowrap items-start gap-4">
            <div className="shrink-0">
                <img alt="" src={imgSrc} className="w-custom" style={{ '--w-custom': '2.75rem' }} />
            </div>
            <div>
                <Price
                    currency={currency}
                    className="text-lg text-bold m-0 mb-1"
                    prefix={c('Offer').t`Last day to save`}
                    isDisplayedInSentence
                >
                    {prices.savedAmount}
                </Price>
                <p className="m-0">{c('Offer').t`When you switch from a monthly to annual subscription.`}</p>
            </div>
        </div>
    );
};
