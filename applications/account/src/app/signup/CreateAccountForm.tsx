import { useEffect, useRef, useState } from 'react';
import * as React from 'react';
import { Link } from 'react-router-dom';
import { c } from 'ttag';
import {
    Button,
    Challenge,
    useLoading,
    PasswordInputTwo,
    useFormErrors,
    InputFieldTwo,
    LinkButton,
    ChallengeResult,
    ChallengeRef,
    captureChallengeMessage,
    ChallengeError,
} from '@proton/components';
import { noop } from '@proton/shared/lib/helpers/function';
import { queryCheckEmailAvailability, queryCheckUsernameAvailability } from '@proton/shared/lib/api/user';
import { API_CUSTOM_ERROR_CODES } from '@proton/shared/lib/errors';
import { getApiErrorMessage } from '@proton/shared/lib/api/helpers/apiErrorHelper';
import {
    requiredValidator,
    emailValidator,
    passwordLengthValidator,
    confirmPasswordValidator,
    getMinPasswordLengthMessage,
} from '@proton/shared/lib/helpers/formValidators';

import { HumanApi } from './helpers/humanApi';
import InsecureEmailInfo from './InsecureEmailInfo';
import { SignupModel } from './interfaces';
import Loader from './Loader';

interface Props {
    model: SignupModel;
    onChange: (model: Partial<SignupModel>) => void;
    hasExternalSignup?: boolean;
    domains: string[];
    humanApi: HumanApi;
    hasChallenge?: boolean;
    onSubmit: (args: ChallengeResult) => Promise<void>;
    loading?: boolean;
}

const CreateAccountForm = ({
    model,
    onChange,
    humanApi,
    onSubmit,
    hasExternalSignup,
    hasChallenge = true,
    domains,
    loading: loadingDependencies,
}: Props) => {
    const challengeRefLogin = useRef<ChallengeRef>();
    const [loading, withLoading] = useLoading();
    const [challengeLoading, setChallengeLoading] = useState(hasChallenge);
    const [challengeError, setChallengeError] = useState(false);
    const [usernameError, setUsernameError] = useState('');
    const [emailError, setEmailError] = useState('');

    const isLoadingView = challengeLoading || loadingDependencies;

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
        } catch (error: any) {
            const errorText = getApiErrorMessage(error) || c('Error').t`Can't check username, try again later`;
            setUsernameError(errorText);
            throw error;
        }
    };

    const handleSubmitEmail = async () => {
        try {
            await humanApi.api({
                ...queryCheckEmailAvailability(email),
                silence: [API_CUSTOM_ERROR_CODES.HUMAN_VERIFICATION_REQUIRED],
            });
        } catch (error: any) {
            // If the error was human verification required, the user cancelled the verification, and we short circuit it here
            if (error.data?.Code === API_CUSTOM_ERROR_CODES.HUMAN_VERIFICATION_REQUIRED) {
                throw error;
            }
            const errorText = getApiErrorMessage(error) || c('Error').t`Can't check username, try again later`;
            setEmailError(errorText);
            throw error;
        }
    };

    useEffect(() => {
        humanApi.clearToken();
    }, []);

    const run = async () => {
        if (signupType === 'email') {
            await handleSubmitEmail();
        } else {
            await handleSubmitUsername();
        }

        const payload = await challengeRefLogin.current?.getChallenge();
        return onSubmit(payload);
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

    useEffect(() => {
        if (isLoadingView) {
            return;
        }
        // Special focus management for challenge
        challengeRefLogin.current?.focus(signupType === 'username' ? '#username' : '#email');
    }, [signupType, isLoadingView]);

    const innerChallenge =
        signupType === 'username' ? (
            <InputFieldTwo
                id="username"
                bigger
                label={c('Signup label').t`Username`}
                error={validator(signupType === 'username' ? [requiredValidator(username), usernameError] : [])}
                disableChange={loading}
                autoComplete="username"
                autoFocus
                suffix={`@${availableDomain}`}
                value={username}
                onValue={(value: string) => {
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
        ) : (
            <InputFieldTwo
                id="email"
                bigger
                label={c('Signup label').t`Email`}
                error={validator(signupType === 'email' ? [requiredValidator(email), emailValidator(email), emailError] : [])}
                disableChange={loading}
                autoFocus
                type="email"
                value={email}
                onValue={(value: string) => {
                    setEmailError('');
                    setEmail(value);
                }}
                onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                    if (e.key === 'Enter') {
                        handleSubmit();
                    }
                }}
            />
        );

    if (challengeError) {
        return <ChallengeError />;
    }

    return (
        <>
            {isLoadingView && (
                <div className="text-center">
                    <Loader />
                </div>
            )}
            <form
                name="accountForm"
                className={isLoadingView ? 'hidden' : undefined}
                onSubmit={(e) => {
                    e.preventDefault();
                    return handleSubmit();
                }}
                method="post"
                autoComplete="off"
                noValidate
            >
                {hasChallenge ? (
                    <Challenge
                        loaderClassName="center flex"
                        challengeRef={challengeRefLogin}
                        type={0}
                        name="username"
                        onSuccess={(logs) => {
                            setChallengeLoading(false);
                            captureChallengeMessage('Failed to load CreateAccountForm iframe partially', logs);
                        }}
                        onError={(logs) => {
                            setChallengeLoading(false);
                            setChallengeError(true);
                            captureChallengeMessage('Failed to load CreateAccountForm iframe fatally', logs);
                        }}
                    >
                        {innerChallenge}
                    </Challenge>
                ) : (
                    innerChallenge
                )}
                {signupType === 'email' && <InsecureEmailInfo email={email} />}
                {hasExternalSignup ? (
                    <div className="text-center">
                        <LinkButton
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
                        </LinkButton>
                    </div>
                ) : null}
                <InputFieldTwo
                    as={PasswordInputTwo}
                    id="password"
                    label={c('Label').t`Password`}
                    assistiveText={getMinPasswordLengthMessage()}
                    error={validator([passwordLengthValidator(password)])}
                    bigger
                    disableChange={loading}
                    autoComplete="new-password"
                    value={password}
                    onValue={setPassword}
                    rootClassName="mt0-5"
                />
                <InputFieldTwo
                    as={PasswordInputTwo}
                    id="repeat-password"
                    label={c('Label').t`Repeat password`}
                    error={validator([
                        passwordLengthValidator(confirmPassword),
                        confirmPasswordValidator(confirmPassword, password),
                    ])}
                    bigger
                    disableChange={loading}
                    autoComplete="new-password"
                    value={confirmPassword}
                    onValue={setConfirmPassword}
                    rootClassName="mt0-5"
                />
                <Button size="large" color="norm" type="submit" fullWidth loading={loading} className="mt1-75">
                    {c('Action').t`Next`}
                </Button>
                <div className="text-center mt2">{c('Info').jt`Already have an account? ${loginLink}`}</div>
            </form>
        </>
    );
};
export default CreateAccountForm;
