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
    const promoPricePerMonth = getSimplePriceString(props.currency, 330);
    const normalPricePerMonth = getSimplePriceString(props.currency, 990);

    const isToYearlyUpsell = props.offer.ID.includes('-to-yearly');
    const totalSavings = null;

    const features = props.offer.deals[0].features?.() || [];

    return (
        // TODO "style" attr is temporary
        <div className="flex flex-column" style={{ width: '480px', height: '800px', border: '1px solid grey' }}>
            <h1 className="mb-6">{props.offer.title?.()}</h1>

            <div className="flex items-center mb-4">
                <div className="flex-1 flex flex-column">
                    {/* TODO: why does it say "drive plus 200gb" and not just "drive plus"? */}
                    <span className="text-4xl">{props.offer.deals[0].dealName}</span>
                    <span className="text-lg">{
                        // translator: full sentence is e.g. "Proton VPN Plus for 12 months", "Proton Duo for 12 months"
                        c('q3campaign_2025: Title').t`for 12 months`
                    }</span>
                </div>

                {/* Square badge */}
                <div className="grow-0">{
                    // translator: in English we have "50%" off, but with other languages, to save space, "-50%" could work better
                    c('q3campaign_2025: Info').jt`${discountPercent}% off`
                }</div>
            </div>

            <div className="flex flex-column mb-4">
                <div>
                    <span className="mr-1" style={{ fontSize: '48px' }}>
                        {promoPricePerMonth}
                    </span>
                    <span className="text-lg">{
                        // translator: current promotion price per month e.g. "$3.33 / month"; price not part of this string
                        c('q3campaign_2025: Info').t`/month`
                    }</span>
                </div>

                <span className="text-lg">
                    <s>{
                        // translator: regular price per month e.g. "$9.99 / month" with STRIKETHROUGH
                        c('q3campaign_2025: Info').jt`${normalPricePerMonth} /month`
                    }</s>
                </span>
            </div>

            {isToYearlyUpsell && (
                <span className="mb-4">{c('q3campaign_2025: Info')
                    .jt`Save ${totalSavings} and keep all your current features!`}</span>
            )}

            <Button color="warning" className="mb-5" style={{ backgroundColor: '#FFD000' }}>{c(
                'q3campaign_2025: Action'
            ).t`Get the deal`}</Button>

            <ul className="mt-0 mb-6">
                {features.map((feature) => (
                    <li>{feature.name}</li>
                ))}
            </ul>

            <div className="flex flex-column gap-2 items-center text-sm">
                <span>
                    {c('q3campaign_2025: Info')
                        .t`Discounts are based on standard monthly pricing. Your subscription will renew at the standard annual rate when the billing cycle ends.`}
                </span>
                <a href="#">{c('q3campaign_2025: Action').t`Don’t show this offer again.`}</a>
            </div>

            {/* TODO: pumpkin image */}
        </div>
    );
}
