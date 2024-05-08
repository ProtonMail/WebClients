import { c } from 'ttag';

import { ButtonLike } from '@proton/atoms/Button';
import { ModalProps, Prompt, SettingsLink } from '@proton/components/components';
import { PLANS } from '@proton/shared/lib/constants';

interface Props extends ModalProps {
    text: string;
    plan: PLANS;
}

const CancelRedirectionModal = ({ text, plan, ...props }: Props) => {
    const ResubscribeButton = () => {
        if (plan === PLANS.NEW_VISIONARY) {
            return null;
        }

        return (
            <ButtonLike
                as={SettingsLink}
                fullWidth
                path={`/dashboard/upgrade?plan=${plan}&target=compare`}
                color="norm"
            >{c('Subscription reminder').t`Resubscribe`}</ButtonLike>
        );
    };

    return (
        <Prompt
            {...props}
            title={c('Subscription reminder').t`Subscription canceled`}
            data-testid="cancellation-reminder-redirection"
            buttons={[
                <ResubscribeButton />,
                <ButtonLike as={SettingsLink} path="/dashboard">{c('Subscription reminder').t`Close`}</ButtonLike>,
            ]}
        >
            <p>{text}</p>
        </Prompt>
    );
};

export default CancelRedirectionModal;
