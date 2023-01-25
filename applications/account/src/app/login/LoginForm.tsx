import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import {
    Challenge,
    ChallengeError,
    ChallengeRef,
    ChallengeResult,
    Checkbox,
    Href,
    Info,
    InputFieldTwo,
    Label,
    PasswordInputTwo,
    useConfig,
    useFormErrors,
    useLoading,
    useLocalState,
} from '@proton/components';
import { Icon } from '@proton/components';
import { getIsVPNApp } from '@proton/shared/lib/authentication/apps';
import { APP_NAMES, BRAND_NAME, SSO_PATHS } from '@proton/shared/lib/constants';
import { requiredValidator } from '@proton/shared/lib/helpers/formValidators';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';
import noop from '@proton/utils/noop';

import SupportDropdown from '../public/SupportDropdown';
import { defaultPersistentKey } from '../public/helper';
import Loader from '../signup/Loader';

interface Props {
    onSubmit: (data: {
        username: string;
        password: string;
        persistent: boolean;
        payload: ChallengeResult;
    }) => Promise<void>;
    toApp?: APP_NAMES;
    signInText?: string;
    defaultUsername?: string;
    hasRemember?: boolean;
    trustedDeviceRecoveryFeature?: { loading?: boolean; feature: { Value: boolean } | undefined };
    signupOptions: Record<string, string | number | undefined>;
}

