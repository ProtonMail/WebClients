import { c } from 'ttag';

import { MAIL_APP_NAME } from '@proton/shared/lib/constants';
import { isTrialChargebeeUser } from '@proton/shared/lib/helpers/subscription';
import { SubscriptionCheckResponse, SubscriptionModel } from '@proton/shared/lib/interfaces';

interface Props {
    amountDue: number;
    creditsRemaining: number;
    checkResult: SubscriptionCheckResponse | undefined;
    subscription: SubscriptionModel | undefined;
}

export const NoPaymentRequiredNote = ({ amountDue, checkResult, creditsRemaining, subscription }: Props) => {
    const isTrialCb = isTrialChargebeeUser(subscription);

    return (
        <div className={amountDue || !checkResult ? 'hidden' : undefined}>
            <h2 className="text-2xl text-bold mb-4">{c('Label').t`Payment details`}</h2>
            {!isTrialCb && (
                <>
                    <div className="mb-4">{c('Info').t`No payment is required at this time.`}</div>
                    {checkResult?.Credit && creditsRemaining ? (
                        <div className="mb-4">{c('Info')
                            .t`Please note that upon clicking the Confirm button, your account will have ${creditsRemaining} credits remaining.`}</div>
                    ) : null}
                </>
            )}
            {isTrialCb && (
                <div className="mb-4">
                    {c('Info')
                        .t`You have a trial ${MAIL_APP_NAME} subscription. If you would like to continue your subscription after the trial period, please add a payment method.`}
                </div>
            )}
        </div>
    );
};
