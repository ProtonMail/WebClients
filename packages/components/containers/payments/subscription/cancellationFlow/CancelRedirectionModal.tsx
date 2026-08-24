import { format, fromUnixTime } from 'date-fns';
import { c } from 'ttag';

import { useSubscription } from '@proton/account/subscription/hooks';
import { ButtonLike } from '@proton/atoms/Button/ButtonLike';
import { PLANS } from '@proton/payments/core/constants';
import { getRenewalTime } from '@proton/payments/core/subscription/helpers';
import { isFreeSubscription } from '@proton/payments/core/type-guards';
import { dateLocale } from '@proton/shared/lib/i18n';

import SettingsLink from '../../../../components/link/SettingsLink';
import type { ModalProps } from '../../../../components/modalTwo/Modal';
import Prompt from '../../../../components/prompt/Prompt';
import useEventManager from '../../../../hooks/useEventManager';
import useCancellationTelemetry, { REACTIVATE_SOURCE } from './useCancellationTelemetry';

interface Props extends ModalProps {
    plan: PLANS;
    planName: string;
}

export const CancelRedirectionModal = ({ planName, plan, ...props }: Props) => {
    const { sendResubscribeModalResubcribeReport, sendResubscribeModalCloseReport } = useCancellationTelemetry();
    const eventManager = useEventManager();
    const [subscription] = useSubscription();

    if (!subscription || isFreeSubscription(subscription)) {
        return null;
    }

    const subscriptionEndDateString = format(fromUnixTime(getRenewalTime(subscription)), 'PPP', {
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
                onClick={async () => {
                    await eventManager.call();
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
            onClose={async () => {
                await eventManager.call();
                sendResubscribeModalCloseReport();
                props.onClose?.();
            }}
            title={c('Subscription reminder').t`Subscription canceled`}
            data-testid="cancellation-reminder-redirection"
            buttons={[
                <ButtonLike
                    as={SettingsLink}
                    onClick={async () => {
                        await eventManager.call();
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
