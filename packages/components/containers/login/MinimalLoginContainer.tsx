import { ReactNode, useEffect, useRef, useState } from 'react';

import { c } from 'ttag';

import { getApiErrorMessage } from '@proton/shared/lib/api/helpers/apiErrorHelper';
import { EMAIL_PLACEHOLDER, MAIL_APP_NAME } from '@proton/shared/lib/constants';
import { API_CUSTOM_ERROR_CODES } from '@proton/shared/lib/errors';
import noop from '@proton/utils/noop';

import { CircleLoader, Input, Label, PasswordInput, PrimaryButton, UnderlineButton } from '../../components';
import { useApi, useErrorHandler, useLoading, useNotifications } from '../../hooks';
import { OnLoginCallback } from '../app/interface';
import { Challenge, ChallengeError, ChallengeRef, ChallengeResult } from '../challenge';
import AbuseModal from './AbuseModal';
import { AuthActionResponse, AuthCacheResult, AuthStep } from './interface';
import { handleLogin, handleTotp, handleUnlock } from './loginActions';

const UnlockForm = ({
    onSubmit,
    cancelButton,
}: {
    onSubmit: (totp: string) => Promise<void>;
    cancelButton?: ReactNode;
}) => {
    const [loading, withLoading] = useLoading();
    const [keyPassword, setKeyPassword] = useState('');

    return (
        <form
            name="unlockForm"
            onSubmit={(event) => {
                event.preventDefault();
                withLoading(onSubmit(keyPassword)).catch(noop);
            }}
            method="post"
        >
            <Label htmlFor="password">{c('Label').t`Mailbox password`}</Label>
            <div className="mb1">
                <PasswordInput
                    name="password"
                    autoFocus
                    autoCapitalize="off"
                    autoCorrect="off"
                    id="password"
                    required
                    className="w100"
                    value={keyPassword}
                    placeholder={c('Placeholder').t`Mailbox password`}
                    onChange={loading ? noop : ({ target: { value } }) => setKeyPassword(value)}
                    data-cy-login="mailbox password"
                />
            </div>
            <div className="flex flex-justify-space-between">
                {cancelButton}
                <PrimaryButton type="submit" loading={loading} data-cy-login="submit mailbox password">
                    {c('Action').t`Submit`}
                </PrimaryButton>
            </div>
        </form>
    );
};

const TOTPForm = ({
    onSubmit,
    cancelButton,
}: {
    onSubmit: (totp: string) => Promise<void>;
    cancelButton?: ReactNode;
}) => {
    const [loading, withLoading] = useLoading();
    const [totp, setTotp] = useState('');
    return (
        <form
            name="totpForm"
            onSubmit={(event) => {
                event.preventDefault();
                withLoading(onSubmit(totp)).catch(noop);
            }}
            method="post"
        >
            <Label htmlFor="twoFa">{c('Label').t`Two-factor authentication code`}</Label>
            <div className="mb1">
                <Input
                    type="text"
                    name="twoFa"
                    autoFocus
                    autoCapitalize="off"
                    autoCorrect="off"
                    autoComplete="one-time-code"
                    id="twoFa"
                    required
                    value={totp}
                    className="w100"
                    placeholder="123456"
                    onChange={loading ? noop : ({ target: { value } }) => setTotp(value)}
                    data-cy-login="TOTP"
                />
            </div>
            <div className="flex flex-justify-space-between">
                {cancelButton}
                <PrimaryButton type="submit" disabled={totp.length < 6} loading={loading} data-cy-login="submit TOTP">
                    {c('Action').t`Submit`}
                </PrimaryButton>
            </div>
        </form>
    );
};

