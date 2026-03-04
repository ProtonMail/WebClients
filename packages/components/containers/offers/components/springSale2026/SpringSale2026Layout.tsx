import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { getSimplePriceString } from '@proton/components/components/price/helper';
import { IcCheckmark } from '@proton/icons/icons/IcCheckmark';
import { CYCLE } from '@proton/payments/core/constants';

import type { OfferLayoutProps } from '../../interface';
import butterfly from './butterfly.webp';

import './SpringSale2026Layout.scss';

export function SpringSale2026Layout({ offer, currency, onSelectDeal }: OfferLayoutProps) {
    if (!offer) {
        return null;
    }
    const deal = offer.deals[0];
    if (!deal.features) {
        return null;
    }
    const features = deal.features();

    const rawPromoPricePerMonth = deal.prices.withCoupon / CYCLE.YEARLY;
    const promoPricePerMonth = getSimplePriceString(currency, rawPromoPricePerMonth);
    const normalPricePerMonth = getSimplePriceString(currency, deal.prices.withoutCouponMonthly);

    const discountPercent = Math.round(100 - (rawPromoPricePerMonth / deal.prices.withoutCouponMonthly) * 100);

    const acceptDeal = () => {
        onSelectDeal(offer, offer.deals[0], currency);
    };

    const isToYearly = offer.ID.includes('-to-yearly');
    const toYearlyDiscountAmount = getSimplePriceString(
        currency,
        deal.prices.withoutCouponMonthly * 12 - rawPromoPricePerMonth * 12
    );

    const isRetention = offer.ID.includes('-retention');

    return (
        <div>
            <h1 className="springSaleHeader text-bold mt-8">{c('q1campaign: Title').t`SPRING SALE`}</h1>
            {/* Offer type */}
            <div className="springSaleText flex gap-2 mb-4">
                <div className="flex flex-column mt-8">
                    <span className="text-4xl text-bold">{deal.dealName}</span>
                    <span className="text-lg">
                        {
                            // translator: full sentence is e.g. "Proton VPN Plus for 12 months", "Proton Duo for 12 months"
                            c('q1campaign: Title').t`for 12 months`
                        }
                    </span>
                </div>

                <div>
                    <img className="springSaleButterfly" src={butterfly} alt={c('q1campaign: Label').t`a butterfly`} />
                </div>
            </div>
            {/* Price and discount */}
            <span className="springSaleDiscount h1 text-bold px-2 mb-6">{`-${discountPercent}%`}</span>
            <div className="springSaleText mb-4">
                <div className="flex items-end mb-1">
                    <span className="springSalePrice text-bold mr-2">{promoPricePerMonth}</span>
                    <span className="text-lg">
                        {
                            // translator: current promotion price per month e.g. "$3.33 / month"; price not part of this string
                            c('q1campaign: Info').t`/month`
                        }
                    </span>
                </div>
                <span className="text-strike text-lg">
                    {normalPricePerMonth}
                    {c('q1campaign: Info').t`/month`}
                </span>
            </div>

            {isToYearly && (
                <p className="springSaleText text-bold">{`Switch to our yearly plan and save ${toYearlyDiscountAmount}!`}</p>
            )}
            {isRetention && (
                <p className="springSaleText text-bold">{`Extend your subscription and save ${discountPercent}%!`}</p>
            )}

            {/* CTA */}
            <Button size="large" onClick={acceptDeal} color="norm" fullWidth>{c('q1campaign: Action')
                .t`Get the deal`}</Button>
            {/* Features */}
            <ul className="springSaleFeatures mb-4">
                {features.map((feature) => (
                    <li className="text-lg py-2 px-3">
                        <IcCheckmark />
                        <span>{feature.name}</span>
                    </li>
                ))}
            </ul>
            <div className="flex flex-column items-center gap-2 mb-10">
                <span className="springSaleText text-sm">{c('q1campaign: Info')
                    .t`Discounts are based on standard monthly pricing. Your subscription will renew at the standard annual rate when the billing cycle ends.`}</span>

                <Button shape="underline" size="small" className="springSaleText text-sm">{c('q1campaign: Action')
                    .t`Don't show this offer again`}</Button>
            </div>
        </div>
    );
}
