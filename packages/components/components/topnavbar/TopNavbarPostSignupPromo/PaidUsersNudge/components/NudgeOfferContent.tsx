import { c } from 'ttag';

import { Button } from '@proton/atoms/index';
import Price from '@proton/components/components/price/Price';
import { useAutomaticCurrency } from '@proton/components/payments/client-extensions';
import clsx from '@proton/utils/clsx';

import { NudeOfferCTA } from './NudeOfferCTA';
import { type PriceData } from './interface';

interface Props {
    imgSrc: string;
    onClick: () => void;
    onNeverShow: () => void;
    variant?: string;
    prices?: PriceData;
}

export const NudgeOfferContent = ({ imgSrc, variant, onClick, onNeverShow, prices }: Props) => {
    const [currency] = useAutomaticCurrency();

    return (
        <section className="p-8">
            <div className="mb-4 text-center">
                <img src={imgSrc} alt="" className="mb-2" />
                <p className="color-weak text-sm m-0 mb-2">{c('Offer').t`Limited-time offer`}</p>
                <p className="text-lg text-semibold m-0">{c('Offer').t`Save big when you pay annually`}</p>
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
                    <NudeOfferCTA prices={prices} variant={variant} />
                </Button>
                <Button shape="underline" color="norm" onClick={onNeverShow}>{c('Offer')
                    .t`Don’t show this offer again`}</Button>
            </div>
        </section>
    );
};
