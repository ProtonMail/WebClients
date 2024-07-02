import { useFlag } from '@unleash/proxy-client-react';
import { c } from 'ttag';

import { ButtonLike } from '@proton/atoms/Button';
import { ModalProps, Prompt, SettingsLink } from '@proton/components/components';
import { PLANS } from '@proton/shared/lib/constants';

import useCancellationTelemetry, { REACTIVATE_SOURCE } from './useCancellationTelemetry';

interface Props extends ModalProps {
    plan: PLANS;
    planName: string;
}

const CancelRedirectionModal = ({ planName, plan, ...props }: Props) => {
    const { sendResubscribeModalResubcribeReport, sendResubscribeModalCloseReport } = useCancellationTelemetry();
    const isCancellationExtended = useFlag('ExtendCancellationProcess');

    const ResubscribeButton = () => {
        if (plan === PLANS.VISIONARY && !isCancellationExtended) {
            return null;
        }

        const path = isCancellationExtended
            ? `/dashboard?source=${REACTIVATE_SOURCE.cancellationFlow}#your-subscriptions`
            : `/dashboard/upgrade?plan=${plan}&target=compare`;

        return (
            <ButtonLike
                as={SettingsLink}
                onClick={() => {
                    sendResubscribeModalResubcribeReport();
                }}
                fullWidth
                path={path}
                color="norm"
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
                    path="/dashboard"
                >{c('Subscription reminder').t`Close`}</ButtonLike>,
            ]}
        >
            <p>{text}</p>
        </Prompt>
    );
};

export default CancelRedirectionModal;
