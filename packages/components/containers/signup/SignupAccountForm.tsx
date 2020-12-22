import React, { useRef, useState, ChangeEvent } from 'react';
import { Link } from 'react-router-dom';
import { c } from 'ttag';
import { USERNAME_PLACEHOLDER } from 'proton-shared/lib/constants';
import {
    Input,
    EmailInput,
    PasswordInput,
    PrimaryButton,
    InlineLinkButton,
    Label,
    Challenge,
    FullLoader,
} from '../../components';
import { useLoading } from '../../hooks';

import { SignupModel, SignupErrors } from './interfaces';
import { SIGNUP_STEPS } from './constants';
import InsecureEmailInfo from './InsecureEmailInfo';
import { ChallengeRef, ChallengeResult } from '../../components/challenge/ChallengeFrame';
import SignupSubmitRow from './SignupSubmitRow';
import SignupLabelInputRow from './SignupLabelInputRow';

interface Props {
    model: SignupModel;
    onChange: (model: SignupModel) => void;
    onSubmit: (payload: ChallengeResult) => void;
    errors: SignupErrors;
    hasExternalSignup?: boolean;
    loading: boolean;
}

const { ACCOUNT_CREATION_USERNAME, ACCOUNT_CREATION_EMAIL } = SIGNUP_STEPS;

