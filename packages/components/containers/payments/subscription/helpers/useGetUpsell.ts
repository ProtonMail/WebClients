import { useCallback } from 'react';

import { entitlementCatalogThunk } from '@proton/account/entitlementCatalog';
import { plansThunk } from '@proton/account/plans';
import { subscriptionThunk } from '@proton/account/subscription';
import { userThunk } from '@proton/account/user';
import { useAutomaticCurrency } from '@proton/payments-hooks/client-extensions/useAutomaticCurrency';
import { isPaymentsPreloaded, usePayments } from '@proton/payments-ui/ui/context/PaymentContext';
import { getCanSubscriptionAccessDuoPlan } from '@proton/payments/core/subscription/helpers';
import { createMultiSubscriptionContext } from '@proton/payments/core/subscription/multi-subscription-context';
import { getPlansMap } from '@proton/payments/core/subscription/plans-map-wrapper';
import { useDispatch } from '@proton/redux-shared-store/sharedProvider';
import type { APP_NAMES } from '@proton/shared/lib/constants';
import { pick } from '@proton/shared/lib/helpers/object';
import { useFlag } from '@proton/unleash/useFlag';
import noop from '@proton/utils/noop';

import { useSubscriptionModalRaw } from '../subscriptionModalContext';
import { isUpsellWithPlan, resolveUpsellsToDisplay } from './dashboard-upsells';

export const useGetUpsell = () => {
    const dispatch = useDispatch();
    const [currency] = useAutomaticCurrency();
    const openSubscriptionModal = useSubscriptionModalRaw();
    const payments = usePayments();
    const lumoMultiSubscriptions = useFlag('LumoMultiSubscriptions');

    return useCallback(
        async (app: APP_NAMES) => {
            const [subscription, user, { plans, freePlan }, entitlementCatalog] = await Promise.all([
                dispatch(subscriptionThunk()),
                dispatch(userThunk()),
                dispatch(plansThunk()),
                dispatch(entitlementCatalogThunk()),
            ]);
            const plansMap = getPlansMap(plans, currency);
            const canAccessDuoPlan = getCanSubscriptionAccessDuoPlan(subscription);
            const [resolvedUpsell] = resolveUpsellsToDisplay({
                app,
                subscription,
                plansMap,
                freePlan,
                openSubscriptionModal,
                canAccessDuoPlan,
                user,
                telemetryFlow: 'subscription',
                multiSubscriptionContext: createMultiSubscriptionContext({
                    lumoMultiSubscriptions,
                    subscription: subscription,
                    entitlementCatalog,
                }),
                ...pick(user, ['canPay', 'isFree', 'hasPaidMail']),
            });
            if (isUpsellWithPlan(resolvedUpsell) && isPaymentsPreloaded(payments)) {
                resolvedUpsell.initializeOfferPrice?.(payments).catch(noop);
            }
            return resolvedUpsell;
        },
        [lumoMultiSubscriptions]
    );
};
