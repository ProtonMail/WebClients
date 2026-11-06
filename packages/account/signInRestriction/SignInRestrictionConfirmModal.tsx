import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import Prompt, { type PromptProps } from '@proton/components/components/prompt/Prompt';
import getBoldFormattedText from '@proton/components/helpers/getBoldFormattedText';

import type { getSignInIdentifiers } from './helpers';

interface Props extends Omit<PromptProps, 'children' | 'buttons' | 'title'> {
    identifiers: ReturnType<typeof getSignInIdentifiers>;
    onConfirm: () => void;
}

const getUsernameAndAddressesDescription = (username: string, signInDomains: string[]) => {
    const [firstDomain, secondDomain, thirdDomain] = signInDomains;
    const firstEmail = `${username}@${firstDomain}`;

    if (thirdDomain) {
        // translator: full sentence is: By turning this on, you’ll only be able to sign in with your original username <eric.norbert>, either on its own or as <eric.norbert@proton.me>, <@protonmail.com>, or <@protonmail.ch>.
        return c('Info')
            .t`By turning this on, you’ll only be able to sign in with your original username **${username}**, either on its own or as **${firstEmail}**, **@${secondDomain}**, or **@${thirdDomain}**.`;
    }

    if (secondDomain) {
        // translator: full sentence is: By turning this on, you’ll only be able to sign in with your original username <eric.norbert>, either on its own or as <eric.norbert@proton.me>, or <@protonmail.com>.
        return c('Info')
            .t`By turning this on, you’ll only be able to sign in with your original username **${username}**, either on its own or as **${firstEmail}**, or **@${secondDomain}**.`;
    }

    // translator: full sentence is: By turning this on, you’ll only be able to sign in with your original username <eric.norbert>, either on its own or as <eric.norbert@proton.me>.
    return c('Info')
        .t`By turning this on, you’ll only be able to sign in with your original username **${username}**, either on its own or as **${firstEmail}**.`;
};

const getDescription = ({ username, primaryEmail, signInDomains }: ReturnType<typeof getSignInIdentifiers>) => {
    if (!username) {
        // translator: full sentence is: By turning this on, you’ll only be able to sign in with <eric.norbert@proton.me>.
        return c('Info').t`By turning this on, you’ll only be able to sign in with **${primaryEmail}**.`;
    }

    if (!signInDomains.length) {
        // translator: full sentence is: By turning this on, you’ll only be able to sign in with your username <eric.norbert>.
        return c('Info').t`By turning this on, you’ll only be able to sign in with your username **${username}**.`;
    }

    return getUsernameAndAddressesDescription(username, signInDomains);
};

// Prompt fires its Enter/Space hotkey on the first non-danger button regardless of focus,
// so a focused Cancel would still confirm. A focused button handles its own activation.
const isPromptHotkeyOnFocusedButton = (event: Pick<Event, 'type' | 'target'>) =>
    event.type === 'keydown' && event.target instanceof Element && event.target.closest('button') !== null;

const SignInRestrictionConfirmModal = ({ identifiers, onConfirm, ...rest }: Props) => {
    const handleConfirm = (event: Pick<Event, 'type' | 'target'>) => {
        if (isPromptHotkeyOnFocusedButton(event)) {
            return;
        }
        onConfirm();
    };

    return (
        <Prompt
            {...rest}
            title={c('Title').t`Restrict sign-in?`}
            buttons={[
                <Button color="warning" onClick={handleConfirm}>
                    {c('Action').t`Restrict sign-in`}
                </Button>,
                <Button onClick={rest.onClose}>{c('Action').t`Cancel`}</Button>,
            ]}
        >
            <p className="mt-0">{getBoldFormattedText(getDescription(identifiers), 'text-break')}</p>
            {identifiers.primaryEmail && (
                <p className="mb-0">{c('Info')
                    .t`Your other email addresses won’t work for sign-in until you turn this off.`}</p>
            )}
        </Prompt>
    );
};

export default SignInRestrictionConfirmModal;
