import type { ReactNode } from 'react';
import { useEffect, useRef, useState } from 'react';

import { c } from 'ttag';

import { Button, CircleLoader } from '@proton/atoms';
import InputFieldTwo from '@proton/components/components/v2/field/InputField';
import PasswordInputTwo from '@proton/components/components/v2/input/PasswordInput';
import useFormErrors from '@proton/components/components/v2/useFormErrors';
import TotpInputs from '@proton/components/containers/account/totp/TotpInputs';
import { startUnAuthFlow } from '@proton/components/containers/api/unAuthenticatedApi';
import { useLoading } from '@proton/hooks';
import { getApiErrorMessage } from '@proton/shared/lib/api/helpers/apiErrorHelper';
import { API_CUSTOM_ERROR_CODES } from '@proton/shared/lib/errors';
import { requiredValidator } from '@proton/shared/lib/helpers/formValidators';
import { KeyTransparencyActivation } from '@proton/shared/lib/interfaces';
import noop from '@proton/utils/noop';

import { useApi, useConfig, useErrorHandler, useNotifications } from '../../hooks';
import type { OnLoginCallback } from '../app/interface';
import Challenge from '../challenge/Challenge';
import ChallengeError from '../challenge/ChallengeError';
import type { ChallengeRef, ChallengeResult } from '../challenge/interface';
import AbuseModal from './AbuseModal';
import type { AuthActionResponse, AuthCacheResult } from './interface';
import { AuthType } from './interface';
import { AuthStep } from './interface';
import { handleLogin, handleNextLogin, handleTotp, handleUnlock } from './loginActions';

const UnlockForm = ({
    onSubmit,
    cancelButton,
}: {
    onSubmit: (totp: string) => Promise<void>;
    cancelButton?: ReactNode;
}) => {
    const [loading, withLoading] = useLoading();
    const [keyPassword, setKeyPassword] = useState('');

    const { validator, onFormSubmit } = useFormErrors();

    return (
        <form
            name="unlockForm"
            onSubmit={(event) => {
                event.preventDefault();
                if (!onFormSubmit()) {
                    return;
                }
                withLoading(onSubmit(keyPassword)).catch(noop);
            }}
            method="post"
        >
            <InputFieldTwo
                as={PasswordInputTwo}
                id="mailboxPassword"
                bigger
                label={c('Label').t`Second password`}
                error={validator([requiredValidator(keyPassword)])}
                disableChange={loading}
                autoFocus
                value={keyPassword}
                onValue={setKeyPassword}
            />
            <div className="flex justify-space-between">
                <Button
                    color="norm"
                    size="large"
                    fullWidth
                    type="submit"
                    loading={loading}
                    data-cy-login="submit mailbox password"
                >
                    {c('Action').t`Submit`}
                </Button>
                {cancelButton}
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

    const [code, setCode] = useState('');
    const [type, setType] = useState<'totp' | 'recovery-code'>('totp');
    const hasBeenAutoSubmitted = useRef(false);

    const { validator, onFormSubmit, reset } = useFormErrors();

    const safeCode = code.replaceAll(/\s+/g, '');
    const requiredError = requiredValidator(safeCode);

    useEffect(() => {
        if (type !== 'totp' || loading || requiredError || hasBeenAutoSubmitted.current) {
            return;
        }
        // Auto-submit the form once the user has entered the TOTP
        if (safeCode.length === 6) {
            // Do it just one time
            hasBeenAutoSubmitted.current = true;
            withLoading(onSubmit(safeCode)).catch(noop);
        }
    }, [safeCode]);

    return (
        <form
            name="totpForm"
            onSubmit={(event) => {
                event.preventDefault();
                if (!onFormSubmit()) {
                    return;
                }
                withLoading(onSubmit(safeCode)).catch(noop);
            }}
            method="post"
        >
            <TotpInputs
                type={type}
                code={code}
                error={validator([requiredError])}
                loading={loading}
                setCode={setCode}
                bigger={true}
            />
            <div className="flex justify-space-between">
                <Button size="large" fullWidth color="norm" type="submit" loading={loading}>
                    {c('Action').t`Submit`}
                </Button>
                <Button
                    color="norm"
                    shape="ghost"
                    size="large"
                    fullWidth
                    className="mt-2"
                    onClick={() => {
                        if (loading) {
                            return;
                        }
                        reset();
                        setCode('');
                        setType(type === 'totp' ? 'recovery-code' : 'totp');
                    }}
                >
                    {type === 'totp' ? c('Action').t`Use recovery code` : c('Action').t`Use authentication code`}
                </Button>
                {cancelButton}
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

    const { validator, onFormSubmit } = useFormErrors();

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
                    if (!onFormSubmit()) {
                        return;
                    }
                    const run = async () => {
                        const payload = await challengeRefLogin.current?.getChallenge().catch(noop);
                        return onSubmit(username, password, payload);
                    };
                    withLoading(run()).catch(noop);
                }}
                method="post"
            >
                {hasChallenge && (
                    <Challenge
                        className="h-0"
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
                <InputFieldTwo
                    id="username"
                    bigger
                    label={c('Label').t`Email or username`}
                    error={validator([requiredValidator(username)])}
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
                    autoComplete="current-password"
                    value={password}
                    onValue={setPassword}
                    rootClassName="mt-2"
                />
                <div className="flex justify-space-between mt-4">
                    {needHelp}
                    <Button color="norm" size="large" type="submit" fullWidth loading={loading} data-cy-login="submit">
                        {c('Action').t`Sign in`}
                    </Button>
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
    const { APP_NAME } = useConfig();
    const { createNotification } = useNotifications();
    const [abuseModal, setAbuseModal] = useState<{ apiErrorMessage?: string } | undefined>(undefined);

    const normalApi = useApi();
    const silentApi = <T,>(config: any) => normalApi<T>({ ...config, silence: true });
    const errorHandler = useErrorHandler();

    const cacheRef = useRef<AuthCacheResult | undefined>(undefined);
    const [step, setStep] = useState(AuthStep.LOGIN);

    const handleResult = async (result: AuthActionResponse) => {
        if (result.to === AuthStep.DONE) {
            await onLogin(result.session);
            return;
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
        <Button size="large" shape="ghost" type="button" fullWidth onClick={handleCancel} className="mt-2">
            {c('Action').t`Cancel`}
        </Button>
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
                    onSubmit={async (username, password, payload) => {
                        try {
                            await startUnAuthFlow();
                            const loginResult = await handleLogin({
                                username,
                                persistent: false,
                                payload,
                                password,
                                api: silentApi,
                            });
                            const result = await handleNextLogin({
                                authType: AuthType.SRP,
                                authResponse: loginResult.authResult.result,
                                authVersion: loginResult.authResult.authVersion,
                                appName: APP_NAME,
                                toApp: APP_NAME,
                                productParam: APP_NAME,
                                username,
                                password,
                                api: silentApi,
                                verifyOutboundPublicKeys: null,
                                ignoreUnlock,
                                persistent: false,
                                setupVPN: false,
                                ktActivation: KeyTransparencyActivation.DISABLED,
                            });
                            return await handleResult(result);
                        } catch (e) {
                            handleError(e);
                        }
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
