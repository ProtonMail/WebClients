import { useCallback } from 'react';

import { useSubscriptionModal } from '@proton/components/containers/payments/subscription/SubscriptionModalProvider';
import { resolveUpsellsToDisplay } from '@proton/components/containers/payments/subscription/helpers';
import { useAutomaticCurrency } from '@proton/components/payments/client-extensions';
import { getPlansMap } from '@proton/payments';
import { getCanSubscriptionAccessDuoPlan } from '@proton/payments';
import { usePaymentsPreloaded } from '@proton/payments/ui';
import { useDispatch } from '@proton/redux-shared-store/sharedProvider';
import type { APP_NAMES } from '@proton/shared/lib/constants';
import { pick } from '@proton/shared/lib/helpers/object';
import noop from '@proton/utils/noop';

import { plansThunk } from '../../../plans';
import { subscriptionThunk } from '../../../subscription';
import { userThunk } from '../../../user';
import { vpnServersCountThunk } from '../../../vpn/serversCount';

export const useGetUpsell = () => {
    const dispatch = useDispatch();
    const [currency] = useAutomaticCurrency();
    const [openSubscriptionModal] = useSubscriptionModal();
    const payments = usePaymentsPreloaded();

    return useCallback(async (app: APP_NAMES) => {
        const [subscription, user, { plans, freePlan }, serversCount] = await Promise.all([
            dispatch(subscriptionThunk()),
            dispatch(userThunk()),
            dispatch(plansThunk()),
            dispatch(vpnServersCountThunk()),
        ]);
        const plansMap = getPlansMap(plans, currency);
        const canAccessDuoPlan = getCanSubscriptionAccessDuoPlan(subscription);
        const [resolvedUpsell] = resolveUpsellsToDisplay({
            app,
            subscription,
            plansMap,
            freePlan,
            serversCount,
            openSubscriptionModal,
            canAccessDuoPlan,
            user,
            telemetryFlow: 'subscription',
            ...pick(user, ['canPay', 'isFree', 'hasPaidMail']),
        });
        resolvedUpsell.initializeOfferPrice?.(payments).catch(noop);
        return resolvedUpsell;
    }, []);
};
