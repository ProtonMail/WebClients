import { format, fromUnixTime } from 'date-fns';
import { c } from 'ttag';

import { useSubscription } from '@proton/account/subscription/hooks';
import { ButtonLike } from '@proton/atoms/Button/ButtonLike';
import SettingsLink from '@proton/components/components/link/SettingsLink';
import type { ModalProps } from '@proton/components/components/modalTwo/Modal';
import Prompt from '@proton/components/components/prompt/Prompt';
import { PLANS } from '@proton/payments';
import { dateLocale } from '@proton/shared/lib/i18n';

import { subscriptionExpires } from '../helpers';
import useCancellationTelemetry, { REACTIVATE_SOURCE } from './useCancellationTelemetry';

interface Props extends ModalProps {
    plan: PLANS;
    planName: string;
}

const CancelRedirectionModal = ({ planName, plan, ...props }: Props) => {
    const { sendResubscribeModalResubcribeReport, sendResubscribeModalCloseReport } = useCancellationTelemetry();
    const [subscription] = useSubscription();

    const subscriptionEndDate = fromUnixTime(subscriptionExpires(subscription, true).expirationDate ?? 0);
    const subscriptionEndDateString = format(subscriptionEndDate, 'PPP', {
        locale: dateLocale,
    });
    const boldedDate = <strong key="subscription-end-date">{subscriptionEndDateString}</strong>;

    const ResubscribeButton = () => {
        if (plan === PLANS.VISIONARY) {
            return null;
        }

        return (
            <ButtonLike
                as={SettingsLink}
                onClick={() => {
                    sendResubscribeModalResubcribeReport();
                }}
                fullWidth
                path={`/dashboard?source=${REACTIVATE_SOURCE.cancellationFlow}#your-subscriptions`}
                data-testid="cancellation-reminder-resubscribe-button"
            >{c('Subscription reminder').t`Reactivate`}</ButtonLike>
        );
    };

    const continueText = c('Subscription reminder')
        .jt`You can continue to enjoy all the benefits of your current plan until ${boldedDate}.`;

    const reactivateText = c('Subscription reminder').t`Reactivate to restore access to ${planName} features.`;

    return (
        <Prompt
            {...props}
            title={c('Subscription reminder').t`Subscription canceled`}
            data-testid="cancellation-reminder-redirection"
            buttons={[
                <ButtonLike
                    as={SettingsLink}
                    onClick={() => {
                        sendResubscribeModalCloseReport();
                    }}
                    color="norm"
                    data-testid="cancellation-reminder-dashboard-button"
                    path="/dashboard"
                >{c('Subscription reminder').t`Got it`}</ButtonLike>,
                <ResubscribeButton />,
            ]}
        >
            <p>{continueText}</p>
            <p>{reactivateText}</p>
        </Prompt>
    );
};

export default CancelRedirectionModal;
