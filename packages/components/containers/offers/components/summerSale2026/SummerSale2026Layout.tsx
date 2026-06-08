import type { ReactNode } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { getSimplePriceString } from '@proton/components/components/price/helper';
import { IcCheckmark } from '@proton/icons/icons/IcCheckmark';
import { CYCLE } from '@proton/payments/core/constants';

import type { OfferLayoutProps } from '../../interface';
import OfferDisableButton from '../shared/OfferDisableButton';
import kvImage from './summer-sale-2026-kv.webp';

import './SummerSale2026Layout.scss';

interface Props extends OfferLayoutProps {
    subText?: ReactNode;
}

export function SummerSale2026Layout({ offer, currency, onSelectDeal, onCloseModal, subText }: Props) {
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
        onSelectDeal(offer, deal, currency);
    };

    const isToYearly = offer.ID.includes('-to-yearly');
    const toYearlyDiscountAmount = getSimplePriceString(
        currency,
        (deal.prices.withoutCouponMonthly - rawPromoPricePerMonth) * 12
    );

    return (
        <div>
            <div className="summerSaleHeaderSection">
                <img src={kvImage} alt="" aria-hidden={true} className="summerSaleKVImage" width={496} height={339} />
                <div className="summerSaleHeaderOverlay" />
                <div className="summerSaleHeaderContent">
                    <div>
                        {/* translator: discount percentage badge, e.g. "-20%" */}
                        <span className="summerSaleDiscountBadge">{`${discountPercent}% OFF`}</span>
                        <h1 className="summerSaleTitle">{c('q2campaign2026: Title').t`SUMMER SALE`}</h1>
                    </div>
                    <div className="flex flex-column">
                        <span className="text-bold summerSalePlanName">{deal.dealName}</span>
                        <span className="summerSaleForMonths">
                            {
                                // translator: full sentence is e.g. "for 12 months"
                                c('q2campaign2026: Title').t`for 12 months`
                            }
                        </span>
                    </div>
                </div>
            </div>

            <div className="summerSaleContent">
                <div className="mb-4">
                    <div className="flex items-end gap-1 mb-1">
                        <span className="summerSalePrice text-bold">{promoPricePerMonth}</span>
                        <span className="text-lg">
                            {
                                // translator: price per month e.g. "$3.33 / month"; price not part of this string
                                c('q2campaign2026: Info').t`/month`
                            }
                        </span>
                    </div>
                    <span className="text-strike text-lg">
                        {normalPricePerMonth}
                        {c('q2campaign2026: Info').t`/month`}
                    </span>
                </div>

                {isToYearly && (
                    <p className="summerSaleText text-bold mb-4">{c('q2campaign2026: Info')
                        .t`Switch to our yearly plan and save ${toYearlyDiscountAmount}!`}</p>
                )}

                {subText && <p className="summerSaleText text-bold mb-4">{subText}</p>}

                <Button size="large" onClick={acceptDeal} color="norm" fullWidth>
                    {c('q2campaign2026: Action').t`Get the deal`}
                </Button>

                <ul className="summerSaleFeatures my-4">
                    {features.map((feature) => (
                        <li key={feature.name} className="py-2 px-3 flex flex-nowrap flex-row items-start gap-1">
                            <IcCheckmark className="shrink-0 mt-0.5" />
                            <span className="flex-1">{feature.name}</span>
                        </li>
                    ))}
                </ul>

                <div className="flex flex-column items-center gap-2 mb-4">
                    <span className="text-sm text-weak">{c('q2campaign2026: Info')
                        .t`Discounts are based on standard monthly pricing. Your subscription will renew at the standard annual rate when the billing cycle ends.`}</span>

                    <OfferDisableButton offer={offer} onCloseModal={onCloseModal} />
                </div>
            </div>
        </div>
    );
}
