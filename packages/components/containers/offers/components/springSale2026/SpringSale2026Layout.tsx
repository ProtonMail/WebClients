import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { IcCheckmark } from '@proton/icons/icons/IcCheckmark';

import type { OfferLayoutProps } from '../../interface';
import butterfly from './butterfly.webp';

import './SpringSale2026Layout.scss';

export function SpringSale2026Layout({ offer }: OfferLayoutProps) {
    const deal = offer?.deals[0] ?? { features: () => [] };
    const features = deal.features?.() || [];

    const acceptDeal = () => {
        // TODO
        // props.onSelectDeal(offer, offer.deals[0], currency);
    };

    return (
        <div>
            <h1 className="springSaleHeader text-bold mt-8">{c('q1campaign: Title').t`SPRING SALE`}</h1>

            {/* Offer type */}
            <div className="springSaleText flex gap-2 mb-4">
                <div className="flex flex-column mt-8">
                    {/* TODO */}
                    <span className="text-4xl text-bold">Insert Product Name</span>
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
            {/* TODO value */}
            <span className="springSaleDiscount h1 text-bold px-2 mb-6">-40%</span>
            <div className="springSaleText mb-4">
                <div className="flex items-end mb-1">
                    {/* TODO value */}
                    <span className="springSalePrice text-bold mr-2">$2.99</span>
                    <span className="text-lg">
                        {
                            // translator: current promotion price per month e.g. "$3.33 / month"; price not part of this string
                            c('q1campaign: Info').t`/month`
                        }
                    </span>
                </div>
                {/* TODO value */}
                <span className="text-strike text-lg">$4.99{c('q1campaign: Info').t`/month`}</span>
            </div>

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