const LoginForm = ({
    onSubmit,
    toApp,
    defaultUsername = '',
    signInText = c('Action').t`Sign in`,
    hasRemember,
    trustedDeviceRecoveryFeature,
    signupOptions = {},
}: Props) => {
    const { APP_NAME } = useConfig();
    const [submitting, withSubmitting] = useLoading();
    const [username, setUsername] = useState(defaultUsername);
    const [password, setPassword] = useState('');
    const [persistent, setPersistent] = useLocalState(false, defaultPersistentKey);

    const usernameRef = useRef<HTMLInputElement>(null);
    const challengeRefLogin = useRef<ChallengeRef>();
    const [challengeLoading, setChallengeLoading] = useState(true);
    const [challengeError, setChallengeError] = useState(false);

    const isVPN = getIsVPNApp(APP_NAME) || getIsVPNApp(toApp);

    const loading = Boolean(challengeLoading || trustedDeviceRecoveryFeature?.loading);

    useEffect(() => {
        if (loading) {
            return;
        }
        usernameRef.current?.focus();
    }, [loading]);

    const { validator, onFormSubmit } = useFormErrors();

    if (challengeError) {
        return <ChallengeError />;
    }

    const learnMore = (
        <Href
            className="color-inherit inline-block"
            key="learn-more"
            url={getKnowledgeBaseUrl('/how-to-access-protonmail-in-private-incognito-mode')}
        >
            {c('Info').t`Learn more`}
        </Href>
    );

    const keepMeSignedInLearnMoreLink = (
        <Href className="color-inherit inline-block" key="learn-more" url={getKnowledgeBaseUrl('/keep-me-signed-in')}>
            {c('Info').t`Why?`}
        </Href>
    );

    const signUpParams: Record<string, string> = {};

    Object.keys(signupOptions).forEach(key => {
        if (typeof signupOptions[key] !== 'undefined') {
            signUpParams[key] = `${signupOptions[key]}`;
        }
    });

    const signUp = (
        <Link
            key="signup"
            className="link text-nowrap"
            to={SSO_PATHS.SIGNUP + (Object.keys(signUpParams).length
                ? '?' + new URLSearchParams(signUpParams).toString()
                : ''
            )}
        >
            {c('Link').t`Create account`}
        </Link>
    );

    const handleSubmit = () => {
        if (submitting || !onFormSubmit()) {
            return;
        }
        const run = async () => {
            const payload = await challengeRefLogin.current?.getChallenge();
            return onSubmit({ username, password, persistent, payload });
        };
        withSubmitting(run()).catch(noop);
    };

    return (
        <>
            {loading && (
                <div className="text-center absolute absolute-center">
                    <Loader />
                </div>
            )}
            <form
                name="loginForm"
                className={loading ? 'visibility-hidden' : undefined}
                onSubmit={(event) => {
                    event.preventDefault();
                    handleSubmit();
                }}
                method="post"
            >
                <Challenge
                    className="h0 absolute"
                    noLoader
                    empty
                    tabIndex={-1}
                    challengeRef={challengeRefLogin}
                    type={0}
                    name="login"
                    onSuccess={() => {
                        setChallengeLoading(false);
                    }}
                    onError={() => {
                        setChallengeLoading(false);
                        setChallengeError(true);
                    }}
                />
                <InputFieldTwo
                    id="username"
                    bigger
                    label={isVPN ? c('Label').t`${BRAND_NAME} email or username` : c('Label').t`Email or username`}
                    error={validator([requiredValidator(username)])}
                    disableChange={submitting}
                    autoComplete="username"
                    value={username}
                    onValue={setUsername}
                    ref={usernameRef}
                />
                <InputFieldTwo
                    id="password"
                    bigger
                    label={c('Label').t`Password`}
                    error={validator([requiredValidator(password)])}
                    as={PasswordInputTwo}
                    disableChange={submitting}
                    autoComplete="current-password"
                    value={password}
                    onValue={setPassword}
                    rootClassName="mt0-5"
                />

                {hasRemember && (
                    <div className="flex flex-row flex-align-items-start">
                        <Checkbox
                            id="staySignedIn"
                            className="mt0-5 mr0-5"
                            checked={persistent}
                            onChange={submitting ? noop : () => setPersistent(!persistent)}
                        />

                        {trustedDeviceRecoveryFeature?.feature?.Value ? (
                            <div className="flex-item-fluid">
                                <Label htmlFor="staySignedIn" className="flex flex-align-items-center">
                                    {c('Label').t`Keep me signed in`}
                                </Label>
                                <div className="color-weak">
                                    {c('Info').jt`Recommended on trusted devices. ${keepMeSignedInLearnMoreLink}`}
                                </div>
                            </div>
                        ) : (
                            <div className="flex-item-fluid">
                                <Label htmlFor="staySignedIn" className="flex flex-align-items-center">
                                    <span className="pr0-5">{c('Label').t`Keep me signed in`}</span>
                                    <span className="flex">
                                        <Info
                                            title={c('Info').t`You'll stay signed in even after you close the browser.`}
                                        />
                                    </span>
                                </Label>
                                <div className="color-weak">
                                    {c('Info')
                                        .jt`Not your device? Use a private browsing window to sign in and close it when done. ${learnMore}`}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                <Button size="large" color="norm" type="submit" fullWidth loading={submitting} className="mt1-5">
                    {
                        // translator: when the "sign in" button is in loading state, it gets updated to "Signing in"
                        submitting ? c('Action').t`Signing in` : signInText
                    }
                </Button>

                <div className="text-center mt1-25">
                    {
                        // translator: Full sentence "New to Proton? Create account"
                        c('Go to sign up').jt`New to ${BRAND_NAME}? ${signUp}`
                    }
                </div>

                <hr className="my1-25" />

                <div className="text-center">
                    <SupportDropdown content={c('Link').t`Trouble signing in?`}>
                        <Link
                            to={SSO_PATHS.RESET_PASSWORD}
                            className="dropdown-item-link w100 pr1 pl1 pt0-5 pb0-5 block text-no-decoration text-left"
                        >
                            <Icon name="user-circle" className="mr0-5" />
                            {c('Link').t`Reset password`}
                        </Link>
                        <Link
                            to={SSO_PATHS.FORGOT_USERNAME}
                            className="dropdown-item-link w100 pr1 pl1 pt0-5 pb0-5 block text-no-decoration text-left"
                        >
                            <Icon name="key" className="mr0-5" />
                            {c('Link').t`Forgot username?`}
                        </Link>
                    </SupportDropdown>
                </div>
            </form>
        </>
    );
};

export default LoginForm;
