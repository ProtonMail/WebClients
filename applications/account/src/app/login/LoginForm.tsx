import { c } from 'ttag';
import React, { useEffect, useRef, useState } from 'react';
import { noop } from 'proton-shared/lib/helpers/function';
import {
    useLoading,
    InputFieldTwo,
    PasswordInputTwo,
    Button,
    useFormErrors,
    ChallengeRef,
    captureChallengeMessage,
    Challenge,
    ChallengeError,
    ChallengeResult,
    LearnMore,
} from 'react-components';
import { Link } from 'react-router-dom';
import { requiredValidator } from 'proton-shared/lib/helpers/formValidators';
import { BRAND_NAME } from 'proton-shared/lib/constants';
import Loader from '../signup/Loader';

interface Props {
    onSubmit: (username: string, password: string, payload: ChallengeResult) => Promise<void>;
    defaultUsername?: string;
}

const LoginForm = ({ onSubmit, defaultUsername = '' }: Props) => {
    const [loading, withLoading] = useLoading();
    const [username, setUsername] = useState(defaultUsername);
    const [password, setPassword] = useState('');

    const usernameRef = useRef<HTMLInputElement>(null);
    const challengeRefLogin = useRef<ChallengeRef>();
    const [challengeLoading, setChallengeLoading] = useState(true);
    const [challengeError, setChallengeError] = useState(false);

    useEffect(() => {
        if (challengeLoading) {
            return;
        }
        // Special focus management for challenge
        // challengeRefLogin.current?.focus('#username');
        usernameRef.current?.focus();
    }, [challengeLoading]);

    const { validator, onFormSubmit } = useFormErrors();

    if (challengeError) {
        return <ChallengeError />;
    }

    const signupLink = <Link key="signupLink" to="/signup">{c('Link').t`Create an account`}</Link>;
    const learnMore = (
        <LearnMore
            key="learn-more"
            url="https://protonmail.com/support/knowledge-base/how-to-access-protonmail-in-private-incognito-mode/"
        />
    );

    return (
        <>
            {challengeLoading && (
                <div className="text-center">
                    <Loader />
                </div>
            )}
            <form
                name="loginForm"
                className={challengeLoading ? 'hidden' : undefined}
                onSubmit={(event) => {
                    event.preventDefault();
                    if (loading || !onFormSubmit()) {
                        return;
                    }
                    const run = async () => {
                        const payload = await challengeRefLogin.current?.getChallenge();
                        return onSubmit(username, password, payload);
                    };
                    withLoading(run()).catch(noop);
                }}
                method="post"
            >
                <Challenge
                    style={{ height: 0 }}
                    tabIndex={-1}
                    challengeRef={challengeRefLogin}
                    type={0}
                    onSuccess={(logs) => {
                        setChallengeLoading(false);
                        captureChallengeMessage('Failed to load LoginForm iframe partially', logs);
                    }}
                    onError={(logs) => {
                        setChallengeLoading(false);
                        setChallengeError(true);
                        captureChallengeMessage('Failed to load LoginForm iframe fatally', logs);
                    }}
                />
                <InputFieldTwo
                    id="username"
                    bigger
                    label={c('Label').t`Email or username`}
                    error={validator([requiredValidator(username)])}
                    autoFocus
                    disableChange={loading}
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
                    disableChange={loading}
                    autoComplete="current-password"
                    value={password}
                    onValue={setPassword}
                    rootClassName="mt0-5"
                />
                <div className="mt1 color-weak">
                    {c('Info').jt`Not your computer? Use a Private Browsing window to sign in. ${learnMore}`}
                </div>
                <Button size="large" color="norm" type="submit" fullWidth loading={loading} className="mt1-75">
                    {c('Action').t`Sign in`}
                </Button>
                <div className="text-center mt2">{c('Info').jt`New to ${BRAND_NAME}? ${signupLink}`}</div>
            </form>
        </>
    );
};

export default LoginForm;
