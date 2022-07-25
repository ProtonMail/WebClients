import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';

import { c } from 'ttag';

import { Card } from '@proton/atoms';
import {
    Button,
    ButtonLike,
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
import { Icon } from '@proton/components';
import { SECOND, SSO_PATHS } from '@proton/shared/lib/constants';
import { requiredValidator } from '@proton/shared/lib/helpers/formValidators';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';
import noop from '@proton/utils/noop';

import SupportDropdown from '../public/SupportDropdown';
import { defaultPersistentKey } from '../public/helper';
import Loader from '../signup/Loader';

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
    hasActiveSessions?: boolean;
}

const LoginForm = ({
    onSubmit,
    defaultUsername = '',
    signInText = c('Action').t`Sign in`,
    hasRemember,
    hasActiveSessions,
}: Props) => {
    const [loading, withLoading] = useLoading();
    const [username, setUsername] = useState(defaultUsername);
    const [password, setPassword] = useState('');
    const [persistent, setPersistent] = useLocalState(false, defaultPersistentKey);

    const [showPasswordManagerHint, setShowPasswordManagerHint] = useState(false);

    const usernameRef = useRef<HTMLInputElement>(null);
    const challengeRefLogin = useRef<ChallengeRef>();
    const [challengeLoading, setChallengeLoading] = useState(true);
    const [challengeError, setChallengeError] = useState(false);

    useEffect(() => {
        if (hasActiveSessions) {
            setShowPasswordManagerHint(false);
            return;
        }

        if (showPasswordManagerHint || password) {
            return;
        }

        let id = setTimeout(() => {
            setShowPasswordManagerHint(true);
        }, 10 * SECOND);

        return () => clearTimeout(id);
    }, [hasActiveSessions, password]);

    useEffect(() => {
        if (challengeLoading) {
            return;
        }
        usernameRef.current?.focus();
    }, [challengeLoading]);

    const { validator, onFormSubmit } = useFormErrors();

    if (challengeError) {
        return <ChallengeError />;
    }

    const learnMore = (
        <Href
            className="color-inherit"
            key="learn-more"
            url={getKnowledgeBaseUrl('/how-to-access-protonmail-in-private-incognito-mode')}
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

                <ButtonLike
                    className="mt1"
                    fullWidth
                    size="large"
                    shape="outline"
                    color="norm"
                    as={Link}
                    to={SSO_PATHS.SIGNUP}
                    disabled={loading}
                >
                    {c('Action').t`Create free account`}
                </ButtonLike>

                <div className="text-center mt2">
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

                {showPasswordManagerHint && (
                    <Card className="text-center mt2" rounded>
                        {c('Info').t`Issues signing in?`}
                        <br />
                        <Href key="update-password-manager-url" url={getKnowledgeBaseUrl('/update-password-manager')}>
                            {c('Info').t`Update the URL in your password manager`}
                        </Href>
                    </Card>
                )}
            </form>
        </>
    );
};

export default LoginForm;
