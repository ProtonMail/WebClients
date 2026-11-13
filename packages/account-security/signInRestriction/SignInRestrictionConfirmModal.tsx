import { c } from 'ttag';

import type { getSignInIdentifiers } from '@proton/account/signInRestriction/helpers';
import { Button } from '@proton/atoms/Button/Button';
import Prompt, { type PromptProps } from '@proton/components/components/prompt/Prompt';
import getBoldFormattedText from '@proton/components/helpers/getBoldFormattedText';

interface Props extends Omit<PromptProps, 'children' | 'buttons' | 'title'> {
    identifiers: ReturnType<typeof getSignInIdentifiers>;
    onConfirm: () => void;
}

const getUsernameAndAddressesDescription = (username: string, signInDomains: string[]) => {
    const [firstEmail, secondEmail, thirdEmail] = signInDomains.map((domain) => `${username}@${domain}`);

    if (thirdEmail) {
        // translator: full sentence is: By turning this on, you’ll only be able to sign in with your username, <eric.norbert>, or with <eric.norbert@proton.me>, <eric.norbert@protonmail.com>, or <eric.norbert@protonmail.ch>.
        return c('Info')
            .t`By turning this on, you’ll only be able to sign in with your username, **${username}**, or with **${firstEmail}**, **${secondEmail}**, or **${thirdEmail}**.`;
    }

    if (secondEmail) {
        // translator: full sentence is: By turning this on, you’ll only be able to sign in with your username, <eric.norbert>, or with <eric.norbert@proton.me> or <eric.norbert@protonmail.com>.
        return c('Info')
            .t`By turning this on, you’ll only be able to sign in with your username, **${username}**, or with **${firstEmail}** or **${secondEmail}**.`;
    }

    // translator: full sentence is: By turning this on, you’ll only be able to sign in with your username, <eric.norbert>, or with <eric.norbert@proton.me>.
    return c('Info')
        .t`By turning this on, you’ll only be able to sign in with your username, **${username}**, or with **${firstEmail}**.`;
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

const SignInRestrictionConfirmModal = ({ identifiers, onConfirm, ...rest }: Props) => {
    return (
        <Prompt
            {...rest}
            title={c('Title').t`Restrict sign-in?`}
            buttons={[
                <Button color="warning" onClick={onConfirm}>
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
