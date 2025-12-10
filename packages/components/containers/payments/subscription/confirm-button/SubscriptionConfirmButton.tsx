import useApi from '@proton/components/hooks/useApi';
import { Renew, SubscriptionMode, changeRenewState, isTrial } from '@proton/payments';

import { AddCreditCardButton, type PublicProps as AddCreditCardButtonProps } from './AddCreditCardButton';
import { SubscriptionSubmitButton, type Props as SubscriptionSubmitButtonProps } from './SubscriptionSubmitButton';

export type Props = SubscriptionSubmitButtonProps & AddCreditCardButtonProps;

export const SubscriptionConfirmButton = (props: Props) => {
    const api = useApi();

    const { paymentForbiddenReason, checkResult, subscription, hasPaymentMethod, onDone } = props;

    // If user has a trial subscription and doesn't have a payment method and the selects the same cycle then he can't
    // run subscription/check request, and we will receive "already-subscribed" reason here. In this case, we can't
    // re-subscribe user to the same plan and cycle that he already has. In this case, the only thing that we can do to
    // lock user in is to offer him adding a payment method.
    const userKeepsBillingCycle = paymentForbiddenReason.reason === 'already-subscribed';

    // If user has a trial subscription, then other cases are possible:
    // - user creates scheduled unpaid subscription, for example, by selecting a lower cycle. In this case,
    //   subscription/check can be executed, and the subscription can be actually created. But for scheduled unpaid
    //   subscriptions, the amount due will be 0 at the checkout. So again we need to ask user to add the credit card to
    //   lock them in.
    // - user creates scheduled paid subscription, for example, by selecting a higher cycle. We don't need to cover this
    //   case here, because the credit card will be automatically requested since amount due will be positive.

    // todo: handle other cases when user doesn't have a payment method (while not in trial) and selects a lower cycle.
    // I think it can be handled in the facade and in the operations, perhaps in the SubscriptionContainer. This logic
    // must also be generic enough to cover the other modification flows like the V2 Signup page.
    const willCreateScheduledSubscription = checkResult?.SubscriptionMode === SubscriptionMode.ScheduledChargedLater;
    const shouldRenderAddCreditCardButton =
        isTrial(subscription) && !hasPaymentMethod && (userKeepsBillingCycle || willCreateScheduledSubscription);

    return shouldRenderAddCreditCardButton ? (
        <AddCreditCardButton
            {...props}
            userKeepsBillingCycle={userKeepsBillingCycle}
            willCreateScheduledSubscription={willCreateScheduledSubscription}
            onDone={async () => {
                await api(
                    changeRenewState({
                        RenewalState: Renew.Enabled,
                    })
                );

                onDone?.();
            }}
        />
    ) : (
        <SubscriptionSubmitButton {...props} />
    );
};
