import { type ReactElement, useEffect, useState } from 'react';

import Price, { type Props as PriceProps } from '@proton/components/components/price/Price';
import SkeletonLoader, {
    type Props as SkeletonLoaderProps,
} from '@proton/components/components/skeletonLoader/SkeletonLoader';
import noop from '@proton/utils/noop';

import type { PaymentsCheckoutUI } from '../../core/checkout';
import { getIsVpnB2BPlan, getPlanNameFromIDs, isLifetimePlanSelected } from '../../core/plan/helpers';
import { type PlanToCheck, usePaymentsPreloaded } from '../context/PaymentContext';
import { getPlanToCheck } from '../context/helpers';

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
