import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';

import { c } from 'ttag';

import { Button, Href } from '@proton/atoms';
import {
    Challenge,
    ChallengeError,
    ChallengeRef,
    ChallengeResult,
    Checkbox,
    Icon,
    Info,
    InputFieldTwo,
    Label,
    PasswordInputTwo,
    useFormErrors,
    useLocalState,
} from '@proton/components';
import { useLoading } from '@proton/hooks';
import { BRAND_NAME } from '@proton/shared/lib/constants';
import { requiredValidator } from '@proton/shared/lib/helpers/formValidators';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';
import noop from '@proton/utils/noop';

import type { Paths } from '../content/helper';
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
    signInText?: string;
    defaultUsername?: string;
    hasRemember?: boolean;
    trustedDeviceRecoveryFeature?: { loading?: boolean; feature: { Value: boolean } | undefined };
    paths: Paths;
}

const LoginForm = ({
    onSubmit,
    defaultUsername = '',
    signInText = c('Action').t`Sign in`,
    hasRemember,
    trustedDeviceRecoveryFeature,
    paths,
}: Props) => {
    const [submitting, withSubmitting] = useLoading();
    const [username, setUsername] = useState(defaultUsername);
    const [password, setPassword] = useState('');
    const [persistent, setPersistent] = useLocalState(false, defaultPersistentKey);

    const usernameRef = useRef<HTMLInputElement>(null);
    const challengeRefLogin = useRef<ChallengeRef>();
    const [challengeLoading, setChallengeLoading] = useState(true);
    const [challengeError, setChallengeError] = useState(false);

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
            href={getKnowledgeBaseUrl('/how-to-access-protonmail-in-private-incognito-mode')}
        >
            {c('Info').t`Learn more`}
        </Href>
    );

    const keepMeSignedInLearnMoreLink = (
        <Href
            className="color-inherit inline-block link-focus"
            key="learn-more"
            href={getKnowledgeBaseUrl('/keep-me-signed-in')}
        >
            {c('Info').t`Why?`}
        </Href>
    );

    const signUp = paths.signup && (
        <Link key="signup" className="link link-focus text-nowrap" to={paths.signup}>
            {c('Link').t`Create account`}
        </Link>
    );

    const handleSubmit = () => {
        if (submitting || !onFormSubmit()) {
            return;
        }
        const run = async () => {
            const payload = await challengeRefLogin.current?.getChallenge().catch(noop);
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
                    label={c('Label').t`Email or username`}
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
                    rootClassName="mt-2"
                />

                {hasRemember && (
                    <div className="flex flex-row flex-align-items-start">
                        <Checkbox
                            id="staySignedIn"
                            className="mt-2 mr-2"
                            checked={persistent}
                            onChange={submitting ? noop : () => setPersistent(!persistent)}
                        />

                        {!loading && trustedDeviceRecoveryFeature?.feature?.Value ? (
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
                                    <span className="pr-2">{c('Label').t`Keep me signed in`}</span>
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

                <Button size="large" color="norm" type="submit" fullWidth loading={submitting} className="mt-6">
                    {
                        // translator: when the "sign in" button is in loading state, it gets updated to "Signing in"
                        submitting ? c('Action').t`Signing in` : signInText
                    }
                </Button>

                {signUp && (
                    <div className="text-center mt-4">
                        {
                            // translator: Full sentence "New to Proton? Create account"
                            c('Go to sign up').jt`New to ${BRAND_NAME}? ${signUp}`
                        }
                    </div>
                )}

                <hr className="my-4" />

                <div className="text-center">
                    <SupportDropdown
                        buttonClassName="mx-auto link link-focus"
                        content={c('Link').t`Trouble signing in?`}
                    >
                        <Link
                            to={paths.reset}
                            className="dropdown-item-link w100 px-4 py-2 block text-no-decoration text-left"
                        >
                            <Icon name="user-circle" className="mr-2" />
                            {c('Link').t`Reset password`}
                        </Link>
                        <Link
                            to={paths.forgotUsername}
                            className="dropdown-item-link w100 px-4 py-2 block text-no-decoration text-left"
                        >
                            <Icon name="key" className="mr-2" />
                            {c('Link').t`Forgot username?`}
                        </Link>
                    </SupportDropdown>
                </div>
            </form>
        </>
    );
};

export default LoginForm;
