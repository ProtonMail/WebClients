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
import { getOfferProduct } from '../../helpers/getOfferProduct';
import type { OfferLayoutProps } from '../../interface';
import OfferDisableButton from '../shared/OfferDisableButton';

import './Q3Sale2026Layout.scss';

interface Props extends OfferLayoutProps {
    subText?: ReactNode;
}

export function Q3Sale2026Layout({ offer, currency, onSelectDeal, onCloseModal, subText }: Props) {
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

    const offerTitle = offer.title?.();

    const planNameWithoutBrand = deal.dealName.replace(`${BRAND_NAME} `, '');

    const protonLogoWithDeal = (
        <span className="q3SalePlanLockup flex flex-row items-center gap-3">
            <ProtonLogo color="invert" scale={0.75} />
            <span className="text-bold q3SalePlanName">{planNameWithoutBrand}</span>
        </span>
    );

    return (
        <div>
            <div className="q3SaleHeaderSection">
                <img
                    src={offer.images?.modalImage}
                    alt=""
                    aria-hidden={true}
                    className="q3SaleKVImage"
                    width={496}
                    height={339}
                />
                <div className="q3SaleHeaderOverlay" />
                <div className="q3SaleHeaderContent">
                    <div>
                        <h1 className="q3SaleTitle font-arizona">{offerTitle}</h1>
                    </div>
                    <div className="flex flex-column">
                        {protonLogoWithDeal}
                        <span className="q3SaleForMonths">
                            {
                                // translator: full sentence is e.g. "for 12 months"
                                c('q3campaign2026: Title').t`for 12 months`
                            }
                        </span>
                    </div>
                </div>
            </div>

            <div className="q3SaleContent">
                <div className="mb-4">
                    <div className="flex items-end gap-1 mb-1">
                        <span className="q3SalePrice text-bold">{promoPricePerMonth}</span>
                        <span className="text-lg">
                            {
                                // translator: price per month e.g. "$3.33 / month"; price not part of this string
                                c('q3campaign2026: Info').t`/month`
                            }
                        </span>
                    </div>
                    <span className="text-strike text-lg">
                        {normalPricePerMonth}
                        {c('q3campaign2026: Info').t`/month`}
                    </span>
                </div>

                {subText && <p className="q3SaleText text-bold mb-4">{subText}</p>}

                <Button size="large" onClick={acceptDeal} color="norm" className="text-bold" fullWidth>
                    {c('q3campaign2026: Action').t`Get the deal`}
                </Button>

                <ul className="q3SaleFeatures my-4">
                    {features.map((feature) => (
                        <li key={feature.name} className="py-2 px-3 flex flex-nowrap flex-row items-start gap-1">
                            <IcCheckmark className="shrink-0 mt-0.5" />
                            <span className="flex-1">{feature.name}</span>
                        </li>
                    ))}
                </ul>

                <div className="flex flex-column items-center gap-2 mb-4">
                    <span className="text-sm text-weak">{c('q3campaign2026: Info')
                        .t`Discounts are based on standard monthly pricing. Your subscription will renew at the standard annual rate when the billing cycle ends.`}</span>

                    <OfferDisableButton offer={offer} onCloseModal={onCloseModal} />
                </div>
            </div>
        </div>
    );
}
