import { c } from 'ttag';

import { ButtonLike } from '@proton/atoms';
import type { ModalProps } from '@proton/components/components';
import { SettingsLink } from '@proton/components/components';
import Prompt from '@proton/components/components/prompt/Prompt';
import { PLANS } from '@proton/shared/lib/constants';

import useCancellationTelemetry, { REACTIVATE_SOURCE } from './useCancellationTelemetry';

interface Props extends ModalProps {
    plan: PLANS;
    planName: string;
}

const CancelRedirectionModal = ({ planName, plan, ...props }: Props) => {
    const { sendResubscribeModalResubcribeReport, sendResubscribeModalCloseReport } = useCancellationTelemetry();

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
                color="norm"
                data-testid="cancellation-reminder-resubscribe-button"
            >{c('Subscription reminder').t`Reactivate`}</ButtonLike>
        );
    };

    const text =
        plan === PLANS.VISIONARY
            ? c('Subscription reminder').t`Your ${planName} has been canceled.`
            : c('Subscription reminder').t`Reactivate to restore access to ${planName} features.`;

    return (
        <Prompt
            {...props}
            title={c('Subscription reminder').t`Subscription canceled`}
            data-testid="cancellation-reminder-redirection"
            buttons={[
                <ResubscribeButton />,
                <ButtonLike
                    as={SettingsLink}
                    onClick={() => {
                        sendResubscribeModalCloseReport();
                    }}
                    data-testid="cancellation-reminder-dashboard-button"
                    path="/dashboard"
                >{c('Subscription reminder').t`Close`}</ButtonLike>,
            ]}
        >
            <p>{text}</p>
        </Prompt>
    );
};

export default CancelRedirectionModal;
