import { c } from 'ttag';
import { useEffect, useRef, useState } from 'react';
import { noop } from '@proton/shared/lib/helpers/function';
import {
    Button,
    captureChallengeMessage,
    Challenge,
    ChallengeError,
    ChallengeRef,
    ChallengeResult,
    Checkbox,
    Info,
    InputFieldTwo,
    Label,
    LearnMore,
    PasswordInputTwo,
    useFormErrors,
    useLoading,
    useLocalState,
} from '@proton/components';
import { Link } from 'react-router-dom';
import { requiredValidator } from '@proton/shared/lib/helpers/formValidators';
import { BRAND_NAME } from '@proton/shared/lib/constants';
import Loader from '../signup/Loader';
import { defaultPersistentKey } from '../public/helper';

interface Props {
    onSubmit: (data: {
        username: string;
        password: string;
        persistent: boolean;
        payload: ChallengeResult;
    }) => Promise<void>;
    defaultUsername?: string;
}

const LoginForm = ({ onSubmit, defaultUsername = '' }: Props) => {
    const [loading, withLoading] = useLoading();
    const [username, setUsername] = useState(defaultUsername);
    const [password, setPassword] = useState('');
    const [persistent, setPersistent] = useLocalState(true, defaultPersistentKey);

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
            className="color-inherit"
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
                        return onSubmit({ username, password, persistent, payload });
                    };
                    withLoading(run()).catch(noop);
                }}
                method="post"
            >
                <Challenge
                    className="h0"
                    tabIndex={-1}
                    challengeRef={challengeRefLogin}
                    type={0}
                    name="login"
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

                <div className="flex flex-row flex-align-items-start">
                    <Checkbox
                        id="staySignedIn"
                        className="mt0-5"
                        checked={persistent}
                        onChange={loading ? noop : () => setPersistent(!persistent)}
                    />
                    <div className="flex-item-fluid">
                        <Label htmlFor="staySignedIn" className="flex flex-align-items-center">
                            <span className="pr0-5">{c('Label').t`Keep me signed in`}</span>
                            <span className="flex">
                                <Info title={c('Info').t`You'll stay signed in even after you close the browser.`} />
                            </span>
                        </Label>
                        <div className="color-weak">
                            {c('Info')
                                .jt`Not your device? Use a private browsing window to sign in and close it when done. ${learnMore}`}
                        </div>
                    </div>
                </div>

                <Button size="large" color="norm" type="submit" fullWidth loading={loading} className="mt1-75">
                    {
                        // translator: when the "sign in" button is in loading state, it gets updated to "Signing in"
                        loading ? c('Action').t`Signing in` : c('Action').t`Sign in`
                    }
                </Button>
                <div className="text-center mt2">{c('Info').jt`New to ${BRAND_NAME}? ${signupLink}`}</div>
            </form>
        </>
    );
};

export default LoginForm;
