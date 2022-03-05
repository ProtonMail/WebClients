import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { c } from 'ttag';
import { noop } from '@proton/shared/lib/helpers/function';
import {
    Button,
    captureChallengeMessage,
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
    useFormErrors,
    useLoading,
    useLocalState,
} from '@proton/components';
import { requiredValidator } from '@proton/shared/lib/helpers/formValidators';
import Loader from '../signup/Loader';
import { defaultPersistentKey } from '../public/helper';

interface Props {
    signInText?: string;
    onSubmit: (data: {
        username: string;
        password: string;
        persistent: boolean;
        payload: ChallengeResult;
    }) => Promise<void>;
    defaultUsername?: string;
    hasRemember?: boolean;
}

const LoginForm = ({ onSubmit, defaultUsername = '', signInText = c('Action').t`Sign in`, hasRemember }: Props) => {
    const [loading, withLoading] = useLoading();
    const [username, setUsername] = useState(defaultUsername);
    const [password, setPassword] = useState('');
    const [persistent, setPersistent] = useLocalState(!!hasRemember, defaultPersistentKey);

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
        setTimeout(() => {
            usernameRef.current?.focus();
        }, 0);
    }, [challengeLoading]);

    const { validator, onFormSubmit } = useFormErrors();

    if (challengeError) {
        return <ChallengeError />;
    }

    const forgotPasswordLink = (
        <Link key="forgotPasswordLink" to="/reset-password">{c('new_plans: forgot links').t`Forgot password`}</Link>
    );
    const forgotUsernameLink = (
        <Link key="forgotUsernameLink" to="/forgot-username">{
            // translator: Part of a sentence "Forgot password or username?"
            c('new_plans: forgot links').t`username`
        }</Link>
    );
    const learnMore = (
        <Href
            className="color-inherit"
            key="learn-more"
            url="https://protonmail.com/support/knowledge-base/how-to-access-protonmail-in-private-incognito-mode/"
        >{c('Info').t`Learn more`}</Href>
    );

    return (
        <>
            {challengeLoading && (
                <div className="text-center absolute absolute-center">
                    <Loader />
                </div>
            )}
            <form
                name="loginForm"
                className={challengeLoading ? 'visibility-hidden' : undefined}
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
                    className="h0 absolute"
                    noLoader
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

                {hasRemember && (
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
                    </div>
                )}

                <Button size="large" color="norm" type="submit" fullWidth loading={loading} className="mt1-75">
                    {
                        // translator: when the "sign in" button is in loading state, it gets updated to "Signing in"
                        loading ? c('Action').t`Signing in` : signInText
                    }
                </Button>
                <div className="text-center mt2">{c('Info').jt`${forgotPasswordLink} or ${forgotUsernameLink}?`}</div>
            </form>
        </>
    );
};

export default LoginForm;
