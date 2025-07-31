import { type FC, useState } from 'react';
import { Link } from 'react-router-dom';

import { c } from 'ttag';

import { Button, InlineLinkButton } from '@proton/atoms/src';
import { useNotifyErrorHandler } from '@proton/components/hooks/useErrorHandler';
import { MailLogo } from '@proton/components/index';
import { IcShield2CheckFilled } from '@proton/icons';
import { PASS_APP_NAME } from '@proton/shared/lib/constants';
import noop from '@proton/utils/noop';

import { SignupType } from '../../../../signup/interfaces';
import { usePasswordInputInline } from '../../../accountDetailsInputs/password/usePasswordInput';
import useEmailInput from '../../../accountDetailsInputs/username/useEmailInput';
import { useSignup } from '../../../context/SignupContext';
import { Layout } from '../components/Layout/Layout';
import { Step, useFlow } from '../contexts/FlowContext';
import { AccountDetailsAside } from './AccountDetailsAside';

const SwitchSignupType = () => {
    const signup = useSignup();

    const { availableSignupTypes, selectedSignupType, focusEmail } = signup.accountForm;

    if (availableSignupTypes.size <= 1) return null;

    const handleSwitchType = (signupType: SignupType) => {
        signup.accountForm.setSignupType(signupType);
        focusEmail(signupType);
    };

    const externalButton = (
        <InlineLinkButton
            key="external-account-switch"
            onClick={() => handleSwitchType(SignupType.Proton)}
            className="color-primary"
        >
            {c('Signup').t`Get a new encrypted email for free`}
        </InlineLinkButton>
    );

    const internalButton = (
        <InlineLinkButton
            key="internal-account-switch"
            onClick={() => handleSwitchType(SignupType.External)}
            className="color-primary"
        >
            {c('Signup').t`Use your current email`}
        </InlineLinkButton>
    );

    return (
        <p className="mt-0 mb-6 mr-auto flex flex-nowrap gap-1 items-center">
            <MailLogo variant="glyph-only" size={6} />
            {selectedSignupType === SignupType.External ? externalButton : internalButton}
        </p>
    );
};

export const AccountDetailsStep: FC = () => {
    const signup = useSignup();
    const { setStep } = useFlow();
    const notifyError = useNotifyErrorHandler();
    const [loading, setLoading] = useState(false);

    const handleRequestSubmit = () => signup.accountForm.refs.form.current?.requestSubmit();
    const { emailInput, loadingChallenge } = useEmailInput({ autoFocus: true, onSubmit: handleRequestSubmit, loading });
    const { passwordInputs } = usePasswordInputInline({ loading });

    const handleSubmit = async () => {
        try {
            setLoading(true);
            const accountData = await signup.accountForm.getValidAccountData({ passwords: true });
            signup.submitAccountData(accountData);
            setStep(Step.RecoveryKit);
        } catch (error) {
            notifyError(error);
        } finally {
            setLoading(false);
        }
    };

    const signIn = (
        <Link key="signin" className="link link-focus text-nowrap" to={signup.loginUrl}>
            {c('Link').t`Sign in`}
        </Link>
    );

    return (
        <Layout aside={<AccountDetailsAside />}>
            <form
                ref={signup.accountForm.refs.form}
                name="accountForm"
                onSubmit={(e) => {
                    e.preventDefault();
                    if (loading) return;
                    handleSubmit().catch(noop);
                }}
                method="post"
                autoComplete="off"
                noValidate
                className="w-full"
            >
                <h1 className="text-5xl text-bold text-center mb-10">{c('Signup').t`Start using ${PASS_APP_NAME}`}</h1>

                {emailInput}

                <SwitchSignupType />

                <div className="fade-in-up">{passwordInputs}</div>

                <Button
                    loading={loading}
                    disabled={loadingChallenge}
                    noDisabledStyles={loadingChallenge}
                    size="large"
                    color="norm"
                    type="submit"
                    fullWidth
                    pill
                    className="mt-2 py-4 text-semibold"
                >
                    {c('Action').t`Create free account now`}
                </Button>

                <div className="text-center mt-4">
                    <span className="color-success">
                        <IcShield2CheckFilled className="align-text-bottom mr-1" />
                        <span>{c('Info').t`End-to-end encrypted`}</span>
                    </span>
                </div>

                <footer className="mt-8">
                    <div className="mt-4 text-sm color-weak text-center">
                        {c('Go to sign in').jt`Already have an account? ${signIn}`}
                    </div>
                </footer>
            </form>
        </Layout>
    );
};
