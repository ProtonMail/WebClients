import { type FC } from 'react';
import { useSelector } from 'react-redux';

import { c } from 'ttag';

import OfferCloseButton from '@proton/components/containers/offers/components/shared/OfferCloseButton';
import {
    ValentineCTA,
    ValentineFeatureList,
    ValentineFooter,
    ValentinePricing,
} from '@proton/components/containers/offers/components/valentine/ValentineComponents';
import { ValentineOfferLayout } from '@proton/components/containers/offers/components/valentine/ValentineLayout25';
import protonLogo from '@proton/components/containers/offers/components/valentine/protonLogo.svg';
import { Icon, ModalTwoContent, ProtonLogo } from '@proton/components/index';
import { PassModal } from '@proton/pass/components/Layout/Modal/PassModal';
import {
    PASS_PLUS_VALENTINES_DAY_MONTHLY_PRICE,
    PASS_PLUS_VALENTINES_DAY_MONTHLY_PRICE_WITHOUT_COUPON,
    PROTON_UNLIMITED_VALENTINES_DAY_MONTHLY_PRICE,
    PROTON_UNLIMITED_VALENTINES_DAY_MONTHLY_PRICE_WITHOUT_COUPON,
} from '@proton/pass/constants';
import { selectUser } from '@proton/pass/store/selectors';
import { DEFAULT_CURRENCY, PLANS, PLAN_NAMES } from '@proton/payments';
import { CYCLE } from '@proton/shared/lib/constants';
import clsx from '@proton/utils/clsx';

type Props = {
    onClose: () => void;
    onUpgradeClick: () => void;
    planToUpsell: PLANS.PASS | PLANS.BUNDLE;
};

/* Copied from packages/components/containers/offers/operations/valentine2025Pass/Layout.tsx
 * with modifications due to it using incompatible hooks */
export const ValentinesDayPromoModal: FC<Props> = ({ onClose, onUpgradeClick, planToUpsell }) => {
    const user = useSelector(selectUser);

    const dealName = PLAN_NAMES[planToUpsell];

    const features = [
        { name: c('Valentine_2025: Offer').t`Unlimited hide-my-email aliases` },
        { name: c('Valentine_2025: Offer').t`Integrated 2FA authenticator` },
        { name: c('Valentine_2025: Offer').t`Secure vault sharing` },
    ];

    const priceWithCoupon =
        planToUpsell === PLANS.PASS
            ? PASS_PLUS_VALENTINES_DAY_MONTHLY_PRICE
            : PROTON_UNLIMITED_VALENTINES_DAY_MONTHLY_PRICE;

    const priceWithoutCoupon =
        planToUpsell === PLANS.PASS
            ? PASS_PLUS_VALENTINES_DAY_MONTHLY_PRICE_WITHOUT_COUPON
            : PROTON_UNLIMITED_VALENTINES_DAY_MONTHLY_PRICE_WITHOUT_COUPON;

    const isDarkTheme = document.body.classList.contains('pass-dark');

    return (
        <PassModal
            className="offer-modal offer-valentine-2025-pass-plus offer-modal--one-deal subscription-modal"
            open
            onClose={onClose}
        >
            <ModalTwoContent>
                <OfferCloseButton onClose={onClose} darkBackground={isDarkTheme} />
                <ValentineOfferLayout>
                    <section className="flex flex-column flex-nowrap w-full px-2 py-12 valentine">
                        <header className="mb-6">
                            {isDarkTheme ? (
                                <ProtonLogo color="invert" className="z-1" />
                            ) : (
                                <img src={protonLogo} alt="" className="mb-6 z-1" />
                            )}
                            <h2 className="text-bold valentine-text">
                                {c('Valentine_2025: Offer').t`Valentine's deal:`} <br />
                                {c('Valentine_2025: Offer').t`50% off for you +1`}
                            </h2>
                        </header>
                        <ValentinePricing
                            deal={{
                                dealName,
                                prices: {
                                    withCoupon: priceWithCoupon * CYCLE.YEARLY,
                                    withoutCoupon: priceWithoutCoupon * CYCLE.YEARLY,
                                    withoutCouponMonthly: priceWithoutCoupon,
                                },
                                cycle: CYCLE.YEARLY,
                                // variables below not used by the component but required by TypeScript
                                ref: '',
                                planIDs: {},
                            }}
                            currency={user?.Currency ?? DEFAULT_CURRENCY}
                        />
                        <section className="py-3 px-3 mb-4 gap-4 rounded-lg flex flex-row items-center relative valentine-text valentine-background">
                            <Icon name="plus" size={7} className="shrink-0" />
                            <div className="flex flex-1 flex-column">
                                <p className="m-0 text-semibold text-lg">{c('Valentine_2025: Offer')
                                    .t`Double the love, half the price`}</p>
                                <p className="m-0">{c('Valentine_2025: Offer')
                                    .t`Get 1 year of ${dealName} at 50% off — plus a gift code to share the same deal with a friend`}</p>
                            </div>
                            <p
                                className={clsx(
                                    'text-sm rounded-full inline-block px-3 py-0.5 m-0 text-semibold text-uppercase absolute top-0 right-0 off-pill',
                                    isDarkTheme ? 'color-norm' : 'color-invert'
                                )}
                            >{c('Valentine_2025: Offer').t`50% off`}</p>
                        </section>
                        <ValentineCTA onClick={onUpgradeClick} />
                        <ValentineFeatureList features={features} />
                        <ValentineFooter />
                    </section>
                </ValentineOfferLayout>
            </ModalTwoContent>
        </PassModal>
    );
};
