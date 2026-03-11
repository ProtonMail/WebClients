import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { getSimplePriceString } from '@proton/components/components/price/helper';
import { IcCheckmark } from '@proton/icons/icons/IcCheckmark';
import { CYCLE } from '@proton/payments/core/constants';

import type { OfferLayoutProps } from '../../interface';
import OfferDisableButton from '../shared/OfferDisableButton';
import butterfly from './butterfly.webp';

import './SpringSale2026Layout.scss';

export function SpringSale2026Layout({ offer, currency, onSelectDeal, onCloseModal }: OfferLayoutProps) {
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
            <h1 className="springSaleHeader text-bold mt-2 pr-4">{c('q1campaign: Title').t`SPRING SALE`}</h1>

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
                    <img className="springSaleButterfly" src={butterfly} alt="" />
                </div>
            </div>

            {/* Price and discount */}
            <span className="springSaleDiscount h1 text-bold px-2 mb-5">{`-${discountPercent}%`}</span>
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
            <Button className="springSaleCTA" size="large" onClick={acceptDeal} color="norm" fullWidth>{c(
                'q1campaign: Action'
            ).t`Get the deal`}</Button>

            {/* Features */}
            <ul className="springSaleFeatures mt-4 mb-4">
                {features.map((feature) => (
                    <li key={feature.name} className="text-lg py-2 px-3 flex flex-nowrap flex-row items-center gap-1">
                        <IcCheckmark className="shrink-0" />
                        <span className="flex-1">{feature.name}</span>
                    </li>
                ))}
            </ul>

            {/* Footer */}
            <div className="flex flex-column items-center gap-2 mb-4">
                <span className="springSaleText text-sm">{c('q1campaign: Info')
                    .t`Discounts are based on standard monthly pricing. Your subscription will renew at the standard annual rate when the billing cycle ends.`}</span>

                <OfferDisableButton offer={offer} onCloseModal={onCloseModal} />
            </div>
        </div>
    );
}
