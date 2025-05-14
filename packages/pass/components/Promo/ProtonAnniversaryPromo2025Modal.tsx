/* Mirrors packages/components/containers/offers/components/anniversary2025/Anniversary2025Layout.tsx */
import { type FC, useMemo } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/index';
import Anniversary2025FeatureList from '@proton/components/containers/offers/components/anniversary2025/Anniversary2025FeatureList';
import Anniversary2025Header from '@proton/components/containers/offers/components/anniversary2025/Anniversary2025Header';
import OfferCloseButton from '@proton/components/containers/offers/components/shared/OfferCloseButton';
import { getAnniversary2025Title } from '@proton/components/containers/offers/helpers/anniversary2025';
import type { OfferId, OfferProps } from '@proton/components/containers/offers/interface';
import { ModalTwoContent } from '@proton/components/index';
import type { FeatureCode } from '@proton/features/interface';
import { PassModal } from '@proton/pass/components/Layout/Modal/PassModal';
import { useNavigateToUpgrade } from '@proton/pass/hooks/useNavigateToUpgrade';
import { pipe } from '@proton/pass/utils/fp/pipe';
import { CYCLE, DEFAULT_CURRENCY, PLANS, PLAN_NAMES } from '@proton/payments/core/constants';
import type { Currency } from '@proton/payments/core/interface';
import { APPS } from '@proton/shared/lib/constants';
import noop from '@proton/utils/noop';

import { type EligiblePlan, UPSELL_MAP } from './ProtonAnniversaryPromo2025.utils';
import { Anniversary2025Pricing } from './ProtonAnniversaryPromo2025Pricing';

import './ProtonAnniversaryPromo2025Modal.scss';

type Props = {
    currency: Currency;
    currentPlan: EligiblePlan;
    email?: string;
    onClose: () => void;
    onDiscard: () => void;
};

export const ProtonAnniversaryPromo2025Modal: FC<Props> = ({ currency, currentPlan, email, onClose, onDiscard }) => {
    const { coupon, planToUpsell, upsellRef, priceWithCoupon, priceWithoutCoupon, features } = UPSELL_MAP[currentPlan];
    const dealName = PLAN_NAMES[planToUpsell];

    const upgrade = useNavigateToUpgrade({
        coupon,
        cycle: '12',
        email,
        plan: planToUpsell,
        upsellRef,
        type: 'offer',
        disableEdit: true,
    });

    const offer: OfferProps = useMemo<OfferProps>(
        () => ({
            /** Prices are only correct for USD, EUR and CHF.
             * If user uses another currency, defaults to EUR */
            currency: ['USD', 'EUR', 'CHF'].includes(currency) ? currency : DEFAULT_CURRENCY,
            offer: {
                title:
                    planToUpsell === PLANS.PASS
                        ? () => getAnniversary2025Title(APPS.PROTONPASS)
                        : getAnniversary2025Title,
                deals: [
                    {
                        features,
                        dealName,
                        prices: {
                            withCoupon: priceWithCoupon * CYCLE.YEARLY,
                            withoutCoupon: priceWithoutCoupon * CYCLE.YEARLY,
                            withoutCouponMonthly: priceWithoutCoupon,
                        },
                        cycle: CYCLE.YEARLY,
                        ref: '',
                        planIDs: {},
                    },
                ],
                featureCode: '' as FeatureCode,
                ID: '' as OfferId,
                layout: () => <></>,
            },
            onChangeCurrency: noop,
            onCloseModal: noop,
            onSelectDeal: noop,
        }),
        [currentPlan, currency]
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
                    <Anniversary2025Header {...offer} />
                    <Anniversary2025Pricing {...offer} />
                    <Button
                        size="large"
                        fullWidth
                        color="norm"
                        className="text-semibold gradient-highlight"
                        onClick={pipe(upgrade, onClose)}
                    >
                        {c('anniversary_2025').t`Get the deal`}
                    </Button>
                    <Anniversary2025FeatureList {...offer} />
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
                                onClick={onDiscard}
                            >{c('specialoffer: Action').t`Don't show this offer again`}</Button>
                        </div>
                    </>
                </section>
            </ModalTwoContent>
        </PassModal>
    );
};
