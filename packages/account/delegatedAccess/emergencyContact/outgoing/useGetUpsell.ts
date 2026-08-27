import { useCallback } from 'react';

import { useSubscriptionModalRaw } from '@proton/components/containers/payments/subscription/SubscriptionModalProvider';
import { isUpsellWithPlan, resolveUpsellsToDisplay } from '@proton/components/containers/payments/subscription/helpers';
import { useAutomaticCurrency } from '@proton/components/payments/client-extensions';
import { isPaymentsPreloaded, usePayments } from '@proton/payments-ui/ui/context/PaymentContext';
import { getCanSubscriptionAccessDuoPlan } from '@proton/payments/core/subscription/helpers';
import { getPlansMap } from '@proton/payments/core/subscription/plans-map-wrapper';
import { useDispatch } from '@proton/redux-shared-store/sharedProvider';
import type { APP_NAMES } from '@proton/shared/lib/constants';
import { pick } from '@proton/shared/lib/helpers/object';
import noop from '@proton/utils/noop';

import { plansThunk } from '../../../plans';
import { subscriptionThunk } from '../../../subscription';
import { userThunk } from '../../../user';

export const useGetUpsell = () => {
    const dispatch = useDispatch();
    const [currency] = useAutomaticCurrency();
    const openSubscriptionModal = useSubscriptionModalRaw();
    const payments = usePayments();

    return useCallback(async (app: APP_NAMES) => {
        const [subscription, user, { plans, freePlan }] = await Promise.all([
            dispatch(subscriptionThunk()),
            dispatch(userThunk()),
            dispatch(plansThunk()),
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
            ...pick(user, ['canPay', 'isFree', 'hasPaidMail']),
        });
        if (isUpsellWithPlan(resolvedUpsell) && isPaymentsPreloaded(payments)) {
            resolvedUpsell.initializeOfferPrice?.(payments).catch(noop);
        }
        return resolvedUpsell;
    }, []);
};
