import { type FC, useMemo } from 'react';
import { useSelector } from 'react-redux';

import { c } from 'ttag';

import { Button } from '@proton/atoms/index';
import Anniversary2025FeatureList from '@proton/components/containers/offers/components/anniversary2025/Anniversary2025FeatureList';
import Anniversary2025Header from '@proton/components/containers/offers/components/anniversary2025/Anniversary2025Header';
import OfferCloseButton from '@proton/components/containers/offers/components/shared/OfferCloseButton';
import type { OfferId, OfferProps } from '@proton/components/containers/offers/interface';
import { ModalTwoContent } from '@proton/components/index';
import type { FeatureCode } from '@proton/features/interface';
import { PassModal } from '@proton/pass/components/Layout/Modal/PassModal';
import { useNavigateToUpgrade } from '@proton/pass/hooks/useNavigateToUpgrade';
import { selectUser } from '@proton/pass/store/selectors';
import { CYCLE, DEFAULT_CURRENCY, PLANS, PLAN_NAMES } from '@proton/payments/core/constants';
import noop from '@proton/utils/noop';

import { type EligiblePlan, UPSELL_MAP } from './ProtonAnniversaryPromo2025.utils';
import { Anniversary2025Pricing } from './ProtonAnniversaryPromo2025Pricing';

import './ProtonAnniversaryPromo2025Modal.scss';

type Props = {
    onClose: () => void;
    onNeverShowAgain: () => void;
    currentPlan: EligiblePlan;
};

/* Copied from packages/components/containers/offers/components/anniversary2025/Anniversary2025Layout.tsx
 * with modifications due to it using incompatible hooks */
export const ProtonAnniversaryPromo2025Modal: FC<Props> = ({ onClose, onNeverShowAgain, currentPlan }) => {
    const user = useSelector(selectUser);

    const { coupon, planToUpsell, upsellRef, priceWithCoupon, priceWithoutCoupon, features } = UPSELL_MAP[currentPlan];

    const dealName = PLAN_NAMES[planToUpsell];

    const userCurrency = user?.Currency ?? DEFAULT_CURRENCY;
    /** Prices are only correct for USD, EUR and CHF. If user uses another currency, defaults to EUR */
    const displayedCurrency = ['USD', 'EUR', 'CHF'].includes(userCurrency) ? userCurrency : DEFAULT_CURRENCY;

    const handleCTAClick = useNavigateToUpgrade({
        coupon,
        cycle: '12',
        email: user?.Email,
        plan: planToUpsell,
        upsellRef,
        type: 'offer',
        disableEdit: true,
    });

    const offerProps: OfferProps = useMemo(
        () => ({
            currency: displayedCurrency,
            offer: {
                title:
                    planToUpsell === PLANS.PASS
                        ? c('anniversary_2025: Offer')
                              .t`Save big on premium Pass features with a limited-time discount.`
                        : c('anniversary_2025: Offer').t`Here's an exclusive gift to celebrate our journey together.`,
                deals: [
                    {
                        features: () => features,
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
                    },
                ],
                // variables below not used by the component but required by TypeScript
                featureCode: '' as FeatureCode,
                ID: '' as OfferId,
                layout: () => <></>,
            },
            onChangeCurrency: noop,
            onCloseModal: noop,
            onSelectDeal: noop,
        }),
        [currentPlan, displayedCurrency]
    );

    return (
        <PassModal
            className="offer-modal offer-anniversary-2025 anniversary-2025-pass-plus offer-modal--one-deal subscription-modal"
            open
            onClose={onClose}
        >
            <ModalTwoContent>
                <OfferCloseButton onClose={onClose} darkBackground />
                <section className="flex flex-column flex-nowrap *:min-size-auto w-full px-2 py-12 anniversary2025">
                    <Anniversary2025Header {...offerProps} />
                    <Anniversary2025Pricing {...offerProps} />
                    <Button
                        size="large"
                        fullWidth
                        color="norm"
                        className="text-semibold gradient-highlight"
                        onClick={handleCTAClick}
                    >
                        {c('anniversary_2025').t`Get the deal`}
                    </Button>
                    <Anniversary2025FeatureList {...offerProps} />
                    <>
                        <p className="color-weak text-sm mt-0 mb-2 text-center">{c('anniversary_2025: Offer')
                            .t`Discounts are based on standard monthly pricing. At the end of the billing cycle, your subscription will renew at the standard annual rate.`}</p>
                        <div className="pb-4 text-center">
                            <Button
                                shape="underline"
                                size="small"
                                color="norm"
                                data-testid="cta:hide-offer"
                                className="offer-disable-button color-weak text-sm hover:color-weak"
                                onClick={onNeverShowAgain}
                            >{c('specialoffer: Action').t`Don't show this offer again`}</Button>
                        </div>
                    </>
                </section>
            </ModalTwoContent>
        </PassModal>
    );
};