const SignupAccountForm = ({ model, onChange, onSubmit, errors, loading, hasExternalSignup }: Props) => {
    const challengeRefLogin = useRef<ChallengeRef>();
    const [loadingChallenge, withLoadingChallenge] = useLoading();
    const [challengeLoading, setChallengeLoading] = useState(true);
    const [isSubmitted, setIsSubmitted] = useState(false);

    const [availableDomain = ''] = model.domains;
    const loginLink = <Link key="loginLink" to="/login">{c('Link').t`Sign in`}</Link>;
    const disableSubmit = !!(
        (model.step === ACCOUNT_CREATION_USERNAME && errors.username) ||
        (model.step === ACCOUNT_CREATION_EMAIL && errors.email) ||
        errors.password ||
        errors.confirmPassword
    );

    const handleSubmit = async () => {
        if (disableSubmit) {
            return;
        }
        setIsSubmitted(true);
        const payload = await challengeRefLogin.current?.getChallenge();
        onSubmit(payload);
    };

    const handleChallengeLoaded = () => setChallengeLoading(false);

    const inner = (() => {
        if (model.step === ACCOUNT_CREATION_USERNAME) {
            const challenge = (
                <>
                    <Challenge
                        bodyClassName="signLayout-container"
                        challengeRef={challengeRefLogin}
                        type={0}
                        onLoaded={handleChallengeLoaded}
                    >
                        <div className="flex flex-nowrap flex-items-center flex-item-fluid relative mb0-5">
                            <div className="flex-item-fluid">
                                <Input
                                    id="login"
                                    name="login"
                                    autoFocus
                                    autoComplete="off"
                                    autoCapitalize="off"
                                    autoCorrect="off"
                                    value={model.username}
                                    isSubmitted={isSubmitted}
                                    onChange={({ target }: ChangeEvent<HTMLInputElement>) =>
                                        onChange({ ...model, username: target.value })
                                    }
                                    onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                                        if (e.key === 'Enter') {
                                            // formRef.submit does not trigger handler
                                            withLoadingChallenge(handleSubmit());
                                        }
                                    }}
                                    error={errors.username}
                                    placeholder={USERNAME_PLACEHOLDER}
                                    className="pm-field--username"
                                    required
                                />
                            </div>
                            <span className="flex right-text absolute">
                                <span className="right-text-inner mauto">@{availableDomain}</span>
                            </span>
                        </div>
                    </Challenge>
                    {hasExternalSignup ? (
                        <InlineLinkButton
                            className="nodecoration mt0-25"
                            id="existing-email-button"
                            onClick={() => onChange({ ...model, username: '', step: ACCOUNT_CREATION_EMAIL })}
                        >{c('Action').t`Use your current email address instead`}</InlineLinkButton>
                    ) : null}
                </>
            );
            return (
                <SignupLabelInputRow
                    label={<Label htmlFor="login">{c('Signup label').t`Username`}</Label>}
                    input={challenge}
                />
            );
        }

        if (model.step === ACCOUNT_CREATION_EMAIL) {
            const challenge = (
                <>
                    <div className="flex-item-fluid">
                        <Challenge
                            bodyClassName="signLayout-container"
                            challengeRef={challengeRefLogin}
                            type={0}
                            onLoad={handleChallengeLoaded}
                        >
                            <EmailInput
                                id="login"
                                name="login"
                                autoFocus
                                autoComplete="off"
                                autoCapitalize="off"
                                autoCorrect="off"
                                value={model.email}
                                isSubmitted={isSubmitted}
                                onChange={({ target }: ChangeEvent<HTMLInputElement>) =>
                                    onChange({ ...model, email: target.value })
                                }
                                onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                                    if (e.key === 'Enter') {
                                        withLoadingChallenge(handleSubmit());
                                    }
                                }}
                                error={errors.email}
                                required
                            />
                        </Challenge>
                    </div>
                    <InsecureEmailInfo email={model.email} />
                    <InlineLinkButton
                        id="proton-email-button"
                        className="nodecoration mt0-25"
                        onClick={() => onChange({ ...model, email: '', step: ACCOUNT_CREATION_USERNAME })}
                    >{c('Action').t`Create a secure ProtonMail address instead`}</InlineLinkButton>
                </>
            );
            return (
                <SignupLabelInputRow
                    label={<Label htmlFor="login">{c('Signup label').t`Email`}</Label>}
                    input={challenge}
                />
            );
        }

        return null;
    })();

    return (
        <>
            {challengeLoading ? (
                <div className="aligncenter">
                    <FullLoader className="color-primary" size={200} />
                </div>
            ) : null}
            <form
                name="accountForm"
                className="signup-form"
                hidden={challengeLoading}
                onSubmit={(e) => {
                    e.preventDefault();
                    withLoadingChallenge(handleSubmit());
                }}
                autoComplete="off"
                method="post"
            >
                {inner}
                <div className="flex flex-nowrap onmobile-flex-column mb2">
                    <SignupLabelInputRow
                        className="mr0-5"
                        label={<Label htmlFor="password">{c('Signup label').t`Password`}</Label>}
                        input={
                            <PasswordInput
                                id="password"
                                name="password"
                                autoComplete="off"
                                autoCapitalize="off"
                                autoCorrect="off"
                                value={model.password}
                                onChange={({ target }: ChangeEvent<HTMLInputElement>) =>
                                    onChange({ ...model, password: target.value })
                                }
                                error={errors.password}
                                required
                            />
                        }
                    />
                    <SignupLabelInputRow
                        className="ml0-5 onmobile-ml0"
                        label={<Label htmlFor="password-repeat">{c('Signup label').t`Confirm`}</Label>}
                        input={
                            <PasswordInput
                                id="password-repeat"
                                name="password-repeat"
                                autoComplete="off"
                                autoCapitalize="off"
                                autoCorrect="off"
                                value={model.confirmPassword}
                                onChange={({ target }: ChangeEvent<HTMLInputElement>) =>
                                    onChange({ ...model, confirmPassword: target.value })
                                }
                                error={errors.confirmPassword}
                                required
                            />
                        }
                    />
                </div>
                <SignupSubmitRow>
                    <PrimaryButton
                        className="pm-button--large flex-item-noshrink onmobile-w100"
                        loading={loading || loadingChallenge}
                        disabled={disableSubmit}
                        type="submit"
                    >{c('Action').t`Create account`}</PrimaryButton>
                </SignupSubmitRow>
                <div className="alignright">
                    <span>{c('Info').jt`Already have an account? ${loginLink}`}</span>
                </div>
            </form>
        </>
    );
};

export default SignupAccountForm;
