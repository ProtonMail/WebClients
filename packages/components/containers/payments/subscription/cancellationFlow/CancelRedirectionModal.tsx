import { format, fromUnixTime } from 'date-fns';
import { c } from 'ttag';

import { ButtonLike } from '@proton/atoms';
import { useSubscription } from '@proton/components';
import SettingsLink from '@proton/components/components/link/SettingsLink';
import type { ModalProps } from '@proton/components/components/modalTwo/Modal';
import Prompt from '@proton/components/components/prompt/Prompt';
import { PLANS } from '@proton/shared/lib/constants';
import { dateLocale } from '@proton/shared/lib/i18n';

import useCancellationTelemetry, { REACTIVATE_SOURCE } from './useCancellationTelemetry';

interface Props extends ModalProps {
    plan: PLANS;
    planName: string;
}

const CancelRedirectionModal = ({ planName, plan, ...props }: Props) => {
    const { sendResubscribeModalResubcribeReport, sendResubscribeModalCloseReport } = useCancellationTelemetry();
    const [subscription] = useSubscription();
    const subscriptionEndDate = format(fromUnixTime(subscription?.PeriodEnd ?? 0), 'PPP', { locale: dateLocale });
    const boldedDate = <strong>{subscriptionEndDate}</strong>;

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
