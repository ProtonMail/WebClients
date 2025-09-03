import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { getSimplePriceString } from '@proton/components/components/price/helper';

import hasOffer from '../../helpers/hasOffer';
import type { OfferLayoutProps } from '../../interface';

export function BackToSchoolLayout(props: OfferLayoutProps) {
    if (!hasOffer(props)) {
        return null;
    }

    // TODO example data, use props instead
    const discountPercent = 60;
    const promoPricePerMonth = getSimplePriceString(props.currency, 3.33);
    const normalPricePerMonth = getSimplePriceString(props.currency, 9.99);

    const isToYearlyUpsell = props.offer.ID.includes('-to-yearly');
    const totalSavings = null;

    const features = props.offer.deals[0].features?.() || [];

    return (
        <div className="flex flex-column">
            <h1>{props.offer.title?.()}</h1>

            <span>
                {/* TODO: why does it say "drive plus 200gb" and not just "drive plus"? */}
                <span>{props.offer.deals[0].dealName}</span>
                <br />
                <span>{
                    // translator: full sentence is e.g. "Proton VPN Plus for 12 months", "Proton Duo for 12 months"
                    c('q3campaign_2025: Title').t`for 12 months`
                }</span>
            </span>

            {/* Square badge */}
            <div>{
                // translator: in English we have "50%" off, but with other languages, to save space, "-50%" could work better
                c('q3campaign_2025: Info').jt`${discountPercent}% off`
            }</div>

            <span>{
                // translator: current promotion price per month e.g. "$3.33 / month"
                c('q3campaign_2025: Info').jt`${promoPricePerMonth} /month`
            }</span>
            <span>
                <s>{
                    // translator: regular price per month e.g. "$9.99 / month" with STRIKETHROUGH
                    c('q3campaign_2025: Info').jt`${normalPricePerMonth} /month`
                }</s>
            </span>

            {isToYearlyUpsell && (
                <span>{c('q3campaign_2025: Info').jt`Save ${totalSavings} and keep all your current features!`}</span>
            )}

            <Button>{c('q3campaign_2025: Action').t`Get the deal`}</Button>

            <ul>
                {features.map((feature) => (
                    <li>{feature.name}</li>
                ))}
            </ul>

            <p>
                {c('q3campaign_2025: Info')
                    .t`Discounts are based on standard monthly pricing. Your subscription will renew at the standard annual rate when the billing cycle ends.`}
            </p>
            <a href="#">{c('q3campaign_2025: Action').t`Don’t show this offer again.`}</a>

            {/* TODO: pumpkin image */}
        </div>
    );
}
