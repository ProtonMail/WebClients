import { differenceInDays, format, fromUnixTime } from 'date-fns';
import { c } from 'ttag';

import { useSubscription } from '@proton/account/subscription/hooks';
import { Button } from '@proton/atoms/index';
import Price from '@proton/components/components/price/Price';
import { useAutomaticCurrency } from '@proton/components/payments/client-extensions';
import { dateLocale } from '@proton/shared/lib/i18n';
import clsx from '@proton/utils/clsx';

import { type PriceData } from './interface';
import { getWindowEndDate } from './paidUserNudgeHelper';

interface Props {
    imgSrc: string;
    onClick: () => void;
    onNeverShow: () => void;
    prices?: PriceData;
}

export const NudgeOfferContent = ({ imgSrc, onClick, onNeverShow, prices }: Props) => {
    const [currency] = useAutomaticCurrency();
    const [subscription] = useSubscription();

    const isOneDollarUser = subscription?.Amount === 100;
    const subscriptionAge = differenceInDays(Date.now(), fromUnixTime(subscription?.PeriodStart ?? Date.now() / 1000));

    const offerEndDate = getWindowEndDate(subscriptionAge);
    const formattedDate = offerEndDate ? format(offerEndDate, 'PPP', { locale: dateLocale }) : undefined;

    return (
        <section className="p-8">
            <div className="mb-4 text-center">
                <img src={imgSrc} alt="" className="mb-2" />
                <p className="color-weak text-sm m-0 mb-2">
                    {isOneDollarUser ? c('Offer').t`Your subscription renews soon` : c('Offer').t`Limited-time offer`}
                </p>
                <p className="text-lg text-semibold m-0">
                    {isOneDollarUser
                        ? c('Offer').t`Pay annually, secure our best offer`
                        : c('Offer').t`Save big when you pay annually`}
                </p>
            </div>
            <div className="rounded-lg border p-3 mb-4">
                {prices?.discountedPrice ? (
                    <div className={clsx('flex justify-space-between', prices.yearlyPrice ? 'mb-2' : '')}>
                        <p className="m-0">{c('Offer').t`Mail Plus for 12 months`}</p>
                        <Price className="text-tabular-nums" currency={currency}>
                            {prices?.discountedPrice}
                        </Price>
                    </div>
                ) : null}
                {prices?.yearlyPrice ? (
                    <div className="flex justify-space-between color-weak">
                        <p className="m-0">{c('Offer').t`You currently pay`}</p>
                        <Price className="text-tabular-nums" currency={currency}>
                            {prices.yearlyPrice}
                        </Price>
                    </div>
                ) : null}
            </div>
            <div className="text-center">
                <Button color="norm" className="mb-4" onClick={onClick} fullWidth>
                    {prices?.savedAmount ? (
                        <Price currency={currency} prefix={c('Offer').t`Save`} isDisplayedInSentence>
                            {prices.savedAmount}
                        </Price>
                    ) : (
                        c('Offer').t`Get the deal`
                    )}
                </Button>
                <div className="flex gap-1 text-sm flex-column">
                    {offerEndDate ? (
                        // translator: Example string: Offer expires March 4th, 2025.
                        <span className="m-0 color-weak">{c('Offer').t`Offer expires ${formattedDate}.`}</span>
                    ) : null}
                    <Button shape="underline" color="norm" onClick={onNeverShow}>{c('Offer')
                        .t`Don’t show this offer again`}</Button>
                </div>
            </div>
        </section>
    );
};