const LoginForm = ({
    onSubmit,
    hasChallenge,
    needHelp,
    footer,
}: {
    onSubmit: (username: string, password: string, payload: ChallengeResult) => Promise<void>;
    hasChallenge?: boolean;
    needHelp?: ReactNode;
    footer?: ReactNode;
}) => {
    const [loading, withLoading] = useLoading();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const challengeRefLogin = useRef<ChallengeRef>();
    const usernameRef = useRef<HTMLInputElement>(null);
    const [challengeLoading, setChallengeLoading] = useState(hasChallenge);
    const [challengeError, setChallengeError] = useState(false);

    useEffect(() => {
        if (challengeLoading) {
            return;
        }
        // Special focus management for challenge
        usernameRef.current?.focus();
    }, [challengeLoading]);

    if (challengeError) {
        return <ChallengeError />;
    }

    return (
        <>
            {challengeLoading && (
                <div className="text-center">
                    <CircleLoader className="color-primary" size="large" />
                </div>
            )}
            <form
                name="loginForm"
                className={challengeLoading ? 'hidden' : undefined}
                onSubmit={(event) => {
                    event.preventDefault();
                    const run = async () => {
                        const payload = await challengeRefLogin.current?.getChallenge();
                        return onSubmit(username, password, payload);
                    };
                    withLoading(run()).catch(noop);
                }}
                method="post"
            >
                {hasChallenge && (
                    <Challenge
                        className="h0"
                        tabIndex={-1}
                        challengeRef={challengeRefLogin}
                        name="login"
                        type={0}
                        onSuccess={() => {
                            setChallengeLoading(false);
                        }}
                        onError={() => {
                            setChallengeLoading(false);
                            setChallengeError(true);
                        }}
                    />
                )}
                <Label htmlFor="login">{c('Label').t`Username or ${MAIL_APP_NAME} address`}</Label>
                <div className="mb1">
                    <Input
                        type="text"
                        name="login"
                        ref={usernameRef}
                        autoFocus
                        autoCapitalize="off"
                        autoCorrect="off"
                        title={c('Title').t`Enter your username or ${MAIL_APP_NAME} email address`}
                        id="login"
                        placeholder={EMAIL_PLACEHOLDER}
                        required
                        value={username}
                        onChange={loading ? noop : ({ target: { value } }) => setUsername(value)}
                        data-cy-login="username"
                    />
                </div>
                <Label htmlFor="password">{c('Label').t`Password`}</Label>
                <div className="mb1">
                    <PasswordInput
                        name="password"
                        autoComplete="current-password"
                        id="password"
                        title={c('Title').t`Enter your password`}
                        required
                        value={password}
                        onChange={loading ? noop : ({ target: { value } }) => setPassword(value)}
                        data-cy-login="password"
                    />
                </div>
                <div className="flex flex-justify-space-between">
                    {needHelp}
                    <PrimaryButton type="submit" loading={loading} data-cy-login="submit">
                        {c('Action').t`Log in`}
                    </PrimaryButton>
                </div>
                {footer}
            </form>
        </>
    );
};

interface Props {
    onLogin: OnLoginCallback;
    needHelp?: ReactNode;
    footer?: ReactNode;
    hasChallenge?: boolean;
    ignoreUnlock?: boolean;
}

const MinimalLoginContainer = ({ onLogin, hasChallenge = false, ignoreUnlock = false, needHelp, footer }: Props) => {
    const { createNotification } = useNotifications();
    const [abuseModal, setAbuseModal] = useState<{ apiErrorMessage?: string } | undefined>(undefined);

    const normalApi = useApi();
    const silentApi = <T,>(config: any) => normalApi<T>({ ...config, silence: true });
    const errorHandler = useErrorHandler();

    const cacheRef = useRef<AuthCacheResult | undefined>(undefined);
    const [step, setStep] = useState(AuthStep.LOGIN);

    const handleResult = (result: AuthActionResponse) => {
        if (result.to === AuthStep.DONE) {
            return onLogin(result.session);
        }
        cacheRef.current = result.cache;
        setStep(result.to);
    };

    const handleCancel = () => {
        cacheRef.current = undefined;
        setStep(AuthStep.LOGIN);
    };

    const handleError = (e: any) => {
        if (e.data?.Code === API_CUSTOM_ERROR_CODES.AUTH_ACCOUNT_DISABLED) {
            setAbuseModal({ apiErrorMessage: getApiErrorMessage(e) });
            return;
        }
        if (e.name === 'TOTPError' || e.name === 'PasswordError') {
            createNotification({ type: 'error', text: e.message });
            return;
        }
        if (
            step === AuthStep.LOGIN ||
            (step === AuthStep.UNLOCK && e.name !== 'PasswordError') ||
            (step === AuthStep.TWO_FA && e.name !== 'TOTPError')
        ) {
            handleCancel();
        }
        errorHandler(e);
    };

    const cancelButton = (
        <UnderlineButton type="reset" onClick={handleCancel}>
            {c('Action').t`Cancel`}
        </UnderlineButton>
    );

    const cache = cacheRef.current;

    return (
        <>
            <AbuseModal
                message={abuseModal?.apiErrorMessage}
                open={!!abuseModal}
                onClose={() => setAbuseModal(undefined)}
            />
            {step === AuthStep.LOGIN && (
                <LoginForm
                    needHelp={needHelp}
                    footer={footer}
                    hasChallenge={hasChallenge}
                    onSubmit={(username, password, payload) => {
                        return handleLogin({
                            username,
                            password,
                            payload,
                            api: silentApi,
                            hasGenerateKeys: false,
                            ignoreUnlock,
                            hasInternalAddressSetup: false,
                            persistent: false,
                        })
                            .then(handleResult)
                            .catch(handleError);
                    }}
                />
            )}
            {step === AuthStep.TWO_FA && cache && (
                <TOTPForm
                    cancelButton={cancelButton}
                    onSubmit={(totp) => {
                        return handleTotp({
                            cache,
                            totp,
                        })
                            .then(handleResult)
                            .catch(handleError);
                    }}
                />
            )}
            {step === AuthStep.UNLOCK && cache && (
                <UnlockForm
                    cancelButton={cancelButton}
                    onSubmit={(keyPassword) => {
                        return handleUnlock({
                            cache,
                            clearKeyPassword: keyPassword,
                            isOnePasswordMode: false,
                        })
                            .then(handleResult)
                            .catch(handleError);
                    }}
                />
            )}
        </>
    );
};

export default MinimalLoginContainer;
