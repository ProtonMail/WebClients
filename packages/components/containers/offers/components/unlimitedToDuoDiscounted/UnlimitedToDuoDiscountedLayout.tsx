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

import './UnlimitedToDuoDiscountedLayout.scss';

/**
 * The discounted Unlimited -> Duo modal. The header carries a discount badge and the plan lockup
 * rather than a headline.
 */
export function UnlimitedToDuoDiscountedLayout({ offer, currency, onSelectDeal, onCloseModal }: OfferLayoutProps) {
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

    const promoPricePerMonth = getSimplePriceString(currency, deal.prices.withCoupon / CYCLE.YEARLY);
    const normalPricePerMonth = getSimplePriceString(currency, deal.prices.withoutCouponMonthly);

    const acceptDeal = () => {
        onSelectDeal(offer, deal, currency);
    };

    const planNameWithoutBrand = deal.dealName.replace(`${BRAND_NAME} `, '');
    const planName = deal.dealName;

    return (
        <div>
            <div className="duoDiscountHeaderSection">
                <img src={offer.images?.modalImage} alt="" aria-hidden={true} className="duoDiscountKVImage" />
                <div className="duoDiscountHeaderContent">
                    {offer.topButtonDiscount ? (
                        <span className="duoDiscountBadge text-bold">{`-${offer.topButtonDiscount}%`}</span>
                    ) : null}
                    <div className="flex flex-column">
                        <span className="duoDiscountPlanLockup flex flex-row items-center gap-3">
                            <ProtonLogo color="invert" scale={0.75} />
                            <span className="text-bold duoDiscountPlanName">{planNameWithoutBrand}</span>
                        </span>
                        <span className="duoDiscountForMonths">
                            {
                                // translator: full sentence is e.g. "for 12 months"
                                c('tryduo2026: Title').t`for 12 months`
                            }
                        </span>
                    </div>
                </div>
            </div>

            <div className="duoDiscountContent">
                <div className="mb-4">
                    <div className="flex items-end gap-1 mb-1">
                        <span className="duoDiscountPrice text-bold">{promoPricePerMonth}</span>
                        <span className="text-lg">
                            {
                                // translator: price per month e.g. "$11.99 /month"; price not part of this string
                                c('tryduo2026: Info').t`/month`
                            }
                        </span>
                    </div>
                    <span className="text-strike text-lg">
                        {normalPricePerMonth}
                        {c('tryduo2026: Info').t`/month`}
                    </span>
                </div>

                <Button size="large" onClick={acceptDeal} color="norm" className="text-bold" fullWidth>
                    {
                        // translator: main call to action, e.g. "Get Proton Duo"
                        c('tryduo2026: Action').t`Get ${planName}`
                    }
                </Button>

                <ul className="duoDiscountFeatures my-4">
                    {features.map((feature) => (
                        <li key={feature.name} className="py-2 px-3 flex flex-nowrap flex-row items-start gap-1">
                            <IcCheckmark className="shrink-0 mt-0.5" />
                            <span className="flex-1">{feature.name}</span>
                        </li>
                    ))}
                </ul>

                <div className="flex flex-column items-center gap-2 mb-4">
                    <span className="text-sm text-weak text-center">{c('tryduo2026: Info')
                        .t`Discounts are based on standard monthly pricing. Your subscription will renew at the standard annual rate when the billing cycle ends.`}</span>

                    <OfferDisableButton offer={offer} onCloseModal={onCloseModal} />
                </div>
            </div>
        </div>
    );
}
