import { c, msgid } from 'ttag';

import { useUser } from '@proton/account/user/hooks';
import { type Subscription } from '@proton/payments';
import { getPlanTitle, isTrial } from '@proton/payments';
import type { SubscriptionCheckResponse } from '@proton/shared/lib/interfaces';

interface Props {
    checkResult: SubscriptionCheckResponse | undefined;
    subscription: Subscription | undefined;
    hasPaymentMethod: boolean;
}

export const NoPaymentRequiredNote = ({ checkResult, subscription, hasPaymentMethod }: Props) => {
    const [user] = useUser();

    const currencyConversion = user.Currency !== checkResult?.Currency;

    const trial = isTrial(subscription);
    const planTitle = getPlanTitle(subscription);
    const creditsRemaining = user.Credit + (checkResult?.Credit ?? 0);

    const amountDue = checkResult?.AmountDue;

    if (amountDue || !checkResult) {
        return null;
    }

    const showReaminingCredits = checkResult?.Credit && creditsRemaining && !currencyConversion && false;

    return (
        <div>
            {!trial && (
                <>
                    <div className="mb-4">{c('Info').t`No payment is required at this time.`}</div>
                    {showReaminingCredits ? (
                        <div className="mb-4">
                            {c('Info').ngettext(
                                msgid`Please note that upon clicking the Confirm button, your account will have ${creditsRemaining} credit remaining.`,
                                `Please note that upon clicking the Confirm button, your account will have ${creditsRemaining} credits remaining.`,
                                creditsRemaining
                            )}
                        </div>
                    ) : null}
                </>
            )}
            {trial && !hasPaymentMethod && (
                <div className="mb-4">
                    {c('Info')
                        .t`You have a trial ${planTitle} subscription. If you would like to continue your subscription after the trial period, please add a payment method.`}
                </div>
            )}
            {trial && hasPaymentMethod && (
                <div className="mb-4">
                    {c('Info')
                        .t`You have a trial ${planTitle} subscription. No payment is required at this time. Your subscription will be automatically renewed at the end of the trial period.`}
                </div>
            )}
        </div>
    );
};
