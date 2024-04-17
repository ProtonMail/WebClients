import { c } from 'ttag';

import { ButtonLike } from '@proton/atoms/Button';
import { ModalProps, Prompt, SettingsLink } from '@proton/components/components';
import { PLANS } from '@proton/shared/lib/constants';

interface Props extends ModalProps {
    text: string;
    plan: PLANS;
}

const CancelRedirectionModal = ({ text, plan, ...props }: Props) => {
    return (
        <Prompt
            {...props}
            title={c('Subscription reminder').t`Subscription canceled`}
            data-testid="cancellation-reminder-redirection"
            buttons={[
                <ButtonLike as={SettingsLink} path={`/dashboard/upgrade?plan=${plan}&target=compare`} color="norm">{c(
                    'Subscription reminder'
                ).t`Resubscribe`}</ButtonLike>,
                <ButtonLike as={SettingsLink} path="/dashboard">{c('Subscription reminder').t`Close`}</ButtonLike>,
            ]}
        >
            <p>{text}</p>
        </Prompt>
    );
};

export default CancelRedirectionModal;
