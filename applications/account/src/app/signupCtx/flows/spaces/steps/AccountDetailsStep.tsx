import { useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { SPACES_APP_NAME } from '@proton/shared/lib/constants';
import noop from '@proton/utils/noop';

import { usePasswordInputSpotlight } from '../../../containers/password/usePasswordInput';
import useEmailInput from '../../../containers/username/useEmailInput';
import { useSignup } from '../../../context/SignupContext';
import Layout from '../components/Layout';
import Terms from '../components/Terms';
import Title from '../components/Title';

interface Props {
    signInUrl: string;
    isInvited: boolean;
    inviter?: string;
    spaceName?: string;
    spaceDescription?: string;
    onSuccess: () => Promise<void>;
}

const AccountDetailsStep = ({ signInUrl, isInvited, inviter, spaceName, spaceDescription, onSuccess }: Props) => {
    const signup = useSignup();
    const [submitting, setSubmitting] = useState(false);

    const { emailInput, loadingChallenge } = useEmailInput({
        autoFocus: !isInvited,
        onSubmit: () => signup.accountForm.refs.form.current?.requestSubmit(),
        loading: submitting,
        emailReadOnly: isInvited,
        inputClassName: 'spaces-signup-input',
    });
    const { passwordInputs } = usePasswordInputSpotlight({ loading: submitting });

    const handleSubmit = async () => {
        try {
            setSubmitting(true);
            await signup.accountForm.getIsValid({ passwords: false });
            const accountData = await signup.accountForm.getValidAccountData({ passwords: true });
            signup.submitAccountData(accountData);
            await onSuccess();
        } catch {
            // Ignore, not valid
        } finally {
            setSubmitting(false);
        }
    };

    const signIn = (
        <a key="signin" className="link link-focus text-nowrap" href={signInUrl}>
            {c('Link').t`Sign in`}
        </a>
    );

    const showInvitePanel = isInvited && !!inviter;

    const getTitle = () => {
        if (showInvitePanel) {
            return c('chat_2025: Spaces').t`Create an account to join`;
        }
        if (isInvited) {
            return c('chat_2025: Spaces').t`You're invited to join ${SPACES_APP_NAME}`;
        }
        return c('chat_2025: Spaces').t`Get started`;
    };
    const title = getTitle();

    return (
        <Layout invite={showInvitePanel ? { inviter, spaceName, spaceDescription } : undefined}>
            <form
                ref={signup.accountForm.refs.form}
                name="accountForm"
                onSubmit={(e) => {
                    e.preventDefault();
                    if (submitting) {
                        return;
                    }
                    handleSubmit().catch(noop);
                }}
                method="post"
                autoComplete="off"
                noValidate
                className="w-full"
            >
                <Title>{title}</Title>

                {emailInput}
                {passwordInputs}

                <Button
                    loading={submitting}
                    disabled={loadingChallenge}
                    noDisabledStyles={loadingChallenge}
                    size="large"
                    color="norm"
                    type="submit"
                    fullWidth
                    className="mt-6"
                >
                    {c('Action').t`Create account`}
                </Button>
                <Terms />
                <hr className="my-6 border-weak" />
                <p className="m-0 text-center color-weak">{c('chat_2025: Spaces')
                    .jt`Already have an account? ${signIn}`}</p>
            </form>
        </Layout>
    );
};

export default AccountDetailsStep;
