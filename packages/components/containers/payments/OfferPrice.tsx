import { type ReactElement, useEffect, useState } from 'react';

import { usePaymentsPreloaded } from '@proton/payments-hooks/ui/context/paymentsContext';
import type { PaymentsCheckoutUI } from '@proton/payments/core/checkout';
import { type PlanToCheck, getPlanToCheck } from '@proton/payments/core/subscription/plan-to-check';
import { getIsVpnB2BPlan, getPlanNameFromIDs, isLifetimePlanSelected } from '@proton/shared/lib/payments/plan/helpers';
import noop from '@proton/utils/noop';

import Price, { type Props as PriceProps } from '../../components/price/Price';
import SkeletonLoader, { type Props as SkeletonLoaderProps } from '../../components/skeletonLoader/SkeletonLoader';

export type Props = {
    planToCheck: PlanToCheck;
    autosizeSkeletonLoader?: boolean;
    skeletonLoaderProps?: SkeletonLoaderProps;
    loader?: ReactElement;
} & Omit<PriceProps, 'children' | 'currency'>;

export const OfferPrice = ({
    planToCheck: planToCheckParam,
    autosizeSkeletonLoader = true,
    skeletonLoaderProps,
    loader,
    ...rest
}: Props) => {
    const payments = usePaymentsPreloaded();

    const planToCheck = getPlanToCheck(planToCheckParam);

    const price = payments.getPrice(planToCheck);

    const [priceLoading, setPriceLoading] = useState(
        !!planToCheck.groupId && !payments.isGroupChecked(planToCheck.groupId)
    );

    const planName = getPlanNameFromIDs(planToCheck.planIDs);
    useEffect(
        function checkPrice() {
            async function run() {
                if (price || !planToCheck.coupon) {
                    setPriceLoading(false);
                    return;
                }

                setPriceLoading(true);
                try {
                    await payments.checkMultiplePlans([planToCheck]);
                } finally {
                    setPriceLoading(false);
                }
            }

            if (payments.initialized) {
                run().catch(noop);
            }
        },
        [price, planName, planToCheck.currency, planToCheck.cycle, planToCheck.coupon, payments.initialized]
    );

    const value: number = (() => {
        const isLifetime = isLifetimePlanSelected(planToCheck.planIDs);

        const planName = getPlanNameFromIDs(planToCheck.planIDs);

        let priceProp: keyof PaymentsCheckoutUI;
        if (isLifetime) {
            priceProp = 'withDiscountPerCycle';
        } else if (planName && getIsVpnB2BPlan(planName)) {
            priceProp = 'withDiscountOneMemberPerMonth';
        } else {
            priceProp = 'withDiscountPerMonth';
        }

        if (price) {
            return price.checkoutUi[priceProp];
        }

        return payments.getFallbackPrice(planToCheck).checkoutUi[priceProp];
    })();

    const groupLoading = planToCheck.groupId ? payments.isGroupLoading(planToCheck.groupId) : false;

    const loading = priceLoading || groupLoading;

    const priceElement = (
        <Price {...rest} currency={planToCheck.currency}>
            {value}
        </Price>
    );

    if (loading) {
        const skeletonLoaderChildren = autosizeSkeletonLoader ? (
            <div className="opacity-0">{priceElement}</div>
        ) : undefined;
        const defaultLoader = <SkeletonLoader {...skeletonLoaderProps}>{skeletonLoaderChildren}</SkeletonLoader>;
        return loader ?? defaultLoader;
    }

    return priceElement;
};
