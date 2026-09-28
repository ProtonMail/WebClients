import { c } from 'ttag';

import { useGetPaymentMethods } from '@proton/account/paymentMethods/hooks';
import { useApi } from '@proton/app-context/useApi';
import { useNotifications } from '@proton/app-context/useNotifications';
import { useLoading } from '@proton/hooks';
import { changeRenewState } from '@proton/payments/core/api/api';
import { Renew } from '@proton/payments/core/subscription/constants';
import { getTrialInfoForSingleSubscription } from '@proton/payments/core/trials';
import isTruthy from '@proton/utils/isTruthy';
import noop from '@proton/utils/noop';

import type { DropdownActionProps } from '../../../../components/dropdown/DropdownActions';
import useEventManager from '../../../../hooks/useEventManager';
import useCancellationTelemetry from '../cancellationFlow/useCancellationTelemetry';
import type { SubscriptionRow } from './getSubscriptionRows';

/**
 * Builds the "Reactivate" dropdown action for a subscription row. The decision of whether to show it
 * lives in the row data (`row.showReactivate`); this hook owns the stateful wiring (loading state,
 * API call, notifications, telemetry) that can't live in the pure row mapper.
 */
export const useReactivateAction = (row: SubscriptionRow): DropdownActionProps[] => {
    const { subscription, showReactivate } = row;

    const [reactivating, withReactivating] = useLoading();
    const api = useApi();
    const { sendDashboardReactivateReport } = useCancellationTelemetry();
    const eventManager = useEventManager();
    const { createNotification } = useNotifications();
    const getPaymentMethods = useGetPaymentMethods();

    return [
        showReactivate && {
            text: c('Action subscription').t`Reactivate`,
            loading: reactivating,
            onClick: () => {
                withReactivating(async () => {
                    const paymentMethods = await getPaymentMethods();
                    // In principle, there is no need to check if user has payment methods before they reactivate. We
                    // want to let them reactivate even without saved payment mehtods, because some users pay only with
                    // Bitcoin, or cash, or possibly with other payment methods that can't be saved. However, the case
                    // when user has a trial subscription from the referral program is special. If user has referral
                    // trial of mail, pass, or drive then they have a free trial that was created without a payment
                    // method upfront (unlike Unlimited or VPN referrals that require buying a full subscription in
                    // exchange for 20 credits). So the cohort of referral trial users is potentially dangerous: if they
                    // cancel and then reactivate without providing a payment method first, then they will enter
                    // delinquency state on renewal attempt, which we don't want. Hence, we make this check here and ask
                    // this cohort to provide a payment method before reactivating.
                    if (
                        getTrialInfoForSingleSubscription(subscription).isReferralTrial &&
                        paymentMethods.length === 0
                    ) {
                        createNotification({
                            type: 'error',
                            text: c('Error').t`Please add a payment method before reactivating your subscription`,
                        });
                        return;
                    }

                    const searchParams = new URLSearchParams(location.search);
                    const reactivationSource = searchParams.get('source');
                    sendDashboardReactivateReport(reactivationSource || 'default');

                    await api(
                        changeRenewState({
                            RenewalState: Renew.Enabled,
                        })
                    );

                    await eventManager.call();
                }).catch(noop);
            },
        },
    ].filter(isTruthy);
};
