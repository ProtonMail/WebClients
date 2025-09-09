import { c } from 'ttag';

import { Button } from '@proton/atoms';
import Icon from '@proton/components/components/icon/Icon';
import { getSimplePriceString } from '@proton/components/components/price/helper';
import { CYCLE } from '@proton/payments';
import { localeCode } from '@proton/shared/lib/i18n';

import hasOffer from '../../helpers/hasOffer';
import type { OfferLayoutProps } from '../../interface';
import OfferDisableButton from '../shared/OfferDisableButton';
import pumpkin from './pumpkin.png';

import './BackToSchoolLayout.scss';

export function BackToSchoolLayout(props: OfferLayoutProps) {
    if (!hasOffer(props)) {
        return null;
    }

    const { currency, offer } = props;
    const deal = offer.deals[0];
    const features = deal.features?.() || [];

    const rawPromoPricePerMonth = deal.prices.withCoupon / CYCLE.YEARLY;

    const promoPricePerMonth = getSimplePriceString(currency, rawPromoPricePerMonth);
    const normalPricePerMonth = getSimplePriceString(currency, deal.prices.withoutCouponMonthly);

    const discountPercent = Math.round(100 - (rawPromoPricePerMonth / deal.prices.withoutCouponMonthly) * 100);

    const isToYearlyUpsell = offer.ID.includes('-to-yearly');
    const totalSavings = getSimplePriceString(
        currency,
        deal.prices.withoutCouponMonthly * CYCLE.YEARLY - deal.prices.withCoupon
    );

    const acceptDeal = () => {
        props.onSelectDeal(props.offer, props.offer.deals[0], props.currency);
    };

    const discountTextClass = localeCode.startsWith('en_') ? 'h2' : 'h3';

    return (
        <>
            <div className="backToSchoolModalContent flex-1 flex flex-column">
                <h1 className="mb-6 text-bold lh100">{offer.title?.()}</h1>

                <div className="flex items-center mb-4">
                    <div className="flex-1 flex flex-column">
                        <span className="text-4xl text-bold">{deal.dealName}</span>
                        <span className="text-lg">{
                            // translator: full sentence is e.g. "Proton VPN Plus for 12 months", "Proton Duo for 12 months"
                            c('q3campaign_2025: Title').t`for 12 months`
                        }</span>
                    </div>

                    {/* Square badge */}
                    <div className="backToSchoolSquareBadge rounded flex items-center">
                        <span className={`${discountTextClass} text-bold ml-3`}>{
                            // translator: in English we have "50%" off, but with other languages, to save space, "-50%" could work better
                            c('q3campaign_2025: Info').jt`${discountPercent}% off`
                        }</span>
                    </div>
                </div>

                {/* Prices */}
                <div className="flex flex-column mb-4">
                    <div>
                        <span className="backToSchoolPromoPrice">{promoPricePerMonth}</span>
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

                <Button size="large" className="backToSchoolCTA mb-5 text-semibold" onClick={acceptDeal}>{c(
                    'q3campaign_2025: Action'
                ).t`Get the deal`}</Button>

                {/* Features */}
                <ul className="backToSchoolFeatures mt-0 mb-6">
                    {features.map((feature) => (
                        <li key={feature.name} className="rounded">
                            <Icon name="checkmark" />
                            <span>{feature.name}</span>
                        </li>
                    ))}
                </ul>

                {/* Disclaimer */}
                <div className="flex flex-column items-center text-center text-sm gap-2">
                    <span>
                        {c('q3campaign_2025: Info')
                            .t`Discounts are based on standard monthly pricing. Your subscription will renew at the standard annual rate when the billing cycle ends.`}
                    </span>

                    <div className="backToSchoolFeaturesDismiss">
                        <OfferDisableButton {...props} />
                    </div>
                </div>
            </div>

            {/* Footer: pumpkin */}
            <img
                className="grow-0 self-center mt-4"
                src={pumpkin}
                alt={c('q3campaign_2025: Label').t`Pumpkin with sunglasses on`}
            />
        </>
    );
}
