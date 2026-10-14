import type { ReactNode } from 'react';
import { useLocation } from 'react-router';

import { c } from 'ttag';

import { useConfig } from '@proton/app-context/useConfig';
import { Button } from '@proton/atoms/Button/Button';
import { IcCheckmark } from '@proton/icons/icons/IcCheckmark';
import { CYCLE } from '@proton/payments/core/constants';
import { BRAND_NAME } from '@proton/shared/lib/constants';

import ProtonLogo from '../../../../components/logo/ProtonLogo';
import { getSimplePriceString } from '../../../../components/price/helper';
import { getDiscountWithCoupon } from '../../helpers/dealPrices';
import { getOfferProduct } from '../../helpers/getOfferProduct';
import type { OfferLayoutProps } from '../../interface';
import OfferDisableButton from '../shared/OfferDisableButton';

import './BlackFriday2026Layout.scss';

interface Props extends OfferLayoutProps {
    subText?: ReactNode;
}

export function BlackFriday2026Layout({ offer, currency, onSelectDeal, onCloseModal, subText }: Props) {
    const { APP_NAME } = useConfig();
    const { pathname } = useLocation();

    if (!offer) {
        return null;
    }
    const deal = offer.deals[0];
    if (!deal.features) {
        return null;
    }
    const features = deal.features(getOfferProduct(APP_NAME, pathname));

    const rawPromoPricePerMonth = deal.prices.withCoupon / CYCLE.YEARLY;
    const promoPricePerMonth = getSimplePriceString(currency, rawPromoPricePerMonth);
    const normalPricePerMonth = getSimplePriceString(currency, deal.prices.withoutCouponMonthly);

    const acceptDeal = () => {
        onSelectDeal(offer, deal, currency);
    };

    const tagline = offer.title?.();
    const discount = getDiscountWithCoupon(deal);

    const planNameWithoutBrand = deal.dealName.replace(`${BRAND_NAME} `, '');

    return (
        <div>
            <div className="bf2026Header">
                <img
                    src={offer.images?.modalImage}
                    alt=""
                    aria-hidden={true}
                    className="bf2026HeaderImage"
                    width={480}
                    height={310}
                />
                <div className="bf2026HeaderShadow" />
                <div className="bf2026HeaderContent">
                    {discount > 0 && (
                        <p className="bf2026Discount font-sofia-sans-condensed m-0" dir="ltr">
                            -{discount}%
                        </p>
                    )}
                    <h1 className="bf2026Title font-sofia-sans-condensed">
                        {
                            // translator: campaign headline in the offer header, displayed in capitals
                            c('bfcampaign2026: Title').t`Black Friday`
                        }
                    </h1>
                    {tagline && <p className="bf2026Tagline font-es-build m-0">{tagline}</p>}
                </div>
            </div>

            <div className="bf2026Content">
                <div className="flex flex-column mb-4">
                    <span className="bf2026PlanLockup flex flex-row flex-nowrap items-center gap-3">
                        <ProtonLogo color="invert" scale={0.75} />
                        <span className="bf2026PlanName text-bold">{planNameWithoutBrand}</span>
                    </span>
                    <span className="bf2026ForMonths">
                        {
                            // translator: full sentence is e.g. "for 12 months"
                            c('bfcampaign2026: Title').t`for 12 months`
                        }
                    </span>
                </div>

                <div className="mb-4">
                    <div className="flex items-baseline gap-2 mb-1">
                        <span className="bf2026Price">{promoPricePerMonth}</span>
                        <span className="text-lg">
                            {
                                // translator: price per month e.g. "$3.33 / month"; price not part of this string
                                c('bfcampaign2026: Info').t`/month`
                            }
                        </span>
                    </div>
                    <span className="text-strike text-lg">
                        {normalPricePerMonth}
                        {c('bfcampaign2026: Info').t`/month`}
                    </span>
                </div>

                {subText && <p className="bf2026Text text-bold mb-4">{subText}</p>}

                <Button size="large" onClick={acceptDeal} color="norm" className="text-bold" fullWidth>
                    {c('bfcampaign2026: Action').t`Get the deal`}
                </Button>

                <ul className="bf2026Features my-4">
                    {features.map((feature) => (
                        <li key={feature.name} className="py-2 px-3 flex flex-nowrap flex-row items-start gap-1">
                            <IcCheckmark className="shrink-0 mt-0.5" />
                            <span className="flex-1">{feature.name}</span>
                        </li>
                    ))}
                </ul>

                <div className="flex flex-column items-center text-center gap-2 mb-4">
                    <span className="text-sm">{c('bfcampaign2026: Info')
                        .t`Discounts are based on standard monthly pricing. Your subscription will renew at the standard annual rate when the billing cycle ends.`}</span>

                    <OfferDisableButton offer={offer} onCloseModal={onCloseModal} />
                </div>
            </div>
        </div>
    );
}
