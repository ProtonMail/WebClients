import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { c } from 'ttag';
import {
    Button,
    InlineLinkButton,
    Challenge,
    useLoading,
    FormField,
    PasswordInputTwo,
    InputTwo,
    Icons,
    useFormErrors,
} from 'react-components';
import { noop } from 'proton-shared/lib/helpers/function';
import { ChallengeRef, ChallengeResult } from 'react-components/components/challenge/ChallengeFrame';
import { queryCheckUsernameAvailability, queryVerificationCode } from 'proton-shared/lib/api/user';
import { API_CUSTOM_ERROR_CODES } from 'proton-shared/lib/errors';
import { getApiErrorMessage } from 'proton-shared/lib/api/helpers/apiErrorHelper';
import { requiredValidator, emailValidator, confirmPasswordValidator } from 'proton-shared/lib/helpers/formValidators';

import { HumanApi } from './helpers/humanApi';
import InsecureEmailInfo from './InsecureEmailInfo';
import ButtonSpacer from '../public/ButtonSpacer';
import { SignupModel } from './interfaces';
import Loader from './Loader';

interface Props {
    model: SignupModel;
    onChange: (model: Partial<SignupModel>) => void;
    hasExternalSignup?: boolean;
    domains: string[];
    humanApi: HumanApi;
    hasChallenge?: boolean;
    onSubmit: (args: ChallengeResult) => void;
}

const CreateAccountForm = ({
    model,
    onChange,
    humanApi,
    onSubmit,
    hasExternalSignup,
    hasChallenge = true,
    domains,
}: Props) => {
    const challengeRefLogin = useRef<ChallengeRef>();
    const [loading, withLoading] = useLoading();
    const [challengeLoading, setChallengeLoading] = useState(hasChallenge);
    const [usernameError, setUsernameError] = useState('');

    const getOnChange = (field: keyof SignupModel) => (value: string) => onChange({ [field]: value });

    const { validator, onFormSubmit } = useFormErrors();

    const { username, email, password, confirmPassword, signupType } = model;

    const handleSubmitUsername = async () => {
        try {
            await humanApi.api({
                ...queryCheckUsernameAvailability(username),
                silence: [
                    API_CUSTOM_ERROR_CODES.HUMAN_VERIFICATION_REQUIRED,
                    API_CUSTOM_ERROR_CODES.USER_EXISTS_USERNAME_ALREADY_USED,
                ],
            });
        } catch (error) {
            const errorText = getApiErrorMessage(error) || c('Error').t`Can't check username, try again later`;
            setUsernameError(errorText);
            throw error;
        }
    };

    useEffect(() => {
        humanApi.clearToken();
    }, []);

    const run = async () => {
        if (signupType === 'email') {
            await humanApi.api(queryVerificationCode('email', { Address: email }));
        } else {
            await handleSubmitUsername();
        }

        const payload = await challengeRefLogin.current?.getChallenge();
        onSubmit(payload);
    };

    const handleChallengeLoaded = () => {
        setChallengeLoading(false);
    };

    const [availableDomain = ''] = domains;
    const loginLink = <Link key="loginLink" to="/login">{c('Link').t`Sign in`}</Link>;

    const handleSubmit = () => {
        if (loading || !onFormSubmit()) {
            return;
        }
        withLoading(run()).catch(noop);
    };

    const setUsername = getOnChange('username');
    const setEmail = getOnChange('email');
    const setPassword = getOnChange('password');
    const setConfirmPassword = getOnChange('confirmPassword');

    const innerChallenge =
        signupType === 'username' ? (
            <FormField
                id="username"
                bigger
                label={c('Signup label').t`Username`}
                error={validator(signupType === 'username' ? [requiredValidator(username), usernameError] : [])}
            >
                <InputTwo
                    disableChange={loading}
                    autoFocus
                    autoComplete="username"
                    suffix={`@${availableDomain}`}
                    value={username}
                    onValue={(value) => {
                        setUsernameError('');
                        setUsername(value);
                    }}
                    onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                        if (e.key === 'Enter') {
                            // formRef.submit does not trigger handler
                            handleSubmit();
                        }
                    }}
                />
            </FormField>
        ) : (
            <div className="flex-item-fluid">
                <FormField
                    id="email"
                    bigger
                    label={c('Signup label').t`Email`}
                    error={validator(signupType === 'email' ? [requiredValidator(email), emailValidator(email)] : [])}
                >
                    <InputTwo
                        disableChange={loading}
                        type="email"
                        value={email}
                        onValue={setEmail}
                        onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                            if (e.key === 'Enter') {
                                handleSubmit();
                            }
                        }}
                    />
                </FormField>
                <InsecureEmailInfo email={email} />
            </div>
        );

    return (
        <>
            {challengeLoading ? (
                <div className="text-center">
                    <Loader />
                </div>
            ) : null}
            <form
                name="accountForm"
                className="signup-form"
                style={
                    challengeLoading
                        ? {
                              position: 'absolute',
                              top: '-1000px',
                              left: '-1000px',
                          }
                        : undefined
                }
                onSubmit={(e) => {
                    e.preventDefault();
                    return handleSubmit();
                }}
                autoComplete="off"
                method="post"
            >
                {hasChallenge ? (
                    <Challenge
                        bodyClassName="sign-layout-container"
                        loaderClassName="center flex"
                        challengeRef={challengeRefLogin}
                        type={0}
                        onLoaded={handleChallengeLoaded}
                    >
                        <Icons />
                        {innerChallenge}
                    </Challenge>
                ) : (
                    innerChallenge
                )}
                {hasExternalSignup ? (
                    <div className="text-center mb1-5">
                        <InlineLinkButton
                            className="text-no-decoration mt0-25"
                            id="existing-email-button"
                            onClick={() => {
                                // Reset verification parameters if email is changed
                                humanApi.clearToken();
                                onChange({
                                    signupType: signupType === 'email' ? 'username' : 'email',
                                    username: '',
                                    email: '',
                                });
                            }}
                        >
                            {signupType === 'email'
                                ? c('Action').t`Create a secure ProtonMail address instead`
                                : c('Action').t`Use your current email address instead`}
                        </InlineLinkButton>
                    </div>
                ) : null}
                <FormField
                    id="password"
                    label={c('Label').t`Password`}
                    error={validator([requiredValidator(password)])}
                    bigger
                >
                    <PasswordInputTwo
                        disableChange={loading}
                        autoComplete="new-password"
                        value={password}
                        onValue={setPassword}
                    />
                </FormField>

                <FormField
                    id="repeat-password"
                    label={c('Label').t`Repeat password`}
                    error={validator([
                        requiredValidator(confirmPassword),
                        confirmPasswordValidator(confirmPassword, password),
                    ])}
                    bigger
                >
                    <PasswordInputTwo
                        disableChange={loading}
                        autoComplete="new-password"
                        value={confirmPassword}
                        onValue={setConfirmPassword}
                    />
                </FormField>
                <ButtonSpacer>
                    <Button size="large" color="norm" type="submit" fullWidth loading={loading}>
                        {c('Action').t`Create account`}
                    </Button>
                </ButtonSpacer>
                <ButtonSpacer mode="text">{c('Info').jt`Already have an account? ${loginLink}`}</ButtonSpacer>
            </form>
        </>
    );
};
export default CreateAccountForm;
